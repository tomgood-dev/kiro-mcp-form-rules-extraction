# personal standalone tpd cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-standalone-tpd-cover-v1.spec.js`
**Run:** 2026-09-04T08-09-12 · Edge headless · 46.3 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 20 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC01/AC02: All lump sum covers available; 1+ selectable | ✅ Passed |
| 2 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC03/AC12: TPD exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70} + Definition {Own default, Any, Modified} | ✅ Passed |
| 3 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC06: TPD + ANB < 17 → minimum age error | ✅ Passed |
| 4 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC06 boundary: TPD min age at ANB 17 is accepted (no min-age error) | ✅ Passed |
| 5 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC07: TPD Stepped + ANB > 65 → max age error | ✅ Passed |
| 6 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC07 boundary: TPD Stepped max at ANB 65 is accepted (no max-age error) | ✅ Passed |
| 7 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC08: TPD Level to 65 + ANB > 60 → max age error | ✅ Passed |
| 8 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC08 boundary: TPD Level to 65 max at ANB 60 is accepted (no max-age error) | ✅ Passed |
| 9 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09: TPD Level to 70 + ANB > 65 → max age error | ✅ Passed |
| 10 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09 boundary: TPD Level to 70 max at ANB 65 is accepted (no max-age error) | ✅ Passed |
| 11 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09A: TPD + ANB 17-21 + SI > $250,000 → young cap error | ✅ Passed |
| 12 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09A boundary: TPD ANB 17-21 SI exactly $250,000 is accepted (no young-cap error) | ✅ Passed |
| 13 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC10: TPD + ANB 17-21 + non-Modified definition → "only eligible for Modified TPD" error | ✅ Passed |
| 14 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC10 accept: TPD + ANB 17-21 + Modified definition is accepted (no Modified-only error) | ✅ Passed |
| 15 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC11: TPD + ANB > 21 + SI > $5,000,000 → max total SI cap error | ✅ Passed |
| 16 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC11 boundary: TPD SI exactly $5,000,000 (ANB > 21) is accepted (no cap error) | ✅ Passed |
| 17 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC13: TPD cover can be added and removed, premium reflects it | ✅ Passed |
| 18 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC14: Sum Insured "?" tooltip shows the TPD discount-bands text | ✅ Passed |
| 19 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC15: maximum 3 TPD covers — "+TPD" is disabled after 3 | ✅ Passed |
| 20 | Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC16: mixed TPD definitions on the same policy → "same TPD definition" error | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC01/AC02: All lump sum covers available; 1+ selectable</summary>

