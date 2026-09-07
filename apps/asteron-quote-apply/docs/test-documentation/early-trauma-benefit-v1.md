# Early Trauma Benefit — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/early-trauma-benefit-v1.spec.js`
- **Last run:** 2026-09-07 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~4 min · 2 tests
- **Source:** Acceptance-criteria mode — Jira ACB-10105 (`docs/user-stories/User Story- Early Trauma Benefit.md`)
- **Result:** 1/2 passing, 1 deferred (SI calc + PDF/L400 not surfaced on the quote screen)

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC00 (reachable) | Early Trauma Benefit is a selectable option on a Trauma cover | Trauma $30k; read + tick the Early Trauma checkbox | Checkbox present, default unticked, togglable | ✅ Pass | The reachable part of the feature |
| 2 | AC01–AC05 | Calculated Early Trauma SI (20% / min $10k / max $100k) + PDF/L400 | — | — | 🚫 Deferred | SI not surfaced on the quote screen (see Deferred) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC01, AC02, AC03, AC04 | The calculated Early Trauma Benefit Sum Insured is NOT surfaced on the quote screen — probe (2026-09-07) confirmed ticking the Early Trauma checkbox does not add/display an Early Trauma SI input (the only SI input still showed the Trauma SI). Not browser-assertable. |
| AC05 | Per the story, the Early Trauma SI is delivered via the PDF / L400 (backend). Verify via a generated PDF or an L400 payload capture, outside this browser suite. |
