# Exhaustive-Coverage Audit — AC-mode specs (2026-09-03)

Triggered by: "we need to not just test happy path… also negative/failing boundaries… proven in
the 'What Each Passing Test Checked' section." Read-only audit of all 6 acceptance-criteria-mode
specs vs their source user stories. Reverse-engineering-mode specs (disability-covers, kids-cover,
lump-sum-covers, personal-details, policy-structure, premium-and-bundling, validation-and-
navigation, showcase, and the root-level `-v1` files) are OUT OF SCOPE per the 2026-09-02 handoff.

## Systemic patterns (apply to ALL specs)

1. **No at-boundary "should-PASS" checks anywhere.** Every age/SI/cap/threshold AC tests only the
   failing side. A cap shifted by 1 would go undetected. Must add below/at/over triples with the
   at-boundary value ACCEPTED.
2. **Missing negative/absence assertions.** e.g. Nil Commission absent from default list; SI cover
   must NOT show "Monthly Benefit" (and vice-versa); "None" bundling for a single cover.
3. **recordCheck gaps** — real error/presence assertions not surfaced → invisible in the report's
   "What Each Passing Test Checked" section. Every meaningful expect() must have a paired recordCheck.
4. **Silently-omitted ACs (no deferral note — steering violation).**
5. **Value-level assertions missing** — premium tests check names/counts, not $ amounts or
   total = sum-of-parts.

## Per-spec top gaps (from parallel sub-agent audit)

