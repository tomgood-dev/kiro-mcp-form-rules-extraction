# create business policy quote — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/create-business-policy-quote-v1.spec.js`
**Run:** 2026-09-04T16-26-32 · Edge headless · 15.5 min
**Environment:** https://outsystems-dev.asteronlife.co.nz
**Result:** 6 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Create a New Business Quote for Business Policy (ACB-3343) › AC02: a new quote lets me select Personal and/or Business policy | ✅ Passed |
| 2 | Create a New Business Quote for Business Policy (ACB-3343) › AC03: the new-quote screen captures the documented Personal Details fields | ✅ Passed |
| 3 | Create a New Business Quote for Business Policy (ACB-3343) › AC04: the Business policy tab shows its documented cover set (no Cancer/Acd. Death/Needlestick) | ✅ Passed |
| 4 | Create a New Business Quote for Business Policy (ACB-3343) › AC05: Business policy Flexi Rate list is N/A then 2.5% to 30.0% in 2.5% steps (default N/A) | ✅ Passed |
| 5 | Create a New Business Quote for Business Policy (ACB-3343) › AC06: Business policy We Pay Your Premiums warns when no lump sum cover is selected | ✅ Passed |
| 6 | Create a New Business Quote for Business Policy (ACB-3343) › AC07: Business policy "?" tooltips show the We Pay Your Premiums / Flexi-Rate text | ✅ Passed |
| 7 | Create a New Business Quote for Business Policy (ACB-3343) › AC01: landing-page agency selection then create quote | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Create a New Business Quote for Business Policy (ACB-3343) › AC01: landing-page agency selection then create quote

**Acceptance Criteria (from user story):**

> AC01: On the landing page I can select my agency (an adviser can be associated with multiple agencies) and click create quote.

**Why skipped:**

> Deferred: no agency-selection UI is presented on the landing page for this test account — it is evidently tied to a single agency (same finding as the personal Create-Quote story ACB-2240 AC01). Multi-agency selection is not reachable to assert here.

---

## What Each Passing Test Checked

<details>
<summary>✅ Create a New Business Quote for Business Policy (ACB-3343) › AC02: a new quote lets me select Personal and/or Business policy</summary>

| Check | Expected | Actual |
|---|---|---|
| A "Business" policy control is present on a new quote | true | true |
| Selecting Business reveals business-policy covers (e.g. Business Disability) | true | true |

</details>

<details>
<summary>✅ Create a New Business Quote for Business Policy (ACB-3343) › AC03: the new-quote screen captures the documented Personal Details fields</summary>

| Check | Expected | Actual |
|---|---|---|
| Personal Details field "firstName" present | true | true |
| Personal Details field "ageNextBirthday" present | true | true |
| Personal Details field "occupationCode" present | true | true |
| Personal Details field "employmentStatus" present | true | true |
| Personal Details field "gender" present | true | true |
| Personal Details field "wePay" present | true | true |
| Personal Details field "flexiRate" present | true | true |

</details>

<details>
<summary>✅ Create a New Business Quote for Business Policy (ACB-3343) › AC04: the Business policy tab shows its documented cover set (no Cancer/Acd. Death/Needlestick)</summary>

| Check | Expected | Actual |
|---|---|---|
| Business cover "Life" is present | true | true |
| Business cover "TPD" is present | true | true |
| Business cover "Trauma" is present | true | true |
| Business cover "Specific Injury" is present | true | true |
| Business cover "Business Disability" is present | true | true |
| Business cover "Farmers Disability" is present | true | true |
| Business cover "Business Expenses" is present | true | true |
| Personal-only cover "Cancer" is ABSENT on the business policy | false | false |
| Personal-only cover "Acd. Death" is ABSENT on the business policy | false | false |
| Personal-only cover "Needlestick" is ABSENT on the business policy | false | false |

</details>

<details>
<summary>✅ Create a New Business Quote for Business Policy (ACB-3343) › AC05: Business policy Flexi Rate list is N/A then 2.5% to 30.0% in 2.5% steps (default N/A)</summary>

| Check | Expected | Actual |
|---|---|---|
| Flexi Rate default | N/A | N/A |
| Flexi Rate full ladder (N/A + 2.5% steps to 30.0%) | N/A,2.5%,5.0%,7.5%,10.0%,12.5%,15.0%,17.5%,20.0%,22.5%,25.0%,27.5%,30.0% | N/A,2.5%,5.0%,7.5%,10.0%,12.5%,15.0%,17.5%,20.0%,22.5%,25.0%,27.5%,30.0% |
| Flexi Rate selection updates to 15.0% | 15.0% | 15.0% |

</details>

<details>
<summary>✅ Create a New Business Quote for Business Policy (ACB-3343) › AC06: Business policy We Pay Your Premiums warns when no lump sum cover is selected</summary>

| Check | Expected | Actual |
|---|---|---|
| We Pay Your Premiums default value | None | None |
| We Pay Your Premiums option list | None,30 days,60 days,90 days | None,30 days,60 days,90 days |
| We Pay with no lump sum cover shows the required-cover warning | warning shown | warning shown |

</details>

<details>
<summary>✅ Create a New Business Quote for Business Policy (ACB-3343) › AC07: Business policy "?" tooltips show the We Pay Your Premiums / Flexi-Rate text</summary>

| Check | Expected | Actual |
|---|---|---|
| We Pay Your Premiums tooltip text present | contains "Waives the premiums for all the lump sum cover" | true |
| Flexi-Rate tooltip text present | contains "discount your clients premium by reducing" | true |

</details>

---

## Notes

- 6/7 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
