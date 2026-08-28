# personal lump sum trauma — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-lump-sum-trauma-v1.spec.js`
**Run:** 2026-08-28T13-30-54 · Edge headless · 18.0 min · 2 workers
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 15 passed, 0 failed
**Source:** ACB-2926 (Personal Lump Sum Standalone Trauma Cover), acceptance-criteria mode
**Generated from the user story using accumulated app context (helpers + LSC- business rules) — no fresh exploration.**

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | AC01/AC02: All 7 lump sum covers available; 1+ selectable | ✅ Passed |
| 2 | AC03: Trauma exposes SI + Premium Structure (Stepped default; Stepped/Level to 65/70) + sub-covers | ✅ Passed |
| 3 | AC06: Trauma + ANB < 17 → min age error | ✅ Passed |
| 4 | AC07: Trauma Stepped + ANB > 70 → max age error | ✅ Passed |
| 5 | AC08: Trauma Level to 65 + ANB > 60 → max age error | ✅ Passed |
| 6 | AC09: Trauma Level to 70 + ANB > 65 → max age error | ✅ Passed |
| 7 | AC10: Trauma + ANB 17-21 + SI > $250k → young combined cap | ✅ Passed |
| 8 | AC14: Trauma + ANB 22-70 + SI > $2M → $2M combined cap | ✅ Passed |
| 9 | AC21: Trauma + SI < $5,000 → min SI error | ✅ Passed |
| 10 | AC23: Major Trauma SI > 3x Trauma SI (TRC < $25k) → 300% cap | ✅ Passed |
| 11 | AC22: Major Trauma SI < $5,000 → min Major Trauma SI error | ✅ Passed |
| 12 | AC18: Max 3 Trauma covers — +Trauma button disabled after 3 | ✅ Passed |
| 13 | AC25: TPD on Trauma + ANB < 17 → min age error | ✅ Passed |
| 14 | AC26: TPD on Trauma + ANB > 60 → max age error | ✅ Passed |
| 15 | AC19: Trauma cover add/remove reflects in premium | ✅ Passed |

---

## Notes

- 15/15 passing. Generated from the story with no fresh exploration — validates the
  "story → tests → run" flow on accumulated context.
- Login now self-manages the single-session conflict (retry + backoff + fail-fast) — this run's
  global-setup logged in on attempt 1 after the 60s release wait.
- Remaining ACs not yet encoded (need targeted probes / variants — to be done per the "no
  deferring" rule): AC04/AC05 (sub-cover SI/structure inheritance), AC11-13/AC15-17 (Cancer +
  combined-cap variants), AC20 (Reinstatement vs Continuous mutual exclusion), AC24 (tooltips),
  AC27 (Modified TPD eligibility 17-21).
- Report written manually pending the reporter all-pass fix; result from run summary.
