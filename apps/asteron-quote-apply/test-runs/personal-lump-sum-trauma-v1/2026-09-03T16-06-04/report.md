# personal lump sum trauma — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-lump-sum-trauma-v1.spec.js`
**Run:** 2026-09-03T16-06-04 · Edge headless · 74.3 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 30 passed, 0 failed, 2 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Personal Lump Sum Trauma Cover › AC01/AC02: All lump sum covers available; 1+ selectable | ✅ Passed |
| 2 | Personal Lump Sum Trauma Cover › AC03: Trauma exposes SI + Premium Structure (Stepped default; Stepped/Level to 65/70) | ✅ Passed |
| 3 | Personal Lump Sum Trauma Cover › AC06: Trauma + ANB < 17 → minimum age error | ✅ Passed |
| 4 | Personal Lump Sum Trauma Cover › AC07: Trauma Stepped + ANB > 70 → max age error | ✅ Passed |
| 5 | Personal Lump Sum Trauma Cover › AC08: Trauma Level to 65 + ANB > 60 → max age error | ✅ Passed |
| 6 | Personal Lump Sum Trauma Cover › AC09: Trauma Level to 70 + ANB > 65 → max age error | ✅ Passed |
| 7 | Personal Lump Sum Trauma Cover › AC06 boundary: Trauma min age at ANB 17 is accepted (no age error) | ✅ Passed |
| 8 | Personal Lump Sum Trauma Cover › AC07 boundary: Trauma Stepped max at ANB 70 is accepted (no age error) | ✅ Passed |
| 9 | Personal Lump Sum Trauma Cover › AC08 boundary: Trauma Level to 65 max at ANB 60 is accepted (no age error) | ✅ Passed |
| 10 | Personal Lump Sum Trauma Cover › AC09 boundary: Trauma Level to 70 max at ANB 65 is accepted (no age error) | ✅ Passed |
| 11 | Personal Lump Sum Trauma Cover › AC10: Trauma + ANB 17-21 + SI > $250k → young combined cap error | ✅ Passed |
| 12 | Personal Lump Sum Trauma Cover › AC14: Trauma + ANB 22-70 + SI > $2M → $2M combined cap error | ✅ Passed |
| 13 | Personal Lump Sum Trauma Cover › AC21: Trauma + ANB 22-70 + SI < $5,000 → minimum SI error | ✅ Passed |
| 14 | Personal Lump Sum Trauma Cover › AC10/AC14/AC21 boundary: SI exactly at each Trauma cap is accepted | ✅ Passed |
| 15 | Personal Lump Sum Trauma Cover › AC23 boundary: Major Trauma SI exactly 3x Trauma SI is accepted (at the cap) | ✅ Passed |
| 16 | Personal Lump Sum Trauma Cover › AC23: Major Trauma SI > 3x Trauma SI (TRC < $25k) → 300% cap error | ✅ Passed |
| 17 | Personal Lump Sum Trauma Cover › AC22: Trauma + Major Trauma + Major Trauma SI < $5,000 → min Major Trauma SI error | ✅ Passed |
| 18 | Personal Lump Sum Trauma Cover › AC18: Maximum 3 Trauma covers — +Trauma button disabled after 3 | ✅ Passed |
| 19 | Personal Lump Sum Trauma Cover › AC25: TPD on Trauma + ANB < 17 → min age error | ✅ Passed |
| 20 | Personal Lump Sum Trauma Cover › AC26: TPD on Trauma + ANB > 60 → max age error | ✅ Passed |
| 21 | Personal Lump Sum Trauma Cover › AC04: Major Trauma inherits Premium Structure from Trauma + own SI field | ✅ Passed |
| 22 | Personal Lump Sum Trauma Cover › AC05/AC27: TPD on Trauma exposes SI + structure + Definition {Own default, Any} | ✅ Passed |
| 23 | Personal Lump Sum Trauma Cover › AC27: ANB 17-21 + TPD on Trauma (non-Modified) → Modified-TPD eligibility error | ✅ Passed |
| 24 | Personal Lump Sum Trauma Cover › AC20: Trauma Reinstatement and Continuous Trauma are mutually exclusive | ✅ Passed |
| 25 | Personal Lump Sum Trauma Cover › AC11: Trauma + Cancer combined SI over $250,000 (ANB 19) → cap error | ✅ Passed |
| 26 | Personal Lump Sum Trauma Cover › AC12: Trauma + Major Trauma combined SI over $250,000 (ANB 19) → cap error | ✅ Passed |
| 27 | Personal Lump Sum Trauma Cover › AC15: Trauma + Cancer combined SI over $2,000,000 (ANB 40) → cap error | ✅ Passed |
| 28 | Personal Lump Sum Trauma Cover › AC16: Trauma + Major Trauma combined SI over $2,000,000 (ANB 40) → cap error | ✅ Passed |
| 29 | Personal Lump Sum Trauma Cover › AC24: Sum Insured "?" tooltip shows the Trauma discount-bands text | ✅ Passed |
| 30 | Personal Lump Sum Trauma Cover › AC19: Trauma cover can be added and removed, premium reflects it | ✅ Passed |
| 31 | Personal Lump Sum Trauma Cover › AC13: Trauma + Major Trauma + Cancer combined SI over $250k (ANB 17-21) → triple-cover cap error | ⏭️ Skipped |
| 32 | Personal Lump Sum Trauma Cover › AC17: Trauma + Major Trauma + Cancer combined SI over $2M (ANB 22-70) → triple-cover cap error | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Personal Lump Sum Trauma Cover › AC13: Trauma + Major Trauma + Cancer combined SI over $250k (ANB 17-21) → triple-cover cap error

