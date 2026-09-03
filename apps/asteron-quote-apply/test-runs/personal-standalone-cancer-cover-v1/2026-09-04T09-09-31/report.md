# personal standalone cancer cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/personal-standalone-cancer-cover-v1.spec.js`
**Run:** 2026-09-04T09-09-31 · Edge headless · 47.9 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 20 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC01/AC02: All lump sum covers available; 1+ selectable | ✅ Passed |
| 2 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC03: Cancer exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70} | ✅ Passed |
| 3 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC04: Cancer Stepped + ANB > 65 → max age error | ✅ Passed |
| 4 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC04 boundary: Cancer Stepped max at ANB 65 is accepted (no max-age error) | ✅ Passed |
| 5 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC05: Cancer Level to 65 + ANB > 60 → max age error | ✅ Passed |
| 6 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC05 boundary: Cancer Level to 65 max at ANB 60 is accepted (no max-age error) | ✅ Passed |
| 7 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC06: Cancer Level to 70 + ANB > 65 → max age error | ✅ Passed |
| 8 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC06 boundary: Cancer Level to 70 max at ANB 65 is accepted (no max-age error) | ✅ Passed |
| 9 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC07: Cancer + ANB 17-21 + SI > $250,000 → young combined-cap error | ✅ Passed |
| 10 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC07 boundary: Cancer ANB 17-21 SI exactly $250,000 is accepted (no young-cap error) | ✅ Passed |
| 11 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC08: Trauma + Cancer + ANB 17-21 + combined SI > $250,000 → young combined-cap error | ✅ Passed |
| 12 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC09: Cancer + ANB 22-65 + SI > $2,000,000 → $2M cap error | ✅ Passed |
| 13 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC09 boundary: Cancer ANB 22-65 SI exactly $2,000,000 is accepted (no cap error) | ✅ Passed |
| 14 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC10: Cancer + ANB 22-65 + SI < $10,000 → minimum SI error | ✅ Passed |
| 15 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC10 boundary: Cancer SI exactly $10,000 is accepted (no min-SI error) | ✅ Passed |
| 16 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC11: Trauma + Cancer + ANB 22-65 + combined SI > $2,000,000 → $2M cap error | ✅ Passed |
| 17 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC12: Trauma + Major Trauma + Cancer + ANB 22-65 + combined SI > $2,000,000 → $2M cap error | ✅ Passed |
| 18 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC13: maximum 3 Cancer covers — "+Cancer" disabled after 3, re-enables on remove | ✅ Passed |
| 19 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC14: 2nd/3rd Cancer covers default to the next Premium Structure (Stepped → Level to 65 → Level to 70) | ✅ Passed |
| 20 | Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC15: Sum Insured "?" tooltip shows the Cancer discount-bands text | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC01/AC02: All lump sum covers available; 1+ selectable</summary>

