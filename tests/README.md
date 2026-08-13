# Playwright test suite — Quote screen business rules

Verifies the rules documented in `output/confluence-pages/business-rules/quote-screen/*`.
Every test title cites the Rule ID(s) it checks (e.g. `LSC-17`) — cross-reference the
business-rules page for the full rationale and exact error text.

## Setup

1. `npm install` (already done if you're reading this from the repo).
2. Copy `.env.example` to `.env` and fill in `ASTERON_LOGIN_EMAIL` / `ASTERON_LOGIN_PASSWORD`.
3. Confirm you can actually reach `outsystems-dev.asteronlife.co.nz` from this machine/network — these tests hit the real dev environment, there's no mock.

## Running

```
npx playwright test                    # headless, all files
HEADLESS=false npx playwright test     # watch it run
npx playwright test tests/quote-screen/lump-sum-covers.spec.js
npx playwright test -g "LSC-17"        # run by title/Rule ID substring
npx playwright test --list             # sanity-check config/imports without touching the network
npx playwright show-report             # open the HTML report from the last run
```

`playwright.config.js` runs a `globalSetup` that logs in once and saves the session to
`tests/.auth/state.json` (gitignored — never commit it, it's a live session). Every test
then reuses that session and only needs to create its own fresh quote.

**Not yet run against the live app** — this suite was written from a machine without
network access to the dev environment. `--list` confirms everything parses and imports
correctly (51 tests across 7 files), but no test has been executed end-to-end yet.
Expect to spend a first pass fixing minor selector drift (dynamic IDs, exact wording)
against the real running app before trusting green results.

## Structure

| File | Rule ID prefix |
|---|---|
| `quote-screen/personal-details.spec.js` | `PD-` |
| `quote-screen/policy-structure.spec.js` | `POL-` |
| `quote-screen/lump-sum-covers.spec.js` | `LSC-` |
| `quote-screen/disability-covers.spec.js` | `DC-` |
| `quote-screen/kids-cover.spec.js` | `KID-` |
| `quote-screen/premium-and-bundling.spec.js` | `PREM-` |
| `quote-screen/validation-and-navigation.spec.js` | `VAL-` |

`helpers/quote-helpers.js` has every reusable interaction: `openNewQuote`, `fillCalcMask`
(the backspace-then-digit-by-digit technique — never use a plain `.fill()` on a Sum
Insured/Monthly Benefit field), `commitWithoutTyping` (the focus+blur trick that "commits"
a Disability cover so it actually counts), `activateCover`, `clickApply`, error/premium/
bundling readers, etc. Add new interactions here rather than duplicating logic in a spec file.

## PROBE tests — read before trusting these

Two scenarios in `policy-structure.spec.js` are written as **probes**, not pinned
assertions, because the source business-rules documentation itself flags an unresolved
discrepancy between two earlier manual-testing sessions:

- Is "Personal"/"Business" an add-a-new-policy action (supports several concurrent
  policies per life) or a simple two-state toggle? (`POL-06` through `POL-10`)
- Does "Add life" require the current life to meet a minimum bar, or does it work
  unconditionally? (`POL-12`)

These tests log what they observe (`console.log`) and only assert something loose enough
to pass either way. **Run them, read the console output, update
`output/confluence-pages/business-rules/quote-screen/policy-structure/page.md` with the
confirmed answer, and then tighten these two tests into real pinned assertions.** Don't
leave them as permanent probes.

## Coverage decisions — what's deliberately NOT a dedicated test

To keep this suite a reasonable size, purely descriptive rules (a field's type, its
option list, its default value) generally only get a test where the option list itself
*is* the interesting behavior (e.g. `LSC-29` Needlestick's fixed-tier dropdown, `KID-07`'s
Kids Cover tiers). Rules about numeric limits, formulas, dependencies, error text, and
cross-field effects — the things a code change is actually likely to silently break — are
covered directly. If you need stricter coverage of every single field/option documented
on a business-rules page, treat this suite as the starting skeleton, not the ceiling.

Explicitly out of scope for this pass (not covered at all yet):
- Save / Save as New / Close / View PDF footer buttons (behavior wasn't stress-tested
  in the source documentation either — see the Apply Flow section's confidence note)
- Business-only Lump Sum cover menu (`LSC-01b` — itself an open discrepancy)
- Occupation-code-by-occupation-code exhaustive sweep of every gating rule (a handful of
  representative codes are tested per cover, not the full AM/AA/A1/A2/B/C/S/U/IC matrix)
- The Apply Flow (Client Details, Duty of Disclosure, Personal Statement, etc.) — this
  suite is Quote screen only; that section of the business rules was a lighter single-pass
  port to begin with and would need its own equivalent testing pass first
