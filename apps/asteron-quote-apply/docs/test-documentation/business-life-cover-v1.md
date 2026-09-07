# Test: Business Policy Lump Sum Life Cover and Additional Covers — business-life-cover-v1

> **Test file:** `business-life-cover-v1.spec.js`
> **Last run:** 2026-09-07 (local Edge headless, `--workers=1`, QA, account C) — full run 10-37-53 + AC43/AC44 fix re-run
> **Source:** ACB-2638 user story (the largest business story, 40+ ACs), acceptance-criteria mode
> **Result:** 33/33 active passing, 4 deferred groups. Environment: QA.

## Results (summary)

All active ACs pass. Coverage:
- AC01/02 covers + policy options (Inflation default-ticked, We Pay, Flexi) + Life selectable.
- AC03 Life SI + Premium Structure (Stepped default) + Business Security (unticked) + Acc.TPD/Acc.Trauma sub-covers.
- AC08 Stepped 11-75 range (+boundary at 75).
- AC09A/AC09/AC10/AC11/AC12/AC13/AC14 — the full Level-ladder max-age caps (50→45, 60→55, 65→60, 70→65, 75→70, 80→70, 100→75), each with over-age error + at-age accept.
- AC16 under-17 $50,000 cap (+boundary at $50,000).
- AC35 Business Security age-56 (+boundary).
- AC29 Acc TPD SI > Life SI cannot-exceed error (+boundary equal-SI accept).
- AC37 Acc TPD Stepped >65; AC40 Acc TPD Stepped <17.
- AC43 Acc Trauma+TPD-on-Trauma <17; AC44 >60.
- AC23/24 max-3 Life disable; AC19 min-premium $240; AC20 We Pay age-65; AC34/06 tooltips; AC07/31 add/remove.
All surfaced via recordCheck.

## Deferred

| AC(s) | Reason |
|---|---|
| AC04/AC05/AC22 | Premium calc VALUES / frequency recalc / flexi-rate % reduction — depend on the pricing engine (day-2 rates), not hand-verifiable to an exact figure. |
| AC25/AC26/AC27/AC28 | Acc TPD/Acc Trauma sub-cover premium-structure inheritance (non-editable when Life Stepped) + Definition lists + Life Cover Buyback + Trauma-benefit mutual exclusion — deep reactive sub-cover chain; focused follow-up. |
| AC29A/AC30/AC32/AC33 | Accelerated combined-SI vs Life SI + Continuous-Trauma 3x + Major-Trauma 3x arithmetic — multi-cover combined-SI needing the AC25/26 structure setup (AC29 single-cover verified). |
| AC36/AC38/AC39/AC41/AC42 | Remaining Business Security min-age + Acc TPD Level-structure age caps — depend on the AC25 structure-editable-when-not-Stepped setup; encode alongside it. |

## Business Rule Corrections

None — QA matched the story verbatim. Note: the TPD-on-Trauma age messages quote the cover name ("Minimum/Maximum Age Next Birthday for 'TPD on Trauma' is 17/60"); the AC43/AC44 regexes were loosened to tolerate the quotes (test fix, not an app issue).

## Notes

Largest business spec. Cleanly-verifiable ACs (age-cap ladder, Business Security, single-cover accelerated-SI rule, max-3, min-premium, We-Pay age, tooltips) encoded thoroughly; the excel/premium-value and deep multi-sub-cover-arithmetic ACs deferred with documented reasons (never silently omitted). Run in parallel with Business Trauma on a separate QA account.
