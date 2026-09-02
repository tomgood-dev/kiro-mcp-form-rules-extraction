# Test: Premium Details in the Quote Screen — premium-details-in-the-quote-screen-v1

> **Test file:** `premium-details-in-the-quote-screen-v1.spec.js`
> **Last run:** 2026-09-01 (local Edge headless, `--workers=1`) — full suite 38.0 min; scoped re-validation of 5 tests 14.0 min
> **Source:** ACB-2286 user story ("Premium Details in the Quote Screen"), acceptance-criteria mode
> **Result:** 12/13 passing, 1 confirmed failing (AC02), 0 blocked
> **Generation log:** `test-runs/premium-details-in-the-quote-screen-v1/generation-log-2026-09-01T10-30.md`

## AC Traceability Matrix

| AC # | Requirement (verbatim from user story) | What the test checks | Status | Notes |
|---|---|---|---|---|
| AC01 | "select any cover for a life insured ... total calculated premiums ... individual premium per life ... visible in the Details section" | All-lives total is a positive number; per-life breakdown shows "Life 1" + the priced cover name | ✅ Pass | |
| AC02 | "select multiple covers ... breakdown for each cover ... total yearly premium per life ... bundling discounts ... with percentage if applicable" | Per-cover breakdown, Total Yearly Premium line present, Bundling Discount = "15% (2 covers)" | ❌ Fail | **Confirmed discrepancy.** Shows "12.5% (3 covers or more)" instead. Full record in `premium-and-bundling/page.md` (PREM-19/20 discrepancy callout) |
| AC04 | "select any cover for a second life insured ... total updates ... individual premium per life with breakdown ... total yearly premium per life" | All-lives total increases after Life 2's cover is priced; Life 2's own breakdown + Total Yearly Premium line appear | ✅ Pass | Required re-expanding Life 1 first — see note below |
| AC05 | "select multiple covers for a second life insured ..." (same breakdown/bundling requirements, scoped to life 2) | Life 2 shows both cover names in its own breakdown, plus a non-null bundling discount | ✅ Pass | |
| AC06 | Payment frequency selectable per life: Fortnightly/Monthly(default)/Quarterly/Half Yearly/Yearly; selection updates the quote | Default + full option list; changing to Yearly updates both the select and the panel's total label | ✅ Pass | |
| AC07 | Premium section itself can be expanded/collapsed | Clicking the Premium widget's own title hides/restores its "Total Monthly Premium (All Lives)" line | ✅ Pass | Scope corrected mid-run: this control only affects the small summary-total widget, not the per-life breakdown (that's AC08's separate control) |
| AC08 | Details section PER LIFE can be expanded/collapsed independently | Clicking "Life 1"'s own accordion title hides/restores its cover breakdown | ✅ Pass | Initially misdiagnosed as blocked (see Limitations/history below) — corrected after screenshot review |
| AC09a | Clicking a Sum-Insured-based cover shows a "Total Sum Insured" tooltip | Clicking "Life Cover A" in the panel shows a tooltip reading "Total Sum Insured: $200,000.00" | ✅ Pass | |
| AC09b | Clicking a Monthly-Benefit-based (Disability) cover shows a "Monthly Benefit" tooltip, per the story's author Q&A (IP/Workability/M&L) | Clicking "Income Protection A" shows a tooltip mentioning "Monthly Benefit" | ✅ Pass | Cover name required the same lettered-suffix pattern as Lump Sum covers ("Income Protection A", not "Income Protection") |
| AC10 | Multiple policies for a life: total, per-policy+per-life breakdown, per-life yearly total | Combined total increases with a 2nd priced policy; 2 independent "Insurance N" sections appear under Life 1 | ✅ Pass | |
| AC11 | Multiple policies at DIFFERENT frequencies → "total ANNUALISED premiums" | Diverging one policy's frequency from Monthly to Yearly switches the top label to "Total Annualised Premium (All Lives)" | ✅ Pass | Combined with AC13 into one test — see generation log parsing note |
| AC12 | Given differing frequencies, unify to same → back to non-annualised label | Unifying the diverged policy back to Monthly reverts the label to "Total Monthly Premium (All Lives)" | ✅ Pass | |
| AC13 | Given same frequency, diverge one → "total annualised premiums" | Covered by the same test as AC11 (identical mechanism, different framing) | ✅ Pass | See AC11 row |
| AC14 | Tooltip next to "Total Annualised Premium (All Lives)" shows the documented explanation text | Confirms the exact tooltip text is present in the DOM once frequencies differ | ✅ Pass | |
| BR (label format) | "Total XXXX Premiums (All Lives)" (plural) when uniform; "Total Annualised Premium (All Lives)" when not | Not strictly asserted — see Limitations | ℹ️ Informational | Live app uses singular "Premium", story says plural "Premiums" — treated as a wording nit, not a functional defect |

## Limitations

| AC(s) | Why |
|---|---|
| BR (label plural/singular wording) | The story's Business Rules section says "Total XXXX **Premiums** (All Lives)" (plural); the live app consistently shows singular "**Premium**". Not asserted as a strict pass/fail gate — treated as a likely story drafting typo, consistent with how AC09c's smoker-wording ambiguity was handled in the `create-a-new-business-quote-v1` spec. Flagged for author awareness only. |

## Process note — a test-generation mistake worth recording

AC08 was initially marked `test.fixme`/blocked after two live DOM-query probes found no per-life
collapse control. This was **wrong** — screenshot review of an unrelated AC04 failure (during the
first full spec run) showed clear visual evidence of a working per-life collapse chevron ("Life 1"
collapsed, "Life 2" expanded). The probes' selectors were too strict (exact-text match on "Life 1"
as a leaf node), not the actual app behavior. AC08 was rewritten as a real, passing test once the
correct selector (an `accordion-item__title`-classed element whose text starts with "Life ") was
found. Lesson: a DOM-query probe finding "nothing" is evidence the *query* found nothing, not proof
the *feature* doesn't exist — cross-check against a visual screenshot before concluding "blocked."

A related bug (not an app issue) also surfaced and was fixed: a shared test helper
(`getPremiumPanelText`) scoped its reads from the first literal occurrence of the substring
"Premium" in the page body — which is actually "Premium Freeze" (a checkbox label inside the form),
not the real Premium panel heading. This didn't produce false passes for AC01/02/04/05 (their
positive assertions happened to also match unrelated form content), but it did cause a false FAIL
for AC08's negative assertion. Fixed by anchoring on the more specific "Total ... (All Lives)"
pattern instead of the ambiguous word "Premium" alone.

## Business Rule Corrections

| Rule ID | Was | Now |
|---|---|---|
| `PREM-19`/`PREM-20` | Documented "2 committed covers (e.g. Life + TPD) at/above their minimums → 15% (2 covers)" as confirmed working | **Regression confirmed, 2026-09-01**: the exact Life + TPD example now shows "12.5% (3 covers or more)" — wrong count AND wrong percentage, also contradicting the Bundling Discounts tooltip's own text on the same page. Reproduced 5 times independently. Discrepancy record added to `premium-and-bundling/page.md`; not yet confirmed with a BA/PM/dev team as regression vs. some other explanation. |
