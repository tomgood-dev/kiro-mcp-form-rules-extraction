# Test Generation — Cumulative Learnings

Appended after each run of `TEST-GENERATION-PROCESS.md`, per its Step 7. Each entry is a short
"what to improve next time" note, newest first. Not a replay of the generation log — see each
story's `test-runs/<slug>/generation-log-*.md` for the full detail behind each entry.

## 2026-09-03 — Exhaustive-coverage hardening pass (all AC-mode specs)

- **The #1 systemic gap was the missing at-boundary ACCEPT case.** An audit of all 6 AC-mode specs
  found every cap/age/threshold test asserted only the FAILING side (over-cap errors), never that
  the value AT the boundary is accepted — so a cap silently shifted by one unit would pass. Fix
  pattern, now mandatory (PROCESS Step 4b): for each limit, assert below/AT/over with the AT case
  asserted to behave per the AC (usually accepted). Encoded as a companion test next to each
  existing failing-side test; data-driven where the caps form a family (Level-to structures).
- **Assert the specific error is ABSENT, not "no errors at all", for accept-side tests.** At a
  boundary-accept value an UNRELATED rule often still fires (e.g. a $5,000 Trauma SI clears the
  $5k min but trips the $240 min-premium rule; ANB 17 min-age accept still shows min-premium).
  Assert `!hasSpecificError` (the boundary under test), not `errors.length === 0` — otherwise the
  accept test fails for the wrong reason.
- **Reopen-in-one-quote sweeps are fragile; use a fresh quote per value.** A Flexi-Rate sweep that
  reopened the Adviser Use panel repeatedly in one quote broke after ~3 iterations (panel state
  carried over). A fresh quote per value is reliable — but stay within the ~4-5-fresh-quotes
  session-load budget (split if more are needed), so probe only the handful of values you actually
  need exact data for (e.g. the Nil-Comm boundary pair), not the whole ladder.
- **recurring EDIT hazard:** a `strReplace` whose `oldStr` ends at a `test('...', async ... => {`
  line silently drops that declaration, producing "await is only valid in async functions". Always
  re-include the full `test(...)` opening line in `newStr`. Hit this twice this session.
- **Live-run time is the real cost, and it compounds.** Single-session account → every run is
  serialised with a 60-90s release wait, and large specs (32 tests each opening fresh quotes) ran
  ~1.1-1.2h EACH. Budget realistically: hardening 6 specs is a multi-hour effort dominated by runs,
  not edits. Consider batching edits across specs and doing verification runs at the very end, and
  set expectations up front.
- **Pre-existing test-data bugs surface when you re-run old tests.** trauma AC11 (Trauma $250k +
  Cancer $1) never actually exceeded the $250k combined cap, so it failed on re-run — a latent
  wrong-input bug (Critical Rule #8 #1) unrelated to the hardening. Re-running old specs as part of
  a hardening pass is a useful side-effect: it flushes out these.

## 2026-09-02 — Multi Lives and Policies (ACB-4394)

- **A per-life "premium" read is a race under load — assert stable structural signals instead.**
  MLP-05/MLP-17 initially asserted the second life's premium > 0 via `getTotalYearlyPremium`. It
  passed in isolation but read 0/blank for the 2nd life in the full suite (OutSystems reactive
  re-render hadn't settled). `fillCalcMask` already self-verifies the SI digits landed, so the
  robust check is: assert the first/active life's premium (stable) + `lifeTabCount === 2` + the
  all-lives total label is present. Don't chase a just-recalculated per-life figure.
- **When the app throws a modal/backdrop during bulk building, a normal `.click()` can't win.**
  MLP-13 (build 10 lives) failed 6× across 3 strategies because a transient `<div class="popup-
  backdrop">` intercepts pointer events deep in the build (~life 5-7) — the documented sustained-
  session-load instability. A DIAGNOSTIC probe that built 5 lives *in isolation* showed ZERO
  backdrop, proving it's load-induced, not a defect. Lesson: (1) run a bulk-op DIAGNOSTIC in
  isolation early to separate "app can't" from "load flakiness"; (2) a test needing many heavy
  ops in one session should be a dedicated split file/session from the start (the steering rule),
  not retrofitted after it flakes; (3) evaluate-based field entry bypasses pointer interception
  but then needs a real server-recalculated self-verify, which itself gets flaky under the same
  load. When all three of those are hit, blocked-with-evidence is the honest call — keep the
  assertion (goes green when a reliable build exists) and cite the sibling limit test that passes.
- **Distinguish "the modal has no OK inside a [role=dialog]" from "no modal".** The app's "Cannot
  proceed" popup is NOT a `[role="dialog"]`; a modal-capture helper scoped to that selector
  returns false-negatives, and the vscomp typeahead ("Select...") is a false-positive. Scope modal
  reads to a real backdrop + known message strings, and verify the capture helper on a KNOWN modal
  before trusting a "no modal" result (recon-2 wasted a run on a `.vscomp` false match).
- **An AC's precondition may be unreachable from the reachable screen — that's blocked-with-
  evidence, not a fail.** MLP-26/MLP-29 both need a "policy has an error" state that a blank or
  over-cap Sum Insured does NOT produce pre-Apply (no visible error at all). The error-HIGHLIGHT
  mechanism was separately confirmed to exist, so the AC isn't wrong — the browser just can't reach
  its trigger. Encode to the story value but mark it needs-BA-clarification, don't pretend-pass.
- **Reuse a strong sibling spec — it collapsed Step-3 probing.** `create-a-new-business-quote-v1`
  already proved Add life / Personal / Business / premium-panel patterns, so 5 combined recon
  probes (not dozens) covered a 29-AC story. Checking the sibling FIRST is what the prior run's
  learning said to do, and it paid off.

## 2026-09-01 — Premium Details in the Quote Screen (ACB-2286)

- When a DOM-query probe finds "nothing" for a control the AC explicitly describes, treat that as
  "the query found nothing," not "the feature doesn't exist." AC08 was wrongly marked
  blocked/`test.fixme` after two probes failed to find a per-life collapse control — a screenshot
  from an unrelated test's failure later showed the control clearly working. Cross-check a
  DOM-query "not found" result against a screenshot from a nearby successful interaction before
  concluding "genuinely blocked."
- When a shared text-scoping helper is used for a NEGATIVE assertion (`not.toContain(...)`), audit
  its anchor pattern extra carefully. An anchor that's "good enough" for positive assertions (any
  match anywhere in a broad slice satisfies them) can be silently wrong-scoped and only surface as
  a bug on the first negative assertion that actually depends on precise scoping. (Two separate
  bugs of this shape hit the same helper in this run — scoping from the ambiguous word "Premium"
  instead of a more specific anchor.)
- Prefer a small number of well-planned, combined recon probes over many narrow one-off ones. 5
  probes were run before writing this story's spec — flagged by the user mid-session as too many.
  Check an existing sibling spec for an already-proven pattern (e.g. a prior story's multi-policy/
  frequency setup) BEFORE probing live from scratch, not after failing to reinvent it.
- `--workers=1` is the reliable choice for this app/account — `--workers=2` triggered a session-
  conflict cascade partway through a run (matches the environment's documented single-session-per-
  account constraint). The wall-clock cost is worth paying for reliability.
