# lump sum life cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/lump-sum-life-cover-v1.spec.js`
**Run:** 2026-08-28T10-48-07 · Edge headless · 19.8 min · 2 workers
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 17 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | AC01/AC02: Life cover is available to apply for in a new Personal quote | ✅ Passed |
| 2 | AC03: Selecting Life exposes Sum Insured, auto-ticks Inflation, defaults Premium Structure to Stepped | ✅ Passed |
| 3 | AC05: Entering Sum Insured calculates and displays a premium | ✅ Passed |
| 4 | AC06: A cover can be added and removed, with premium reflecting the change | ✅ Passed |
| 5 | AC07: Stepped, Age Next Birthday outside 11-75 → age-range error on Apply | ✅ Passed |
| 6 | AC08: Level to 50 max age → error on Apply above cap | ✅ Passed |
| 7 | AC09: Level to 60 max age → error on Apply above cap | ✅ Passed |
| 8 | AC10: Level to 65 max age → error on Apply above cap | ✅ Passed |
| 9 | AC11: Level to 70 max age → error on Apply above cap | ✅ Passed |
| 10 | AC12: Level to 75 max age → error on Apply above cap | ✅ Passed |
| 11 | AC13: Level to 80 max age → error on Apply above cap | ✅ Passed |
| 12 | AC14: Level to 100 max age → error on Apply above cap | ✅ Passed |
| 13 | AC15: Any Level + Age Next Birthday < 17 → minimum-age error | ✅ Passed |
| 14 | AC16: Stepped + SI > $50,000 + Age Next Birthday 11-16 → under-17 cap error | ✅ Passed |
| 15 | AC19: Calculated yearly premium < $240 → minimum-premium error on Apply | ✅ Passed |
| 16 | AC21: Selecting Premium Freeze auto-unticks Inflation Adjustment (mutual exclusion) | ✅ Passed |
| 17 | AC23: Maximum 3 Life covers — Life button disabled after 3 | ✅ Passed |

---

## Notes

- 17/17 tests passing. All testable acceptance criteria for ACB-2242 confirmed matching the story
  against the live app.
- Test assertions are written to the spec's expected behavior — they pass automatically once the
  app matches the requirement.
- Deferred ACs (AC04, AC17, AC18, AC20, AC22) are documented in
  `docs/test-documentation/lump-sum-life-cover-v1.md`.
- NOTE: this report.md was written manually because the auto-reporter did not emit on this
  all-pass, 2-worker run (reporter bug — see TEST-GENERATION-LEARNINGS). The result above is from
  the run's own summary output (`17 passed`).
