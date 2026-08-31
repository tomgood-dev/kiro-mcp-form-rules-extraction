# Adviser Use / Commission Category

> Child of [Quote Screen](../page.md). Rule ID prefix: `ADV-`
> Source spec: [User Story - Select Default Commission Category](../../../../user-stories/User%20Story-%20Select%20Default%20Commission%20Category.md) (Jira ACB-13175)
> Tested by: `apps/asteron-quote-apply/tests/quote-screen/select-default-commission-category-part-1.spec.js`, `part-2.spec.js`, and `part-3.spec.js` ([test docs](../../../test-documentation/) — part-1/part-2 docs still carry their pre-rename `-v1` filename, part-3 not yet documented) — originally one 7-part file (`comm-cat-v2.spec.js`), split for sustained-session-load reasons (see "Retracted findings" below), then renamed off the `-v1` versioned scheme to this story-based `part-N` scheme.
> **This feature is treated as already built** — the source doc's Jira Status field is blank,
> but per `.kiro/steering/test-expansion-process.md` ("acceptance-criteria mode"), a mismatch
> here is a candidate defect, not evidence the feature isn't shipped. Every mismatch below is
> backed by a full Discrepancy Evidence Record, not a one-line summary.

## What this is

Clicking **Adviser Use** on a valid, priced quote opens a **"Commissions"** modal. It has two sections:

1. **Default for Agency** — an agency-wide default commission category (Upfront / Level 30 / Spread 20) with an **Update** button.
2. **Per-life commission detail** — per policy ("Personal Insurance - N"), a **Select IC/RC** dropdown and a **Select All** / per-cover commission-category dropdown, plus a **Split commission** checkbox.

The Default for Agency setting is **shared across the agency**, not per-quote — changing it affects future quotes agency-wide. Tests must not click its Update button against the shared dev environment without a clear reason to.

**Important methodology note:** the Select IC/RC default depends on which Flexi Rate is selected. Switching Flexi Rate and reopening Adviser Use *within the same quote* can leave a stale selection from the previous Flexi Rate instead of computing a fresh one — this produced two false-positive "defects" this session (see "Retracted findings" below). Always test each distinct Flexi Rate value in its own fresh quote (a "New Quote" navigation within the same login session is sufficient isolation — confirmed via `evidence/10-probe-fresh-quote-isolation/`).

## Confirmed rules

> ⚠ **Three known regressions, unresolved as of 2026-08-25 — see
> `test-runs/select-default-commission-category-part-1/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md`
> for full evidence (screenshots embedded inline).** `ADV-01`'s agency-number
> parenthetical, `ADV-07`'s Update-button-starts-disabled behavior, and `ADV-08`/`ADV-09`/
> `ADV-10`'s single-Upfront-valid-option auto-select all currently fail live, each
> independently re-confirmed with a second, minimal probe script distinct from the spec
> file's shared helpers. Not yet confirmed with a BA/PM as regression vs. intentional
> change. The rule text below still describes the *documented* (not necessarily current
> live) behavior — do not assume it's accurate until that's resolved.

