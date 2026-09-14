# Project Context

## Suite dashboard (high-level view for dev/BA)

A suite-level dashboard aggregates the LATEST run of every spec into two auto-updating files at
`apps/asteron-quote-apply/test-runs/`:
- `DASHBOARD.md` — scannable Markdown (suite totals, per-spec pass/fail/skip, last-run time,
  duration, env, and a "specs with failing tests" triage list). Good for a BA / Confluence.
- `dashboard.html` — self-contained, sortable + filterable (All / Failing / Passing / All-skipped),
  no server needed — open the file. Good for a dev.

It **rebuilds automatically at the end of every test run** (the run-folder reporter calls
`tools/build-dashboard.js` in `onEnd`). Rebuild manually anytime with `node tools/build-dashboard.js`.

- Source of truth: each run now also writes a machine-readable `summary.json` beside `report.md`
  (spec, timestamp, env, counts, per-test title/status/duration, and a `filtered` flag). The
  dashboard reads these; for older runs predating `summary.json` it falls back to parsing
  `report.md`'s header.
- `-g`/`--grep` single-test re-runs are flagged `filtered:true` and are SKIPPED when choosing a
  spec's "latest full run", so a partial re-run never misrepresents the whole spec. (Legacy
  filtered runs without summary.json self-correct on the next full run.)
- Skipped tests = deferred/blocked ACs (documented per spec) — the dashboard frames these as "not a
  failure". Intentional expected-fails (known QA discrepancies) still count as failed (they are real
  app discrepancies) and appear in the triage list.

## Parallel test runs (N accounts)

Use the reusable launcher instead of hand-editing per-run `$specs`/`Start-Job` arrays:

```
node tools/parallel-run.js <spec> [<spec> ...]   # fan named specs across accounts
node tools/parallel-run.js --all                 # run every quote-screen spec
node tools/parallel-run.js --scaling-test        # launch the same short spec on all accounts (load test)
node tools/parallel-run.js --scaling-test --streams 10   # load-test a specific stream count
node tools/parallel-run.js --list                # show discovered accounts + specs
```

- Accounts live in gitignored `apps/asteron-quote-apply/accounts.json` (format in
  `accounts.example.json`, committed). Add accounts there — no script edits needed. Each account
  `id` maps to auth state `state-qa-<id>.json`.
- The launcher bakes in the concurrency-safety settings: **`KILL_STRAY_EDGE=false` on every stream**
  (the critical flag — without it a stream's `taskkill /F /IM msedge.exe` murders sibling streams'
  browsers), one stream per account at a time (platform = one session/account), and an auto-scaled
  launch stagger (8s ≤4 streams, 12s ≤8, 15s ≥9) so simultaneous chromium.launch+login stays smooth.
- Concurrency model: A accounts + S specs → up to A specs run at once, the rest queue onto accounts
  as they free up. Options: `--streams N`, `--stagger-ms M`, `--timeout-s S`, `--grep "expr"`.
- Verified 2026-09-08: 4 concurrent streams cost ~1.5GB RAM total (~0.35-0.4GB/stream on top of
  baseline), 0 casualties. Extrapolated ~3.5-4GB for 10 streams — resource-bound by host RAM, not
  the framework. Re-run `--scaling-test --streams 10` on the target host once 10 accounts exist to
  confirm all log in cleanly under concurrent load (the login window is the riskiest moment).

## What this project is

A reusable AI-driven framework (see root `README.md`) for reverse-engineering business rules,
field definitions, validation constraints, and field dependencies from live web applications —
plus a worked example app, `apps/asteron-quote-apply/`, covering the Asteron Life Quote & Apply
insurance form (OutSystems Reactive Web). Output feeds into Atlassian MCP for Confluence/Jira
documentation and OutSystems OutDoc for screen-level documentation (OutDoc handles its own
extraction — do not produce OutSystems-specific output).

## Target application (asteron-quote-apply)

