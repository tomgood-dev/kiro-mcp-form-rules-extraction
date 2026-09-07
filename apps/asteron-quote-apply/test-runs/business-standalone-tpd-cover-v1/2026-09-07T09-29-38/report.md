# business standalone tpd cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/business-standalone-tpd-cover-v1.spec.js`
**Run:** 2026-09-07T09-29-38 · Edge headless · 58.6 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 19 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC01/AC02: Business policy lump sum covers available; TPD selectable | ✅ Passed |
| 2 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC03: Business TPD exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70} + Definition {Own default, Any, Modified} + Business Security (default unchecked) | ✅ Passed |
| 3 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC04: Business TPD + ANB < 17 → minimum age error | ✅ Passed |
| 4 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC04 boundary: Business TPD min age at ANB 17 is accepted (no min-age error) | ✅ Passed |
| 5 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC05: Business TPD Stepped + ANB > 65 → max age error | ✅ Passed |
| 6 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC05 boundary: Business TPD Stepped max at ANB 65 is accepted (no max-age error) | ✅ Passed |
| 7 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC06: Business TPD Level to 65 + ANB > 60 → max age error | ✅ Passed |
| 8 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC07: Business TPD Level to 70 + ANB > 65 → max age error | ✅ Passed |
| 9 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC08: Business TPD + ANB 17-21 + SI > $250,000 → young cap error | ✅ Passed |
| 10 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC08 boundary: Business TPD ANB 17-21 SI exactly $250,000 is accepted (no young-cap error) | ✅ Passed |
| 11 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC09: Business TPD + ANB 17-21 + non-Modified definition → "only eligible for Modified TPD" | ✅ Passed |
| 12 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC10: Business TPD + ANB > 21 + SI > $5,000,000 → max total SI cap error | ✅ Passed |
| 13 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC10 boundary: Business TPD SI exactly $5,000,000 is accepted (no cap error) | ✅ Passed |
| 14 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC11/AC14: multi-TPD default-structure progression (Stepped→Level to 65→Level to 70) + max 3 disables +TPD | ✅ Passed |
| 15 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC15: mismatched TPD definitions on the same policy → same-definition error | ✅ Passed |
| 16 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC17: Business TPD + Business Security + ANB > 56 → Business Security max-age error | ✅ Passed |
| 17 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC17 boundary: Business Security at ANB 56 is accepted (no Business Security max-age error) | ✅ Passed |
| 18 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC12: Business TPD cover can be added and removed | ✅ Passed |
| 19 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC13: Business TPD "?" tooltip shows the discount-bands + Business Security text | ✅ Passed |
| 20 | Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC16: Acc TPD / TPD on Trauma + ANB 17-21 non-Modified → Modified-only error | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC16: Acc TPD / TPD on Trauma + ANB 17-21 non-Modified → Modified-only error

**Acceptance Criteria (from user story):**

> AC16: Given Acc TPD or TPD on Trauma, When ANB 17-21 and definition not Modified, Then "Age Next Birthday 17-21 is only eligible for Modified TPD".

**Why skipped:**

> Deferred: Acc TPD / TPD on Trauma are sub-covers under Life/Trauma (not standalone TPD) — belongs with the Business Life (ACB-2638) / Business Trauma (ACB-2939) specs where those sub-covers live. The standalone-TPD Modified-only rule is covered by AC09 here.

---

## What Each Passing Test Checked

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC01/AC02: Business policy lump sum covers available; TPD selectable</summary>

