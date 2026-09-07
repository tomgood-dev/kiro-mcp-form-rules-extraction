# business farmers disability cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/business-farmers-disability-cover-v1.spec.js`
**Run:** 2026-09-07T14-32-03 · Edge headless · 101.9 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 29 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC01/AC02: Business policy Disability covers available (Business Disability, Farmers Disability, Business Expenses); selectable | ✅ Passed |
| 2 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC03: Business Disability exposes Monthly Benefit + Classification[Employed(def)/Equity Owner (up to 75%)/Equity Owner (>75%)] + Benefit Period[6(def)/9/12/18/24 Months] + Waiting[30(def)/60/90 Days] + Business Security(unticked)+Partial Disablement(ticked) + Stepped | ✅ Passed |
| 3 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC04/AC05: Farmers Disability exposes Monthly Benefit + Benefit Period[6(def)/9/12/18/24 Months/5 Years] + Waiting[30(def)/60/90 Days] + Business Security/Partial Disablement; NO Classification | ✅ Passed |
| 4 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC09: after adding Business Disability the +Business Disability button is disabled (max 1) | ✅ Passed |
| 5 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC10: after adding Farmers Disability the +Farmers Disability button is disabled (max 1) | ✅ Passed |
| 6 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC11: Business Disability cover can be added and removed | ✅ Passed |
| 7 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC12: Business Security tooltip text present ("Allows future increases without medical underwriting. Financial justification for increases required.") | ✅ Passed |
| 8 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC13: Business Disability + ANB > 61 → max-age error | ✅ Passed |
| 9 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC13 boundary: Business Disability at ANB 61 is accepted (no max-age error) | ✅ Passed |
| 10 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC14: Farmers Disability + ANB > 61 → max-age error | ✅ Passed |
| 11 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC14 boundary: Farmers Disability at ANB 61 is accepted (no max-age error) | ✅ Passed |
| 12 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC15: Business Disability monthly benefit > $50,000 → cap error | ✅ Passed |
| 13 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC15 boundary: Business Disability monthly benefit exactly $50,000 is accepted (no cap error) | ✅ Passed |
| 14 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC16: Farmers Disability monthly benefit > $10,000 (eligible occupation) → cap error | ✅ Passed |
| 15 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC16 boundary: Farmers Disability monthly benefit exactly $10,000 (eligible occupation) is accepted (no cap error) | ✅ Passed |
| 16 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC07: Farmers Disability + Employment Status "Employed" → employment-status error (+ occupation not available) | ✅ Passed |
| 17 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC06: Farmers Disability + occupation requiring Individual Consideration (IC) → underwriting message (+ occupation not available) | ✅ Passed |
| 18 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC08: Farmers Disability + ineligible occupation (U) → "This occupation is not eligible" + not available | ✅ Passed |
| 19 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC06/AC08 contrast: Farmers Disability + eligible occupation (C, Self-Employed) → NO occupation/eligibility error | ✅ Passed |
| 20 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC17: Farmers Disability + personal Workability → conjunction error | ✅ Passed |
| 21 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC18: Business Disability + personal Workability → conjunction error | ✅ Passed |
| 22 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC19/AC20: Business Disability + Farmers Disability together → mutual-exclusivity error | ✅ Passed |
| 23 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC22: Business Disability + Business Security + ANB > 56 → Business Security max-age error | ✅ Passed |
| 24 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC22 boundary: Business Security at ANB 56 is accepted (no Business Security max-age error) | ✅ Passed |
| 25 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC23: Business Disability + ANB < 17 → min-age error | ✅ Passed |
| 26 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC23 boundary: Business Disability at ANB 17 is accepted (no min-age error) | ✅ Passed |
| 27 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC24: Farmers Disability + ANB < 17 → min-age error | ✅ Passed |
| 28 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC24 boundary: Farmers Disability at ANB 17 is accepted (no min-age error) | ✅ Passed |
| 29 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC25: Business Disability + Classification "Equity Owner (>75%)" + Benefit Period 18/24 Months → invalid-combo error | ✅ Passed |
| 30 | Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC21: Sharemilker occupation → Farmers Disability $5,000 cap | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC21: Sharemilker occupation → Farmers Disability $5,000 cap

**Acceptance Criteria (from user story):**

> AC21: Given occupation "Sharemilker - Not an employee milker", When Farmers Disability is selected, Then "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $5,000".
> 
> Deferred reason: the named farming occupations in the story's Business Rules (Sharemilker, Dairy Farm Manager, etc.) are NOT selectable from the occupation control available to this test account.
> Probe (probe-business-farmers-disability.js, 2026-09-07) confirmed the Business-policy Occupation Code dropdown exposes only single-letter risk classes [AM/AA/A1/A2/B/C/S/U/IC] — there is no named-occupation typeahead on this screen for this account, so "Sharemilker - Not an employee milker" cannot be selected and the $5,000 sub-cap cannot be reached from the browser here.
> 
> Expected (per story): "The maximum allowable Farmers Disability monthly benefit for the selected occupation is $5,000".

