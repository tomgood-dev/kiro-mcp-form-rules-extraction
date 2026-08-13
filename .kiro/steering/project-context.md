# Project Context

## What this project is

Automated extraction of business rules, field definitions, validation constraints,
and field dependencies from the Asteron Life Quote & Apply insurance form.
The form is built in OutSystems (React). Output feeds into Atlassian MCP for
Confluence/Jira documentation and OutSystems OutDoc for screen-level documentation
(OutDoc handles its own extraction — do not produce OutSystems-specific output).

## Target application

- **Login URL:** https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ
- **Post-login destination:** Dashboard at `/AdviserCentral_Uplift/`
- **Form entry point:** Navigate to Quote & Apply → click "New Quote" (opens in new tab)
- **Form URL pattern:** `/QuoteAndApply/Quote?QuoteId=...`

## Iteration 002 follow-up — COMPLETE (2026-08-12)

All open items from `HANDOFF_TO_KIRO_CLI.md` §4 have been resolved via `server.js` from the Amazon Workspace. Key findings appended to `output/iteration-002/scratch-notes.md`. Summary of resolutions:

1. **Major Trauma ≥$25k formula**: When TRC ≥ $25,000, no percentage cap — only the global $2M combined limit (TRC + Major Trauma + Cancer). Below $25k: 300% × TRC.
2. **Save/Save as New/Close/View PDF**: Save shows optional reference modal then persists. Close returns to list.
3. **Business Expenses**: Flat $16,666/month cap, available for AM/AA/A1/A2/B/C, blocked for S/U.
4. **Farmers Disability**: Flat $10,000/month cap, only B/C occupation + self-employed.
5. **Phantom Lump Sum covers**: Don't vanish — produce $240 minimum premium error.
6. **Duplicate covers**: NO-OP — one instance per cover type per policy.
7. **Add Life minimum**: Unconditional — no validation required.
8. **Specific Injury**: No companion cover requirement. Fixed-tier dropdown ($50K steps).
9. **Fortnightly**: Yearly ÷ 26 with per-payment rounding.
10. **Needlestick**: AA-only — removed from DOM for all other occupation codes.

## Automated regression tests for the business rules

`tests/` is a proper `@playwright/test` suite (not the ad-hoc `server.js`/`explore-form.js`
scripts) verifying the Quote screen rules in `output/confluence-pages/business-rules/quote-screen/*`.
51 tests across 7 files, one per business-rules page, test titles cite Rule IDs. See
`tests/README.md` for setup/running instructions and — importantly — the "PROBE tests"
section: two tests deliberately don't assert a pinned answer yet because the source docs
themselves flag those exact behaviors as an unresolved discrepancy between two testing
sessions (multi-policy mechanism, Add-Life minimum bar). **This suite has not yet been run
against the live app** (written from a machine without network access to
`outsystems-dev.asteronlife.co.nz`) — `npx playwright test --list` confirms it all parses,
but expect a first-pass fixup round against the real running app.

## Confluence-ready business rules (BA/Dev reference)

`output/confluence-pages/business-rules/` contains the full business-rules documentation restructured as a hub-and-child page tree, ready to paste/import into Confluence (folder nesting = intended parent/child page nesting; each `page.md` = one Confluence page). Every discrete rule carries a stable Rule ID (e.g. `LSC-17`, `DC-21`) for citing in tickets/tests. Start at `output/confluence-pages/business-rules/page.md` — it indexes every child page and lists open discrepancies between the two testing sessions that still need re-verification (multi-policy mechanism, Business policy's 4th Lump Sum cover, and the Add-Life minimum-bar gate). The Quote Screen section is exhaustively stress-tested; the Apply Flow section is a lighter single-pass port of iteration-001 and is flagged as such.

## Interaction patterns and automation guide

All interaction patterns, element-type rules, section-by-section gotchas, and server.js
action reference are documented in:

  `.kiro/steering/form-automation-playbook.md`

Read that file before starting any automation session.

## Completed iterations

| Iteration | Date | Coverage | Folder |
|-----------|------|----------|--------|
| 001 | 2026-08-04 | Full form — Quote + Apply steps 2–6c (payment gate blocks 6d/6e) | `output/iteration-001/` |
| 002 | 2026-08-11/12 | Exhaustive business-rules + stress-test pass on the Quote/Illustration step. ALL open items resolved (Major Trauma formula, footer buttons, occupation gates, cover dependencies, payment frequency). See `quote-screen-business-rules.md` + `scratch-notes.md` + individual test files. | `output/iteration-002/` |

QuoteId (iteration-001): `57d0a8ac-e396-4261-85de-4738503b2f0c`  
ApplicationId (iteration-001): `8103d198-8e5c-406a-882c-b3fd7061f775`

## Key DOM facts

- OutSystems DOM label mislabels on disability covers:
  - `Dropdown_WaitingPeriod3` = Waiting Period (DOM label says "Benefit Period")
  - `Dropdown2` within disability covers = Premium Structure (DOM label says "Monthly Benefit")
- Minimum premium: $240/year per life insured — increase Sum Insured if this error appears
- Accordion sections: check `aria-expanded` before clicking; true = already open, do not click again