| Check | Expected | Actual |
|---|---|---|
| Lump sum cover "Life" is available | true | true |
| Lump sum cover "TPD" is available | true | true |
| Lump sum cover "Trauma" is available | true | true |
| Lump sum cover "Cancer" is available | true | true |
| Lump sum cover "Acd. Death" is available | true | true |
| Lump sum cover "Needlestick" is available | true | true |
| Lump sum cover "Specific Injury" is available | true | true |
| Cancer is selectable (its Sum Insured field appears) | true | true |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC03: Cancer exposes SI + Premium Structure {Stepped default, Level to 65, Level to 70}</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer Sum Insured field is present | true | true |
| Cancer Premium Structure default | Stepped | Stepped |
| Cancer Premium Structure options | Stepped, Level to 65, Level to 70 | Stepped, Level to 65, Level to 70 |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC04: Cancer Stepped + ANB > 65 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Cancer Stepped + ANB > 65 | stepped ... Cancer Cover is 65 | The maximum Age Next Birthday for Stepped premium Cancer Cover is 65 |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC04 boundary: Cancer Stepped max at ANB 65 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer Stepped max at ANB 65 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC05: Cancer Level to 65 + ANB > 60 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Cancer Level to 65 + ANB > 60 | Level to 65 ... 60 | The maximum Age Next Birthday for Level to 65 Cancer Cover is 60 |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC05 boundary: Cancer Level to 65 max at ANB 60 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer Level to 65 max at ANB 60 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC06: Cancer Level to 70 + ANB > 65 → max age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Cancer Level to 70 + ANB > 65 | Level to 70 ... 65 | The maximum Age Next Birthday for Level to 70 Cancer Cover is 65 |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC06 boundary: Cancer Level to 70 max at ANB 65 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer Level to 70 max at ANB 65 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC07: Cancer + ANB 17-21 + SI > $250,000 → young combined-cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Cancer ANB 17-21 + SI > $250k | 17 - 21 is $250,000 (incl Cancer) | The minimum premium is $240.00 per year per Life insured. \| The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC07 boundary: Cancer ANB 17-21 SI exactly $250,000 is accepted (no young-cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer ANB 17-21 SI exactly $250,000 accepted (no young-cap error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC08: Trauma + Cancer + ANB 17-21 + combined SI > $250,000 → young combined-cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma+Cancer combined > $250k (ANB 17-21) | 17 - 21 is $250,000 (incl Cancer) | The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, for clients Age Next Birthday 17 - 21 is $250,000. |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC09: Cancer + ANB 22-65 + SI > $2,000,000 → $2M cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Cancer ANB 22-65 + SI > $2M | including Cancer Cover, is $2,000,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000. |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC09 boundary: Cancer ANB 22-65 SI exactly $2,000,000 is accepted (no cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer ANB 22-65 SI exactly $2,000,000 accepted (no cap error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC10: Cancer + ANB 22-65 + SI < $10,000 → minimum SI error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Cancer SI < $10,000 | minimum Cancer Cover sum insured is $10,000 | The minimum premium is $240.00 per year per Life insured. \| The minimum Cancer Cover sum insured is $10,000. |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC10 boundary: Cancer SI exactly $10,000 is accepted (no min-SI error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer SI exactly $10,000 accepted (no min-SI error) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC11: Trauma + Cancer + ANB 22-65 + combined SI > $2,000,000 → $2M cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma+Cancer combined > $2M (ANB 22-65) | including Cancer Cover, is $2,000,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, Major Trauma, including Cancer Cover, is $2,000,000. \| The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000. |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC12: Trauma + Major Trauma + Cancer + ANB 22-65 + combined SI > $2,000,000 → $2M cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Error shown for Trauma+MajorTrauma+Cancer combined > $2M | including Cancer Cover, is $2,000,000 | The maximum total Sum Insured per life for Trauma Recovery Cover, Major Trauma, including Cancer Cover, is $2,000,000. \| The maximum total Sum Insured per life for Trauma Recovery Cover, including Cancer Cover, is $2,000,000. |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC13: maximum 3 Cancer covers — "+Cancer" disabled after 3, re-enables on remove</summary>

| Check | Expected | Actual |
|---|---|---|
| +Cancer disabled after 3 Cancer covers | true | true |
| +Cancer re-enabled after removing one (now 2 covers) | false | false |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC14: 2nd/3rd Cancer covers default to the next Premium Structure (Stepped → Level to 65 → Level to 70)</summary>

| Check | Expected | Actual |
|---|---|---|
| 1st Cancer cover default Premium Structure | Stepped | Stepped |
| 2nd Cancer cover default Premium Structure | Level to 65 | Level to 65 |
| 3rd Cancer cover default Premium Structure | Level to 70 | Level to 70 |
| 3rd Cancer Premium Structure is still changeable | Stepped | Stepped |

</details>

<details>
<summary>✅ Personal Lumpsum Standalone Cancer Cover (ACB-2928) › AC15: Sum Insured "?" tooltip shows the Cancer discount-bands text</summary>

| Check | Expected | Actual |
|---|---|---|
| Cancer Sum Insured tooltip lists the discount bands | contains $100,000-$249,999 / $250,000+ | Licensee OneOneTwoThree Sign out Illustration Add life Life 1 Personal Details First Name Last Name Date of birth Age next birthday Gender Male Female Smoking status (incl. vapes & e-cigarettes) Yes No Occupation Select...  Occupation code AM AA A1 A2 B C S U IC Employment status Select one Employed Self-Employed Employed by own company Other Pre-tax annual income ($) Policies 1 Personal Business Personal 1 Inflation Adjustment Benefit Premium Freeze We Pay Your Premiums None 30 days 60 days 90 days Flexi Rate N/A 2.5% 5.0% 7.5% 10.0% 12.5% 15.0% 17.5% 20.0% 22.5% 25.0% 27.5% 30.0% Lump Sum Covers 1 Life TPD Trauma Cancer Acd. Death Needlestick Specific Injury Cancer A Remove Sum Insured ($) Premium Structure Stepped Level to 65 Level to 70 Disability Covers 0 Mortgage & Living Income Protection Workability Kids Cover 0 Number of Kids 0 1 2 3 4 5 6 7 8 9 Premium Total Annualised Premium (All Lives) Life 1 Personal Insurance 1 Payment frequency Fortnightly Monthly Quarterly Half Yearly Yearly Total $0.00 Total Yearly Premium $0.00 Bundling Discounts None Adviser Use Loadings CloseView PDFSave as NewSaveApply Annual income can include salary,wages, packaged fringe benefits, commissions, bonuses and company superannuation contributions e.g KiwiSaver. For the self-employed it's the insured's share of the net profit (or loss) of the business, derived from their own personal exertion (after deduction of all business expenses, including depreciation), but before tax. Waives the premiums for all the lump sum cover premiums on the policy after the chosen wait period if the insured is sick or disabled and cannot work for more than 10 hours a week after the chosen waiting period. Flexi-rate allows you to discount your clients premium by reducing all or part of the Advisers Initial and/or Renewal Commission. This is the total premium the clients will pay for the year. For example, the monthly premium x 12 or the half-yearly premium x 2 Provides additional money over and above the Trauma Recovery sum insured for cancer conditions and includes the Early stage cancer benefit. For certain occupations, provides additional financial protection against the risk of contracting hepatitis B or C or HIV. The Specific injury support benefit – Lump sum pays a multiple of the sum insured for specified injuries suffered as a result of an accident. It must be purchased with at least one eligible Personal Insurance cover. The large sum insured discount bands for Cancer Cover are:  $100,000 - $249,999 $250k + A discount that applies to Personal & Business for taking out multiple cover types:  2 cover types: 12.5%  3 or more cover types: 17.5% You can add commission details here You can add a percentage or per mille loading here |

</details>

---

## Notes

- 20/20 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