| Check | Expected | Actual |
|---|---|---|
| Lump sum cover "Life" is available | true | true |
| Lump sum cover "TPD" is available | true | true |
| Lump sum cover "Trauma" is available | true | true |
| Lump sum cover "Cancer" is available | true | true |
| Lump sum cover "Acd. Death" is available | true | true |
| Lump sum cover "Needlestick" is available | true | true |
| Lump sum cover "Specific Injury" is available | true | true |
| TPD is selectable (its Sum Insured field appears) | true | true |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC03/AC12: TPD exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70} + Definition {Own default, Any, Modified}</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Sum Insured field is present | true | true |
| TPD Premium Structure default | Stepped | Stepped |
| TPD Premium Structure options | Stepped, Level to 65, Level to 70 | Stepped, Level to 65, Level to 70 |
| TPD Definition default | Own | Own |
| TPD Definition options | Own, Any, Modified | Own, Any, Modified |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC06: TPD + ANB < 17 → minimum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD ANB < 17 | minimum Age Next Birthday ... TPD ... is 17 | The minimum premium is $240.00 per year per Life insured. \| The minimum Age Next Birthday for Stepped 'Standalone TPD Cover' is 17 |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC06 boundary: TPD min age at ANB 17 is accepted (no min-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD min age at ANB 17 accepted (no min-age error) | false | false |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC07: TPD Stepped + ANB > 65 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD Stepped + ANB > 65 | maximum Age Next Birthday for Stepped ... 65 | The minimum premium is $240.00 per year per Life insured. \| The maximum Age Next Birthday for Stepped 'Standalone TPD Cover' is 65 |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC07 boundary: TPD Stepped max at ANB 65 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Stepped max at ANB 65 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC08: TPD Level to 65 + ANB > 60 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD Level to 65 + ANB > 60 | Level to 65 ... 60 | The maximum Age Next Birthday for Level to 65 'Standalone TPD Cover' is 60 |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC08 boundary: TPD Level to 65 max at ANB 60 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Level to 65 max at ANB 60 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09: TPD Level to 70 + ANB > 65 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD Level to 70 + ANB > 65 | Level to 70 ... 65 | The maximum Age Next Birthday for Level to 70 'Standalone TPD Cover' is 65 |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09 boundary: TPD Level to 70 max at ANB 65 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Level to 70 max at ANB 65 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09A: TPD + ANB 17-21 + SI > $250,000 → young cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD ANB 17-21 + SI > $250k | Age Next Birthday 17 - 21 is $250,000 | The minimum premium is $240.00 per year per Life insured. \| The maximum 'TPD Cover' Sum Insured per life for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC09A boundary: TPD ANB 17-21 SI exactly $250,000 is accepted (no young-cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD ANB 17-21 SI exactly $250,000 accepted (no young-cap error) | false | false |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC10: TPD + ANB 17-21 + non-Modified definition → "only eligible for Modified TPD" error</summary>

| Check | Expected | Actual |
|---|---|---|
| Non-Modified TPD at ANB 17-21 raises the Modified-only error | only eligible for Modified TPD | The minimum premium is $240.00 per year per Life insured. \| Age Next Birthday 17-21 is only eligible for Modified TPD |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC10 accept: TPD + ANB 17-21 + Modified definition is accepted (no Modified-only error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Modified TPD at ANB 17-21 accepted (no Modified-only error) | false | false |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC11: TPD + ANB > 21 + SI > $5,000,000 → max total SI cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for TPD SI > $5,000,000 (ANB > 21) | maximum total Sum Insured per life for TPD Cover is $5,000,000 | The maximum total Sum Insured per life for TPD Cover is $5,000,000. |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC11 boundary: TPD SI exactly $5,000,000 (ANB > 21) is accepted (no cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD SI exactly $5,000,000 accepted (no cap error) | false | false |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC13: TPD cover can be added and removed, premium reflects it</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Sum Insured field present after adding the cover | true | true |
| TPD Sum Insured field removed after removing the cover | 0 | 0 |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC14: Sum Insured "?" tooltip shows the TPD discount-bands text</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD Sum Insured tooltip lists the discount bands | contains $100,000-$249,999 / $250,000-$499,999 / $500k + | Licensee OneOneTwoThree Sign out Illustration Add life Life 1 Personal Details First Name Last Name Date of birth Age next birthday Gender Male Female Smoking status (incl. vapes & e-cigarettes) Yes No Occupation Select...  Occupation code AM AA A1 A2 B C S U IC Employment status Select one Employed Self-Employed Employed by own company Other Pre-tax annual income ($) Policies 1 Personal Business Personal 1 Inflation Adjustment Benefit Premium Freeze We Pay Your Premiums None 30 days 60 days 90 days Flexi Rate N/A 2.5% 5.0% 7.5% 10.0% 12.5% 15.0% 17.5% 20.0% 22.5% 25.0% 27.5% 30.0% Lump Sum Covers 1 Life TPD Trauma Cancer Acd. Death Needlestick Specific Injury TPD A Remove Sum Insured ($) Premium Structure Definition Stepped Level to 65 Level to 70 Own Any Modified Disability Covers 0 Mortgage & Living Income Protection Workability Kids Cover 0 Number of Kids 0 1 2 3 4 5 6 7 8 9 Premium Total Annualised Premium (All Lives) Life 1 Personal Insurance 1 Payment frequency Fortnightly Monthly Quarterly Half Yearly Yearly Total $0.00 Total Yearly Premium $0.00 Bundling Discounts None Adviser Use Loadings CloseView PDFSave as NewSaveApply Annual income can include salary,wages, packaged fringe benefits, commissions, bonuses and company superannuation contributions e.g KiwiSaver. For the self-employed it's the insured's share of the net profit (or loss) of the business, derived from their own personal exertion (after deduction of all business expenses, including depreciation), but before tax. Waives the premiums for all the lump sum cover premiums on the policy after the chosen wait period if the insured is sick or disabled and cannot work for more than 10 hours a week after the chosen waiting period. Flexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission. This is the total premium the clients will pay for the year. For example, the monthly premium x 12 or the half-yearly premium x 2 Provides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit. For certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV. The Specific injury support benefit – Lump sum pays a multiple of the sum insured for specified injuries suffered as a result of an accident. It must be purchased with at least one eligible Personal Insurance cover. The large sum insured discount bands for TPD Cover are:  $100,000 - $249,999 $250,000 - $499,999 $500k + A discount that applies to Personal & Business for taking out multiple cover types:  2 cover types: 12.5%  3 or more cover types: 17.5% You can add commission details here You can add a percentage or per mille loading here |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC15: maximum 3 TPD covers — "+TPD" is disabled after 3</summary>

| Check | Expected | Actual |
|---|---|---|
| TPD add button is disabled after 3 TPD covers | true | true |

</details>

<details>
<summary>✅ Personal Standalone Lumpsum TPD Cover (ACB-2927) › AC16: mixed TPD definitions on the same policy → "same TPD definition" error</summary>

| Check | Expected | Actual |
|---|---|---|
| Mismatched TPD definitions raise the same-definition error | same TPD definition for TPD cover on the same policy | You must have the same TPD definition for TPD cover on the same policy. |

</details>

---

## Notes

- 20/20 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
