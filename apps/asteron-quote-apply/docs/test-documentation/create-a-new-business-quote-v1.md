# Test: Create a New Business Quote — create-a-new-business-quote-v1

> **Test file:** `create-a-new-business-quote-v1.spec.js`
> **Last run:** 2026-09-01 (local Edge headless, `--workers=2`) — 15.2 min
> **Source:** ACB-2240 user story ("Create a New Business Quote"), acceptance-criteria mode
> **Result:** 17/18 passing, 1 confirmed failing (AC07), 1 blocked (AC01)
> **Generation log:** `test-runs/create-a-new-business-quote-v1/generation-log-2026-09-01T09-11.md`

## AC Traceability Matrix

Each row shows the verbatim acceptance criterion from the user story, what the test asserts, and the current result.

| AC # | Requirement (verbatim from user story) | What the test checks | Status | Notes |
|---|---|---|---|---|
| AC01 | "I should be able to select my agency (one adviser can be associated with multiple agencies) and click create quote" | N/A | 🚫 Blocked | `test.fixme` — no agency-selection UI found anywhere on the landing "Quotes and Applications" dashboard (only Status/page-size filters). This test account is evidently tied to a single agency. |
| AC02 | "I should be able to select if the new quote/application is for a Personal Policy and/or Business Policy" | Personal policy exists by default; clicking Business adds a coexisting Business policy | ✅ Pass | Also confirms Business Rule #5 |
| AC04 | Full Personal Details / Lump Sum / Disability / Kids Cover field list must be captured | Split into 3 sub-tests (AC04a/b/c) by section — see below | ✅ Pass (all 3) | |
| AC04a | Personal Details field list (14 fields/controls) | Each field's DOM presence checked | ✅ Pass | |
| AC04b | Lump Sum Cover types (7) + Life sub-covers (4) + Trauma sub-covers (checkboxes ×3, buttons ×2) | Presence of each button/checkbox | ✅ Pass | |
| AC04c | Disability Covers (3) + Kids Cover control | Presence of each | ✅ Pass | |
| AC05 | "the 'age next birthday' must be calculated and displayed" after entering DOB | Age Next Birthday field non-empty after native DOB set | ✅ Pass | |
| AC06 | Selecting Occupation prepopulates Occupation Code | Occupation Code non-blank + locked after type-ahead selection | ✅ Pass | |
| AC07 | Selecting Occupation Code instead prepopulates the Occupation field | Occupation type-ahead display text after setting Code=AA | ❌ Fail | **Confirmed discrepancy.** Type-ahead stays on "Select..." — not prepopulated. Full record in `personal-details/page.md` (`PD-07`/`PD-08` section) |
| AC08 | Employment status options: Employed / Self Employed / Employed by own company / Other | Exact option list check | ✅ Pass | |
| AC09 | Age Next Birthday, Gender, Smoker, Occupation-or-Code, Employment Status all mandatory | Split into 3 sub-tests (AC09a/b/c) — see below | Mixed | |
| AC09a | Age/Gender/Occupation missing blocks Apply | Combined "must complete the following fields" message | ✅ Pass | |
| AC09b | Employment Status missing (Life-only quote) | Whether Apply proceeds to Client Summary | ℹ️ Informational | No hard assertion — observed result: Apply did NOT proceed (`proceeded=false`). Consistent with AC09's claim, but NOT strong evidence specifically for Employment Status: confounded by the known, separately-documented Apply-completion issue (`validation-and-navigation/page.md`) that blocks Apply even on fully-valid configs, and `PD-20` already establishes Employment Status only blocks Apply for Disability covers, not unconditionally as AC09 implies. Re-test once the Apply-completion issue is resolved to get a clean read. |
| AC09c | Smoker mandatory | Confirms a default value ("No") is always present | ✅ Pass* | *Ambiguous AC wording — "mandatory" can't be tested as blocking since no unset state is reachable via the UI (button-group always has a default). Flagged for author clarification, not a strict AC09 pass |
| AC10 | Flexi Rate: N/A default, 2.5%–30.00% list, selectable+saveable | Default + full 13-option list + selection persists | ✅ Pass | |
| AC11 | We Pay Your Premiums: None/30/60/90 days + warning if no lump sum cover selected | Default + option list + exact warning text | ✅ Pass | |
| AC12 | Selecting a cover exposes SI + Premium Structure (default Stepped) | Life used as representative cover | ✅ Pass | |
| AC13 | Add/remove cover reflected in the premium panel | Premium before/after add, and after remove | ✅ Pass | |
| AC14 | Kids Cover: 0–9, per-kid fields, SI tiers $50k(default)–$200k | Per-kid DOB field presence + SI tier default/list | ✅ Pass | |
| AC15 | Per-policy Payment Frequency: Fortnightly/Monthly(default)/Quarterly/Half Yearly/Yearly | Default + option list on 2 policies; changing one doesn't affect the other | ✅ Pass | Also confirms Business Rule #6 |
| BR-004 | "Can create 'add life' to the quote/application" | Life 2 tab appears after Add life | ✅ Pass | |
| BR-005 | "Can also add business and or personal policy type ... at the same time" | Covered by AC02's test | ✅ Pass | |
| BR-006 | "Each policy can be paid on a different frequency" | Covered by AC15's test | ✅ Pass | |

## Limitations

| AC(s) | Why |
|---|---|
| AC01 | No agency-selection UI reachable from this test account — see generation log for the full landing-page probe dump. Would need a genuinely multi-agency adviser account to test. |

## Business Rule Corrections

| Rule ID | Was | Now |
|---|---|---|
| `PD-07`/`PD-08` | Implied the Occupation ↔ Occupation Code relationship might be symmetric | Confirmed one-directional only: Occupation → Code works; Code → Occupation does not. Discrepancy record added, not yet confirmed with a BA/PM as regression vs. by-design. |
