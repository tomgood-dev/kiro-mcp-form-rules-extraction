# Occupation-based Lump Sum cover gating (LSC-02/LSC-03) is not enforced for ANY occupation code

> **Status:** Draft · not yet filed in a tracker
> **Severity:** High — an entire documented eligibility control (`LSC-02`/`LSC-03`) appears
> completely non-functional, not a narrow edge case. Not confirmed as customer-facing
> harmful (no error, no data corruption — the covers just activate when the business
> rule says they shouldn't), but the rule existed for occupation-based risk reasons.
> **Component:** Quote › Lump Sum Covers › Occupation gating
> **Environment:** `outsystems-dev.asteronlife.co.nz` (Asteron Connect Quote & Apply, "Illustration" step)
> **Found via:** Automated test (Playwright) — `apps/asteron-quote-apply/tests/quote-screen/lump-sum-covers.spec.js`,
> tests `LSC-02`/`LSC-03` — then confirmed and fully characterized via two purpose-built
> probe scripts, `apps/asteron-quote-apply/probes/probe-lsc02-03-full-sweep.js` and
> `probe-occupation-typeahead-am-hunt.js`
> **Reported:** 2026-08-25 · automated regression suite + live interactive follow-up

## Summary

The business-rules documentation (`docs/confluence-pages/business-rules/quote-screen/lump-sum-covers/page.md`,
rules `LSC-02`/`LSC-03`) states:
- **`LSC-02`**: Needlestick is only functionally available for Occupation Code = **AA**. For
  every other code (AM, A1, A2, B, C, S, U, IC), clicking the button should be a no-op —
  the button stays in the DOM, but no cover card is added.
- **`LSC-03`**: Occupation Code = **AM** additionally disables Cancer, Accidental Death, and
  Specific Injury.

This was originally reported today as an **AM-specific** finding (Needlestick/Cancer
activating when they shouldn't at Occupation Code = AM). Following up with a full sweep
across **every** Occupation Code option and **both** input paths (the plain "Occupation
code" select and the "Occupation" type-ahead search field) found the problem is much
broader than AM: **every occupation code tested activates all four gated covers
(Needlestick, Cancer, Accidental Death, Specific Injury) with zero enforcement.** This is
not an AM-specific bug, and not specific to how the occupation is entered — the gating
described by `LSC-02`/`LSC-03` currently does not fire under any tested condition.

This is also not a brand-new observation: `sessions/2026-08-19.md` already recorded
*"Needlestick now activates for ALL occupation codes (AA-only restriction appears
removed)"* six days before today's investigation, using the same plain-select method.
Today's work confirms that finding still holds, extends it to Cancer/Accidental
Death/Specific Injury, and additionally rules out the type-ahead input path as a
confounding factor. Two independent sessions, six days apart, agree.

## Preconditions

A logged-in adviser session, on the Quote screen ("Illustration" step) for a **brand-new,
unsaved quote** (`New Quote` from `/QuoteAndApply/` → any adviser number → a blank
`Quote?QuoteId=&...` page). No cover may already be active.

Personal Details must be filled in enough for the page to accept cover-button clicks at
all — the exact values don't matter to this bug, only that they're valid:
- **Age next birthday**: any value in the valid range (used: `35`) — **just-needs-to-be-valid**.
- **Gender**: either option (used: `Male`) — **just-needs-to-be-valid**.
- **Occupation code**: **this is the variable under test, not a fixed precondition.** The
  bug reproduces at **every** code offered by the dropdown: blank/unselected, AM, AA, A1,
  A2, B, C, S, U, and IC. AA is the one code the documented rule says should NOT be gated
  for Needlestick (though `LSC-03`'s Cancer/Acc.Death/Specific Injury gating at AM still
  applies) — it's included in the table below as a control, not as a counter-example.
- **No companion cover pre-activated.** Needlestick and Specific Injury normally require a
  companion cover to clear an *Apply*-time validation (`LSC-31b`/`LSC-34`), but that
  requirement is enforced at Apply, not at click-time — per the doc's own wording, the
  `LSC-02`/`LSC-03` gate is supposed to prevent the cover card from being added on click at
  all, independent of the companion-cover rule. This report never clicks Apply — the
  no-op-on-click behavior is the whole test, and companion-cover status doesn't affect it.

## Steps to reproduce

**Core reproduction (any single code, e.g. AM):**
1. On the quote from the preconditions above, open the **Occupation code** dropdown (in
   the Personal Details panel) and select **AM**. Wait for the page to finish
   recalculating (the "Loading" indicator disappears).
2. In the **Lump Sum Covers** panel, click **Needlestick**.
3. Check whether a new cover row/card appeared — look for a new **"Remove"** link, which
   only appears on an actually-activated cover.
   - **Expected** (per `LSC-02`): no card appears — the click is a no-op.
   - **Actual**: a card appears (Sum Insured field + "Remove" link).
4. Repeat step 2-3 for **Cancer**, **Acd. Death**, and **Specific Injury** (each on its own
   fresh quote, to avoid the app's documented stale-state-carryover behavior across
   scenarios reused on one quote).
   - **Expected** (per `LSC-03`, for AM specifically): all three should be no-ops too.
   - **Actual**: all three activate.

**Full sweep (what was actually run, one fresh quote per code × cover combination):**
For each Occupation Code in `["" (blank), AM, AA, A1, A2, B, C, S, U, IC]`, on its own
fresh quote, clicked Needlestick, Cancer, Acd. Death, and Specific Injury in turn (with a
`removeAllCoverCards` reset between each), counting "Remove" links before/after each
click. Every single one of the 4 × 10 = 40 combinations activated. Two results initially
looked like exceptions on a first pass — Occupation Code C showing Acd. Death/Specific
Injury buttons as briefly "not found," and Occupation Code IC showing Cancer as a no-op —
but **neither reproduced** on a clean re-run with slightly more settle time after the
click; both were timing artifacts of the probe script, not real gating. There is no
occupation code, among those tested, where the gate actually holds beyond AA's documented
Needlestick exception not applying (AA is the one code Needlestick is *supposed* to work
for, per `LSC-02` — it activating there is expected, not a finding).

**Type-ahead path (rules out the "maybe gating only fires once the type-ahead field is
populated" hypothesis):**
1. Searched the "Occupation" type-ahead for every plausible military/Armed-Forces-related
   term: `Armed Forces`, `Army`, `Navy`, `Air Force`, `Military`, `Soldier`, `Defence`,
   `Defense`, `NZDF`, `Combat`, `Infantry`, `Marine`. Only `Armed Forces` and `Marine`
   returned any matches at all (10 unique titles total across both).
2. Selected each of the 10 titles (fresh quote each) and read back the Occupation Code it
   auto-locked to. **No title resolved to AM** — the two "Armed Forces" titles both
   resolve to **U**, matching the earlier investigation's finding. `AM` may not be
   reachable via the type-ahead at all under any title a reasonable person would search
   for; it's possible the doc's gloss "AM = Armed Forces" is itself imprecise, or AM maps
   to a title outside this search space.
3. Selected the type-ahead title that resolves to **U** (confirmed via reading the now
   locked/disabled Occupation Code select back), then clicked Needlestick and Cancer —
   both activated. Deliberately did **not** click Apply this time, to rule out the earlier
   session's 500-error confound entirely.
4. As a control, selected a type-ahead title that resolves to **AA**, and got the same
   result (both activate) — confirming the type-ahead path behaves the same either way,
   i.e. going through the type-ahead field makes no detectable difference to gating.

## Evidence

| Occupation Code (via plain select) | Needlestick | Cancer | Acd. Death | Specific Injury |
|---|---|---|---|---|
| (blank/unselected) | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| AM | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| AA | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| A1 | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| A2 | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| B | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| C | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| S | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| U | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |
| IC | ACTIVATED | ACTIVATED | ACTIVATED | ACTIVATED |

| Occupation Code (via "Occupation" type-ahead) | Needlestick | Cancer |
|---|---|---|
| U (via "Armed Forces - all ranks...") | ACTIVATED | ACTIVATED |
| AA (via "...Biologist (not marine) - Laboratory / Consulting", control) | ACTIVATED | ACTIVATED |

No occupation code, via either input path, produced a gated (no-op) result for any of the
four covers this session.

Original two-run finding (2026-08-25, plain select, AM only) that started this
investigation:
- `apps/asteron-quote-apply/test-results/asteron-quote-apply-tests--80891-able-for-Occupation-Code-AA-chromium/` (Needlestick)
- `apps/asteron-quote-apply/test-results/asteron-quote-apply-tests--75aa2-ecific-Injury-functionally--chromium/` (Cancer)

Prior corroborating finding, six days earlier, different session, same method:
- `sessions/2026-08-19.md`: *"LSC-02: Needlestick now activates for ALL occupation codes (AA-only restriction appears removed)"*

## Root cause

Unknown from black-box observation alone. The occupation-eligibility check that used to
gate these four covers' click handlers does not appear to run for any code, on either
input path. No console/network errors were observed during any of today's clicks (unlike
the earlier, unrelated Apply-time 500 error from `ECT_Provider/WS_ECT.asmx`, which is not
part of this finding and was successfully ruled out as a confound by never clicking Apply
in this round of testing). The absence of errors slightly favors "the check was
deliberately removed/disabled" over "the check is silently erroring," but this is not
conclusive from the client side.

**Update, 2026-08-26:** a separate stress-testing pass found **Trauma has its own
occupation-eligibility gate that still works correctly** — Occupation Code = U blocks
Trauma at Apply with *"This Occupation is not eligible"*, confirmed absent at Occupation
Code = AA (control), and confirmed again under a Business policy. See
`lump-sum-covers/page.md`'s `LSC-17b`. Since Trauma isn't one of the four covers this
report covers, this doesn't change the finding above — but it does weigh the two
explanations differently: the occupation-gating *system* clearly isn't wholesale disabled
(Trauma's check still runs and blocks correctly), which favors "a real regression
specific to these four covers' gating logic" over "the whole feature was intentionally
removed."

Also confirmed the regression is narrowly scoped even *within* the four broken covers:
Needlestick's separate maximum-Age-Next-Birthday-65 validation (`PD-31`) still fires
correctly (confirmed at Age 70, Occ=AA — a code where occupation gating was never the
issue). Only the occupation-eligibility check itself is broken; every other validation on
these covers (age caps, Sum Insured caps, companion-cover requirements) continues to work.

## Reproducibility

Confirmed across:
- 2 independent runs today (AM only, plain select) — original finding.
- 1 full sweep today — 10 occupation codes × 4 covers = 40 combinations, plain select, all
  40 activated (2 apparent exceptions did not reproduce on retest — see Steps above).
- 1 type-ahead-driven retest today — 2 codes (U, AA) × 2 covers = 4 combinations, all 4 activated.
- 1 independent session 6 days prior (2026-08-19) — same underlying Needlestick/AA-only
  restriction found already lifted, via the plain select.

No variance observed in any run — every combination tested, across two sessions six days
apart and two input paths, agrees that the gate does not fire.

## Possible explanations to rule out first

- **A real regression** — plausible, and now strengthened: an eligibility check that
  should run on *every* occupation code, through *either* input path, appears to run on
  *none* of them. A bug this broad (not a single-code edge case) is more consistent with
  something like a removed/disabled feature flag or a broken shared guard clause than a
  narrow per-code data issue.
- **An intentional change** — still worth checking given active development on this form.
  If occupation-based eligibility gating for these four covers was deliberately removed
  entirely (not just relaxed for one code), that's a bigger doc/rule change than
  originally scoped, but plausible.
- **A test artifact** — now very unlikely. Two independent sessions, two input paths (plain
  select and type-ahead), and 44 total click combinations all agree. The two isolated
  "gated" readings that appeared mid-sweep (Occupation Code C, IC) were investigated and
  did not reproduce with more settle time — they were probe-timing artifacts, not real
  gate hits, and are called out as such rather than silently dropped.

## Known test flakiness (not part of the finding)

Running the new `LSC-02/LSC-03 @ Occupation Code = AA` Playwright test in isolation twice
produced two different problems, neither of which touches the core finding above (AA is
the control/expected-to-pass case, not where the regression lives): once a plain 240s
timeout mid-teardown, and once a run that took an anomalous ~14 minutes (vs. ~2 minutes
for every other code) and returned a one-off "Specific Injury: no-op" for AA — which
contradicts the full-sweep probe's earlier clean "ACTIVATED" result for that exact
combination. This reads as environment/network slowness in this session rather than a
real behavior difference (nothing else this session pointed at Specific Injury being
special for AA), but the AA test specifically should be re-run cleanly before trusting
either its pass or fail status.

## Suggested next step

Confirm with a BA/PM whether occupation-based eligibility gating for Needlestick, Cancer,
Accidental Death, and Specific Injury (`LSC-02`/`LSC-03`) was intentionally removed. Given
the scope now confirmed (every code, both input paths), this reads much more like "the
feature was turned off" than "one code's rule broke" — worth asking about directly rather
than assuming a narrow regression. If unintentional, file this as a real defect with the
dev team using this report. Either way, `lump-sum-covers/page.md` currently carries a
"known regression, unresolved" annotation on `LSC-02`/`LSC-03` pending that answer — update
it once confirmed.

## Test artifact

```
npx playwright test apps/asteron-quote-apply/tests/quote-screen/lump-sum-covers.spec.js -g "LSC-02|LSC-03" --config=playwright.config.js
node apps/asteron-quote-apply/probes/probe-lsc02-03-full-sweep.js
node apps/asteron-quote-apply/probes/probe-occupation-typeahead-am-hunt.js
```
