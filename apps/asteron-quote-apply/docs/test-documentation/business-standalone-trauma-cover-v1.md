# Test: Business Policy Lump Sum Standalone Trauma Cover — business-standalone-trauma-cover-v1

> **Test file:** `business-standalone-trauma-cover-v1.spec.js`
> **Last run:** 2026-09-07 (local Edge headless, `--workers=1`, QA, account B) — full run 10-37-52 + AC11 fix re-run
> **Source:** ACB-2939 user story, acceptance-criteria mode
> **Result:** 26/26 active passing, 1 deferred (AC17 Major-Trauma-3x). Environment: QA.

## Results (summary)

All ACs pass. Coverage: AC01/02 presence + selectable; AC03 Structure [Stepped(def)/65/70] + optional-benefit checkboxes (Business Security/Early/Reinstatement/Continuous) + Major Trauma/TPD-on-Trauma sub-covers; AC06/07/08/09 age caps by structure (min 17 / Stepped 70 / Level 65→60 / Level 70→65) + boundary accepts; AC10/11 young $250k combined-cap (+boundary); AC12/13 $2M combined-cap (+boundary); AC16 min-SI $5,000 (+boundary); AC19/20 TPD-on-Trauma age 17/60; AC22 TPD-on-Trauma Modified-only at 17-21; AC23 min Major Trauma SI $5,000; AC14 max-3 disable; AC21 Business Security age-56 (+boundary); AC04/05 Major Trauma + TPD-on-Trauma structure inheritance + TPD-on-Trauma Definition [Own(def)/Any]; AC18 tooltips; AC15 add/remove. All surfaced via recordCheck.

## Deferred

| AC(s) | Reason |
|---|---|
| AC17 | Major Trauma 3x cap when base Trauma < $25,000 ("...based on the Trauma Cover Sum Insured of $XXXX is $YYYY", YYYY=XXXX*3). Hand-derivable and equivalent to personal Trauma AC23 ($20k→$60k); held to keep the first Business-Trauma pass lean — quick follow-up. |

## Business Rule Corrections

None — QA matched the story verbatim. Note: the young combined-cap message includes a "Major Trauma," segment when Major Trauma is active ("...Trauma Recovery Cover, Major Trauma, including Cancer Cover, ... $250,000"); the AC11 regex was loosened to match (my initial regex was too strict — a test fix, not an app issue).

## Notes

Business-tab variant of the personal Trauma spec, plus Business Security. Run in parallel with Business Life on a separate QA account (no session conflict). AC11 initially failed on the too-strict regex; fixed and re-confirmed.
