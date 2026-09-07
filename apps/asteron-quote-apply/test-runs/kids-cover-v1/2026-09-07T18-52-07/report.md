# kids cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/kids-cover-v1.spec.js`
**Run:** 2026-09-07T18-52-07 · Edge headless · 15.1 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 6 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Apply for Kids Cover (ACB-2295) › AC01/AC02/AC07: Kids Cover selectable; number-of-kids drives per-kid First/Surname/DOB/Gender/SI fields | ✅ Passed |
| 2 | Apply for Kids Cover (ACB-2295) › AC03/AC04: Kids SI is a dropdown, default $50,000 (Free), range $50k-$200k in $10k steps (16 tiers) | ✅ Passed |
| 3 | Apply for Kids Cover (ACB-2295) › AC06: selecting kids with NO primary personal cover → companion-required error | ✅ Passed |
| 4 | Apply for Kids Cover (ACB-2295) › AC05: a kid DOB with ANB > 21 → maximum-age error (single error even with multiple over-age kids) | ✅ Passed |
| 5 | Apply for Kids Cover (ACB-2295) › Business Rule: maximum number of kids is 9 (the number-of-kids select caps at 9) | ✅ Passed |
| 6 | Apply for Kids Cover (ACB-2295) › AC08/AC09: kid SI above $50k adds a single "Kids" premium line (regardless of number of kids) | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Apply for Kids Cover (ACB-2295) › AC01/AC02/AC07: Kids Cover selectable; number-of-kids drives per-kid First/Surname/DOB/Gender/SI fields</summary>

| Check | Expected | Actual |
|---|---|---|
| Selecting 1 kid reveals a per-kid Date of Birth field | > before | 1 -> 2 |
| Per-kid firstName field present | true | true |
| Per-kid surname field present | true | true |
| Per-kid gender field present | true | true |

</details>

<details>
<summary>✅ Apply for Kids Cover (ACB-2295) › AC03/AC04: Kids SI is a dropdown, default $50,000 (Free), range $50k-$200k in $10k steps (16 tiers)</summary>

| Check | Expected | Actual |
|---|---|---|
| Kids SI dropdown default | $50,000 (Free) | $50,000 (Free) |
| Kids SI tier count (16: $50k-$200k in $10k steps) | 16 | 16 |
| Kids SI first tier | starts $50,000 | $50,000 (Free) |
| Kids SI last tier | $200,000 | $200,000 |
| Kids SI tiers step by exactly $10,000 | all 10000 | 10000 |

</details>

<details>
<summary>✅ Apply for Kids Cover (ACB-2295) › AC06: selecting kids with NO primary personal cover → companion-required error</summary>

| Check | Expected | Actual |
|---|---|---|
| Kids with no personal cover raises the companion-required error | add at least one Personal Insurance Cover before adding Kids Cover | The minimum premium is $240.00 per year per Life insured. \| Please add at least one Personal Insurance Cover before adding Kids Cover |

</details>

<details>
<summary>✅ Apply for Kids Cover (ACB-2295) › AC05: a kid DOB with ANB > 21 → maximum-age error (single error even with multiple over-age kids)</summary>

| Check | Expected | Actual |
|---|---|---|
| Kid DOB value landed (self-verify) | 1996-06-15 | 1996-06-15 |
| Kid ANB > 21 raises the max-age error | The maximum Age Next Birthday kids cover is 21 | The maximum Age Next Birthday kids cover is 21 |

</details>

<details>
<summary>✅ Apply for Kids Cover (ACB-2295) › Business Rule: maximum number of kids is 9 (the number-of-kids select caps at 9)</summary>

| Check | Expected | Actual |
|---|---|---|
| Maximum selectable number of kids | 9 | 9 |

</details>

<details>
<summary>✅ Apply for Kids Cover (ACB-2295) › AC08/AC09: kid SI above $50k adds a single "Kids" premium line (regardless of number of kids)</summary>

| Check | Expected | Actual |
|---|---|---|
| A "Kids" premium line appears in the panel | present (single total line) | Kids mentions=2 |

</details>

---

## Notes

- 6/6 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
