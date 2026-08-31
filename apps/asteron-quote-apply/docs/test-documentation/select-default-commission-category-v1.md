# Test: Select Default Commission Category — select-default-commission-category-v1

> **Test file:** `select-default-commission-category-v1.spec.js`
> **Last run:** 2026-08-31 (local Edge headless, **`--workers=1`**) — 38.0 min
> **Source:** ACB-13175 user story ("Select Default Commission Category"), acceptance-criteria mode
> **Result:** 11/15 passing, 2 confirmed failing (AC06/07/08 persistence, AC13 gating), 2 blocked (AC12, AC16 — Apply gate unreachable)
>
> **⚠ Run with `--workers=1`.** The AC06/07/08 test mutates the *agency-wide* Default for Agency
> (a shared server-side setting) mid-run and reverts it in a `finally`. Under `--workers=2` a second
> worker runs the parallel-block reader tests (AC01/AC03) concurrently and reads the temporarily-mutated
> shared value, producing false failures. Serial execution avoids this.
>
> **Regression update 2026-08-31:** the previously-failing AC04/AC05, AC09, and AC14-auto-select
> (2.5%/7.5%/15%) now **PASS** — the dev team fixed the Update-button-starts-enabled and
> single-valid-IC/RC auto-select regressions. The expected-to-fail assertions flipped green automatically.

## AC Traceability Matrix

Each row shows the verbatim acceptance criterion from the user story, what the test asserts, and the current result.

| AC # | Requirement (verbatim from user story) | What the test checks | Status | Notes |
|---|---|---|---|---|
| AC01 | "the label 'Default for Agency (xxxxx)' is visible and the correct agency number is displayed in the label" | Label text contains `Default for Agency (` followed by digits | ✅ Pass | |
| AC02 | "the following options are available for selection: Upfront, Level 30, Spread 20" | Dropdown options exactly equal `['Upfront', 'Level 30', 'Spread 20']` | ✅ Pass | |
| AC03 | "the default commission category is set to Upfront" | `selectedIndex` is 0 (Upfront) | ✅ Pass | |
| AC04 | "When no changes have been made by the user Then the Update button is disabled" | `updateButton.disabled === true` immediately on open | ✅ Pass | Regression fixed 2026-08-31 (was failing — button started enabled) |
| AC05 | "When the new selection differs from the saved value Then the Update button becomes enabled" | After changing selection: `disabled === false`; after reverting: `disabled === true` | ✅ Pass | Regression fixed 2026-08-31 |
| AC06 | "the selected commission category is saved as the agency default and the updated value is available for future quotes" | After clicking Update, sign out, sign back in, open new quote → value persists | ❌ Fail | Persistence step still fails; Update no longer stays saved across a fresh login (see Notes below) |
| AC07 | "the following confirmation message is displayed: 'Your default commission structure setting has been updated.'" | Poll for confirmation message text in body after clicking Update | ✅ Pass* | Confirmation message NOW appears (regression fixed) — the AC07 sub-assertion passes; the combined AC06/07/08 test still fails at the AC06/08 persistence step |
| AC08 | "the previously saved default commission category is displayed" when reopening Adviser Use | Fresh login session sees the updated value | ❌ Fail | Same root cause as AC06 (persistence) |
| AC09 | "When the user has not changed the current commission category selection Then the Update button remains disabled and no update action can be performed" | On fresh open with no change, `updateButton.disabled === true` | ✅ Pass | Regression fixed 2026-08-31 (was failing — same as AC04) |
| AC10 | "only IC/RC options valid for the selected commission category and Flexi-Rate combination are displayed" | IC/RC dropdown options match expected list for each Flexi Rate value | ✅ Pass | Verified at N/A, 2.5%, 7.5%, 12.5%, 15% |
| AC11 | "the commission category must be automatically set to Nil Commission and the following message must be displayed" | Body text contains exact "Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected"; no IC/RC row visible | ✅ Pass | |
| AC12 | "When the adviser clicks Apply without visiting the Adviser Use screen ... Then the application must prevent processing and display 'Please select IC/RC in Adviser Use for all policies.'" | With Spread 20 default at FR 2.5%, click Apply without picking IC/RC; assert the IC/RC validation | 🚫 Blocked | `test.fixme` — same Apply employment-details gate as AC16 (evidence 14); also needs Spread 20 as the *saved* agency default (Update mutates agency-wide shared state) |
| AC13 | "the Select IC/RC pick list must display 'Please Select' ... all commission category pick lists remain disabled until an IC/RC option is selected" | Spread 20 default + FR 2.5%: assert IC/RC = Please Select and category pick lists disabled before an IC/RC pick | ❌ Fail | **Confirmed discrepancy.** App auto-selects IC-75%, RC-100% and enables the per-cover category (Level 30) instead of gating on "Please Select". Reconciled via native-selectOption probe (evidence 15). Expected-to-fail until the gating is implemented |
| AC14 | "QA automatically selects the available IC/RC option and no manual user selection is required" (single valid option) | `selectedIndex` is not 0 ("Please Select") when only one valid option exists | ✅ Pass | Regression fixed 2026-08-31 — now auto-selects at 2.5%/7.5%/15% (was failing) |
| AC15 | "QA does not automatically select an IC/RC option and the user must manually choose" (multiple valid options) | `selectedIndex === 0` ("Please Select") at 12.5% (4 valid options) | ✅ Pass | |
| AC16 | "When the user attempts to proceed without selecting an IC/RC option Then 'Please select IC/RC in Adviser Use for all policies.' is displayed and the user cannot proceed" | Click Apply on a Flexi-12.5% quote with no IC/RC picked; assert the IC/RC validation message | 🚫 Blocked | `test.fixme` — IC/RC-at-Apply validation sits behind the "complete the client's employment details" Apply gate, which now blocks Apply even with Employment Status = Employed set (probed twice). The old VAL-08 recipe that used to pass the gate now also fails — app-side gate change. See evidence `14-probe-ac16-apply-employment-gate/`. |
| AC17 | "Given a Flexi-Rate supports more than one commission category ... the user may select from any valid commission category available for that Flexi-Rate" | FR 15% + IC-50%, RC-50%: per-cover category pick list offers all three categories | ✅ Pass | Confirmed matching — options = Upfront, Level 30, Spread 20 (evidence 15) |
| AC19 | "When the selection changes Then the available IC/RC options are refreshed immediately and any previously selected IC/RC value that is no longer valid is cleared" | IC/RC option set at Flexi 15% differs from the set at 2.5% (options refreshed on Flexi change) | ✅ Pass | |
| AC22 | "Given an agency default commission category has been configured, When a new quote is created, Then the default commission category must be automatically applied to the quote" | New quote at FR 2.5%: per-cover Life Cover category resolves to the agency default (Upfront) | ✅ Pass | Category resolves a beat after the IC/RC auto-selects — test polls until settled to avoid a flaky early read |

