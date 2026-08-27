# Project Context

## What this project is

A reusable AI-driven framework (see root `README.md`) for reverse-engineering business rules,
field definitions, validation constraints, and field dependencies from live web applications —
plus a worked example app, `apps/asteron-quote-apply/`, covering the Asteron Life Quote & Apply
insurance form (OutSystems Reactive Web). Output feeds into Atlassian MCP for Confluence/Jira
documentation and OutSystems OutDoc for screen-level documentation (OutDoc handles its own
extraction — do not produce OutSystems-specific output).

## Target application (asteron-quote-apply)

- **Login URL:** https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ
- **Post-login destination:** Dashboard at `/AdviserCentral_Uplift/`
- **Form entry point:** Navigate to Quote & Apply → click "New Quote" (opens in new tab)
- **Form URL pattern:** `/QuoteAndApply/Quote?QuoteId=...`
- **Network requirement:** only reachable from a whitelisted IP (see
  `apps/asteron-quote-apply/docs/network-access-issue.md`)

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
  `batch.js`, `cmd.js`, `run.js`) — NOT Asteron-specific, works with any target app per root
  README's "Add Your App" section
- `sessions/` — dated working-session notes (chronological, all in one place)
- `archive/` — superseded material: `iteration-001/`, `iteration-002/`, `iteration-003/` (early
  exploration passes, now superseded by the business-rules docs above),
  `legacy-scripts/` (pre-`tools/`-framework one-off exploration scripts), `sessions/` merged
  into root `sessions/`

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
