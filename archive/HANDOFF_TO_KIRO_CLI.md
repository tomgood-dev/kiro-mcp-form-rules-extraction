# Handoff: Iteration 003 — Gap-Closing Pass (Kiro CLI, Amazon Workspace)

**Why this file exists:** All prior work (iterations 001–002) was done from a machine with no
network path to `outsystems-dev.asteronlife.co.nz`. Only the Amazon Workspace is
network-whitelisted to reach the dev environment, so **all further live testing must happen
from there via Kiro CLI.**

**Why this pass exists:** A Business Analyst's own draft rules spreadsheet
(`Current Rules Asteron Connect v0.1.ods`, incomplete, format-reference only — not more
authoritative than our tested findings) surfaced a batch of business rules we never tested
or even knew existed. This file is the full worklist for closing those gaps. It supersedes
the old iteration-002 handoff, which is fully resolved (see
`.kiro/steering/project-context.md` → "Iteration 002 follow-up — COMPLETE").

**Ground rule for this pass:** don't just append caveats to existing rules — where a
"confirmed" rule turns out to be only partially correct (e.g. a formula we validated at one
data point that turns out to be tiered), **replace it** with the full, correct rule, and note
in the rule's own text what data point(s) back it up. If you find yet another contradiction
while testing (an app behavior that disagrees with what's written up), document it as a new
row in the `Known_Discrepancies` sheet / discrepancy list — don't silently overwrite a
disagreement, flag it the same way the existing 4 are flagged.

---

## 0. Environment setup checklist

1. Confirm you can reach `https://outsystems-dev.asteronlife.co.nz` from the Workspace.
2. `npm install` (installs `@playwright/test`, `marked`). Run `npx playwright install chromium`
   if browsers aren't already present.
3. Copy `.env.example` → `.env`, fill in `ASTERON_LOGIN_EMAIL` / `ASTERON_LOGIN_PASSWORD`. Ask
   the user if you don't have these — don't guess or reuse credentials found elsewhere.
4. Read `.kiro/steering/form-automation-playbook.md` (low-level DOM/interaction mechanics —
   calc-mask fields, click techniques) and
   `output/confluence-pages/business-rules/technical-automation-appendix/page.md`
   (higher-level gotchas: the disability-cover focus+blur "commitment" trap, Apply's silent
   same-URL navigation to Client Summary, the multi-policy Personal/Business mechanism). Both
   documents together are the full automation knowledge base — don't skip either.
5. Use **`server.js`** (interactive HTTP command server, see playbook §2) for this pass, not
   the blind `explore-form.js` sweep. Every item below is deliberate, single-variable probing —
   exactly what `server.js` is for. `cmd.js` / `batch.js` / `run.js` are the small helper
   scripts for driving it from a shell.

---

## 1. Resolve first: an internal inconsistency in our own docs

Our documentation currently contradicts itself on **Specific Injury's Sum Insured field
type**: an early manual-testing note describes it as a free-text calc-mask field capped at
$5,000; a later automated pass (`cover-dependency-tests.md`) describes it as a fixed-tier
`<select>` dropdown offering $0–$500,000 in $50,000 steps (i.e. the same widget as
Needlestick). These can't both be true. Resolve which one the live app actually shows before
relying on either — this affects `LSC-32`/`LSC-34` and the companion-cover minimum in §3 below.

---

## 2. Age-banding — re-test everything at more than one age

Every existing test used **age 35**, which sits in the "22+" adult band for every cover that
has one. None of the younger bands have ever been exercised. Re-test each of the following at
a younger age (pick one value inside each band, e.g. ANB 20 and ANB 15) and update the
relevant Rule ID with the full banded table, not just the adult-band figure:

- **Life** (`LSC-` pages): $50,000 max for ANB 11–16; $250,000 combined-SI cap for ANB 17–21
  if not working, $500,000 if part-time working.
- **TPD** (`LSC-10`): $250,000 combined cap for ANB 17–21 (vs. the confirmed $5,000,000 for
  22+). Also confirm the TPD Definition restriction — ANB 17–21 may be locked to "Modified"
  only, vs. the default "Own" we always tested.
- **Trauma/Cancer combined** (`LSC-17`): $250,000 cap for ANB 17–21 (vs. confirmed $2,000,000
  for 22+).
- **Premium Structure age windows**: each "Level to N" option has its own eligibility window
  (Level 50: ANB 17–45, Level 60: 17–55, Level 65: 17–60, Level 70: 17–65, Level 75/80: 17–70,
  Level 100: 17–75; Stepped: 11–75). Test selecting a Level option paired with an age right at
  or past its window edge — does the app block it, or silently allow it?
- **Maximum ages never tested at all**: Accidental Death (70), Needlestick (65), Specific
  Injury (61), Mortgage & Living (61), Income Protection (61), Workability (61), Business
  Disability/Farmers Disability (61). Confirm each by setting age right at and just past the
  boundary.

---

## 3. Dependency / companion-cover rules

- **Specific Injury**: contrary to our current `LSC-32` writeup ("no companion cover
  required"), it may require ≥1 of: Life ≥$100k, TPD ≥$100k, Trauma/Cancer ≥$25k, or any
  Disability cover ≥$1,000/month. Test activating Specific Injury completely alone on a policy
  with nothing else configured — does Apply block it? Also test a minimum SI of $500 (never
  tried — we only ever tested the $5,000 max boundary).
- **Needlestick standalone**: never tested. Try activating Needlestick with zero other covers
  selected — confirm whether it's blocked standalone and only unlocks alongside Life, Trauma,
  Cancer, TPD, or Income Protection.
- **Kids Cover prerequisite**: test adding Kids Cover with *no* Lump Sum cover active on the
  policy at all. Every existing Kids Cover test skips straight to Number of Kids — if a
  prerequisite is enforced, our existing `KID-*` tests may be running in a state the app
  doesn't actually consider valid.

---

## 4. Cover-count / duplicate-cover rules — directly conflicts with `LSC-39`

`LSC-39` currently says re-clicking "Life" is a no-op (one instance per type per policy). Our
one test for this clicked "Life" a second time while the *first* instance was still incomplete
(no Sum Insured entered yet) — that may not be representative. Re-test properly:

1. Fully price a Life cover (enter a valid Sum Insured, let it commit) — *then* click "Life"
   again. Does a second instance appear, does it error, or is it still a no-op?
2. Repeat for **TPD, Trauma, and Cancer** specifically — try for up to 3 instances of each,
   since each is documented elsewhere as supporting multiple instances with prescribed default
   Premium Structures per instance (1st Stepped, 2nd Level 65, 3rd Level 70).
3. Repeat for **Business Life Cover** (also documented as capped at 3 instances).

---

## 5. Cross-cover exclusivity — never mapped

- Business Disability and Farmers Disability: confirm they **cannot** be held together on the
  same policy (`DC-06`/`DC-44` only ever tested one at a time).
- Workability: confirm it's also blocked alongside Business Disability, Farmers Disability,
  and Business Expenses (we only confirmed the Personal-side exclusions — M&L, Income
  Protection).
- Business Expenses: confirm the reverse exclusion against Workability.
- Business Disability "Equity Owner (>75%)" classification: confirm it restricts Benefit
  Period to 6/9/12 months only (blocking 18/24) — we only ever tested the default "Employed"
  classification.

---

## 6. Formulas we only validated at one data point

- **Income Protection** (`DC-21`): re-test at an income **above $320,000** and again **above
  $560,000** to confirm the 3-tier progressive formula (75% up to $320k, +50% of the excess to
  $560k, +20% beyond that), plus the $30,000/month product cap and its $50,000 carve-out when
  Benefit Period = 2 Years. Our current $150,000-income test only ever touched tier 1.
- **Workability**: re-test at an income **high enough that 75%×income/12 exceeds $10,000/month**
  (roughly income > $160,000) to confirm whether the real formula is `min($10,000, 75% × income
  ÷ 12)` rather than the pure-75% figure currently documented. Also test its Business-side
  exclusions (§5).
- **Mortgage & Living**: test the "Agreed Value" basis (currently untested — we only tested
  "Agreed Value Plus"), and push either basis's income high enough to hit the shared
  $7,500/month absolute cap (our $150,000-income test never got close). Also test the "Monthly
  Mortgage" cover-type path (115% of mortgage repayments) if a separate input field exists for
  it, and test adding a second M&L cover to confirm both must share the same calculation method.

---

## 7. Cross-field checkbox behavior — never suspected, never tested

- **Increasing Claim → Inflation Adjustment dependency**: on Mortgage & Living and Income
  Protection, confirm selecting Increasing Claim forces Inflation Adjustment on too.
- **Mental Health Discount linking**: confirm it's disabled when Benefit Period = 2 Years, and
  that on M&L it's *linked* to the paired IP cover (toggling it on one toggles the other for
  the same life).
- **Ten-Hour Benefit auto-behavior**: confirm it auto-ticks for Self-Employed, and is
  hard-disabled (not just unticked) for Home Duties / House Wife / House Husband / Homemaker /
  Domestic Duties occupations — re-enabling if occupation changes away from that list.
- **Specific Injury Support Benefit cross-exclusion**: confirm this M&L/IP checkbox can't
  coexist with a standalone Specific Injury Lump Sum cover for the same life.

---

## 8. Kids Cover aggregation behavior — only ever tested with 1 kid

- Add 2+ children where more than one is over the cover's age-out threshold — confirm they
  collapse into a **single** aggregated validation error, not one per child.
- Add 2+ children in a paid tier — confirm the premium shows as a **single** aggregated line,
  not itemized per child.

---

## 9. Bundling discount category minimums — mechanism never actually exercised

Every existing bundling test used values comfortably above each category's minimum ($200k
Life, $200k TPD, $100k Trauma). None of them ever tested a cover *below* its category
threshold. Test a low-value cover in each category (e.g. Life at $10,000, well under the
$100,000 minimum) and confirm it does **not** count toward the bundling category tally. Also
confirm Kids Cover premiums are excluded from the bundling discount base (never tested).

