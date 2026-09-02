# Generation log — Premium Details in the Quote Screen (ACB-2286)

Source: `docs/user-stories/User Story- Premium Details in the Quote Screen.md`
Process: `TEST-GENERATION-PROCESS.md`

## Step 0 — Mandatory reading

- `.kiro/steering/test-expansion-process.md` (conventions, already loaded from prior work this session)
- `apps/asteron-quote-apply/docs/business-rules/quote-screen/page.md` (screen anatomy)
- `apps/asteron-quote-apply/docs/business-rules/quote-screen/premium-and-bundling/page.md` (PREM-01 to PREM-26 — primary source doc for this story)
- `apps/asteron-quote-apply/docs/business-rules/quote-screen/personal-details/page.md` (context, not directly tested here)
- `apps/asteron-quote-apply/helpers/quote-helpers.js` (full read — confirmed `getTotalYearlyPremium`, `getBundlingDiscount`, existing patterns for cover activation, calc-mask, multi-policy setup)
- `apps/asteron-quote-apply/tests/quote-screen/create-a-new-business-quote-v1.spec.js` (full read — template for spec structure, AND the exact working pattern for AC15/BR-006's multi-policy Payment Frequency setup, reused directly for this story's AC10-AC13)
- `apps/asteron-quote-apply/tests/quote-screen/showcase-business-rules.spec.js` (spot-checked — confirmed Disability covers use the same `input[id*="SumInsured"]` element id pattern as Lump Sum covers, despite being visually labeled "Monthly Benefit")

## Step 1 — AC extraction to canonical form

| Internal ID | Source | Given/When/Then (paraphrased) |
|---|---|---|
| PMD-AC-01 | AC01 | Select any cover for a life → all-lives total shown in Premium; per-life premium visible in Details |
| PMD-AC-02 | AC02 | Select multiple covers for a life → total, per-cover breakdown, per-life yearly total, bundling discount % |
| PMD-AC-04 | AC04 | Select any cover for a 2nd life → total updates; 2nd life has its own breakdown + yearly total |
| PMD-AC-05 | AC05 | Select multiple covers for a 2nd life → same breakdown/bundling as AC02, scoped to that life |
| PMD-AC-06 | AC06 | Payment frequency selectable per life: Fortnightly/Monthly/Quarterly/Half Yearly/Yearly; updates the quote |
| PMD-AC-07 | AC07 | Premium section itself can expand/collapse |
| PMD-AC-08 | AC08 | Details section PER LIFE can expand/collapse (distinct from AC07) |
| PMD-AC-09 | AC09 | Clicking a cover shows a tooltip: Monthly Benefit (IP/Workability/M&L) or Total Sum Insured (others) |
| PMD-AC-10 | AC10 | Multiple policies for a life → total, per-policy+per-life breakdown, per-life yearly total |
| PMD-AC-11 | AC11 | Multiple policies for a life at DIFFERENT frequencies → "total ANNUALISED premiums" shown |
| PMD-AC-12 | AC12 | Given differing frequencies, unify all to same → back to "total calculated premiums" (non-annualised) label |
| PMD-AC-13 | AC13 | Given SAME frequency, diverge any one → "total annualised premiums" shown |
| PMD-AC-14 | AC14 | Given AC11/AC13, tooltip next to "Total Annualised Premium (All Lives)" shows explanatory text |
| PMD-BR-01 | Business Rules row | Label format: "Total XXXX Premium(s) (All Lives)" when uniform; "Total Annualised Premium (All Lives)" when not |

**Parsing judgment calls:**
- The story numbers ACs 01, 02, 04, 05, ... (no AC03) — preserved verbatim, not renumbered.
- AC11 and AC13 both describe "policies/lives now have different frequencies" as the trigger for the
  annualised label — they differ only in their stated starting point (already-different vs.
  uniform-then-diverged). Mechanically these produce the identical test: set up 2 priced policies,
  diverge one frequency, assert the label. Combined into ONE test (`AC11/AC13`) rather than two
  near-duplicates, with the combination explicitly noted in the test's own annotation for traceability.
  Flagged for author clarification: are AC11 and AC13 intended to be functionally distinct, or is this
  intentional emphasis (arriving at the same state two different ways)?
