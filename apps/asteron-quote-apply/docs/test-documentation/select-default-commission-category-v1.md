# Test: Select Default Commission Category — select-default-commission-category-v1

> **Test file:** `select-default-commission-category-v1.spec.js`
> **Last run:** 2026-08-28 (local Edge headless) — 17.0 min
> **Source:** ACB-13175 user story ("Select Default Commission Category"), acceptance-criteria mode
> **Result:** 4/11 passing, 6 confirmed failing (known regressions), 1 blocked (AC16 — Apply gate unreachable)

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
| AC09 | "When the user has not changed the current commission category selection Then the Update button remains disabled and no update action can be performed" | On fresh open with no change, `updateButton.disabled === true` | ❌ Fail | Button starts enabled — same known regression as AC04 |
| AC10 | "only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed" | IC/RC dropdown options match expected list for each Flexi Rate value | ✅ Pass | Verified at N/A, 2.5%, 7.5%, 12.5%, 15% |
| AC11 | "the commission category must be automatically set to Nil Commission and the following message must be displayed" | Body text contains exact "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected"; no IC/RC row visible | ✅ Pass | |
| AC14 | "QA automatically selects the available IC/RC option and no manual user selection is required" (single valid option) | `selectedIndex` is not 0 ("Please Select") when only one valid option exists | ❌ Fail | Works at N/A; broken at 2.5%/7.5%/15% — known regression |
| AC15 | "QA does not automatically select an IC/RC option and the user must manually choose" (multiple valid options) | `selectedIndex === 0` ("Please Select") at 12.5% (4 valid options) | ✅ Pass | |
| AC16 | "When the user attempts to proceed without selecting an IC/RC option Then 'Please select IC/RC in Adviser Use for all policies.' is displayed and the user cannot proceed" | Click Apply on a Flexi-12.5% quote with no IC/RC picked; assert the IC/RC validation message | 🚫 Blocked | `test.fixme` — IC/RC-at-Apply validation sits behind the "complete the client's employment details" Apply gate, which now blocks Apply even with Employment Status = Employed set (probed twice). The old VAL-08 recipe that used to pass the gate now also fails — app-side gate change. See evidence `14-probe-ac16-apply-employment-gate/`. |
| AC19 | "When the selection changes Then the available IC/RC options are refreshed immediately and any previously selected IC/RC value that is no longer valid is cleared" | IC/RC option set at Flexi 15% differs from the set at 2.5% (options refreshed on Flexi change) | ✅ Pass | |

## Deferred / Blocked (not yet encoded)

| AC(s) | Reason |
|---|---|
| AC12/AC13 | Spread 20 default + incompatible Flexi Rate validation — requires changing the *agency-wide* default to Spread 20, a shared mutating setting; must be done in the serial Save & Persistence block with a revert. Not yet wired. |
| AC16 | **Blocked (probed):** encoded but `test.fixme`. The IC/RC-at-Apply validation is behind the "complete the client's employment details" Apply gate, which now blocks Apply even with Employment Status = Employed (confirmed twice, `14-probe-ac16-apply-employment-gate/`). The previously-passing VAL-08 recipe also fails now → app-side gate change. Enable once the Apply employment gate is reachable again. |
| AC17 | Benefit-level (per-cover) commission category control — needs a multi-cover quote and a probe to confirm the per-cover control exists/where. Not yet probed. |
| AC18, AC20–AC25 | Existing/saved/pre-existing quotes unchanged after a default change — requires pre-existing saved quotes or historic applications; likely not reachable from a fresh browser session. Needs a probe to confirm blocked-vs-testable. |
| AC26 | Data integrity post-deployment — requires backend verification (no browser path). |
| AC27 | STP/LIFE400 payload — requires backend/payload inspection (no browser path). |

## Known Regressions (bug report)

The 6 failures (AC04, AC05, AC06, AC07, AC08, AC09, AC14 at 2.5%/7.5%/15%) are documented in:
`test-runs/select-default-commission-category/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md`,
and the latest auto-generated run report is
`test-runs/select-default-commission-category-v1/2026-08-28T15-53-43/report.md`.

Assertions are written to the **spec's expected behavior** — suite goes green automatically once regressions are fixed.

## Candidate regression found this run (outside ACB-13175)

`validation-and-navigation.spec.js` VAL-08 ("a fully valid single-cover configuration allows Apply
to proceed") **now fails** — Apply reports no visible error but does not navigate to Client Summary,
using the same `employmentStatus:'Employed'` recipe it used to pass with. This surfaced while
probing AC16 and points to an app-side change in the Apply/employment-details gate. Flag for the
dev team.