| Rule ID | Rule |
|---|---|
| `ADV-01` | Label reads **"Default for Agency (`<agency numbers>`)"** — a comma-separated list of real agency numbers, confirming AC01. *(Regression 2026-08-25: live testing now shows the label as plain "Default for Agency" with no agency number at all — see callout above.)* |
| `ADV-02` | Default commission category options are exactly **Upfront / Level 30 / Spread 20** — no "Nil Commission" option is ever offered as a default (AC02, and the doc's explicit "Nil Commission Option" rule). |
| `ADV-03` | First-time default (no prior agency configuration) is **Upfront** (AC03). |
| `ADV-04` | When **Flexi Rate = N/A**, the **Select IC/RC** dropdown for a cover has exactly one real option (`IC-100%, RC-100%`) besides "Please Select", and it is **auto-selected** rather than left on "Please Select" (AC14). Re-confirmed still working 2026-08-25 (unlike ADV-08/09/10 below). |
| `ADV-05` | Selecting the **30% Flexi Rate** displays: *"Commission is Nil as Nil Comm - 30% Discount Flexirate has been selected"* (AC11, exact text confirmed). No "Please select IC/RC" validation appears in this state. |
| `ADV-06` | At 30% Flexi Rate, the per-cover commission rows (**Select IC/RC**, **Select All**, per-cover dropdown) are **removed from the modal entirely** — only the agency-wide Default for Agency dropdown remains. This matches the doc's "Adviser Use Cover display" note that covers are not shown in this scenario. |
| `ADV-07` | **Update** button starts **disabled**, and only enables once the Default for Agency selection genuinely differs from the currently-saved value; reverting the selection back to the saved value re-disables it (AC04, AC05, and the spirit of AC09). See "Retracted findings" below for the 2026-08-19 false-positive report of this same symptom — **but see the callout above: live testing on 2026-08-25, using neither `page.mouse.wheel()` nor any other interaction before the read, found the Update button genuinely starts enabled, not disabled.** This looks like a real, newer regression distinct from the earlier retracted finding, not a repeat of it — same symptom, different (and this time ruled-out) cause. |
| `ADV-08` | **Example 1 (2.5% Flexi Rate):** Select IC/RC auto-selects `IC-100%, RC-50%` (the documented Upfront default, the only valid option — AC14); the per-cover "Life Cover" row auto-selects `Upfront`. Confirmed via `evidence/06-probe-example1-category-default/`. *(Regression 2026-08-25: now stays on "Please Select" — see callout above.)* |
| `ADV-09` | **Example 2 (7.5% Flexi Rate):** Select IC/RC auto-selects `IC-75%, RC-100%` (the documented Upfront default, the only valid option — AC14), with exactly the 4 documented options. Confirmed via `evidence/08-probe-clean-single-flexirate-7.5pct/` — see "Retracted findings" for why this took two attempts. *(Regression 2026-08-25: now stays on "Please Select" — see callout above.)* |
| `ADV-10` | **Example 3 (15% Flexi Rate):** Select IC/RC auto-selects `IC-50%, RC-50%` (the documented Upfront default, the only valid option — AC14); the per-cover "Life Cover" row auto-selects `Upfront`. Confirmed via `evidence/07-probe-examples-3-4/`. *(Regression 2026-08-25: now stays on "Please Select" — see callout above.)* |
| `ADV-11` | **Example 4 (12.5% Flexi Rate, multiple UPFRONT IC/RC rates):** Select IC/RC correctly stays on `Please Select` (does NOT auto-select) with exactly the 4 documented options, since multiple valid IC/RC combinations exist for Upfront at this rate — matches the doc's explicit "the adviser must select an option" instruction and the general principle behind AC15. Confirmed via `evidence/09-probe-clean-single-flexirate-12.5pct/` — see "Retracted findings" for why this took two attempts. Re-confirmed still working 2026-08-25 (unlike ADV-08/09/10 above) — so specifically "pick the one Upfront-valid option among several listed" looks broken, not the whole auto-select mechanism. |
| `ADV-12` | **Per-benefit multi-category selection at a multi-category Flexi Rate (AC17)** *(confirmed 2026-08-31, `[Story ACB-13175]`)*: at Flexi Rate 15% after selecting IC-50%, RC-50%, the per-cover ("Life Cover") commission category pick list offers **all three** valid categories — `Upfront`, `Level 30`, `Spread 20` — so the adviser may select any valid category for that Flexi Rate. Matches the story Example 3. Confirmed via `evidence/15-probe-ac13-ac17-categories/` and passing test AC17. |
| `ADV-13` | **New quote applies the agency default to its covers (AC22)** *(confirmed 2026-08-31, `[Story ACB-13175]`)*: a newly created quote automatically applies the agency default commission category — at Flexi Rate 2.5% (single valid IC/RC for Upfront) the per-cover "Life Cover" category resolves to **Upfront** (the default). The category resolves a beat after the IC/RC auto-selects, so a reader must let it settle. Confirmed via passing test AC22 and `evidence/16-probe-save-reopen-reachability/`. |

### Discrepancy Evidence Record — AC13 (Adviser Use category-gating not enforced)

- **AC / Rule ID:** AC13 (*Advise Use screen defaults*); candidate `ADV-13` once confirmed with a BA/PM.
- **Verbatim requirement:** "**Given** an adviser has selected a Flexi-Rate for which their default commission category is not valid, **When** the adviser opens the **Adviser Use** page, **Then** the **Select IC/RC** pick list must be enabled and display **"Please Select"** And only the IC/RC options available for the selected Flexi-Rate, while all commission category pick lists (including **Select All**) remain disabled until an IC/RC option is selected; And upon selecting an IC/RC option, the commission category pick lists must be enabled and display only the commission category associated with that selected IC/RC option" (Acceptance Criteria table, AC13).
- **Reproduction steps:**
  1. Log in; open a New Quote. Persona: Age 35, Male, Occupation AA, Life Cover $500,000.
  2. On the quote (Illustration) screen set **Flexi Rate = 2.5%** (Spread 20 is not a valid category for 2.5%).
  3. Click **Adviser Use** to open the Commissions modal.
  4. In the modal set **Default for Agency = Spread 20** using the native dropdown (do NOT click Update).
  5. Immediately read the **Select IC/RC** value, and the **Select All** and **Life Cover** category pick lists' enabled/disabled state — before selecting any IC/RC option.
- **Expected result:** Select IC/RC = **"Please Select"**; **Select All** and **Life Cover** category pick lists **disabled** until an IC/RC option is chosen.
- **Actual result:** Select IC/RC is **auto-selected to `IC-75%, RC-100%`** (not "Please Select"); **Select All** is **enabled** with options `["Please Select","Level 30"]`; **Life Cover** is **enabled** and **auto-selected to `Level 30`** with options `["Please Select","Level 30"]`. The category pick lists are NOT gated behind a manual IC/RC selection. (The "only the associated category" behaviour after a manual IC/RC pick does hold — picking IC-100%, RC-50% narrows the categories to `["Please Select","Upfront"]`.)
- **Evidence artifact(s):** `evidence/15-probe-ac13-ac17-categories/notes.md` (native-selectOption reading, authoritative) and `raw-output.txt`; reproduced by the `.spec.js` AC13 test on 2 consecutive runs.
- **Environment:** https://outsystems-dev.asteronlife.co.nz, account hanno.coetzee+1123, observed 2026-08-31.
- **Reproducibility:** reproduced 2× via the spec test (native path) and 1× via the reconciling native-selectOption probe. Note: an initial probe using raw `dispatchEvent('change')` to set Spread 20 showed the *expected* ("Please Select" / disabled) reading — a confirmed artifact of the non-native mutation; the native path is authoritative and does not gate.
- **Test encoding:** `select-default-commission-category-v1.spec.js` → test "AC13: Adviser Use defaults for an invalid default+Flexi combo (Spread 20 @ 2.5%)", assertions written to the spec's expected values (Please Select + disabled), currently EXPECTED TO FAIL until the gating is implemented.


## Retracted findings (methodology notes, kept for the record)

Two apparent discrepancies were found this session and both were retracted after further investigation — worth reading in full, not just the conclusion, since each is a caution about testing this specific app.

### Update button (mouse.wheel() artifact)

An earlier probe reported the **Update** button as already enabled on modal open, before any change — apparently contradicting AC04/AC05. A deeper, controlled re-investigation (4 further runs — timing samples with zero interaction, and a clean re-test using only Playwright's real `selectOption()` API) found this was a **false positive**, most likely caused by the original probe's own `page.mouse.wheel(0, 400)` call (used just to scroll a screenshot into view) — plausibly an OS/browser quirk where a wheel event over a focused `<select>` silently changes its value, which the app's reactive binding then treated as a genuine user change. `ADV-07` reflects the corrected, confirmed conclusion. Full trail: `evidence/update-button-investigation.txt` (Part 1) and `evidence/01` through `evidence/04`.

**Lesson:** avoid `page.mouse.wheel()` (or any raw scroll) near `<select>` elements when probing this app — prefer `locator.scrollIntoViewIfNeeded()`.

### 7.5% and 12.5% Flexi Rate IC/RC defaults (same-quote carryover artifact)

The 7.5% Flexi Rate default was reported as a mismatch (`IC-100%, RC-100%` observed vs. `IC-75%, RC-100%` expected) and reproduced identically on 3 separate script runs, including the actual `comm-cat-v1.spec.js` test file — this looked like solid, independently-confirmed evidence of a real defect. It wasn't. All 3 runs had opened the Adviser Use modal at Flexi Rate N/A (whose correct default genuinely is `IC-100%, RC-100%`) earlier in the *same quote/session* before switching to 7.5% and reopening the modal — none were actually independent. This surfaced when testing Example 4 (12.5%) immediately after Example 3 (15%) in one script produced an equally wrong result (Example 3's own correct default leaking into Example 4's reading), which prompted a fully clean re-test: fresh quote, Flexi Rate set to the target value *before* Adviser Use is ever opened. Both 7.5% and 12.5% then matched the user story exactly. `ADV-09` and `ADV-11` reflect the corrected, confirmed conclusions. Full trail: `evidence/update-button-investigation.txt` (Part 2) and `evidence/05` through `evidence/10`.

**Lesson:** when a component's default depends on another field's current value, test each distinct value in its own fresh quote — switching the field and reopening the same component instance within one quote is not sufficient isolation, even with zero interaction-API mistakes. This is now a mandatory rule in `.kiro/steering/test-expansion-process.md` ("Stateful-component carryover across a driving field's value").

## Deferred (not yet investigated — explicitly, not silently skipped)

| AC(s) | Why deferred |
|---|---|
| AC06, AC07, AC08 | Save/persist flow for the agency-wide default — requires actually clicking Update, which mutates a setting shared with other users of this dev environment. Not attempted without a dedicated test account/agency. |
| AC09 | Partially covered by `ADV-07`'s revert-to-saved-value behavior; the exact "no changes made across a session" first-open case beyond first-time-ever-configured is not separately isolated. |
| AC10 (remainder), AC12, AC15 | Rest of the multi-option IC/RC matrix. **AC12** (Spread 20 default + FR 2.5/10/17.5/25% → "Please select IC/RC…" on Apply) is blocked by the same Apply employment-details gate as AC16 (see `evidence/14-probe-ac16-apply-employment-gate/`) — the validation is behind that gate and currently unreachable from the browser. **Correction (2026-08-31):** AC13 does NOT require clicking Update — setting Default for Agency = Spread 20 *in-quote* drives the screen behaviour, so AC13 is now encoded (as a confirmed discrepancy, see the AC13 record above); the earlier "AC13 requires Update" deferral note was wrong. |
| AC18 | **Blocked in practice (investigated 2026-08-31, `evidence/17-probe-rowopen/`).** A **Save** action exists and carries the chosen IC/RC + per-cover category. Reading it back needs the dashboard "Quotes and Applications" list, which is a plain HTML `<table>` (rows are `<tr class="table-row">` with client-name anchors — clicking a row is trivial). BUT the list's data rows render **unreliably under automation** (populated on 2 early runs, absent on ~6 later runs; a patient 40s wait + networkidle + Refresh-content + Status/page-size filters all failed). Row identification is solved; list-render reliability is the blocker (same class as the documented environment flakiness). |
| AC22 | **Confirmed matching (2026-08-31, `[Story ACB-13175]`).** A new quote automatically applies the agency default to its covers — at FR 2.5% the Life Cover category resolves to Upfront (the default). Encoded and passing (test AC22). |
| AC23, AC24, AC25 | **Blocked in practice (evidence 17).** Existing QUOTE and APPLICATION IN PROGRESS rows are present in the dashboard list, but the same unreliable list-render blocks opening one under automation (see AC18). To pursue later: lighter-loaded environment / dedicated account, or drive the list's data endpoint instead of the rendered widget. |
| AC20, AC21 | **Partially blocked.** Require quotes/applications created *before the feature was deployed* — that temporal precondition can't be manufactured now (feature already live); only verifiable by inspecting genuinely pre-deployment rows, by comparison, not by creating the precondition. |
| AC26 | Data integrity after deployment — backend/DB verification, no browser path (blocked). |
| AC27 | STP / LIFE400 `createPolicy` payload — requires backend/payload inspection, out of scope for UI-only Playwright tests (blocked). |

## Environment finding: sustained session load (2026-08-21)

Not a defect in the app or the test logic — a discovered limit of this shared dev environment worth knowing before writing future tests that open many quotes in one session.

`comm-cat-v2.spec.js` (the original single-file version, opening 7 fresh quotes in one login session per the fresh-quote-per-Flexi-Rate methodology above) hit two distinct instability events across several runs: a 15-minute hang on the very first action of the 7th fresh quote in one run, and a full forced logout back to the login page mid-test on the 3rd fresh quote in another run. Neither correlated with a specific quote number, Flexi Rate value, or account — both point at cumulative session load (many "New Quote" cycles in one continuous session) as the trigger, something no other test in this suite has done before (every other test reuses one quote throughout).

Separately, session conflicts ("Credentials rejected or session conflict") reliably followed any run that didn't reach its own clean sign-out (a timeout or crash leaves the server-side session held) — expected per the platform's documented single-session-per-account behavior, not new instability.

**Fix:** split into `select-default-commission-category-part-1-v1.spec.js` (Parts 1-4, 4 fresh quotes) and `select-default-commission-category-part-2-v1.spec.js` (Parts 5-7, 3 fresh quotes), each with its own login. Both ran clean end-to-end with zero retries needed after the split. Also fixed in the same pass: `openFreshQuote()`'s "New Quote" URL capture only handled an absolute `window.open()` URL — a different test account returned a relative path, which `page.goto()` rejected; now normalized to prepend `BASE_URL` when the captured URL isn't already absolute.

**Rule of thumb for future tests:** if a test needs more than ~4-5 fresh quotes to cover its scenarios, split it across multiple files/sessions rather than one long one.