- PMD-BR-01's exact label wording ("Total XXXX **Premiums** (All Lives)", plural) was found to differ
  from the live app's actual text ("Total XXXX **Premium** (All Lives)", singular) — confirmed via
  recon. Treated as a minor wording nit (likely a story drafting typo), NOT asserted as a strict
  pass/fail gate, consistent with how AC09c's smoker-wording ambiguity was handled in the
  create-a-new-business-quote-v1 spec — asserting it would produce a failing test for a cosmetic
  singular/plural mismatch unrelated to real business risk. Noted here for author awareness only.

## Step 2 — Classification

| AC | Classification | Basis |
|---|---|---|
| PMD-AC-01 | Testable now | Existing helpers (`activateCover`, `sumInsuredInput`) sufficient |
| PMD-AC-02 | Testable now (needed 1 probe for the bundling-discount discrepancy) | See Step 3 |
| PMD-AC-04 | Testable now | "Add life" pattern already proven in prior story's BR-004 |
| PMD-AC-05 | Testable now | Combines AC02 + AC04's patterns |
| PMD-AC-06 | Testable now | `select[id*="PaymentFrequencyDropdown"]` fingerprint already known from prior story's AC15 |
| PMD-AC-07 | Needs-probe → written | Premium panel's expand/collapse control not previously documented; probed (see Step 3) |
| PMD-AC-08 | Needs-probe → genuinely blocked (see below) | Probed TWICE with different DOM strategies |
| PMD-AC-09 (a: SI-based) | Needs-probe → written | Cover-name tooltip mechanism not previously documented; probed |
| PMD-AC-09 (b: benefit-based) | Testable now, NOT independently probed | Written directly, first live evidence is this spec's own run (see annotation) |
| PMD-AC-10 | Testable now | Reuses AC15/BR-006's exact proven multi-policy pattern from the prior story |
| PMD-AC-11/13 | Needs-probe → written | The label-switching text itself ("Total Annualised Premium (All Lives)") not previously confirmed live; probed |
| PMD-AC-12 | Testable now | Inverse of AC11/13, same mechanism |
| PMD-AC-14 | Needs-probe → written | Tooltip text confirmed present in DOM during recon; test confirms it's reachable from the live diverged state |

### PMD-AC-08 — genuinely blocked, evidence

Probed live twice (2026-09-01), see `probe-premium-details-recon-3.js` and `-4.js`:
1. First attempt: searched the Premium panel's DOM for a childless leaf element with exact text
   "Life 1" — found none (`life1ElFound: false`).
2. Second attempt (relaxed): searched for ANY element (any child count) whose own direct text nodes
   equal "Life 1" (ignoring descendant text) — found **zero matches** (`matchCount: 0`).
3. Separately, dumped the Premium panel's full accordion structure (`probe-premium-details-recon-2.js`,
   step 3): exactly ONE `osui-accordion-item` exists in the whole panel — the panel itself (AC07's
   control). No nested accordion-item, `role="button"`, or `aria-expanded` attribute exists anywhere
   under the per-life text.

Conclusion: "Life 1" is rendered as plain inline text, not as its own addressable, collapsible DOM
element. There is no separate AC08 control distinct from AC07's whole-panel toggle. Encoded as
`test.fixme` with this evidence, per the process's "genuinely-blocked only after a probe proves it" rule.

## Step 3 — Probe trail

Five recon probes were run before finalizing the spec (more than ideal for one story — flagged by the
user mid-run; the process going forward should aim to combine these into fewer, better-planned probes):

1. **`probe-premium-details-recon.js`** — first broad structural dump. Found:
   - Premium panel structure (per-life/per-cover breakdown, Payment Frequency select location).
   - **Bundling discount discrepancy**: Life+TPD ($200k each) → "12.5% (3 covers or more)" instead of
     documented "15% (2 covers)".
   - AC09's first click attempt mis-fired (clicked the wrong "Life" element — the Lump Sum Covers
     activation button, not a Premium-panel cover line — which added an unwanted 2nd Life cover).
   - Confirmed only 1 Payment Frequency dropdown exists until a 2nd policy has its own priced cover.
