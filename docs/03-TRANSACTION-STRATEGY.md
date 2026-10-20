# Transaction strategy — Phase 3

## Principles
1. Stock reservation + order create must be atomic (existing RPCs / server actions)
2. Discount increment uses atomic SQL (`025_discount_increment_atomic.sql`)
3. Payment confirmation (phase 11) must:
   - verify signature
   - be idempotent (webhook_events unique external_id)
   - update order only once
4. Prefer single DB round-trip or explicit RPC over multi-step without rollback

## Tables supporting idempotency
- `webhook_events` (provider + external_id unique)
- `payment_attempts` (skeleton until gateway)
- `order_status_history` (append-only timeline)
