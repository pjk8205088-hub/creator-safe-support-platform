# Admin and PG audit - 2026-09-05

## Status

NICEPAY selected by the owner; merchant keys have NOT been issued.
Payments must remain disabled. This is not a completed live PG integration.
Changes in this audit are local; production deployment must be verified separately.

## Corrected

- Admin APIs require a server-verified ADMIN user.
- Login sessions are persisted as hashed opaque tokens in the existing database,
  expire after eight hours, and are deleted on logout. Separate Vercel functions
  can resolve the same session without sharing process memory.
- Signup hashes passwords with bcrypt and issues the same session type as login.
- Public signup cannot select ADMIN.
- Existing administrator credentials are not reset on each catalog request.
- Removed catalog seed logic that deactivated every other creator.
- Unverified payment/order/support POST routes return PG_NOT_READY with no writes.
- No automatic frontend confirmation or simulated successful payment fallback.
- Point purchase clicks no longer credit local balances without payment.
- Admin UI verifies its session; false any-password instructions removed.
- Fan list loads registered users; fabricated message delivery logs removed.
- Admin fee changes save to the API and do not recalculate historic order fees.
- Failed signup and disconnected social login no longer create demo sessions.
- Vercel build now compiles the API rather than deploying stale tracked output.

## Verification

Run `pnpm --filter @cssp/api build`, then `node scripts/admin-security-test.mjs`.
Tests use a temporary local libSQL database, not production Turso.
Tests cover administrator login, invalid credentials, unauthorized and fan access,
signup hashing, role escalation rejection, cross-instance sessions, logout,
commission validation, and blocked unverified payment writes.
Run `pnpm --filter @cssp/web build` for frontend compilation/type checks.

## Required Before Accepting Money

- [ ] Obtain NICEPAY server-approval client ID and secret key; register only in server environment variables.
- [ ] Confirm merchant products, price/unit semantics and allowed business model.
- [ ] Implement SDK checkout and server-owned product/price/order creation.
- [ ] Implement return URL validation, PG approval, signatures and order/amount matching.
- [ ] Persist provider transaction IDs uniquely; make retries and callbacks idempotent.
- [ ] Implement verified webhook reconciliation and timeout/network cancellation recovery.
- [ ] Implement authorized full/partial refunds, transactional wallet ledger and entitlement revocation.
- [ ] Implement settlement audit records. A dashboard total is NOT a bank transfer.
- [ ] Complete NICEPAY sandbox success/failure/cancel/duplicate/tampering tests.
- [ ] Reconcile historical PAID rows with actual PG transactions; previous code accepted fake approvals.
- [ ] Review local demo wallet balances; do not migrate them as paid funds.
- [ ] Review legacy plaintext user passwords and affected inactive creators without resetting user data blindly.
- [ ] Finish server-backed creator administration, DM logs and bank payout integration.
- [ ] Add rate limiting, session cleanup, password reset and hardened production session transport.
- [ ] Deploy and test the production admin login and domain/API routing.

GitHub Pages is a static deployment and cannot run this Express/Turso backend.
Use the Vercel application for server-backed login; verify eon8.co.kr DNS separately.

Official NICEPAY references:
- https://github.com/nicepayments/nicepay-manual/blob/main/api/payment-window-server.md
- https://github.com/nicepayments/nicepay-manual/blob/main/api/status-transaction.md
