---
title: "How We Split a Monolith Without Dropping a Single Transaction"
date: 2026-07-09
tags: ["Architecture", "Migration", "Payments"]
description: "The strangler fig pattern applied to payment systems — extracting services from a monolith that processes real money, with zero downtime and zero reconciliation gaps."
---

Settlement runs every night. If it misses a transaction, that merchant doesn't get paid — and you get a very angry call at 2 AM. Our monolith "SettleCore" had been doing this for six years. Single Postgres schema, one Java process, 400K transactions a day. We needed to extract settlement into its own service without skipping a single row.

Here's exactly how we did it.

## The Architecture

We extracted a Settlement Service from the monolith using the **strangler fig pattern**. The monolith handled auth, capture, and settlement in one atomic request chain. We wanted settlement to own its own data and run independently.

```
┌─────────────────────────────────────┐
│              API Gateway            │
└┬──────┬──────┬──────┬──────┬──────┬┘
 │      │      │      │      │      │
┌▼──┐ ┌▼──┐ ┌▼──┐ ┌▼──┐ ┌▼──┐ ┌▼──┐
│A  │ │C  │ │R  │ │S  │ │N  │ │V  │
│uth│ │apt│ │efd│ │etl│ │otf│ │    │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
             │
      ┌──────▼──────┐
      │  Settlement  │ ← extracted service
      │   Service    │
      └──────┬──────┘
             │
      ┌──────▼──────┐
      │ SettleStore │ ← its own DB
      │  (Postgres) │
      └─────────────┘

Phase 1: Dual-write (monolith + service)
Phase 2: Read from service, fallback to monolith
Phase 3: Monolith settlement path → circuit breaker → decom
```

## The Dual-Write Phase

Every captured transaction needed to land in both the monolith's settlement queue *and* the new service. We added a Go-based dual-writer that sat between the capture handler and the database.

```go
type DualWriter struct {
    monolith *sql.DB
    service  *sql.DB
    audit    *AuditTrail
    cb       *circuit.Breaker
}

func (dw *DualWriter) WriteCapture(ctx context.Context, tx *Capture) error {
    // Primary write — monolith must succeed
    if err := dw.writeToMonolith(ctx, tx); err != nil {
        return err // don't proceed, money is at stake
    }
    // Secondary write — best effort, tracked
    if err := dw.cb.Execute(func() error {
        return dw.writeToService(ctx, tx)
    }); err != nil {
        dw.audit.RecordMiss(ctx, tx.ID, err)
        // Not ideal, but monolith will backfill tonight
        return nil // don't fail the request
    }
    return nil
}
```

The circuit breaker was critical. If the new service went down, we silently logged the miss and kept processing through the monolith. A nightly reconciliation job compared both stores and backfilled any gaps.

## The Hardest Part: Cutover Consistency

Data consistency across the boundary during cutover was the real nightmare. Dual-writes are fine during normal operation, but what happens when you flip the switch? At time T, a capture arrives. Does it go to the monolith, the service, or both? What about in-flight transactions that started in the monolith but haven't settled yet?

We solved it with a **cutover state machine**:

```
State        │ Reads from │ Writes to       │ In-flight handling
─────────────┼────────────┼─────────────────┼─────────────────────
Shadow       │ Monolith   │ Both (async)    │ Monolith only
Dual         │ Monolith   │ Both (sync)     │ Monolith
Audit        │ Service*   │ Both (sync)     │ Monolith → migrated
Primary      │ Service    │ Service         │ Service
```

\* Audit phase: read from service, cross-check every row against the monolith. Any mismatch halted the cutover.

We spent three weeks in the Audit phase. The reconciliation job compared every settlement record — ID, amount, currency, timestamp, gateway response — between the two stores. We found seven discrepancies in the first week, all due to a subtle timezone bug in the service's timestamp normalization. Fixed, replayed, verified.

## Rollbacks: Three, All Data-Related

We rolled back three times:

1. **Stale reads (week 2).** The service connected to a replica with 12-second replication lag. A user initiated a refund, the service didn't see the original capture, and rejected it. Rollback trigger: support ticket spike (#transaction-not-found). Fix: read from the monolith's primary until the service replica caught up.

2. **Partial foreign key drift (week 5).** A schema migration on the monolith added a new payment method type that the service didn't know about. The dual-writer inserted NULL for the FK. Rollback trigger: reconciliation flagged 14 orphaned settlement rows. Fix: shared schema migration coordination.

3. **Circuit breaker false positive (week 7).** A transient network blip tripped the breaker and stayed open for 5 minutes. The backfill job caught up, but we lost 2,300 dual-writes. Rollback trigger: audit report showed gap > 1,000 rows. Fix: tuned breaker to half-open after 30 seconds.

## Results

After 11 weeks, settlement was fully extracted. **Zero dropped transactions.** The monolith's settlement code path has a circuit breaker pointing at the service — if the service goes down, the monolith reverts to its original settlement logic. We've never triggered it in production.

The scariest moment: flipping to "Primary" state at 11 PM on a Thursday, watching the dashboard for 30 minutes, seeing green, and realizing nobody noticed. That's the best outcome you can hope for in payments.