| Check | Expected | Actual |
|---|---|---|
| Business lump sum cover "Life" is available | true | true |
| Business lump sum cover "TPD" is available | true | true |
| Business lump sum cover "Trauma" is available | true | true |
| Business lump sum cover "Specific Injury" is available | true | true |
| TPD is selectable (Sum Insured field appears) | true | true |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC03: Business TPD exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70} + Definition {Own default, Any, Modified} + Business Security (default unchecked)</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Sum Insured field present | true | true |
| TPD Premium Structure default + options | Stepped(def); Stepped/Level to 65/Level to 70 | Stepped; Stepped/Level to 65/Level to 70 |
| TPD Definition default + options | Own(def); Own/Any/Modified | Own; Own/Any/Modified |
| Business Security checkbox present + default unchecked | present, unchecked | {"checked":false,"disabled":false} |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC04: Business TPD + ANB < 17 → minimum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Business TPD ANB < 17 | minimum Age Next Birthday ... TPD ... 17 | The minimum premium is $240.00 per year per Life insured. \| The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17 |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC04 boundary: Business TPD min age at ANB 17 is accepted (no min-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business TPD min age at ANB 17 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC05: Business TPD Stepped + ANB > 65 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Business TPD Stepped + ANB > 65 | maximum ... Stepped ... TPD ... 65 | The minimum premium is $240.00 per year per Life insured. \| The maximum Age Next Birthday for Stepped 'Standalone TPD Cover' is 65 |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC05 boundary: Business TPD Stepped max at ANB 65 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business TPD Stepped max at ANB 65 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC06: Business TPD Level to 65 + ANB > 60 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Business TPD Level to 65 + ANB > 60 | Level to 65 ... TPD ... 60 | The maximum Age Next Birthday for Level to 65 'Standalone TPD Cover' is 60 |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC07: Business TPD Level to 70 + ANB > 65 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Business TPD Level to 70 + ANB > 65 | Level to 70 ... TPD ... 65 | The maximum Age Next Birthday for Level to 70 'Standalone TPD Cover' is 65 |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC08: Business TPD + ANB 17-21 + SI > $250,000 → young cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Business TPD ANB 17-21 + SI > $250k | Age Next Birthday 17 - 21 is $250,000 | The minimum premium is $240.00 per year per Life insured. \| The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC08 boundary: Business TPD ANB 17-21 SI exactly $250,000 is accepted (no young-cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business TPD ANB 17-21 SI exactly $250,000 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC09: Business TPD + ANB 17-21 + non-Modified definition → "only eligible for Modified TPD"</summary>

| Check | Expected | Actual |
|---|---|---|
| Non-Modified TPD at ANB 17-21 raises the Modified-only error | only eligible for Modified TPD | The minimum premium is $240.00 per year per Life insured. \| Age Next Birthday 17-21 is only eligible for Modified TPD |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC10: Business TPD + ANB > 21 + SI > $5,000,000 → max total SI cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Business TPD SI > $5,000,000 | maximum total Sum Insured per life for TPD Cover is $5,000,000 | The maximum total Sum Insured per life for TPD Cover is $5,000,000. |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC10 boundary: Business TPD SI exactly $5,000,000 is accepted (no cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business TPD SI exactly $5,000,000 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC11/AC14: multi-TPD default-structure progression (Stepped→Level to 65→Level to 70) + max 3 disables +TPD</summary>

| Check | Expected | Actual |
|---|---|---|
| 1st TPD default structure | Stepped | Stepped |
| 2nd TPD default structure | Level to 65 | Level to 65 |
| 3rd TPD default structure | Level to 70 | Level to 70 |
| +TPD disabled after 3 covers | true | true |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC15: mismatched TPD definitions on the same policy → same-definition error</summary>

| Check | Expected | Actual |
|---|---|---|
| Mismatched TPD definitions raise the same-definition error | same TPD definition for TPD cover on the same policy | You must have the same TPD definition for TPD cover on the same policy. |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC17: Business TPD + Business Security + ANB > 56 → Business Security max-age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Security at ANB > 56 raises the max-age error | maximum Age Next Birthday for Business Security is 56 | The maximum Age Next Birthday for Business Security is 56 |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC17 boundary: Business Security at ANB 56 is accepted (no Business Security max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Security at ANB 56 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC12: Business TPD cover can be added and removed</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Sum Insured field present after adding | true | true |
| TPD Sum Insured field removed after removing | 0 | 0 |

</details>

<details>
<summary>✅ Business Policy Lumpsum Standalone TPD Cover (ACB-2940) › AC13: Business TPD "?" tooltip shows the discount-bands + Business Security text</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD discount-bands tooltip present | contains bands for TPD Cover | true |
| Business Security tooltip present | contains "future increases without medical underwriting" | true |

</details>

---

## Notes

- 19/20 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
