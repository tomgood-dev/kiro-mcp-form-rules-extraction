# Test Expansion Process

> Steering file for systematically expanding test files to full coverage.
> Follow this process for every test file that needs multi-persona/exhaustive treatment.
> **ALL steps are mandatory. Do NOT skip any step or wait to be prompted. Complete them automatically.**

## Probe & Interaction Safety (applies to every probe and test, both modes)

A false "finding" caused by the test's own interaction technique is worse than no finding — it
wastes review time and can misdirect a real dev fix. 2026-08-20: a probe's own `page.mouse.wheel()`
call (used only to scroll a screenshot into frame) silently produced a false "Update button always
enabled" reading, initially written up as a real ACB-13175 defect before being retracted. Full
investigation trail: `apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/evidence/update-button-investigation-raw-output.txt`.

**Re-running the same script more times does not catch this class of bug.** A script-induced
artifact is exactly as reproducible as a real one — it's deterministic given the same faulty
steps. Stress-testing (repetition) proves consistency, not correctness. The three rules below do
catch it.

### Banned / discouraged interaction patterns

- **`page.mouse.wheel()` / `page.mouse.move()` + coordinate-based clicks — banned.** These depend
  on ambient cursor position and can land on whatever element happens to be underneath, including
  a `<select>` a couple of screenshots ago (the likely mechanism behind the 2026-08-20 false
  positive: a wheel event over a focused select silently changed its value). Use
  `locator.scrollIntoViewIfNeeded()` instead of a manual wheel/scroll simulation whenever framing
  a screenshot.
- **`page.keyboard.press()` sent without a preceding `.click()`/`.focus()` on the specific
  target** — same ambient-focus risk. Always click/focus the exact target locator first.
- **Raw `element.value = x; element.dispatchEvent(...)`** to change a select/input — avoid when
  `locator.selectOption()` / `locator.fill()` can do the same thing natively. When it genuinely
  can't be avoided (existing precedent: `dc-v5.spec.js`, `lsc-both-v11.spec.js`,
  `test-pd-v12.spec.js`), it MUST be paired with the self-verifying rule below.

### The self-verifying interaction rule (mandatory)

Any interaction — especially a raw DOM mutation — must be followed by an assertion that could
**only** be true if the interaction genuinely took effect on the app's side. Never read a passive
DOM attribute (`.disabled`, `.value`, `.selectedIndex`) immediately after an interaction and treat
that alone as proof it landed — a passive read can't distinguish "the framework's reactive state
really updated" from "the raw DOM property changed but nothing downstream noticed."

- **Good** (existing precedent, `dc-v5.spec.js`): switch a dropdown via raw `dispatchEvent`, then
  assert a *server-recalculated* value (a benefit cap, an error message) that could only be
  correct if the switch really happened.
- **Bad** (what caused the 2026-08-20 false positive): read a button's `.disabled` boolean right
  after an interaction, with nothing forcing proof the interaction actually registered.

### When a probe finds something "surprising" — verify before writing it up

Never treat a single probe run, however clean-looking, as sufficient to write a Discrepancy
Evidence Record. Before writing one up:

1. **Re-run with a DIFFERENT, minimal script** that does only the read, stripped of every action
   not strictly required to reach that state (no extra screenshots, no scrolling, no incidental
   interactions in between). If the result changes, the removed step was the contaminant.
2. **If the behavior could plausibly be time-dependent**, sample the same state repeatedly over
   several seconds with ZERO further interaction, to rule out "it changes on its own."
3. **Only write the finding up once 2+ independently-clean runs agree.** One run is a lead, not a
   finding.

This is exactly what overturned the "Update button always enabled" false positive (see the
evidence file above for the full 5-run trail) — and it's the standing bar for every future
discrepancy, not a one-off recovery step.

## Two Modes of Test Authoring

This project has two distinct starting points for a test, and they carry different obligations:

1. **Reverse-engineering mode** — no written spec exists. Behavior is derived from scratch by black-box probing against the live app (this is how DC/PREM/POL/LSC rules were built). "The app's behavior IS the rule" — there's nothing to disagree with except an earlier probe of the same app.
2. **Acceptance-criteria mode** — a written spec already exists (a Jira/Confluence user story with numbered ACs, e.g. `docs/user-stories/*.md`) describing what a **built or supposedly-built** feature should do. Here the app's actual behavior can be *wrong* relative to a real, authored requirement — a genuine product/dev discrepancy, not just an undocumented quirk. **Never assume a mismatch means "not built yet."** Treat every AC as describing current, shippable behavior unless a teammate confirms otherwise. A mismatch found here is a candidate defect and must be documented well enough to file as one.

