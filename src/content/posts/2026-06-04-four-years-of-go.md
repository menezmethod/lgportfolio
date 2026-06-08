---
title: "What 4 Years of Go at Scale Taught Me About Writing Go"
date: 2026-06-04
tags: ["Go", "Software Engineering", "Backend"]
description: "Concrete Go patterns from 4 years building payment services at Fortune 50 scale — interfaces, error handling, gRPC, and what I wish someone told me sooner."
---

Four years ago I wrote my first Go service at The Home Depot. Before that, I was a Java shop loyalist — Lombok, abstract factories, the whole nine yards. Today I maintain Go payment services that move real money across 2,400+ stores, and I've flipped on almost everything I thought I knew about writing backend code.

Here's what stuck.

## What I Unlearned

The hardest thing to let go was **over-engineering for tomorrow**. Java taught me to layer abstractions early: repository interfaces, service interfaces, factory interfaces, all before a single line of business logic. Go taught me that premature abstraction is the most expensive thing you can write. You can't delete what's already deployed across 20 microservices.

Start concrete. Extract interfaces when you have a second implementation pulling at the seams, not when you *think* one might show up. Most never do.

## Error Handling: The Honest Pattern

Clean errors are the single biggest signal of Go maturity I see in code reviews. Junior Go code logs and returns. Senior Go code wraps with intent.

```go
// Bad: opaque, loses stack, loses context
if err != nil {
    log.Errorf("failed to process payment: %v", err)
    return err
}

// Good: wrap with semantic context
if err != nil {
    return fmt.Errorf("process payment %s for order %s: %w", paymentID, orderID, ErrPaymentFailed)
}

// Better: sentinel errors + typed wrappers
var (
    ErrInsufficientFunds = errors.New("insufficient funds")
    ErrPaymentDeclined   = errors.New("payment declined by provider")
)

type PaymentError struct {
    PaymentID string
    OrderID   string
    Provider  string
    Err       error
}

func (e *PaymentError) Error() string {
    return fmt.Sprintf("payment %s for order %s via %s failed: %v",
        e.PaymentID, e.OrderID, e.Provider, e.Err)
}

func (e *PaymentError) Unwrap() error { return e.Err }
```

| Approach | Debuggability | Caller Control | Production Ops |
|---|---|---|---|
| Log + return err | Low — context lost | None | Pager duty bait |
| `fmt.Errorf("...: %w", err)` | High — wraps upstream | `errors.Is`/`As` work | Solid |
| Sentinel + typed error | Highest — structured fields | Type switch, `errors.As` | Alertable fields |
| Panic/recover | Avoid entirely | Breaks control flow | SRE nightmare |

Rule of thumb: if an error reaches `main()` and you can't tell which order failed and why, you're doing it wrong.

## Interfaces: Small, Lived-in, Local

I see teams import giant interface packs from shared libraries — 12-method monsters that no single type ever fully implements. That's Java leaking into Go.

Go interfaces belong **at the call site**, not the definition site. The `io.Reader` pattern — one method — is your north star. If an interface needs more than three methods, step back and ask whether your types are pulling double duty.

```go
// Don't export enormous interfaces from shared libs
type PaymentProcessor interface {
    Authorize(ctx context.Context, req AuthorizeRequest) (*AuthorizeResponse, error)
    Capture(ctx context.Context, req CaptureRequest) (*CaptureResponse, error)
    Refund(ctx context.Context, req RefundRequest) (*RefundResponse, error)
    Void(ctx context.Context, req VoidRequest) (*VoidResponse, error)
    Settle(ctx context.Context, req SettleRequest) (*SettleResponse, error)
    BatchReconcile(ctx context.Context, req BatchRequest) (*BatchResponse, error)
}

// Instead: let consumers declare what they need, small
type Authorizer interface {
    Authorize(ctx context.Context, amount Cents, currency string) (Authorization, error)
}
```

Your HTTP handler doesn't need the full `PaymentProcessor`. It needs `Authorizer`. Let the concrete type satisfy multiple small interfaces — the compiler enforces it for free.

## gRPC Lessons at 50ms P99

gRPC isn't "HTTP/2 with protobuf." It's a distributed systems contract that you'll debug at 2 AM during a payment spike.

- **Deadlines are non-negotiable.** Every outbound gRPC call gets a `context.WithTimeout`. Every unary server handler reads `ctx.Deadline()` and respects it. I've watched cascading P0s caused by one unset timeout propagating through a call chain. Set them at the boundary, every time.
- **Error detail payloads save teams.** Use `google.golang.org/genproto/googleapis/rpc/errdetails` to attach `BadRequest`, `ErrorInfo`, and `RetryInfo` to gRPC status errors. Your downstream consumers will thank you when they can programmatically decide to retry vs. fail.
- **Streaming !== free.** Bidirectional streaming for event ingestion is powerful, but you need backpressure handling, reconnect backoff, and graceful shutdown sequencing. Production lesson: always put a `select { case <-ctx.Done(): ... }` in every stream receive loop.

## What I'd Undo

If I could rewind four years:

1. **Too many repos.** Every payment method type got its own repository with its own CI, its own deploy pipeline, its own config. Monorepo (or at least a sane polyrepo with shared tooling) would have halved our operational overhead.
2. **Custom config frameworks.** We built our own config library. It was fine until it wasn't — edge cases in refresh, broken diffing, no one remembers how it works. Use env vars, use YAML with structured types, use Vault. Don't write config infra.
3. **Over-indexing on "idiomatic" microservices.** We split services so aggressively that a single payment flow touched six services. The complexity tax — deployments, tracing, network faults — far exceeded the benefit. A little monolith at the start is fine. Extract when latency or team boundaries demand it, not before.

## Why This Matters

If you're interviewing for Senior SWE or Staff-level backend roles — especially at companies doing real-money transactions — Go is the language of record in modern payments infrastructure (Stripe, Adyen, Square, and the internal stacks of every large retailer). The patterns above aren't academic opinions; they're the difference between a service that stays up on Black Friday and one that pages you at 3 AM because a nil pointer made it to production.

Write Go that your on-call self can read at 2 AM. Wrap your errors. Keep your interfaces small. Set your deadlines. The compiler's your ally — trust it, and don't fight the language.
