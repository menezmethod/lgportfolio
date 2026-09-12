---
title: "A Trace Caught a Bug Before Customers Did"
description: "How OpenTelemetry instrumentation on a payment service exposed a race condition that would have caused double-charges — and the traces that proved it."
date: "2026-06-25"
tags: ["Observability", "OpenTelemetry", "Production Incidents"]
---

<!-- TODO: confirm with Luis — this post narrates a specific idempotency-key race
     condition and its fix. cv.md's payments incident work is described as
     "contributed to incident response: fast log retrieval, hypothesis generation"
     across incidents involving metric cardinality, circuit breakers, health
     checks, and upstream timeouts — it doesn't name this specific race/fix.
     Reframed to team-contributed language per the requested edit (pulled traces,
     flagged the race, proposed a fix — not sole root-cause-and-fix ownership),
     but please confirm the incident happened this way before it goes out under
     your byline. -->

## The Incident That Wasn't — Yet

Friday, 2:47 PM. A payment service had been running three months without a single charge discrepancy. Then a pager alert fired: "Idempotency check latency spike — p99 > 5s."

Not a crash. Not a double-charge. A latency alert. On-call, I pulled the traces on the payment path rather than jumping straight to blaming the database — and they told a different story: a race condition that would eventually cause a double-charge. It just hadn't happened at scale yet. I flagged it to the team and we dug in together.

## What the Trace Showed

The flow had an idempotency check: read the `idempotency_key` row. If it exists, return the cached result. If not, insert it and charge. Textbook. The code looked correct in isolation.

The trace told the truth:

```
─── POST /charge/{orderID} ──────────────── (2.3s) ───
  ├─ check-idempotency            [201ms]
  │  └─ SELECT idempotency_key    [42ms]   ← empty
  ├─ insert-idempotency-key       [35ms]
  ├─ charge-card          [~1.8s] ── wait ──►
  │
  └─ check-idempotency (concurrent!) [198ms]
     └─ SELECT idempotency_key    [40ms]   ← empty!
```

Two requests for the same `orderID` arrived 47ms apart. The first `check-idempotency` span completed before the second started. Both saw empty rows. Both charged the card. The database had a unique constraint on `idempotency_key` — the second `INSERT` would fail, but only *after* the card was charged. The handler wasn't checking the insert error. A textbook read-without-lock race, invisible in logs because both requests logged "idempotency check passed."

## The Fix

I proposed a DB-level optimistic lock instead of read-then-write, and a teammate implemented and reviewed it: `INSERT ... ON CONFLICT DO NOTHING` with `RETURNING`:

```go
func (s *PaymentService) Charge(ctx context.Context, orderID string) (*ChargeResult, error) {
    var existingKey string
    err := s.db.QueryRowContext(ctx,
        `INSERT INTO idempotency_keys (order_id, status, created_at)
         VALUES ($1, 'processing', NOW())
         ON CONFLICT (order_id) DO NOTHING
         RETURNING order_id`, orderID,
    ).Scan(&existingKey)

    if err == sql.ErrNoRows {
        return s.lookupPreviousCharge(ctx, orderID)
    }
    if err != nil {
        return nil, fmt.Errorf("acquire idempotency lock: %w", err)
    }
    result, err := s.chargeCard(ctx, orderID)
    // ... update status on completion
    return result, nil
}
```

The `INSERT` with `ON CONFLICT DO NOTHING` acts as the exclusive lock. First request to commit the row wins. Subsequent requests immediately return cached results. p99 latency dropped from 5s to 120ms.

## What Every Payment Service Should Trace

- **Idempotency key acquisition**. Trace from read to write. If two spans for the same key overlap, you have a race. The single highest-signal trace for payment correctness.

- **External gateway calls**. Trace the full round-trip including response body. A trace showing an abnormal retry pattern is your best forensic evidence for charge disputes.

- **Order state transitions**. Every `pending → processing → completed | failed` change should emit a trace event. Traces reveal *which* request caused illegal transitions.

- **Database transaction boundaries**. Read-committed isolation makes read-then-write without explicit locking a race candidate. Trace `tx.Begin()` to `tx.Commit()`.