- **Environments (switchable via `BASE_URL`):** QA (current) `https://outsystems-qa.asteronlife.co.nz`;
  dev `https://outsystems-dev.asteronlife.co.nz`. As of 2026-09-07 operations run against **QA**.
  `global-setup.js` derives the login URL from `BASE_URL` (`<BASE_URL>/CentralPortalsLogin/NewLoginRLANZ`)
  and `playwright.edge.config.js` reads `BASE_URL` for `baseURL` — so switching environments is just
  setting `BASE_URL` inline per run (dev is the fallback default only when `BASE_URL` is unset).
  Credentials are per-environment and are NOT stored in the repo (passed inline as
  `ASTERON_LOGIN_EMAIL`/`ASTERON_LOGIN_PASSWORD`; `.auth/` state files are gitignored). QA uses a
  separate set of accounts from dev.
- **Login URL pattern:** `<BASE_URL>/CentralPortalsLogin/NewLoginRLANZ`
- **Post-login destination:** Dashboard at `/AdviserCentral_Uplift/`
- **Form entry point:** Navigate to Quote & Apply → click "New Quote" (opens in new tab)
- **Form URL pattern:** `/QuoteAndApply/Quote?QuoteId=...`
- **Network requirement:** only reachable from a whitelisted IP (see
  `apps/asteron-quote-apply/docs/network-access-issue.md`)

## Saved auth state goes STALE — refresh before probing (learned repeatedly, incl. 2026-09-14)

**Saved `.auth/state-qa-<id>.json` sessions expire (roughly days).** A stale state does NOT error
loudly — the browser just lands on the LOGIN screen. This has bitten twice: after a weekend the
09-09 states were dead on 09-11, and again on 09-14 a probe opened 4 browsers that all sat on the
login page because the saved session had expired.

**Why standalone probes can't recover on their own:** the login flow lives ONLY in
`global-setup.js` (which the Playwright config runs automatically before a test run). A standalone
probe under `probes/` loads `storageState` from the saved `.auth/` file and does NOT log in — so if
that state is stale, the probe has no way to authenticate and every action fails on the login page.

**Rules:**
1. **Before running any standalone probe, refresh the account's auth state first** via global-setup:
   ```
   BASE_URL=<qa> LOGIN_EMAIL=<..> LOGIN_PASSWORD=<..> AUTH_STATE_FILENAME=state-qa-a.json KILL_STRAY_EDGE=true \
     node -e "require('./apps/asteron-quote-apply/global-setup.js')().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})"
   ```
   (It logs in, retries session-conflict with backoff, and writes a fresh `state-qa-a.json`.)
