# kids cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/kids-cover.spec.js`
**Run:** 2026-09-02T14-28-25 · Edge headless · 19.7 min
**Environment:** outsystems-dev.asteronlife.co.nz
**Result:** 1 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | KID-10: Kids Cover premium is only charged once Sum Insured exceeds the free $50,000 tier | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ KID-10: Kids Cover premium is only charged once Sum Insured exceeds the free $50,000 tier</summary>

| Check | Expected | Actual |
|---|---|---|
| Total yearly premium unchanged with Kids Cover at the $50,000 (Free) tier | 254.16 | 254.16 |
| Total yearly premium increases once Kid Sum Insured exceeds the $50,000 free tier (next tier: $60,000) | > 254.16 | 266.16 |

</details>

---

## Notes

- 1/1 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