Section "Testing a Written User Story" below is mandatory for mode 2. Everything else in this file applies to both modes.

## Testing a Written User Story (Acceptance-Criteria Mode)

When the test's source is a user story with numbered ACs rather than a black-box exploration:

1. **Probe before asserting.** Never guess selectors or encode an AC's expected value without first confirming, via a throwaway probe script (`apps/asteron-quote-apply/probes/probe-<topic>.js`), what the real DOM/behavior actually is. Keep the probe script — do not delete it once it has produced evidence used in a finding.
2. **Every AC gets one of three outcomes**, and each must be traceable in the test doc:
   - **Confirmed matching** → becomes a normal passing assertion in the `.spec.js`, tagged with its AC id.
   - **Confirmed NOT matching** → still becomes an assertion in the `.spec.js`, written to the *spec's* expected value (not the observed one), and it is EXPECTED TO FAIL until the discrepancy is fixed. This is the entire point of testing from a user story before/around a release — the suite goes green automatically the moment the real defect is fixed. Order these after the confirmed-matching assertions in the same file so a single fail-fast test still re-verifies everything already known-good on every run (see "Test Console constraints" below).
   - **Not yet investigated** (genuinely out of scope for this pass — e.g. requires backend/STP verification, multi-session state, etc.) → listed explicitly as deferred with a one-line reason. Never silently omit an AC.
3. **Every "confirmed NOT matching" outcome requires a full Discrepancy Evidence Record** (template below) in the relevant business-rules page. A one-line summary ("2 discrepancies found") is not sufficient — the record must stand on its own as something a developer or PM could act on without re-running anything.

### Discrepancy Evidence Record (mandatory template)

Write one of these per discrepancy, in the feature's business-rules page — NOT in the test doc,
which stays a terse matrix with a short inline Notes phrase and no links out (see Step 7):

```
#### <short title>

- **AC / Rule ID:** e.g. AC05, or ADV-xx once confirmed
- **Verbatim requirement:** exact quoted text from the source user story, including which
  table row / section it came from (quote it, don't paraphrase it)
- **Reproduction steps:** numbered, exact values — persona (age/gender/OCC), cover + sum
  insured, exact dropdown/field values and the exact order of clicks/selections. Someone
  who has never seen this app should be able to follow these steps verbatim.
- **Expected result:** quoted from the source doc
- **Actual result:** verbatim string, or the raw DOM/JSON dump observed (not a paraphrase —
  e.g. the literal options array and selectedIndex, not "it showed the wrong thing")
- **Evidence artifact(s):** relative path(s) to a retained screenshot and/or the raw probe
  script output that produced this finding. Store screenshots in an `evidence/` folder next
  to the business-rules page.md that documents the feature (e.g.
  `.../adviser-use-commission/evidence/`). Never delete probe screenshots or raw output
  once they've supported a finding.
- **Environment:** base URL, account/login used, date observed
- **Reproducibility:** confirmed once vs. reproduced N times, and any variance noticed
  between runs
- **Test encoding:** which assertion in which `.spec.js` currently encodes this as an
  expected-to-fail check (per outcome #2 above), or "not yet encoded — reason: ..."
```

### Test Console constraints (still apply in this mode)

