---
title: "What 4 Years of Go at Scale Taught Me About Writing Go"
date: 2026-06-04
tags: ["Go", "Software Engineering", "Backend"]
description: "Concrete Go patterns from 4 years building payment services at Fortune 50 scale: interfaces, error handling, gRPC, and stuff I wish someone had told me sooner."
---

Four years ago I wrote my first Go service at The Home Depot. Before that I was a Java guy through and through: Lombok, abstract factories, the whole thing. I spent about two years on Go payment services moving real money across a 2,300+ store rollout. I've since moved over to SRE on Home Services, but writing that much production Go rewired basically everything I thought I knew about backend code.

Some of this actually stuck with me.

## What I had to unlearn

The hardest habit to break was over-engineering for stuff that might happen later. Java trained me to stack abstractions early: repository interfaces, service interfaces, factory interfaces, all before I'd written a line of actual business logic. Go taught me the hard way that premature abstraction is about the most expensive thing you can write. You can't just delete code once it's deployed across 20 microservices.

Start concrete. Pull out an interface once you actually have a second implementation, not because you think one might show up someday. Most of the time it doesn't.

## Error handling, the honest way

In code review, clean error handling is the fastest tell for how experienced someone is with Go. Junior code just logs and returns. Experienced code wraps the error with actual intent.

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
| Log + return err | Low, context lost | None | Pager duty bait |
| `fmt.Errorf("...: %w", err)` | High, wraps upstream | `errors.Is`/`As` work | Solid |
| Sentinel + typed error | Highest, structured fields | Type switch, `errors.As` | Alertable fields |
| Panic/recover | Avoid entirely | Breaks control flow | SRE nightmare |

If an error makes it all the way to `main()` and you still can't tell which order failed or why, something's wrong with how you're wrapping it.

## Interfaces: small, lived-in, local

I've seen teams import giant interface packs from shared libraries, 12-method monsters that no single type ever fully implements. That's just Java leaking into Go.

Go interfaces belong at the call site, not the definition site. The `io.Reader` pattern (one method) is basically the model to follow. If an interface needs more than three methods, stop and ask whether your types are doing too much.

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

Your HTTP handler doesn't need the whole `PaymentProcessor`. It needs `Authorizer`. Let the concrete type satisfy several small interfaces, the compiler enforces that for free.

## gRPC lessons at 50ms P99

gRPC is a distributed systems contract, one you'll end up debugging at 2 AM during a payment spike.

- **Deadlines aren't optional.** Every outbound gRPC call gets a `context.WithTimeout`. Every unary server handler reads `ctx.Deadline()` and actually respects it. I've watched one unset timeout turn into a cascading P0 as it propagated down a call chain. Set them at the boundary. Every time.
- **Error detail payloads save people time.** Use `google.golang.org/genproto/googleapis/rpc/errdetails` to attach `BadRequest`, `ErrorInfo`, and `RetryInfo` to gRPC status errors. Downstream teams will thank you when they can decide programmatically whether to retry or just fail.
- **Streaming isn't free.** Bidirectional streaming for event ingestion is great, but you need backpressure handling, reconnect backoff, and a graceful shutdown sequence. Learned the hard way: put a `select { case <-ctx.Done(): ... }` in every stream receive loop.

## What I'd undo

If I could rewind four years:

1. **Too many repos.** Every payment method type got its own repo, with its own CI, its own deploy pipeline, its own config. A monorepo (or at least a saner polyrepo with shared tooling) would've cut our overhead in half.
2. **Custom config frameworks.** We built our own config library. It worked fine until it didn't: refresh edge cases, broken diffing, and by the end nobody remembered how it actually worked. Use env vars. Use YAML with structured types. Use Vault. Just don't build your own config infra.
3. **Splitting services too early.** We split things so aggressively that a single payment flow touched six services. The complexity tax (more deployments, more tracing, more places for the network to fail) was way bigger than what we got out of it. A little monolith at the start is fine. Extract when latency or team boundaries actually force it, not before.

## Why this matters

None of this is clever. It's just what stops being optional once real money and a real on-call rotation are involved. Cut a corner in a payment path and it comes back to bite you, usually at the worst possible time, and then you're the one on the call explaining why.

Write Go your on-call self can actually read at 2 AM. Wrap your errors. Keep interfaces small. Set your deadlines. That covers most of it.
