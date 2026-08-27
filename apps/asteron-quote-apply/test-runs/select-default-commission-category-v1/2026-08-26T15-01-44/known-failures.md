# Known failures in this run — cross-reference

All 3 failures in this run's `results.md` are **already-documented, previously-confirmed
regressions**, not new findings. Full evidence (including embedded screenshots):
[`select-default-commission-category-part-1/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md`](../2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md)

Each is checked here against the **literal text of the source user story**
(`docs/user-stories/User Story- Select Default Commission Category.md`), not just our own
downstream business-rules doc, to confirm it's a genuine acceptance-criteria violation and
not an assumption we encoded ourselves:

| Test | AC | User story says (verbatim) | Live app does |
|---|---|---|---|
| AC01/AC02/AC03/AC14 → **AC01 sub-check** | AC01 | *"Then the label 'Default for Agency (xxxxx)' is visible And the correct agency number is displayed in the label."* | Shows plain "Default for Agency" — no agency number, no parentheses |
| AC04/AC05 → **AC04 sub-check** | AC04 | *"Given the currently saved default commission category is displayed When no changes have been made by the user Then the Update button is disabled."* | Update button starts enabled |
| ADV-08 (2.5% Flexi Rate) | AC14 | Worked example, Example 1: *"IC-100%, RC-50% is the Default for UPFRONT for 2.5%. Expect to see this value in the IC/RC field after opening the Adviser Use screen."* | Stays on "Please Select" |

Since AC02/AC03/AC11 aren't failing (see `results.md`), no cross-reference needed for
those - they pass and match the story as documented.

**Still open:** BA/PM confirmation of regression vs. intentional change. Until then these
stay red on purpose (see `.kiro/steering/test-expansion-process.md`, "Do not silently fix
the test to match new behavior").