**Why skipped:**

> Named farming occupation "Sharemilker - Not an employee milker" is not selectable from the single-letter Occupation Code dropdown available to this account (probe-business-farmers-disability.js confirmed only AM/AA/A1/A2/B/C/S/U/IC). The $5,000 sub-cap requires that named occupation and cannot be reached from the browser here.

---

## What Each Passing Test Checked

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC01/AC02: Business policy Disability covers available (Business Disability, Farmers Disability, Business Expenses); selectable</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability cover "Business Disability" is available | true | true |
| Business Disability cover "Farmers Disability" is available | true | true |
| Business Disability cover "Business Expenses" is available | true | true |
| Business Disability selectable (Monthly Benefit field appears) | true | true |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC03: Business Disability exposes Monthly Benefit + Classification[Employed(def)/Equity Owner (up to 75%)/Equity Owner (>75%)] + Benefit Period[6(def)/9/12/18/24 Months] + Waiting[30(def)/60/90 Days] + Business Security(unticked)+Partial Disablement(ticked) + Stepped</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability Monthly Benefit field present | true | true |
| Classification default | Employed | Employed |
| Classification options (as a set) | Employed, Equity Owner (up to 75%), Equity Owner (>75%) | Employed, Equity Owner (>75%), Equity Owner (up to 75%) |
| Benefit Period default | 6 Months | 6 Months |
| Benefit Period options | 6/9/12/18/24 Months | 6 Months/9 Months/12 Months/18 Months/24 Months |
| Waiting Period default | 30 Days | 30 Days |
| Waiting Period options | 30/60/90 Days | 30 Days/60 Days/90 Days |
| Premium Structure pre-populated Stepped | Stepped | Stepped |
| Business Security present + default unticked | present, unchecked | {"checked":false,"disabled":false} |
| Partial Disablement present + default ticked | present, checked | {"checked":true,"disabled":false} |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC04/AC05: Farmers Disability exposes Monthly Benefit + Benefit Period[6(def)/9/12/18/24 Months/5 Years] + Waiting[30(def)/60/90 Days] + Business Security/Partial Disablement; NO Classification</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers Disability Monthly Benefit field present | true | true |
| Farmers Benefit Period default | 6 Months | 6 Months |
| Farmers Benefit Period options (adds 5 Years) | 6/9/12/18/24 Months/5 Years | 6 Months/9 Months/12 Months/18 Months/24 Months/5 Years |
| Farmers Waiting Period default + options | 30 Days; 30/60/90 Days | 30 Days; 30 Days/60 Days/90 Days |
| Farmers Premium Structure Stepped | Stepped | Stepped |
| Farmers Business Security(unticked) + Partial Disablement(ticked) | BS unchecked, PD checked | BS={"checked":false,"disabled":false} PD={"checked":true,"disabled":false} |
| AC05: Classification dropdown ABSENT for Farmers | null | null |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC09: after adding Business Disability the +Business Disability button is disabled (max 1)</summary>

| Check | Expected | Actual |
|---|---|---|
| +Business Disability disabled after adding one | true | true |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC10: after adding Farmers Disability the +Farmers Disability button is disabled (max 1)</summary>

