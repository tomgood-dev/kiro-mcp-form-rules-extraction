# Test: Select Default Commission Category — select-default-commission-category-v1

> **Test file:** `select-default-commission-category-v1.spec.js`
> **Last run:** 2026-08-27 (local Edge headless) — 7.6 min
> **Source:** ACB-13175 user story ("Select Default Commission Category"), acceptance-criteria mode
> **Result:** 3/8 passing, 5 confirmed failing (known regressions)

## AC Traceability Matrix

Each row shows the verbatim acceptance criterion from the user story, what the test asserts, and the current result.

| AC # | Requirement (verbatim from user story) | What the test checks | Status | Notes |
|---|---|---|---|---|
| AC01 | "the label 'Default for Agency (xxxxx)' is visible and the correct agency number is displayed in the label" | Label text contains `Default for Agency (` followed by digits | ✅ Pass | |
| AC02 | "the following options are available for selection: Upfront, Level 30, Spread 20" | Dropdown options exactly equal `['Upfront', 'Level 30', 'Spread 20']` | ✅ Pass | |
| AC03 | "the default commission category is set to Upfront" | `selectedIndex` is 0 (Upfront) | ✅ Pass | |
| AC04 | "When no changes have been made by the user Then the Update button is disabled" | `updateButton.disabled === true` immediately on open | ❌ Fail | Button starts enabled — known regression |
| AC05 | "When the new selection differs from the saved value Then the Update button becomes enabled" | After changing selection: `disabled === false`; after reverting: `disabled === true` | ❌ Fail | Fails because AC04 precondition fails |
| AC06 | "the selected commission category is saved as the agency default and the updated value is available for future quotes" | After clicking Update, sign out, sign back in, open new quote → value persists | ❌ Fail | Update doesn't persist — known regression |
| AC07 | "the following confirmation message is displayed: 'Your default commission structure setting has been updated.'" | Poll for confirmation message text in body after clicking Update | ❌ Fail | No confirmation shown — known regression |
| AC08 | "the previously saved default commission category is displayed" when reopening Adviser Use | Fresh login session sees the updated value | ❌ Fail | Same root cause as AC06 |
| AC10 | "only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed" | IC/RC dropdown options match expected list for each Flexi Rate value | ✅ Pass | Verified at N/A, 2.5%, 7.5%, 12.5%, 15% |
| AC11 | "the commission category must be automatically set to Nil Commission and the following message must be displayed" | Body text contains exact "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected"; no IC/RC row visible | ✅ Pass | |
| AC14 | "QA automatically selects the available IC/RC option and no manual user selection is required" (single valid option) | `selectedIndex` is not 0 ("Please Select") when only one valid option exists | ❌ Fail | Works at N/A; broken at 2.5%/7.5%/15% — known regression |
| AC15 | "QA does not automatically select an IC/RC option and the user must manually choose" (multiple valid options) | `selectedIndex === 0` ("Please Select") at 12.5% (4 valid options) | ✅ Pass | |

## Deferred (not yet tested)

| AC(s) | Reason |
|---|---|
| AC09 | Only revert-to-saved-value case confirmed; general "no changes across a session" not isolated |
| AC12/AC13 | Spread 20 default + incompatible Flexi Rate validation — requires changing agency default to Spread 20 |
| AC16 | Validation message on Apply without IC/RC selected — requires clicking Apply |
| AC17 | Benefit-level commission category changes — requires multi-cover quote with different categories |
| AC18/AC19 | Save/persist IC/RC + dynamic refresh on change — requires saved quote + re-open |
| AC20–AC25 | Existing quotes/applications unchanged after default change — requires pre-existing saved quotes |
| AC26 | Data integrity post-deployment — requires backend verification |
| AC27 | STP/LIFE400 payload — requires backend/payload inspection |

## Known Regressions (bug report)

All 5 failures are documented in:
`test-runs/select-default-commission-category/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md`

Assertions are written to the **spec's expected behavior** — suite goes green automatically once regressions are fixed.
