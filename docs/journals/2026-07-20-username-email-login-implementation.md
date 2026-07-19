# Username + Email Login Feature — Completed with Critical Post-Implementation Fixes

**Date**: 2026-07-20 15:45
**Severity**: High (two defects caught in review, both fixed before merge)
**Component**: Authentication system, User management portal
**Status**: Resolved

## What Happened

Completed the full 7-task plan for username + email login (dual identifier sign-in, admin-only account creation, optional email). All core functionality built and integrated: migration, validation helpers, server actions, portal wired to real DB data. Code review (via `code-reviewer` subagent) caught two real defects despite the implementation following the plan verbatim, line-for-line. Both were fixed immediately; full end-to-end verification via Playwright passed after fixes.

## The Brutal Truth

This session exposed a critical gap between "follow the plan precisely" and "the code is secure/correct." The plan's code examples had two silent authorization and data-modeling bugs that should have been caught during planning, not implementation. More frustrating: a stale `.env.local` DB password blocked direct-Postgres migration apply mid-task, forcing a manual detour via Supabase Studio — yet this credential issue was pre-existing (affects `verify-staff-read.mts` too), meaning the repo has a lingering environmental debt that will bite us again.

The relieving part: code review worked. The defects were real, not theoretical, and would have caused serious problems in production (role escalation, data corruption in the portal, cascading deletes).

## Technical Details

**Defect 1 — Missing Authorization in `createUser`:**
- Server action used `SupabaseAdminClient` (service-role, bypasses RLS) but had no authorization check
- Any signed-in non-suspended user (including `family` or `carer` roles) could call it directly via browser devtools and create arbitrary accounts, including `super_admin`
- **Fix**: Added `if (user.role_id !== 'super_admin' && user.role_id !== 'admin') throw new UnauthorizedError()`
- **Verified**: Carer account correctly rejected with 403 on form submit; no DB write occurred. Admin account succeeded.

**Defect 2 — `email` Still Used as Unique Key in Portal:**
- `users-view.tsx` tracked edit-target by `email`; `user-table.tsx` used `email` as React list key
- Email is now nullable (entire point of this feature), so multiple username-only accounts collide on `null` → React re-renders wrong row, Edit silently creates new account instead of updating, Delete wipes all `null`-email rows
- **Fix**: Re-keyed on `username` (always present, always unique per schema)
- **Verified**: Created username-only account (`alice`, no email), edited it successfully (password only), deleted it alone (no collateral). No collisions.

**DB Credential Issue (Pre-existing, Newly Exposed):**
- `.env.local` `SUPABASE_DB_PASSWORD` rejected by both port 5432 and 6543 (TCP reachable, auth failure)
- Blocked `scripts/db/apply-migration.mts`; same credential fails `verify-staff-read.mts` (pre-existing script)
- **Workaround**: Applied migration manually via Supabase Studio while agent continued building REST/Auth paths (unaffected — service-role key uses different auth)
- **Impact on this task**: None — migration is in, feature complete. Impact on repo: direct-Postgres scripts are broken until credential is rotated.

## What We Tried

1. Followed plan exactly → revealed the plan had gaps
2. Applied migration via direct postgres → hit auth failure, pivoted to Supabase Studio
3. Built all 7 tasks per spec → code review flagged defects immediately
4. Fixed both defects → added authz check and re-keyed data model
5. Verified fixes end-to-end with Playwright against dev server

## Root Cause Analysis

**Why did authorization/keying bugs land in the plan?**
- Plan was written as proof-of-concept code, not security-audited code
- Schema change (nullable email) wasn't traced through to UI components
- Admin-only function didn't explicitly state "enforce via getCurrentUser check" — just a comment
- Code review, not planning review, caught these (indicates planning rigor gap)

**Why is DB credential stale?**
- Unknown — likely a previous manual credential rotation that didn't update `.env.local`
- Affects a secondary verification script path (direct postgres), not the main auth flows
- Indicates environment setup documentation is incomplete or wasn't followed during last cred rotation

## Lessons Learned

1. **Code review is non-negotiable.** Plan-to-code fidelity is not sufficient for correctness. Even verbatim code needs security/data-model audit.
2. **Schema changes propagate to the entire feature,** not just the database. Nullable email → audit every UI component that reads/keys on it.
3. **Authorization checks must be explicit in code, not comments.** "Admin-only" needs `if (role !== admin) throw` at the function entry.
4. **Environment credentials need rotation SOP.** The repo has two code paths requiring Postgres creds (direct scripts + service-role via Supabase). When rotating, update both `.env.local` documentation and any affected scripts, or deprecate direct-Postgres scripts entirely.

## Next Steps

1. **Merge this feature** (all defects fixed, E2E passing).
2. **Rotate `.env.local` DB password** in local dev environment and update `README.md` or `./docs/environment-setup.md` to document the credential and warn about expiry.
3. **Consider deprecating `scripts/db/apply-migration.mts`** and `verify-staff-read.mts` (direct Postgres scripts) in favor of Supabase Studio or REST API migration runners, since service-role auth is more maintainable.
4. **Add authz check template to code-review checklist** for any function using service-role / admin-only clients.
5. **Add "trace schema changes to UI" step to feature planning checklist** to catch keying/nullability issues earlier.

**Owner**: @lamvh  
**Follow-up PR**: Credential rotation + environment docs  
**Blocking**: None; feature is complete and production-ready