Same as reverse-engineering mode: one `test()` per file, ES5 inside `page.evaluate()` (no arrow
functions, no `let`/`const` inside evaluate blocks — use `function(){}` and `var`), fresh login
per test, sign out at end. A fail-fast single test means a "confirmed NOT matching" assertion
placed early in the file will hide later confirmed-passing assertions from every run until it's
fixed — order matters (see outcome #2 above).

## Critical Rules (do these WITHOUT being asked)

1. **Version numbers must always match** — if the test file is `dc-v3.spec.js`, the documentation MUST be `dc-v3.md`. If you bump the version, rename the doc immediately.
2. **Deprecate old versions immediately** — when a new version passes locally, move the old file to `deprecated/` before asking the user to upload.
3. **Write/update test documentation as part of the same workflow** — don't wait to be asked. After a test passes locally, create/update the `.md` file in the same step.
4. **Update business rules docs in the same workflow** — if a test reveals a discrepancy, update the business rules page AND the exhaustive analysis doc before moving on.
5. **No "limitations" that are actually testable** — if something CAN be tested, test it. Only list genuine system constraints (e.g. IP Tier 3 masked by $30k cap) as limitations.
6. **Commit atomically** — one commit per completed test expansion, including: test file, deprecated old version, test documentation, any business rules corrections.

## Completion Checklist (must ALL be done before a test is "finished")

- [ ] Full-coverage test written (all variations, boundaries, personas, independence)
- [ ] Test passes locally (Edge config)
- [ ] Old version moved to `deprecated/`
- [ ] Version bumped (renamed for Test Console cache)
- [ ] Test documentation `.md` created/updated (filename matches test version)
- [ ] Documentation is a scannable Results matrix (one row per rule/check), not prose — see
      Step 7 for the required 1-4 section structure, and no links out to other docs
- [ ] Limitations/Deferred section contains ONLY genuine system constraints or explicitly-not-yet-done items
- [ ] Business rules docs updated if any discrepancies found (with date stamp)
- [ ] Acceptance-criteria mode only: every "confirmed NOT matching" AC has a full Discrepancy
      Evidence Record (not a one-line summary) with retained evidence artifacts
- [ ] No banned interaction patterns used (`page.mouse.wheel`/`page.mouse.move`, unscoped
      `page.keyboard.press`, raw `dispatchEvent` without a self-verifying follow-up assertion —
      see "Probe & Interaction Safety")
- [ ] Every "surprising" result was re-verified with a different minimal script (and a
      no-interaction timing sample if time-dependence was plausible) before being written up
- [ ] `exhaustive-analysis.md` updated if new GAP/finding
- [ ] Committed and pushed with descriptive message
- [ ] User informed of file to upload + expected runtime

## The Process

### Step 1: Identify Missing Variations

Take the existing test file and list what variables could theoretically affect each rule's output:

- **Age**: young (11-16), young adult (17-21), standard (22-60), older (61-75)
- **Gender**: Male, Female
- **Occupation Code**: AA, AM, A1, A2, B, C, S, U, IC (values 0-8)
- **Employment Status**: Employed, Self-Employed, Employed by own company, Other
- **Income**: multiple levels hitting each tier boundary and cap
- **Cover combinations**: single, pairs, triples

For each rule, ask: "If a developer accidentally introduced a modifier based on [variable], would this test catch it?"

### Step 2: Write the Full-Coverage Version

Structure the test in distinct parts:

1. **Core rule validation** — sweep across all meaningful input values (e.g. 7 income levels for a formula, exact boundary for a cap)
2. **Multi-persona checks** — same rule tested with different age/gender/OCC combos to confirm universality
3. **Independence checks** — hold everything constant, flip one variable at a time, assert output doesn't change
4. **Cross-rule interactions** — exclusivity, dependencies, mutual exclusions tested on a deliberately different persona from the core tests

Use a helper function like `assertVal(actual, expected, ruleId, context)` for clear failure messages.

Set timeout generously — 10-12 minute tests are fine. Use `test.setTimeout(720000)` or higher.

### Step 3: Run Locally

```powershell
$env:Path = "C:\Users\TOMGOO\AppData\Local\Kiro-Cli;" + $env:Path
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
$env:BASE_URL = "https://outsystems-dev.asteronlife.co.nz"
$env:LOGIN_EMAIL = "hanno.coetzee+1123@resolutionlife.com.au"
$env:LOGIN_PASSWORD = "P@ssw0rd135"

# Use Edge config (Chromium blocked by security tools)
node node_modules/@playwright/test/cli.js test apps/asteron-quote-apply/tests/<file>.spec.js --reporter=line --config=playwright.edge.config.js
```

If it passes → proceed to Step 5.
If it fails → proceed to Step 4.

### Step 4: Investigate Failures

**Do NOT just adjust the test to match the app.** Determine whether:

- (a) The test has a bug (wrong selector, timing issue, incorrect expected value)
- (b) The app behaves differently from the documented business rules

If (b): this is a **new finding**. Write a targeted probe script (`apps/asteron-quote-apply/probes/probe-<topic>.js`) to confirm the behavior at multiple data points. Then:
- Update the business rules doc (`apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/<category>/page.md`) with the correction, including date stamp and evidence
- Update `exhaustive-analysis.md` with a new GAP-XX entry
- THEN fix the test's expected values to match reality

**If this test's source is a written user story (acceptance-criteria mode, see above)**, do NOT
just fix the test's expected values to match reality — the reality may be the bug. Write a full
**Discrepancy Evidence Record** (template above) instead, and encode the assertion against the
*spec's* expected value so it fails until the real defect is fixed.

### Step 5: Upload to Test Console

- Rename file with bumped version number (cache busting)
- Set env vars: `BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD`
- Run one test at a time with gaps between (single-session per user)
- Confirm pass

### Step 6: Deprecate Old Version

```powershell
Move-Item "apps/asteron-quote-apply/tests/<old-version>.spec.js" "apps/asteron-quote-apply/tests/deprecated/"
```

### Step 7: Write Test Documentation

Create/update `apps/asteron-quote-apply/docs/confluence-pages/test-documentation/<filename>.md`.
**Keep it a scannable matrix, not a prose write-up** — this doc gets read to answer "did it pass,
what did it check, why," not to relearn the whole test. No links out to other docs (business
rules pages, steering docs, source user stories) — keep it self-contained; a short inline phrase
in the Notes column is enough context.

