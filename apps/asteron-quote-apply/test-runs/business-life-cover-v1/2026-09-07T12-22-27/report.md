# business life cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/business-life-cover-v1.spec.js`
**Run:** 2026-09-07T12-22-27 · Edge headless · 8.6 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 2 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Business Policy Lump Sum Life Cover and Additional Covers (ACB-2638) › AC43: Acc Trauma + TPD on Trauma + ANB < 17 → TPD-on-Trauma min age error | ✅ Passed |
| 2 | Business Policy Lump Sum Life Cover and Additional Covers (ACB-2638) › AC44: Acc Trauma + TPD on Trauma + ANB > 60 → TPD-on-Trauma max age error | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Business Policy Lump Sum Life Cover and Additional Covers (ACB-2638) › AC43: Acc Trauma + TPD on Trauma + ANB < 17 → TPD-on-Trauma min age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD on Trauma (under Life) ANB < 17 | TPD on Trauma is 17 | The minimum premium is $240.00 per year per Life insured. \| Minimum Age Next Birthday for 'TPD on Trauma' is 17 The minimum Age Next Birthday for Trauma Recovery Cover is 17 |

</details>

<details>
<summary>✅ Business Policy Lump Sum Life Cover and Additional Covers (ACB-2638) › AC44: Acc Trauma + TPD on Trauma + ANB > 60 → TPD-on-Trauma max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD on Trauma (under Life) ANB > 60 | TPD on Trauma is 60 | Maximum Age Next Birthday for 'TPD on Trauma' is 60 |

</details>

---

## Notes

- 2/2 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
