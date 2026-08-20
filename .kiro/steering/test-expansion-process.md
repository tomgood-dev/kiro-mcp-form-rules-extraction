# Test Expansion Process

> Steering file for systematically expanding test files to full coverage.
> Follow this process for every test file that needs multi-persona/exhaustive treatment.
> **ALL steps are mandatory. Do NOT skip any step or wait to be prompted. Complete them automatically.**

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
- [ ] Documentation covers ALL parts with tables, formulas, personas
- [ ] Limitations section contains ONLY genuine system constraints
- [ ] Business rules docs updated if any discrepancies found (with date stamp)
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

If (b): this is a **new finding**. Write a targeted probe script (`tools/probe-<topic>.js`) to confirm the behavior at multiple data points. Then:
- Update the business rules doc (`apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/<category>/page.md`) with the correction, including date stamp and evidence
- Update `exhaustive-analysis.md` with a new GAP-XX entry
- THEN fix the test's expected values to match reality

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

Create/update `apps/asteron-quote-apply/docs/confluence-pages/test-documentation/<filename>.md`:

**Required sections:**
- Header: test file, execution time, last verified date, assertion count
- Summary: one paragraph on what the test proves
- Test Structure: numbered list of parts
- Per-part detail: table showing inputs → expected outputs → what it proves
- Formulas Under Test: if applicable, show the math
- Independence Checks: what variable was flipped, why it matters
- Findings That Corrected Business Rules: if any discrepancies were found
- Limitations: ONLY genuine system constraints that cannot be tested (not things that should have been included)

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

| Test | Current Assertions | What Needs Adding |
|------|-------------------|-------------------|
| `pol-kid-v1` | 4 | Multi-persona for POL-05, Kids with different SI tiers selected, multiple kids |
| `dc-v3` | 28 | Add Agreed Value variant tests, Monthly Mortgage cover type, verify formulas hold across those variants |

## Key Technical Notes

- **Test Console constraints**: One `test()` per file, ES5 inside `page.evaluate()`, fresh login per test, sign out at end
- **Edge browser**: Use `playwright.edge.config.js` for local runs (Chromium blocked)
- **Income field**: Use `input[id*="Input_AnnualIncome"]` or fall back to `input[id*="MaskedInput"]`
- **Cover buttons**: Use exact text from DOM (e.g. `Acd. Death` not `Accidental Death`)
- **Calc-mask fields**: Clear with 12× Backspace before typing digits one by one
- **Auto-default**: Focus + Tab (blur) triggers server-side calculation for DC covers
- **Income re-entry**: Must re-enter income before each new cover activation (server doesn't recalculate existing covers on income change)