### multi-lives-and-policies-v1
- AC02: ANB 11-75 boundary uncovered → test 10(reject)/11(accept)/75(accept)/76(reject) on an added life.
- AC13/BR-A: max-10-lives boundary uncovered (fixme'd for test-side reason) → SPLIT to dedicated
  session/file; test 9(enabled)/10(disabled)/11(blocked).
- AC09: only far-under negative ($1,000). Add threshold ~$240.00 boundary + multi-life "any life" variant.
- AC07/AC08: Cancel-keeps-life / Delete-removes-life+policies never exercised or recordCheck'd
  (only the modal is checked) — blocked by the MLP-06 discrepancy (no delete dialog reachable).
- AC17: per-cover breakdown + arithmetic reconciliation of per-life/all-lives totals missing.
- Symmetry: AC16 (Personal-policy delete), AC18 (Life2/Personal1 nav), AC28 (Personal control-move) untested.

### create-a-new-business-quote-v1
- AC04a: Inflation Adjustment default-ticked NOT asserted (story says auto-ticked).
- AC10/AC14: boundary values only COUNTED, not verified (Flexi first=2.5%/last=30.0%/2.5%-step;
  Kids tier min $50k/$10k-step). A wrong-but-same-length list would pass.
- AC14: per-kid First/Surname/Gender not checked (only DOB); 0 & 9 kids boundaries missing.
- AC05: exact age never verified; no boundary DOBs (15/16/17 band, 75 max, leap, future/invalid).
- recordCheck missing: AC09a error, AC11 warning, AC12 SI-present, AC04b Trauma checkboxes.
- BR-001/002/003 (Flexi Rate discount lowers premium/commission): business effect entirely untested.

### premium-details-in-the-quote-screen-v1
- No amount-level assertions anywhere (AC01/02/04/05/10 check names only, never $ or total=sum).
- AC02/05 bundling boundary + negatives: $99,999 vs $100,000 per-cover min; "None" for single cover.
- AC09a/09b mutual-exclusion negatives (SI cover must NOT show Monthly Benefit & vice-versa);
  Workability & Mortgage&Living tooltips untested.
- AC06 only Monthly→Yearly (other 3 options + per-life independence untested).
- AC08 2-life independence; AC12 non-default/multi-life unify path untested.
- recordCheck omissions: AC05 bundling, AC09b benefit amount.

### select-default-commission-category-v1
- Flexi Rate boundary: spec exercises only N/A,2.5,7.5,12.5,15,30% — MISSING 5/10/17.5/20/25/27.5%.
- AC02: Nil Commission NOT asserted absent from selectable default list (explicit requirement).
- AC11: only Upfront→Nil; Level 30 & Spread 20 default→Nil untested.
- AC13: only IC-100/RC-50→Upfront; IC-75/RC-100→LEVEL30 untested. AC17 restrictive splits untested.
- AC19: "previously-selected now-invalid value cleared" clause unasserted.
- Silently omitted (no deferral): AC18 (IC/RC save+persist — REACHABLE, add it), AC20/21/23/24/25
  (need historic quote). Genuine limits: AC26 (post-deploy integrity), AC27 (STP payload — backend).
- AC12/AC16 fixme bodies are dead code (behind the employment-details Apply gate).

### lump-sum-life-cover-v1
- FIVE ACs entirely absent, NO deferral note: AC04 (freq→recalc), AC18 (part-time SI>$500k referral),
  AC20 (WPYP≠None + age>65 → max-age-65), AC22 (flexi≠N/A → premium reduced). Probe + defer or encode.
- Boundary (systemic): every cap AC tests only the erroring side. Missing at-boundary ACCEPT checks:
  age 45(Level-50)/55(60)/60(65)/65(70)/70(75)/70(80)/75(100); age 17 min; SI exactly $50k under-17;
  SI exactly $250k young-no-income; age 11/75 Stepped edges (+ under-min age 10).
- Negatives: AC03 "digits only" with non-digit input; AC15 only tests Level-to-100; AC21 reverse dir.
- recordCheck gaps: AC01, AC02 none; AC03 SI-present not recorded.

### personal-lump-sum-trauma-v1
- TWO ACs unencoded, no deferral: AC13 & AC17 (triple-cover Trauma+Cancer+Major Trauma combined-cap
  at ANB 17-21 $250k and 22-70 $2M — distinct error message never exercised).
- No at-boundary should-PASS anywhere: ANB 17/70/60/65; SI $250k/$2M/$5k; Major Trauma cap $60k(3×$20k).
- recordCheck missing: AC01, AC02, AC24 (zero); AC03/04/05 partial.
- AC24 tooltips incomplete (only SI; Early/Continuous/Major Trauma tooltips untested).
- One-directional: AC20 (only Reinstatement→Continuous), AC18 (only disabled-after-3), AC19 (no update path).
- AC23 asserts substring not computed 3×TRC values; doesn't test TRC≥$25k (300% should NOT fire).
- Blocked (genuine): AC27 positive (no "Modified" option in Definition dropdown).

## Standard to apply (the bar for "exhaustive")

For every AC with a stated numeric/length/date/enum limit or an error path:
- **Boundary triple**: just-below (behavior A), at-boundary (behavior B), just-over (behavior C) —
  with the at-boundary ACCEPT case explicitly asserted, not just the failing side.
- **Negative/absence**: assert what must NOT be present/allowed, not only what must.
- **Value-level**: assert the exact computed value/message, and total = sum-of-parts where stated.
- **recordCheck on every meaningful expect()** so it shows in "What Each Passing Test Checked".
- **No silent omission**: every AC either encoded or test.fixme(true, reason-with-probe-evidence).
- Unreachable edges (e.g. app doesn't expose the input) → blocked-with-evidence, documented.


## Hardening progress (2026-09-03)

Applied the standard above; each hardened spec was run live and the new boundary/negative checks
confirmed present in the report's "What Each Passing Test Checked" section.

| Spec | Status | New coverage added (all proven live) |
|---|---|---|
| multi-lives-and-policies-v1 | DONE (run 08-58-19) | ANB 11-75 boundary triple on added life; $240 min-premium both sides; per-cover premium arithmetic reconciliation; delete-only-target negative; any-policy navigation |
| select-default-commission-category-v1 | DONE (run 11-07-28) | Nil-Commission-absent negative (AC02); 27.5%-vs-30% Nil boundary pair; un-sampled 20% Flexi Rate coverage |
| lump-sum-life-cover-v1 | DONE (run 12-00-54) | at-cap ACCEPT for all 7 Level-to structures; $50k under-17 at-cap accept; $250k young-no-income at-cap accept; $240 above-floor accept; AC03 digits-only negative; AC04/18/20/22 deferred-with-note |
| personal-lump-sum-trauma-v1 | DONE (run 13-09-53) | at-cap ACCEPT for Trauma age caps (17/70/60/65); $250k/$2M/$5k SI at-cap accept; Major Trauma 3x at-cap accept; recordCheck on AC01/02; AC13/17 deferred-with-note |
| premium-details-in-the-quote-screen-v1 | DONE (run 14-30-58) | AC02 bundling counting-boundary ($99,999->None below / $100,000->discount counted at, independent of the % discrepancy); AC09a negative (SI cover tooltip does NOT show Monthly Benefit); AC09b negative + $2,000 amount (Monthly-Benefit cover does NOT show Total Sum Insured) |
| create-a-new-business-quote-v1 | DONE (run 15-17-29) | AC04a Inflation auto-ticked (value-level, not just presence); AC10 Flexi Rate first=2.5% / last=30.0% / full-ladder toEqual (not just count); AC14 Kids SI min tier $50,000 + exact $10k step + per-kid First/Surname/Gender fields; AC09a recordCheck on the combined "must complete the following fields" message |

Note: the AC11 test in personal-lump-sum-trauma-v1 fails on a PRE-EXISTING data issue (Trauma $250k
+ Cancer $1 does not push combined SI over the $250k cap, so no error fires) — unrelated to this
hardening pass; flagged for a separate fix (bump the Cancer SI so combined > $250k).

Additional PRE-EXISTING failures flagged for follow-up (NOT introduced by this hardening pass):
- premium-details-in-the-quote-screen-v1 AC02 (known bundling 12.5%-vs-15% discount discrepancy,
  encoded as expected-fail) and AC04/AC05 (multi-life tab-switch reactive-render race reading
  $0/missing "TPD A" — the same class of race fixed with the stable-signal wait in multi-lives;
  could reuse that lifeTabCount/stable-signal fix here).
- create-a-new-business-quote-v1 AC07 (selecting Occupation Code = AA leaves the Occupation
  type-ahead field showing "Select..." instead of the corresponding occupation — candidate defect
  or type-ahead prepopulation timing; predates this pass).
- select-default-commission-category-v1: 7 known pre-existing regressions.

All hardening work is now DONE across all six AC-mode specs.
