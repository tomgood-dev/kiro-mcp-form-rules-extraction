# personal disability income protection — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-disability-income-protection-v1.spec.js`
**Run:** 2026-09-04T15-42-57 · Edge headless · 7.2 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 2 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Personal Disability Cover — Income Protection (ACB-2646) › AC17: IP + ANB > 61 → maximum age error | ✅ Passed |
| 2 | Personal Disability Cover — Income Protection (ACB-2646) › AC17 boundary: IP max age at ANB 61 is accepted (no max-age error) | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Personal Disability Cover — Income Protection (ACB-2646) › AC17: IP + ANB > 61 → maximum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for IP ANB > 61 | maximum Age Next Birthday for Income Protection ... 61 | The maximum Age Next Birthday for Income Protection cover is 61 |

</details>

<details>
<summary>✅ Personal Disability Cover — Income Protection (ACB-2646) › AC17 boundary: IP max age at ANB 61 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| IP max age at ANB 61 accepted (no max-age error) | false | false |

</details>

---

## Notes

- 2/2 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