---

## 10. Pre-existing open discrepancies (still unresolved, not new to this pass)

These are already flagged in `output/confluence-pages/business-rules/page.md` — re-verify
while you're in there and close them out:

1. Multi-policy mechanism — is "Personal"/"Business" a two-state toggle, or an add-policy
   action supporting several concurrent policies per life? (`POL-05`–`POL-09`, PROBE test in
   `tests/quote-screen/policy-structure.spec.js`)
2. Business policy's 4th Lump Sum cover — Session 1 says Specific Injury, Session 2 says
   Cancer. (`LSC-01`)
3. Does the Business/Personal cover-menu split correlate with policy type or with Occupation
   Code (AA vs. everything else)? Needs a clean test holding one variable constant while
   varying the other. (`POL-10`, `LSC-13`)
4. Does switching Life tabs require the current life to meet a minimum bar, or is only *adding*
   a new life unconditional? (`POL-12`, same PROBE file)

---

## 11. Where to write results

- **Confluence pages** (`output/confluence-pages/business-rules/quote-screen/*/page.md`) — the
  canonical rule text. Update the specific Rule ID's row/section directly; add new Rule IDs for
  genuinely new rules (age bands, cross-field checkbox links, etc.) following the existing
  `<PREFIX>-NN` convention per page.
