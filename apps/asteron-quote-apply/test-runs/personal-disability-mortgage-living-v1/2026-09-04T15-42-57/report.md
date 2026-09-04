# personal disability mortgage living — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-disability-mortgage-living-v1.spec.js`
**Run:** 2026-09-04T15-42-57 · Edge headless · 7.2 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 2 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Personal Disability Cover — Mortgage & Living (ACB-2653) › AC10: M&L + ANB > 61 → maximum age error | ✅ Passed |
| 2 | Personal Disability Cover — Mortgage & Living (ACB-2653) › AC10 boundary: M&L max age at ANB 61 is accepted (no max-age error) | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Personal Disability Cover — Mortgage & Living (ACB-2653) › AC10: M&L + ANB > 61 → maximum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for M&L ANB > 61 | maximum Age Next Birthday for Mortgage & Living ... 61 | The maximum Age Next Birthday for Mortgage & Living cover is 61 |

</details>

<details>
<summary>✅ Personal Disability Cover — Mortgage & Living (ACB-2653) › AC10 boundary: M&L max age at ANB 61 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| M&L max age at ANB 61 accepted (no max-age error) | false | false |

</details>

---

## Notes

- 2/2 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