2. **Do NOT burn repeated attempts against a stale session.** If a probe lands on the login page
   (dashboard body empty / URL contains `login` / `openNewQuote` aborts with "did not open a popup
   tab"), STOP — that's a stale-state signal, not an app bug. Refresh the state, then retry once.
3. **A full `run.js test` run does NOT have this problem** — its config runs `global-setup.js`, so it
   always logs in fresh. The stale-state trap is specific to standalone `probes/` scripts that reuse
   saved state.
4. Assume any saved state older than ~a day is stale and refresh it up front rather than testing it.

## Where things live (current structure — see root README.md for the full map)

- `apps/asteron-quote-apply/tests/` — Playwright test suite (ES5-inside-`page.evaluate()`,
  one `test()` per file — see `.kiro/steering/test-expansion-process.md` for why)
- `apps/asteron-quote-apply/probes/` — throwaway/retained investigation scripts specific to
  this app (hardcoded URL/creds/selectors) — run directly with `node`, not via Playwright Test
- `apps/asteron-quote-apply/helpers/` — shared OutSystems interaction patterns
  (`quote-helpers.js`)
- `apps/asteron-quote-apply/docs/business-rules/` — canonical business rules,
  one `page.md` per topic, Rule-ID-prefixed (e.g. `LSC-`, `DC-`, `PREM-`, `ADV-`)
- `apps/asteron-quote-apply/docs/test-documentation/` — one `.md` per test
  file, version-matched (e.g. `disability-covers-formulas-and-caps-v1.spec.js` ↔
  `disability-covers-formulas-and-caps-v1.md` — steering doc note: keep these in
  sync when bumping a version; a version-bump rename is often pure Test Console cache-busting
  with no content change, but still rename the doc immediately, don't let them drift)
- `apps/asteron-quote-apply/docs/user-stories/` — source Jira/Confluence user stories tested in
  **acceptance-criteria mode** (see `.kiro/steering/test-expansion-process.md`)
- `apps/asteron-quote-apply/docs/exhaustive-analysis.md` — full field/boundary/validation map
- `tools/` — the generic, reusable, app-agnostic exploration server + helpers (`server.js`,
  `batch.js`, `cmd.js`, `run.js`) — NOT Asteron-specific, works with any target app (see the
  root README + WRAPPER.md "Quick Start", and `.kiro/steering/how-to-run.md`)
- `sessions/` and `archive/` — **local-only (gitignored, not shipped)**: the builder's dated
  working-session notes and superseded early iterations / legacy scripts. Kept on the builder's
  machine for history; not part of the repo a user clones.

## Completed iterations (historical — see archive/iteration-00N/ for raw evidence)

| Iteration | Date | Coverage |
|-----------|------|----------|
| 001 | 2026-08-04 | Full form — Quote + Apply steps 2–6c (payment gate blocked 6d/6e) |
| 002 | 2026-08-11/12 | Exhaustive business-rules + stress-test pass on the Quote/Illustration step |
| 003 | 2026-08-13 | Gap-closing pass — age-banded limits, dependency/exclusivity rules, multi-tier formulas, cross-field checkbox links, bundling minimums |

These are superseded by the live business-rules docs under
`apps/asteron-quote-apply/docs/business-rules/` — treat the iteration folders
as historical evidence, not the current source of truth.

## Key DOM facts (still current)

- OutSystems DOM label mislabels on disability covers:
  - `Dropdown_WaitingPeriod3` = Waiting Period (DOM label says "Benefit Period")
  - `Dropdown2` within disability covers = Premium Structure (DOM label says "Monthly Benefit")
- Minimum premium: $240/year per life insured — increase Sum Insured if this error appears
- Accordion sections: check `aria-expanded` before clicking; true = already open, do not click again

## Mandatory fields — CHECK THESE FIRST (learned the hard way 2026-09-09)

**A red asterisk `*` next to a field label = MANDATORY.** Before concluding a button "does nothing"
or a flow is "blocked/unreachable", ALWAYS check for unfilled mandatory (asterisked) fields first —
this is step one of form testing, not an afterthought. OutSystems often **fails silently** (no
visible error, or an error you have to scroll to) when a mandatory field is empty, so a
non-progressing button is far more likely a blank required field than a broken/ungated control.

- **"Priced" ≠ "complete for Apply".** The fields needed to generate a PREMIUM are a SUBSET of the
  fields mandatory to APPLY. A quote can price + save with the minimum set but still block Apply on
  other required fields.
- **Confirmed Apply-gate mandatory fields (quote screen, personal covers):** First Name, Last Name,
  **Date of Birth**, Gender, Smoking status, Occupation (name via typeahead) + Occupation Code,
  Employment Status, and **Pre-tax Annual Income** (this last one was the field a 2026-09-09
  investigation missed for hours — Apply silently refused until income was entered). Fill ALL
  asterisked fields, then Apply progresses into the application flow (Duty of Disclosure onward) —
  no `ShowApplyNow` URL trick or landing-list reopen needed.
- When probing/deferring ANY screen: enumerate its `*`-marked fields and fill them all before
  deciding something is unreachable. "It gave no error" usually means "a mandatory field is blank".
- Save (the reference popup) = click the popup's `button.btn-primary` "Save" (fires `ActionSaveQuote`);
  the other "Save" in the DOM is the quote-screen action behind the modal.