## Deferred / Blocked (not yet encoded)

Reachability of the "existing/saved quotes & applications" ACs was probed 2026-08-31
(evidence `16-probe-save-reopen-reachability/`). Findings: a **Save** action exists on the quote
screen (carries IC/RC + per-cover category, needs a fully-valid client), and the dashboard has a
**"Quotes and Applications" list of real existing quotes AND applications** (QUOTE / APPLICATION IN
PROGRESS rows). The list is async/lazy-loaded and rows open via a JS list-widget handler (no
`QuoteId` URL) — reopening a saved row is feasible but that widget interaction is not yet cracked.

| AC(s) | Verdict | Reason |
|---|---|---|
| AC18 | **Reachable — not yet wired** | Save carries the chosen IC/RC + category; reading it back needs the list row-open widget interaction (async list + JS row action). Feasible; not blocked. |
| AC23, AC25 | **Reachable — not yet wired** | Existing QUOTE rows are present in the dashboard list; needs the same row-open interaction. |
| AC24 | **Reachable — not yet wired** | "APPLICATION IN PROGRESS" rows are present; needs the same row-open interaction. |
| AC20, AC21 | **Partially blocked** | Require quotes/applications created *before the feature was deployed* — that temporal precondition can't be manufactured now (feature already live); only verifiable by inspecting genuinely pre-deployment rows, by comparison. |
| AC12 | **Blocked (probed)** | `test.fixme` — same employment-details Apply gate as AC16 (evidence 14); also needs Spread 20 as the *saved* agency default. |
| AC16 | **Blocked (probed)** | `test.fixme` — IC/RC-at-Apply validation behind the "complete the client's employment details" Apply gate (evidence 14). |
| AC26 | **Blocked** | Data integrity post-deployment — backend/DB verification, no browser path. |
| AC27 | **Blocked** | STP/LIFE400 payload — backend payload inspection, no browser path. |

**Next step to close AC18/AC23/AC24/AC25:** crack the dashboard list row-open — wait for
`networkidle` (or click "Refresh content"), locate a data row by its Reference/Client-name text,
invoke the widget's row action, confirm the quote screen loads; then read/modify the persisted
commission category. AC22 (the one in this group that needs no save/reopen) is now encoded and
passing.

## Confirmed failing (expected-to-fail, on purpose)

| AC(s) | Why it fails |
|---|---|
| AC06/AC08 | After Update + sign-out + sign-in, the agency default does not persist as the changed value across the fresh login. Encoded against the spec (should persist). |
| AC13 | App auto-selects an IC/RC (IC-75%, RC-100% → Level 30) instead of gating category pick lists behind a manual "Please Select" choice. Full Discrepancy Evidence Record in the business-rules page (`ADV` section) + evidence 15. |

Assertions are written to the **spec's expected behavior** — each flips to ✅ automatically once the underlying app behaviour is fixed (as AC04/AC05/AC09/AC14 just did on 2026-08-31).

## Candidate regression found while probing (outside ACB-13175)

`validation-and-navigation.spec.js` VAL-08 ("a fully valid single-cover configuration allows Apply
to proceed") **now fails** — Apply reports no visible error but does not navigate to Client Summary,
using the same `employmentStatus:'Employed'` recipe it used to pass with. This surfaced while
probing AC16 and points to an app-side change in the Apply/employment-details gate. Flag for the
dev team.