**Acceptance Criteria (from user story):**

> AC13: Given Trauma + Major Trauma + Cancer, When ANB 17-21 and combined SI > $250,000, Then the
> triple-cover combined-cap error ("Trauma Recovery Cover, Major Trauma, including Cancer Cover ...
> $250,000") is displayed.
> 
> Deferred: needs a probe to capture the exact triple-cover message and the SI split that triggers
> it (distinct from the two-cover AC11/AC12 message already tested). Encode after probing.

**Why skipped:**

> Needs a probe to capture the exact Trauma+MajorTrauma+Cancer triple-cover $250k message (see exhaustive-coverage-audit-2026-09-03.md).

---

### ⏭️ Personal Lump Sum Trauma Cover › AC17: Trauma + Major Trauma + Cancer combined SI over $2M (ANB 22-70) → triple-cover cap error

**Acceptance Criteria (from user story):**

> AC17: Given Trauma + Major Trauma + Cancer, When ANB 22-70 and combined SI > $2,000,000, Then the
> triple-cover combined-cap error ("Trauma Recovery Cover, Major Trauma, including Cancer Cover ...
> $2,000,000") is displayed.
> 
> Deferred: needs a probe to capture the exact triple-cover message and the SI split that triggers
> it (distinct from the two-cover AC15/AC16 message already tested). Encode after probing.

**Why skipped:**

> Needs a probe to capture the exact Trauma+MajorTrauma+Cancer triple-cover $2M message (see exhaustive-coverage-audit-2026-09-03.md).

---

## What Each Passing Test Checked

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC01/AC02: All lump sum covers available; 1+ selectable</summary>

| Check | Expected | Actual |
|---|---|---|
| Lump sum cover "Life" button present | true | true |
| Lump sum cover "TPD" button present | true | true |
| Lump sum cover "Trauma" button present | true | true |
| Lump sum cover "Cancer" button present | true | true |
| Lump sum cover "Acd. Death" button present | true | true |
| Lump sum cover "Needlestick" button present | true | true |
| Lump sum cover "Specific Injury" button present | true | true |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC03: Trauma exposes SI + Premium Structure (Stepped default; Stepped/Level to 65/70)</summary>

| Check | Expected | Actual |
|---|---|---|
| Trauma Premium Structure default value | Stepped | Stepped |
| Trauma Premium Structure has Stepped/Level to 65/Level to 70 options | 3 | 3 |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC06: Trauma + ANB < 17 → minimum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma ANB < 17 | minimum Age Next Birthday for Trauma Recovery Cover is 17 | The minimum premium is $240.00 per year per Life insured. \| The minimum Age Next Birthday for Trauma Recovery Cover is 17 |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC07: Trauma Stepped + ANB > 70 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma Stepped + ANB > 70 | maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70 | The maximum Age Next Birthday for Stepped Trauma Recovery Cover is 70 |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC08: Trauma Level to 65 + ANB > 60 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma Level to 65 + ANB > 60 | Level to 65 Trauma Recovery cover is 60 | The maximum Age Next Birthday for Level to 65 Trauma Recovery Cover is 60 |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC09: Trauma Level to 70 + ANB > 65 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma Level to 70 + ANB > 65 | Level to 70 Trauma Recovery cover is 65 | The maximum Age Next Birthday for Level to 70 Trauma Recovery Cover is 65 |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC06 boundary: Trauma min age at ANB 17 is accepted (no age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Trauma min age at ANB 17 accepted (no age error) | false | false |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC07 boundary: Trauma Stepped max at ANB 70 is accepted (no age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Trauma Stepped max at ANB 70 accepted (no age error) | false | false |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC08 boundary: Trauma Level to 65 max at ANB 60 is accepted (no age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Trauma Level to 65 max at ANB 60 accepted (no age error) | false | false |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC09 boundary: Trauma Level to 70 max at ANB 65 is accepted (no age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Trauma Level to 70 max at ANB 65 accepted (no age error) | false | false |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC10: Trauma + ANB 17-21 + SI > $250k → young combined cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma ANB 17-21 + SI > $250k | Trauma Recovery Cover ... Age Next Birthday 17 - 21 is $250,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC14: Trauma + ANB 22-70 + SI > $2M → $2M combined cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma ANB 22-70 + SI > $2M | Trauma Recovery Cover, including Cancer Cover, is $2,000,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC21: Trauma + ANB 22-70 + SI < $5,000 → minimum SI error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma ANB 22-70 + SI < $5,000 | minimum Trauma Cover sum insured is $5,000 | The minimum premium is $240.00 per year per Life insured. \| The minimum Trauma Cover sum insured is $5,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC10/AC14/AC21 boundary: SI exactly at each Trauma cap is accepted</summary>

| Check | Expected | Actual |
|---|---|---|
| AC10 boundary: SI $250,000 at ANB 17-21 accepted (no cap error) | false | false |
| AC14 boundary: SI $2,000,000 at ANB 22-70 accepted (no cap error) | false | false |
| AC21 boundary: SI $5,000 at ANB 22-70 accepted (no min-SI error) | false | false |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC23 boundary: Major Trauma SI exactly 3x Trauma SI is accepted (at the cap)</summary>

| Check | Expected | Actual |
|---|---|---|
| AC23 boundary: Major Trauma SI = 3x Trauma SI accepted (no 300% cap error) | false | false |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC23: Major Trauma SI > 3x Trauma SI (TRC < $25k) → 300% cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Major Trauma SI > 3x Trauma SI | maximum Sum Insured for Major Trauma Benefit | The maximum Sum Insured for Major Trauma Benefit based on the Trauma Cover Sum Insured of $20000 is $60000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC22: Trauma + Major Trauma + Major Trauma SI < $5,000 → min Major Trauma SI error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Major Trauma SI < $5,000 | minimum Major Trauma Benefit sum insured is $5,000 | The minimum Major Trauma Benefit sum insured is $5,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC18: Maximum 3 Trauma covers — +Trauma button disabled after 3</summary>

| Check | Expected | Actual |
|---|---|---|
| Trauma cover button disabled after 3 covers added | true | true |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC25: TPD on Trauma + ANB < 17 → min age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD on Trauma ANB < 17 | minimum Age Next Birthday for TPD on Trauma is 17 | The minimum premium is $240.00 per year per Life insured. \| The minimum Age Next Birthday for Trauma Recovery Cover is 17 The minimum Age Next Birthday for TPD on Trauma is 17 |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC26: TPD on Trauma + ANB > 60 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD on Trauma ANB > 60 | maximum Age Next Birthday for TPD on Trauma is 60 | The maximum Age Next Birthday for TPD on Trauma is 60 |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC04: Major Trauma inherits Premium Structure from Trauma + own SI field</summary>

| Check | Expected | Actual |
|---|---|---|
| Major Trauma Premium Structure mirrors Trauma (Stepped) | true | true |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC05/AC27: TPD on Trauma exposes SI + structure + Definition {Own default, Any}</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD on Trauma Definition default value | Own | Own |
| TPD on Trauma Definition options | Own,Any | Own,Any |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC27: ANB 17-21 + TPD on Trauma (non-Modified) → Modified-TPD eligibility error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for ANB 17-21 + TPD on Trauma (non-Modified) | only eligible for Modified TPD | The minimum premium is $240.00 per year per Life insured. \| Age Next Birthday 17-21 is only eligible for Modified TPD |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC20: Trauma Reinstatement and Continuous Trauma are mutually exclusive</summary>

| Check | Expected | Actual |
|---|---|---|
| Continuous Trauma disabled after selecting Trauma Reinstatement | true | true |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC11: Trauma + Cancer combined SI over $250,000 (ANB 19) → cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma + Cancer combined SI over $250,000 (ANB 19) | combined-cap error mentioning $250,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC12: Trauma + Major Trauma combined SI over $250,000 (ANB 19) → cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma + Major Trauma combined SI over $250,000 (ANB 19) | combined-cap error mentioning $250,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, Major Trauma, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC15: Trauma + Cancer combined SI over $2,000,000 (ANB 40) → cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma + Cancer combined SI over $2,000,000 (ANB 40) | combined-cap error mentioning $2,000,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, Major Trauma, including Cancer Cover, is $2,000,000. \| The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC16: Trauma + Major Trauma combined SI over $2,000,000 (ANB 40) → cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma + Major Trauma combined SI over $2,000,000 (ANB 40) | combined-cap error mentioning $2,000,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000. |

</details>

<details>
<summary>✅ Personal Lump Sum Trauma Cover › AC19: Trauma cover can be added and removed, premium reflects it</summary>

| Check | Expected | Actual |
|---|---|---|
| Yearly premium after adding Trauma cover | greater than 0 | 362.28 |
| Yearly premium after removing Trauma cover | null or 0 | 0 |

</details>

---

## Notes

- 30/32 tests passing, 2 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
