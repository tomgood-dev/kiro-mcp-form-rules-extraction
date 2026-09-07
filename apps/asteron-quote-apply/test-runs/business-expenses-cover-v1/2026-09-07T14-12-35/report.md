# business expenses cover — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/business-expenses-cover-v1.spec.js`
**Run:** 2026-09-07T14-12-35 · Edge headless · 45.4 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 13 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC01/AC02: Business policy exposes disability covers; Business Expenses selectable; combo = Business/Farmers Disability + Business Expenses | ✅ Passed |
| 2 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC03: Business Expenses exposes Monthly Benefit + Premium Structure {Stepped, greyed/disabled} + Benefit Period {1 Year, greyed/disabled} + Waiting Period {14(def)/30/60/90 Days, editable} | ✅ Passed |
| 3 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC04: Business Expenses + unsuitable occupation (S) → "not available for the selected occupation" | ✅ Passed |
| 4 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC04 (negative/contrast): suitable occupation (AA) → NO occupation-not-available error | ✅ Passed |
| 5 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC05: Business Expenses monthly benefit > $16,666 → max monthly benefit error | ✅ Passed |
| 6 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC05 boundary: Business Expenses monthly benefit exactly $16,666 is accepted (no cap error) | ✅ Passed |
| 7 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC06: after selecting Business Expenses the +Business Expenses button is disabled (max 1) | ✅ Passed |
| 8 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC07: Business Expenses cover can be added and removed | ✅ Passed |
| 9 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC08: Business Expenses + ANB > 61 → maximum age error | ✅ Passed |
| 10 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC08 boundary: Business Expenses at ANB 61 is accepted (no max-age error) | ✅ Passed |
| 11 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC09: Business Expenses + ANB < 17 → minimum age error | ✅ Passed |
| 12 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC09 boundary: Business Expenses at ANB 17 is accepted (no min-age error) | ✅ Passed |
| 13 | Business Policy Disability Cover — Business Expenses (ACB-2695) › AC10: Personal Workability + Business Expenses → conjunction error | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC01/AC02: Business policy exposes disability covers; Business Expenses selectable; combo = Business/Farmers Disability + Business Expenses</summary>

| Check | Expected | Actual |
|---|---|---|
| Business disability cover "Business Disability" is available | true | true |
| Business disability cover "Farmers Disability" is available | true | true |
| Business disability cover "Business Expenses" is available | true | true |
| Business Expenses is selectable (Monthly Benefit field appears) | true | true |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC03: Business Expenses exposes Monthly Benefit + Premium Structure {Stepped, greyed/disabled} + Benefit Period {1 Year, greyed/disabled} + Waiting Period {14(def)/30/60/90 Days, editable}</summary>

| Check | Expected | Actual |
|---|---|---|
| Monthly Benefit field allows entry (editable) | true | true |
| Premium Structure default is Stepped | Stepped | Stepped |
| Premium Structure is greyed out / disabled (non-editable) | true | true |
| Benefit Period pre-populated "1 Year" | 1 Year | 1 Year |
| Benefit Period is greyed out / disabled (non-editable) | true | true |
| Waiting Period default is 14 Days | 14 Days | 14 Days |
| Waiting Period options | 14 Days/30 Days/60 Days/90 Days | 14 Days/30 Days/60 Days/90 Days |
| Waiting Period is editable (not greyed out) | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC04: Business Expenses + unsuitable occupation (S) → "not available for the selected occupation"</summary>

| Check | Expected | Actual |
|---|---|---|
| Unsuitable occupation (S) raises the not-available error | Business Expenses Cover is not available for the selected occupation. | The minimum premium is $240.00 per year per Life insured. \| Business Expenses Cover is not available for the selected occupation. |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC04 (negative/contrast): suitable occupation (AA) → NO occupation-not-available error</summary>

| Check | Expected | Actual |
|---|---|---|
| Suitable occupation (AA) does NOT raise the occupation error | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC05: Business Expenses monthly benefit > $16,666 → max monthly benefit error</summary>

| Check | Expected | Actual |
|---|---|---|
| Monthly benefit $16,667 (>cap) raises the $16,666 max error | The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666 | The maximum allowable Business Expenses monthly benefit for the selected occupation is $16,666 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC05 boundary: Business Expenses monthly benefit exactly $16,666 is accepted (no cap error)</summary>

| Check | Expected | Actual |
|---|---|---|
| Monthly benefit exactly $16,666 accepted (no cap error) | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC06: after selecting Business Expenses the +Business Expenses button is disabled (max 1)</summary>

| Check | Expected | Actual |
|---|---|---|
| +Business Expenses enabled before any activation | false | false |
| +Business Expenses disabled after 1 activation (max 1) | true | true |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC07: Business Expenses cover can be added and removed</summary>

| Check | Expected | Actual |
|---|---|---|
| Business Expenses benefit field present after adding | true | true |
| Business Expenses benefit field removed after removing | 0 | 0 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC08: Business Expenses + ANB > 61 → maximum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| ANB 62 (>61) raises the max-age error | The maximum Age Next Birthday for Business Expenses ... is 61 | The minimum premium is $240.00 per year per Life insured. \| The maximum Age Next Birthday for Business Expenses cover is 61 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC08 boundary: Business Expenses at ANB 61 is accepted (no max-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| ANB 61 accepted (no max-age error) | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC09: Business Expenses + ANB < 17 → minimum age error</summary>

| Check | Expected | Actual |
|---|---|---|
| ANB 16 (<17) raises the min-age error | The minimum Age Next Birthday for Business Expenses ... is 17 | The minimum premium is $240.00 per year per Life insured. \| The minimum Age Next Birthday for Business Expenses cover is 17 |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC09 boundary: Business Expenses at ANB 17 is accepted (no min-age error)</summary>

| Check | Expected | Actual |
|---|---|---|
| ANB 17 accepted (no min-age error) | false | false |

</details>

<details>
<summary>✅ Business Policy Disability Cover — Business Expenses (ACB-2695) › AC10: Personal Workability + Business Expenses → conjunction error</summary>

| Check | Expected | Actual |
|---|---|---|
| Workability + Business Expenses raises the conjunction error | Business Expenses Cover is not available to be taken in conjunction with Workability Cover | Business Expenses Cover is not available to be taken in conjunction with Workability Cover |

</details>

---

## Notes

- 13/13 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
