# kids cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/kids-cover-v1.spec.js`
**Run:** 2026-09-07T18-47-45 · Edge headless · 4.1 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 1 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Apply for Kids Cover (ACB-2295) › AC05: a kid DOB with ANB > 21 → maximum-age error (single error even with multiple over-age kids) | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Apply for Kids Cover (ACB-2295) › AC05: a kid DOB with ANB > 21 → maximum-age error (single error even with multiple over-age kids)</summary>

| Check | Expected | Actual |
|---|---|---|
| Kid DOB value landed (self-verify) | 1996-06-15 | 1996-06-15 |
| Kid ANB > 21 raises the max-age error | The maximum Age Next Birthday kids cover is 21 | The maximum Age Next Birthday kids cover is 21 |

</details>

---

## Notes

- 1/1 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