| Check | Expected | Actual |
|---|---|---|
| +Farmers Disability disabled after adding one | true | true |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC11: Business Disability cover can be added and removed</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability benefit field present after adding | true | true |
| Business Disability benefit field removed after removing | 0 | 0 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC12: Business Security tooltip text present ("Allows future increases without medical underwriting. Financial justification for increases required.")</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Security tooltip text present | true | true |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC13: Business Disability + ANB > 61 → max-age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability ANB 62 max-age error | The maximum Age Next Birthday for Business Disability is 61 | The maximum Age Next Birthday for Business Disability is 61 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC13 boundary: Business Disability at ANB 61 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability at ANB 61 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC14: Farmers Disability + ANB > 61 → max-age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers Disability ANB 62 max-age error | The maximum Age Next Birthday for Farmers Disability is 61 | The maximum Age Next Birthday for Farmers Disability is 61 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC14 boundary: Farmers Disability at ANB 61 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers Disability at ANB 61 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC15: Business Disability monthly benefit > $50,000 → cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability > $50,000 cap error | The maximum allowable monthly benefit for Business Disability Cover is $50,000 | The maximum allowable monthly benefit for Business Disability Cover is $50,000 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC15 boundary: Business Disability monthly benefit exactly $50,000 is accepted (no cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability exactly $50,000 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC16: Farmers Disability monthly benefit > $10,000 (eligible occupation) → cap error</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers Disability > $10,000 cap error | The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000 | The maximum allowable Farmers Disability monthly benefit for the selected occupation is $10,000 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC16 boundary: Farmers Disability monthly benefit exactly $10,000 (eligible occupation) is accepted (no cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers Disability exactly $10,000 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC07: Farmers Disability + Employment Status "Employed" → employment-status error (+ occupation not available)</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers + Employed employment-status error | Eligibility for Farmers Disability Cover requires an Employment Status of either 'Self Employed' or 'Employed by own company' | The minimum premium is $240.00 per year per Life insured. \| Eligibility for Farmers Disability Cover requires an Employment Status of either 'Self Employed' or 'Employed by own company' Farmers Disability Cover is not available for the selected occupation |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC06: Farmers Disability + occupation requiring Individual Consideration (IC) → underwriting message (+ occupation not available)</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers + IC occupation → not-available error | Farmers Disability Cover is not available for the selected occupation | The minimum premium is $240.00 per year per Life insured. \| Please contact underwriting as this Occupation requires Individual Consideration Farmers Disability Cover is not available for the selected occupation |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC08: Farmers Disability + ineligible occupation (U) → "This occupation is not eligible" + not available</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers + U occupation → not-eligible | This occupation is not eligible | The minimum premium is $240.00 per year per Life insured. \| This occupation is not eligible Farmers Disability Cover is not available for the selected occupation |
| Farmers + U occupation → not available for occupation | Farmers Disability Cover is not available for the selected occupation | The minimum premium is $240.00 per year per Life insured. \| This occupation is not eligible Farmers Disability Cover is not available for the selected occupation |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC06/AC08 contrast: Farmers Disability + eligible occupation (C, Self-Employed) → NO occupation/eligibility error</summary>

| Check | Expected | Actual |
|---|---|---|
| Eligible occupation C → no occupation/eligibility error | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC17: Farmers Disability + personal Workability → conjunction error</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers + Workability conjunction error | Farmers Disability Cover is not available to be taken in conjunction with Workability Cover | Farmers Disability Cover is not available to be taken in conjunction with Workability Cover |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC18: Business Disability + personal Workability → conjunction error</summary>

| Check | Expected | Actual |
|---|---|---|
| Business + Workability conjunction error | Business Disability Cover is not available to be taken in conjunction with Workability Cover | Business Disability Cover is not available to be taken in conjunction with Workability Cover |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC19/AC20: Business Disability + Farmers Disability together → mutual-exclusivity error</summary>

| Check | Expected | Actual |
|---|---|---|
| Business + Farmers mutual-exclusivity error | Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other | Business Disability Cover and Farmers Disability Cover are not available to be taken in conjunction with each other |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC22: Business Disability + Business Security + ANB > 56 → Business Security max-age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Security ANB 57 max-age error | The maximum Age Next Birthday for Business Security is 56 | The maximum Age Next Birthday for Business Security is 56 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC22 boundary: Business Security at ANB 56 is accepted (no Business Security max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Security at ANB 56 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC23: Business Disability + ANB < 17 → min-age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability ANB 16 min-age error | The minimum Age Next Birthday for Business Disability is 17 | The minimum premium is $240.00 per year per Life insured. \| The minimum Age Next Birthday for Business Disability is 17 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC23 boundary: Business Disability at ANB 17 is accepted (no min-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Disability at ANB 17 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC24: Farmers Disability + ANB < 17 → min-age error</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers Disability ANB 16 min-age error | The minimum Age Next Birthday for Farmers Disability is 17 | The minimum premium is $240.00 per year per Life insured. \| The minimum Age Next Birthday for Farmers Disability is 17 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC24 boundary: Farmers Disability at ANB 17 is accepted (no min-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Farmers Disability at ANB 17 accepted | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business/Farmers Disability (ACB-2691) › AC25: Business Disability + Classification "Equity Owner (>75%)" + Benefit Period 18/24 Months → invalid-combo error</summary>

| Check | Expected | Actual |
|---|---|---|
| AC25 preconditions landed (Classification + Benefit Period) | Equity Owner (>75%) + 18 Months | Equity Owner (>75%) + 18 Months |
| AC25 invalid classification/benefit-period combo error | The available benefit periods for Business Disability Cover with the selected classification are 6, 9 or 12 months | The available benefit periods for Business Disability Cover with the selected classification are 6, 9 or 12 months |

</details>

---

## Notes

- 29/30 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