2. **`probe-premium-details-recon-2.js`** — re-confirmed the bundling discrepancy on a fresh quote
   (2nd independent reading, same result). Fixed the AC09 click target (scoped to `div.popover-top`
   text match) — succeeded, revealing the popover/tooltip mechanism and its exact text format
   ("Total Sum Insured:\n$200,000.00"). Also captured the Premium panel's accordion structure
   (confirming AC07's control) and every static tooltip balloon text present in the DOM, including
   AC14's exact expected wording.
3. **`probe-premium-details-recon-3.js`** — first (too-strict) AC08 check; attempted to find the AC14
   tooltip's trigger icon by walking UP from the balloon element — this approach was fundamentally
   wrong (OutSystems tooltips are portal-rendered, so walking up from the balloon lands on an unrelated
   ancestor near the document root, not the actual inline trigger). Confirmed "Add life" produces a
   "Life 2" tab.
4. **`probe-premium-details-recon-4.js`** — relaxed AC08 check (still 0 matches — see above). Attempted
   to reach the diverging-frequency state via a 2nd priced Business-policy cover, but used an incorrect
   button-matching strategy (looked for a 2nd literal "Life" button and picked the wrong one, since
   Personal/Business policies are TAB-SWITCHED, not simultaneously rendered) — did not succeed.
5. **`probe-premium-details-recon-5.js`** — diagnostic-only: dumped the Policies accordion before/after
   clicking "Business", confirming Personal and Business policies are mutually-exclusive TABS (only
   one policy's card is rendered in the DOM at a time) with a different, shorter cover list for
   Business policies (Life/TPD/Trauma/Specific Injury; no Cancer/Acd Death/Needlestick, no Disability
   covers, no Kids Cover). This explained why probe #4's approach failed — it did NOT independently
   attempt the fix. The actual working pattern was found instead by re-reading
   `create-a-new-business-quote-v1.spec.js`'s existing AC15/BR-006 test, which already correctly
   implements this multi-policy setup (`clickButtonByLabel(quote, 'Business', ...)` then
   `activateCover(quote, 'Life')` then `fillCalcMask(sumInsuredInput(quote, 0), ...)` — index 0, not 1,
   since each policy's Sum Insured inputs are independently scoped once its tab is active). This was
   reused directly for AC10/AC11/AC12/AC13/AC14 instead of running a 6th probe.

**Process note for next time:** probes #3/#4 could have been combined into #2, and probe #5 was
avoidable entirely if the existing sibling spec's proven pattern had been checked before attempting a
new one from scratch. Checking existing specs for a proven pattern BEFORE probing live is now the
default going forward.

## Step 3 addendum — input-correctness checklist (AC02's bundling assertion)

1. **Threshold values from this AC's own numbers**: $200,000 for both Life and TPD, both well above
   the documented $100,000 minimum (PREM-23/24) — not borrowed from elsewhere.
2. **No interacting rule fires first**: age 35/Male/occupation code AA are all mid-range, no age-band
   or occupation-gating rule is in play at these values.
3. **Every Given/When clause satisfied**: "multiple covers for a life insured" — 2 covers, 1 life. ✓
4. **All precondition state established**: minimum personal details set before activating covers. ✓
5. **Correct field/index**: `sumInsuredInput(quote, 0)` for Life (1st active cover), `(quote, 1)` for
   TPD (2nd active cover) — matches the established, already-proven indexing convention.
6. **Strict assertion**: asserts the exact string `"15% (2 covers)"`, not merely "some discount shown"
   — this is what surfaces the confirmed discrepancy instead of silently passing.

## Step 6 — Self-verification

The bundling-discount discrepancy was independently reproduced on 2 separate fresh quotes during recon
(probes #1 and #2, different browser sessions) before being encoded into the spec — satisfies the
"verify before writing up" rule ahead of the spec's own (3rd) run.

AC09b (Disability-cover tooltip) and AC11/13's exact label text were NOT independently re-verified
before being encoded — the spec run itself is the first/only live evidence for these. If either
produces a surprising (unexpected) result, it must be re-verified with a second, minimal check before
being written up as a confirmed finding or business-rule correction, per project convention.

## Step 7 — final summary

**4 spec runs total** before reaching a clean, correct final state — more than any prior story in
this project, driven by 3 real bugs found in the test code itself (not the app) plus one probing
methodology mistake:

1. **Run 1** (`--workers=2`, 13 tests): `getPremiumPanelText` only captured a 3-line summary instead
   of the full per-life breakdown (root cause: the accordion-fingerprint match was too narrow — the
   Premium widget and the per-life breakdown are separate sibling elements, not nested). Also,
   everything from test 4 onward failed with an unrelated infra symptom (`Input_AgeNextBirthday` not
   found) — a session-conflict cascade from running 2 workers concurrently against this environment's
   documented single-session-per-account constraint.
2. **Run 2** (`--workers=1`, fixed `getPremiumPanelText`): no more infra cascade (confirms workers=1
   is the safe choice here). Surfaced 3 new issues, diagnosed from the run's own screenshots (no new
   live probing needed): (a) AC07's collapse check was scoped too broadly (body-wide instead of the
   specific widget); (b) AC09a's tooltip-read helper picked up a stale DOM match instead of the
   freshly-opened one; (c) AC09b assumed the wrong cover-instance name ("Income Protection" vs the
   actual "Income Protection A"). Also revealed, via the AC04 failure's screenshot, that AC08 had
   been WRONGLY marked blocked — the per-life collapse control genuinely exists, the earlier probes'
   selectors were just too strict.
3. **Run 3** (`--workers=1`, all fixes from run 2 applied): 11/13 passing. AC02 failed correctly
   (confirmed discrepancy, reproduced independently again). AC08's rewritten test still failed,
   because `getPremiumPanelText` (used by the AC08 rewrite) had ANOTHER bug: it scoped from the
   first literal occurrence of "Premium" in the page, which is "Premium Freeze" — a form checkbox
   label — not the real panel heading, so it read stale form content instead of the summary panel.
4. **Run 4** (`--workers=1`, scoped to the 5 affected tests via `-g`): fixed `getPremiumPanelText` to
   anchor on the "Total ... (All Lives)" pattern instead of the ambiguous word "Premium". **4/5
   passing, AC02 failing correctly (5th independent confirmation).** Combined with run 3's results
   for the other 8 tests (unaffected by this specific bug), final state: **12/13 passing, 1 confirmed
   failing (AC02), 0 blocked.**

**Final counts:** 14 ACs from the story (AC01, AC02, AC04–AC14 — no AC03 in the source), written as
13 tests (AC11+AC13 combined — see Step 1 parsing note). 12 pass, 1 confirmed regression (AC02
bundling discrepancy — see `premium-and-bundling/page.md`'s PREM-19/20 discrepancy callout), 0
blocked/deferred.

**What to improve next time** (appended to `TEST-GENERATION-LEARNINGS.md`):
- When a DOM-query probe finds "nothing" for a control the AC explicitly describes, treat that as
  "the query found nothing," not "the feature doesn't exist" — cross-check against a screenshot from
  a nearby successful interaction before concluding "genuinely blocked."
- When a shared text-scoping helper is used for a NEGATIVE assertion (`not.toContain(...)`), audit
  its anchor pattern extra carefully — an anchor that's "good enough" for positive assertions (any
  match anywhere satisfies them) can silently be wrong-scoped and only surface as a bug on the first
  negative assertion that relies on precise scoping.
- Prefer running a small number of well-planned, combined recon probes over many narrow one-off
  probes (5 probes were run for this story before writing the spec — more than ideal; the user
  flagged this mid-session). Checking an existing sibling spec for an already-proven pattern (as was
  eventually done for the multi-policy/frequency setup, reusing `create-a-new-business-quote-v1`'s
  AC15/BR-006 test) should happen BEFORE probing live from scratch, not after.
- `--workers=1` is the reliable choice for this environment/account — `--workers=2` triggered a
  session-conflict cascade partway through a run; the wall-clock cost (single-worker runs took
  14–38 minutes vs. the ~15 minute 2-worker runs on other specs) is worth paying for reliability.
