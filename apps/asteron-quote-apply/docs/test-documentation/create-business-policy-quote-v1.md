# Test: Create a New Business Quote for Business Policy — create-business-policy-quote-v1

> **Test file:** `create-business-policy-quote-v1.spec.js`
> **Last run:** 2026-09-04 (local Edge headless, `--workers=1`, account B) — run 16-26-32
> **Source:** ACB-3343 user story ("Create a New Business Quote for Business Policy"), acceptance-criteria mode
> **Result:** 6/6 active passing, 1 deferred (AC01 agency selection — no UI for this single-agency account)

## Results

| # | AC | What's tested | Test input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC02 | Personal and/or Business policy selectable | New quote | "Business" control present; selecting it reveals business covers | ✅ Pass | |
| 2 | AC03 | Personal Details fields captured | New quote | First Name/ANB/Occupation Code/Employment/Gender/We Pay/Flexi all present | ✅ Pass | Shared with personal Create-Quote (ACB-2240) |
| 3 | AC04 | Business tab cover set + personal-only covers absent | Select Business | Life/TPD/Trauma/Specific Injury/Business Disability/Farmers Disability/Business Expenses present; Cancer/Acd. Death/Needlestick ABSENT | ✅ Pass | Positive + negative/absence |
| 4 | AC05 | Flexi Rate ladder + default | Select Business | default N/A; ladder [N/A, 2.5% … 30.0%] 13 options; selecting 15.0% updates | ✅ Pass | Value-level `toEqual` |
| 5 | AC06 | We Pay Your Premiums warning | select "30 days", no lump sum | default None; options None/30/60/90; "At least one lump sum cover must be selected with We Pay Your Premiums" | ✅ Pass | Negative/absence |
| 6 | AC07 | "?" tooltips (We Pay / Flexi-Rate) | Select Business | documented tooltip phrases present | ✅ Pass | DOM/title search (no click) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC01 | No agency-selection UI is presented on the landing page for this test account — evidently tied to a single agency (same finding as the personal Create-Quote story ACB-2240 AC01). Multi-agency selection not reachable to assert here. |

## Business Rule Corrections

None — the app matched the story on the business cover set (including the absence of Cancer/Acd. Death/Needlestick), Flexi ladder, We-Pay warning, and tooltips.

## Notes — parallel run

Run in parallel with the Workability spec on the primary account — no session conflict. The business policy is opened via the "Business" button (confirmed via probe); Flexi/We-Pay/tooltip patterns mirror the personal Create-Quote spec (ACB-2240).
