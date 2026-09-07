# Occupation (Apply-flow screen) — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/occupation-apply-flow-v1.spec.js`
- **Last run:** 2026-09-07 · QA (`https://outsystems-qa.asteronlife.co.nz`) · <1 min · 1 test
- **Source:** Acceptance-criteria mode — `docs/user-stories/User Story- Occupation.md`
- **Result:** 0/1 passing, 1 deferred (Apply-flow screen not reachable from the Quote screen)

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/AC02/AC03/AC04 | Apply-flow Occupation screen (Employer/Country/Address; Previous→Insurance History; Next→Income) | — | — | 🚫 Deferred | Not reachable from the Quote screen (see Deferred) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC01–AC04 | This story is the Apply-FLOW "Occupation" screen — its ACs are application-flow navigation (Previous → Insurance History, Next → Income) and capture of Employer/Country/Address. It is reached only after progressing a full application past Duty of Disclosure, which is not driveable from the Quote screen in this environment (Apply flow historically payment/flow-gated). Encode as part of a dedicated Apply-flow test pass once that flow is reachable end-to-end. The QUOTE-screen occupation dropdown + code eligibility is covered separately by `occupational-codes-v1` (ACB-6504). |
