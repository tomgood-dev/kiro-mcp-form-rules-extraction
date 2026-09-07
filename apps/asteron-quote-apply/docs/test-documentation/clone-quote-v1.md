# Clone Quote — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/clone-quote-v1.spec.js`
- **Last run:** 2026-09-08 · QA (`https://outsystems-qa.asteronlife.co.nz`) · <1 min · 1 test
- **Source:** Acceptance-criteria mode — Jira ACB-5748 (`docs/user-stories/User Story - Clone Quote.md`)
- **Result:** 0/1 passing, 1 deferred (PC01 Submitted application not reachable)

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01-05 | Clone a submitted application (prepopulated quote; birthday-locked variant; Apply Now uses quote-level data only) | — | — | 🚫 Deferred | PC01 = a Submitted application (see Deferred) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC01–AC05 | PC01 requires a **Submitted** application. Probe 2026-09-08: the landing "Submitted" status filter returned **0 rows** on the test account, and producing a submitted application requires the full Apply → Payment → Submit flow (payment-gated in this environment). Clone Quote is a landing-page action on a submitted application and has no browser path from the quote screen. Reachable once a submitted-application fixture exists on a test account (or the payment gate is bypassable in a test env). |
