# Known failures in this run — cross-reference

Both failures in this run's `results.md` are **already-documented, previously-confirmed
regressions**, not new findings. Full evidence (including embedded screenshots):
[`select-default-commission-category-part-1/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md`](../../select-default-commission-category-part-1/2026-08-25T19-26-35/bug-reports/adviser-use-commission-regressions.md)

Each is checked here against the **literal text of the source user story**
(`docs/user-stories/User Story- Select Default Commission Category.md`), confirming it's a
genuine acceptance-criteria violation, not an assumption encoded by the test:

| Test | AC | User story says (verbatim) | Live app does |
|---|---|---|---|
| ADV-09 (7.5% Flexi Rate) | AC14 | Worked example, Example 2: *"IC-75%, RC-100% is the Default for UPFRONT for 7.5%. Expect to see this value in the IC/RC field after opening the Adviser Use screen."* | Stays on "Please Select" |
| ADV-10 (15% Flexi Rate) | AC14 | Worked example, Example 3: *"IC-50%, RC-50% is the Default for UPFRONT for 15%. Expect to see this value in the IC/RC field after opening the Adviser Use screen."* | Stays on "Please Select" |

ADV-11 (12.5% Flexi Rate, AC15 — multiple valid options, no auto-select expected) is NOT
failing and needs no cross-reference — it correctly matches the story's Example 4, which
explicitly says the pick list "will need to default to Please Select... therefore the
adviser must select an option."

**Still open:** BA/PM confirmation of regression vs. intentional change. Until then these
stay red on purpose (see `.kiro/steering/test-expansion-process.md`, "Do not silently fix
the test to match new behavior").
