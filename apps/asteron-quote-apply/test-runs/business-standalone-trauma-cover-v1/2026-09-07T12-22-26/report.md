# business standalone trauma cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/business-standalone-trauma-cover-v1.spec.js`
**Run:** 2026-09-07T12-22-26 · Edge headless · 4.7 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 1 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Business Policy Lump Sum Standalone Trauma Cover (ACB-2939) › AC11: Business Trauma + Major Trauma + ANB 17-21 + combined SI > $250,000 → young combined-cap error | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Business Policy Lump Sum Standalone Trauma Cover (ACB-2939) › AC11: Business Trauma + Major Trauma + ANB 17-21 + combined SI > $250,000 → young combined-cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Business Trauma+Major Trauma combined > $250k (ANB 17-21) | 17 - 21 is $250,000 (incl Cancer) | The maximum total Sum Insured per life for Trauma Recovery Cover, Major Trauma, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

---

## Notes

- 1/1 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
