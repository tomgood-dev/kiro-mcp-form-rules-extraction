# Landing page: Inflight Quotes — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-inflight-quotes-v1.spec.js`
- **Last run:** 2026-09-08 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~2 min · 3 tests
- **Source:** Acceptance-criteria mode — `docs/user-stories/User Story- Landing page- Inflight Quotes.md`
- **Result:** 2/3 passing, 1 deferred (time-dependent 45-day expiry)

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01 | Clicking quote & apply lands on the New Business Quoting Tool UI | Navigate to /QuoteAndApply/ | "Quotes and Applications" UI + New Quote | ✅ Pass | |
| 2 | AC02 | Inflight quotes with all statuses viewable (status filter exposes each) | Read status filter | Quote/Pre application/Submitted/App-in-progress/…with TIV/Expired | ✅ Pass | |
| 3 | AC03/AC04 | 45-day expiry (App-in-progress/Pre-App expire; Quote >45 days shows rate-change validation) | — | — | 🚫 Deferred | Time-dependent (see Deferred) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC03, AC04 | Depend on records whose last-modified date is more than 45 days in the past (to trigger expiry / the stale-rate validation on re-entry). This elapsed-time state cannot be created on demand from the browser, and the QA test accounts have no aged records (the In Progress table is empty — probe 2026-09-08). Reachable only with seeded records backdated >45 days or a backend clock/date fixture. |
