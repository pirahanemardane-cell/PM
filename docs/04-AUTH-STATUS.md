# Phase 4 - Auth status

Updated: 2026-10-20

| Item | Status |
|------|--------|
| Supabase Auth login/session | done |
| Profile + addresses | done |
| Rate limit on login/signup | done (checkRateLimit auth) |
| Temp lock after failed logins | done (5 fails / 15 min lock) |
| Email verification resend | done (resendEmailVerificationAction + profile UI) |
| OTP mobile skeleton | done (lib/otp + actions) |
| Admin role + staff | done (admin users) |
| Fine-grained permission table | deferred (role-based sufficient pre-launch) |
| Automated security tests | partial (rate-limit unit tests) |
| Active sessions device list | deferred (needs session store) |

## Lockout rules
- Key: email|ip
- 5 failures in 15 minutes window
- Lock 15 minutes
- Cleared on successful login

## Phase 11
Payment auth flows out of scope here.