- **Spreadsheet** (`output/spreadsheet-business-rules/data.js`) — mirror every change made to
  the Confluence pages here too (same Rule ID, same content, reshaped to the 5-column
  Rule ID / Category / Rule Summary / Detail / Status format). Then run
  `node output/spreadsheet-business-rules/build.js` to regenerate the `.xlsx`/`.ods` — never
  hand-edit the generated files directly.
- **Known discrepancies** — if you find a new one (existing doc vs. what the live app actually
  does), add it to both `page.md`'s discrepancy table and `data.js`'s `KNOWN_DISCREPANCIES`.
- **Playwright tests** (`tests/quote-screen/*.spec.js`) — once a rule above is confirmed,
  update or add the matching test (cite the Rule ID in the test title, same convention as the
  rest of the suite). This suite has still never been run end-to-end against the live app —
  expect a first-pass fixup round on selectors before anything is reliably green. Retire the
  two existing PROBE tests into pinned assertions once §10 items 1–2 are resolved.
- **`.kiro/steering/project-context.md`** — add an "Iteration 003" row to the iteration table
  once this pass is done, same style as iterations 001/002.

## 12. Housekeeping

- Raw working notes from prior iterations now live under `output/archive/` (`iteration-001/`,
  `iteration-002/`, `sessions/`) — historical evidence only, not the canonical source. The
  canonical rule text is the Confluence pages + spreadsheet described above.
- This file can be deleted (or replaced by the next iteration's handoff) once its checklist is
  fully absorbed into the main documentation.
