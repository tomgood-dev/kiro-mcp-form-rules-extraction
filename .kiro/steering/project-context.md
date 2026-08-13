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

All open items from the (now-superseded) iteration-002 `HANDOFF_TO_KIRO_CLI.md` §4 have been resolved via `server.js` from the Amazon Workspace. Key findings appended to `output/archive/iteration-002/scratch-notes.md`. Summary of resolutions:

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

## Iteration 003 — gap-closing pass (COMPLETED 2026-08-13)

Resolved all items from `HANDOFF_TO_KIRO_CLI.md` §1–§10. Key findings by section:

**§1 — Specific Injury field type**: calc-mask input (NOT fixed-tier dropdown). Same widget as Life/TPD/Trauma with 8 Premium Structure options.

**§10 — 4 open discrepancies resolved**:
1. Personal/Business = add-policy action (supports multiple concurrent policies)
2. Business 4th Lump Sum = Specific Injury (not Cancer)
3. Cover-menu split driven by policy type, not occupation code
4. Add Life IS blocked when current life incomplete (modal error)

**§2 — Age banding**: Life max $50k for ANB<17, TPD max $250k (Modified only) for 17-21, max ages confirmed (Acd Death 70, Needlestick 65, Specific Injury 61). Premium Structure dropdown has NO client-side filtering.

**§3 — Dependencies**: Specific Injury requires companion cover. Needlestick requires companion (narrower list). Kids Cover requires ≥1 Personal Insurance Cover.

**§4 — Duplicates**: Life allows 2+ instances (2nd defaults Level 50). 3rd blocked until 2nd has SI.

**§5 — Exclusivity**: Business Disability + Farmers Disability mutually exclusive. NO cross-policy exclusions.

**§6 — Formulas**: IP tiered 75%/$320k + 50%/$320-560k, cap $30k/mo. Workability min($10k, 75%×income÷12). M&L min($7,500, 45%×income÷12).

**§7 — Checkboxes**: Increasing Claim independent of Inflation Adjustment. Mental Health disabled at BP=2yr. Ten-Hour auto-checks for Self-Employed (M&L only).

**§8 — Kids**: Single aggregated premium line. SI options $50k(Free) to $200k in $10k steps.

**§9 — Bundling minimums**: Life/TPD min $100k, Trauma ~$25k, M&L $500-$1000/mo.

Raw test evidence: `output/iteration-003-*.md` (5 files).
(only network-whitelisted environment for `outsystems-dev.asteronlife.co.nz`).

## Spreadsheet (.ods/.xlsx) version of the business rules

`output/spreadsheet-business-rules/` — same rule catalog as the Confluence pages, reshaped
into the spreadsheet format the business actually works in (one sheet per category,
consistent 5-column layout: Rule ID | Category | Rule Summary | Detail | Status). Built
with SheetJS (`xlsx` package, installed via `npm install xlsx --no-save` — not a tracked
project dependency, install it again if `build.js` needs re-running). `data.js` holds the
transcribed rows; `build.js` generates both `Asteron-Connect-Quote-Screen-Business-Rules.xlsx`
and the equivalent `.ods`, and re-reads them back to verify row counts. Includes its own
`Known_Discrepancies` sheet mirroring the Confluence hub page's discrepancy list. Update
`data.js` and re-run `node output/spreadsheet-business-rules/build.js` whenever a rule
changes — don't hand-edit the generated `.xlsx`/`.ods` directly, they'll drift from `data.js`.

Note: the user separately supplied `Current Rules Asteron Connect v0.1.ods` (their own
Downloads folder) — an incomplete BA draft in a similar sheet-per-category style, used only
as a format reference. It contains several rules that conflict with what we tested (e.g.
Specific Injury's companion-cover requirement, whether duplicate top-level covers are
allowed, how bundling-discount categories are counted) — reconciling that draft against our
tested rules is a distinct, not-yet-started task if the user asks for it later.

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
| 001 | 2026-08-04 | Full form — Quote + Apply steps 2–6c (payment gate blocks 6d/6e) | `output/archive/iteration-001/` |
| 002 | 2026-08-11/12 | Exhaustive business-rules + stress-test pass on the Quote/Illustration step. ALL open items resolved (Major Trauma formula, footer buttons, occupation gates, cover dependencies, payment frequency). See `quote-screen-business-rules.md` + `scratch-notes.md` + individual test files. | `output/archive/iteration-002/` |
| 003 | 2026-08-13 | Gap-closing pass COMPLETE — age-banded limits, dependency/exclusivity rules, multi-tier formulas, cross-field checkbox links, bundling minimums, 4 discrepancies resolved. | `output/iteration-003-*.md` |

QuoteId (iteration-001): `57d0a8ac-e396-4261-85de-4738503b2f0c`  
ApplicationId (iteration-001): `8103d198-8e5c-406a-882c-b3fd7061f775`

## Key DOM facts

- OutSystems DOM label mislabels on disability covers:
  - `Dropdown_WaitingPeriod3` = Waiting Period (DOM label says "Benefit Period")
  - `Dropdown2` within disability covers = Premium Structure (DOM label says "Monthly Benefit")
- Minimum premium: $240/year per life insured — increase Sum Insured if this error appears
- Accordion sections: check `aria-expanded` before clicking; true = already open, do not click again