**Required structure (exactly these 1-4 sections, in this order):**

1. **Header block** (4 lines, no more): test file, last run date + environment + duration,
   source (reverse-engineering mode, or the Jira/user-story reference for acceptance-criteria
   mode), and a one-line result summary (e.g. "7/7 passing" or "4/5 passing, 1 confirmed failing").
2. **Results** — one matrix, one row per rule/check (collapse a multi-assertion sweep like "7
   income levels × 3 covers" into one row per formula/rule, not 21 rows):

   | # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
   |---|---|---|---|---|---|---|

   Status is always one of ✅ Pass / ❌ Fail / 🚫 Retracted — no other wording. Notes is for the
   one-liner that matters (why something's confirmed-failing on purpose, why a "finding" got
   retracted, a new-vs-known-issue flag) — not a restatement of the Expected column.
3. **Limitations** (if any) — small table, `Rule ID | Why`. ONLY genuine system constraints that
   cannot be tested (not things that should have been included — see Critical Rule #5 below).
   For acceptance-criteria mode, use **Deferred** instead (same shape, `AC(s) | Reason`) for ACs
   that are testable later but simply haven't been done yet — the distinction matters: Limitations
   can't be closed, Deferred can.
4. **Business Rule Corrections** (if any) — small table, `Rule ID | Was | Now`, only when this
   test run actually corrected a previously-documented rule.

Do not add a Summary paragraph, a numbered "Test Structure" list, a Formulas section, or a
separate Independence Checks section — fold that context into the matrix's Test Input/Expected/
Notes columns instead.

### Step 8: Update Business Rules Docs

If Step 4 found discrepancies, ensure these files are updated:
- `apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/<category>/page.md`
- `apps/asteron-quote-apply/docs/exhaustive-analysis.md`

All corrections must include:
- Date stamp: *(Corrected 2026-XX-XX)*
- What was wrong
- What the app actually does
- Evidence (error message text, observed values)

### Step 9: Commit and Push

```powershell
$git = 'C:\Users\TOMGOO\AppData\Local\Programs\Git\bin\git.exe'
& $git -C 'C:\Users\TOMGOO\kiro-mcp-form-rules-extraction' add -A
& $git -C 'C:\Users\TOMGOO\kiro-mcp-form-rules-extraction' commit -m "descriptive message"
& $git -C 'C:\Users\TOMGOO\kiro-mcp-form-rules-extraction' push origin master
```

Commit message should name the test file, assertion count, and any doc corrections.

---

## Remaining Tests Needing This Process

Both items previously listed here are done: `pol-kid-v1` was superseded by `pol-kid-v3`
(multi-persona POL-05, SI tiers, multiple kids all present — see `pol-kid-v3.md`), and `dc-v3`
was superseded by `dc-v5` (Agreed Value + Loss of Earnings variants, Monthly Mortgage cover type
all present — see `dc-v5.md`). Nothing currently queued. When a new gap is identified, list it
here with the test file and what's missing, and remove the row once closed — don't let entries
go stale (this table itself was out of date for a while before being caught in a documentation audit).

## Key Technical Notes

- **Test Console constraints**: One `test()` per file, ES5 inside `page.evaluate()`, fresh login per test, sign out at end
- **Edge browser**: Use `playwright.edge.config.js` for local runs (Chromium blocked)
- **Income field**: Use `input[id*="Input_AnnualIncome"]` or fall back to `input[id*="MaskedInput"]`
- **Cover buttons**: Use exact text from DOM (e.g. `Acd. Death` not `Accidental Death`)
- **Calc-mask fields**: Clear with 12× Backspace before typing digits one by one
- **Auto-default**: Focus + Tab (blur) triggers server-side calculation for DC covers
- **Income re-entry**: Must re-enter income before each new cover activation (server doesn't recalculate existing covers on income change)
