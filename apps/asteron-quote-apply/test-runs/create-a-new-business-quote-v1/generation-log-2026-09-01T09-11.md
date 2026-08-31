# Generation Decision Log — Create a New Business Quote (ACB-2240) → create-a-new-business-quote-v1

- **Started:** 2026-09-01T09:11 (+10:00)
- **Source story:** `apps/asteron-quote-apply/docs/user-stories/User Story- Create a New Business Quote.md` (Jira ACB-2240)
- **Mode:** Acceptance-criteria mode (a written story exists — the story's expected values are the source of truth; a mismatch is a candidate defect, not "not built").
- **Slug:** `create-a-new-business-quote-v1`

This log captures every meaningful decision, why, what was uncertain, selectors discovered
(and dead ends), ACs deferred and why, and ambiguities flagged for author clarification.

---

## Step 0 — Mandatory reading (done)

Read fully before touching anything:
- `TEST-GENERATION-PROCESS.md` (the 7-step procedure).
- `.kiro/steering/test-expansion-process.md` (current version — `report.md`-only convention,
  AC annotation format, parallel describe structure, banned interaction patterns,
  input-correctness checklist, strict-assertion backstop).
- `.kiro/steering/project-context.md` (app URLs, DOM facts).
- Helpers: `quote-helpers.js`, `outsystems-generic-helpers.js` (REUSE — openNewQuote, setAge,
  setGender, setMinimumPersonalDetails, setOccupation, activateCover, coverButtonExists,
  fillCalcMask, sumInsuredInput, clickApply, getVisibleErrors, getTotalYearlyPremium,
  isOnClientSummary, tickCheckboxByLabel, getCheckboxStateByLabel, clickButtonByLabel,
  selectFromTypeahead).
- Template spec `personal-lump-sum-trauma-v1.spec.js` (imports, freshQuote helper, parallel
  describe, AC annotation shape, fingerprint-select pattern for opaque-id controls).
- Business rules: `personal-details/page.md`, `lump-sum-covers/page.md`,
  `disability-covers/page.md`, `kids-cover-and-multi-life/page.md`,
  `policy-structure/page.md`, `premium-and-bundling/page.md`,
  `validation-and-navigation/page.md`.

**Key facts carried forward (sanity-check selectors/values, but assert to the STORY):**
- Personal/Business policy buttons create new independently-numbered policies (`POL-06`).
- Employment Status list: Employed / Self-Employed / Employed by own company / Other (`PD-09`).
- Flexi Rate: N/A default, then 2.5%–30.0% in 2.5% steps, 13 options (`POL-04`).
- Kids Cover: 0–9, SI tier list $50k(Free)–$200k in $10k steps, 16 options (`KID-01`/`KID-07`).
- Combined missing-fields message *"You must complete the following fields - Gender, Age
  Next Birthday & Occupation/Occupation Code"* (`VAL-19`) — base pattern for AC09's mandatory
  check on Age/Gender/Occupation.
- **Known, still-open environment issue** (`validation-and-navigation/page.md` callout):
  Apply does not reliably complete even on a fully-valid config — a transient error flashes
  and clears while the underlying block persists, root cause unconfirmed. Any AC here that
  hinges on "Apply succeeds/fails" is affected by this; flagged per-test where relevant
  rather than silently trusted.

---

## Step 1 — AC extraction to canonical form

Assigned internal IDs with prefix `CNBQ-AC-0NN` (Create New Business Quote) for story ACs,
`CNBQ-BR-00N` for the standalone "Business Rules" table rows not already covered by an AC.

| Internal ID | Source | Intent (short) |
|---|---|---|
| CNBQ-AC-001 | AC01 | Landing page: select agency (adviser may have multiple), click create quote |
| CNBQ-AC-002 | AC02 | New Business Quote Tool: select Personal and/or Business Policy |
| CNBQ-AC-004 | AC04 | New quote UI captures: Personal Details (full field list) + Lump Sum Covers (7 covers + sub-covers) + Disability Covers (3) + Kids Cover |
| CNBQ-AC-005 | AC05 | Entering DOB calculates + displays Age Next Birthday |
| CNBQ-AC-006 | AC06 | Selecting Occupation (type-ahead) prepopulates Occupation Code |
| CNBQ-AC-007 | AC07 | Selecting Occupation Code instead prepopulates the Occupation field |
| CNBQ-AC-008 | AC08 | Employment status list: Employed / Self-Employed / Employed by own company / Other |
| CNBQ-AC-009 | AC09 | Mandatory fields: Age Next Birthday, Gender, Smoker, Occupation-or-Code, Employment Status |
| CNBQ-AC-010 | AC10 | Flexi Rate list 2.5%–30.00%, selectable and saveable |
| CNBQ-AC-011 | AC11 | We Pay Your Premiums: None(default)/30/60/90 days + warning if no lump sum cover selected |
| CNBQ-AC-012 | AC12 | Selecting a cover type → enter Sum Insured; Premium Structure prepopulated, default Stepped |
| CNBQ-AC-013 | AC13 | Add/remove cover type; premium changes reflected in the Progress/Premium panel |
| CNBQ-AC-014 | AC14 | Number of Kids (0–9) → per-kid fields (name, surname, DOB, gender) + SI tier list $50k(default)–$200k |
| CNBQ-AC-015 | AC15 | Per-policy Payment Frequency: Fortnightly/Monthly(default)/Quarterly/Half Yearly/Yearly |
| CNBQ-BR-004 | Business Rule #4 | Can "add life" to the quote/application |
| CNBQ-BR-005 | Business Rule #5 | Can add Business AND Personal policy types simultaneously |
| CNBQ-BR-006 | Business Rule #6 | Each policy can be paid on a different (independent) frequency |

**Parsing judgment calls (logged):**
- AC03 does not exist in the source table (jumps AC02 → AC04) — treated as a numbering gap in
  the story, not a missing requirement; nothing extracted for it.
- AC04's field list is very large (spans Personal Details, all 7 Lump Sum covers with their
  sub-covers, all 3 Disability covers, and Kids Cover). Split into 3 sub-tests by section
  (Personal Details fields / Lump Sum + sub-covers / Disability + Kids Cover) rather than one
  giant test, so a partial failure still localizes to a section — still one internal ID
  (CNBQ-AC-004) with all three sub-tests carrying the same AC annotation.
- AC09 lists "Smoker" as mandatory. Probed live (Step 3): Smoking status is a button-group
  that always has a real, pre-selected default ("No") — there is no reachable "unset" state
  to test blocking against. Flagged as an AC-wording ambiguity (the requirement may mean "a
  value is always present," which the default already satisfies, rather than "must force an
  explicit user choice") rather than encoded as a pass/fail check. Candidate for the AC-wording
  feedback loop (`ROADMAP.md` Phase 2).
- AC09's Employment Status clause overlaps a known nuance: `PD-20`/`personal-details/page.md`
  established Employment Status only blocks Apply once a *Disability* cover is priced without
  it — not unconditionally. AC09 states Employment Status is mandatory without that
  qualification. Encoded as a targeted test (Life-only quote, Employment Status left unset) to
  check whether the story's unconditional reading holds; flagged as possibly ambiguous/
  overly-broad AC wording either way, and the result is also confounded by the known
  Apply-completion issue (see below) — treated as informational rather than a hard pass/fail.

---

## Step 2 — Classification (testable-now / needs-probe / genuinely-blocked)

| Internal ID | Classification | Reason |
|---|---|---|
| CNBQ-AC-001 | **genuinely-blocked (probed)** | Probed the landing page (`/QuoteAndApply/`, the "Quotes and Applications" dashboard) directly. Only UI controls present: a Status filter dropdown and a page-size dropdown (10/20/50/100) — no agency-selection control of any kind. "New Quote" proceeds directly to a blank quote with no agency picker step. This test account is evidently associated with a single agency (or the picker only appears for multi-agency advisers, which this account is not) — the multi-agency selection UI could not be found anywhere reachable. Deferred per the "genuinely-blocked only after a probe proves it" rule. |
| CNBQ-AC-002 | testable-now | Matches `POL-06`. `clickButtonByLabel(page, 'Personal'/'Business')` + check a new policy panel appears. |
| CNBQ-AC-004 | testable-now | Field/button/section presence — all DOM-readable via existing helpers (`coverButtonExists`, direct selector checks). Split into 3 tests per the parsing note above. |
| CNBQ-AC-005 | testable-now | Matches `PD-15`. Reuse the native-value-setter DOB pattern from `personal-details.spec.js`. |
| CNBQ-AC-006 | testable-now | Matches `PD-07`. `setOccupation` (type-ahead) then read Occupation Code's locked value. |
| CNBQ-AC-007 | testable-now (discrepancy found) | Probed live (Step 3): selecting Occupation Code = AA directly leaves the Occupation type-ahead showing "Select..." — it is NOT prepopulated, contradicting the story's explicit requirement. Encoded as a test asserting the story's expected behavior (prepopulated) — currently FAILS. This is a genuine, confirmed discrepancy, not a probe-technique artifact (native `selectOption()` used, no raw `dispatchEvent`). |
| CNBQ-AC-008 | testable-now | Matches `PD-09`. Read the Employment Status select's option list. |
| CNBQ-AC-009 | testable-now (mixed) | (a) Age/Gender/Occupation missing → `VAL-19` combined message: testable-now, high confidence. (b) Employment Status alone missing on a Life-only (non-Disability) quote: testable-now but result is informational given the ambiguity + Apply-completion confound noted in Step 1 — encoded as a real check with the caveat stated in its AC annotation, not silently skipped. (c) Smoker: not encoded as pass/fail per the Step 1 ambiguity note — instead a single assertion confirms the always-present default, with the ambiguity documented in the test comment. |
| CNBQ-AC-010 | testable-now | Matches `POL-04`. Read Flexi Rate select's option list. |
| CNBQ-AC-011 | testable-now | Probed live (Step 3): confirmed exact warning text *"At least one lump sum cover must be selected with We Pay Your Premiums"* appears when a waiting period is selected with zero lump sum covers active. High confidence. |
| CNBQ-AC-012 | testable-now | Matches per-cover `LSC-*` docs. Life used as the representative cover (SI field + Premium Structure default Stepped). |
| CNBQ-AC-013 | testable-now | `activateCover` + `getTotalYearlyPremium` before/after; `removeAllCoverCards` then re-check. |
| CNBQ-AC-014 | testable-now | Probed live (Step 3): confirmed default SI tier is exactly "$50,000 (Free)", full 16-option list $50k–$200k in $10k steps — matches the story exactly. High confidence. |
| CNBQ-AC-015 | testable-now | Probed live (Step 3): confirmed Payment Frequency default is "Monthly", full 5-option list exactly `[Fortnightly, Monthly, Quarterly, Half Yearly, Yearly]` matches the story. |
| CNBQ-BR-004 | testable-now | Matches `POL-11`. `clickButtonByLabel(page, 'Add life')`, check "Life 2" tab appears. |
| CNBQ-BR-005 | testable-now | Matches `POL-06`/`POL-07`. Add Personal then Business on the same quote, confirm both policy panels coexist. |
| CNBQ-BR-006 | testable-now | Probed live (Step 3): confirmed 2 independent Payment Frequency `<select>` elements exist once both a Personal and a Business policy are active (each defaulting to Monthly). Test additionally verifies changing one does NOT change the other (the probe only confirmed presence, not independence under mutation — that's asserted fresh in the real test). |

Nothing silently dropped. Only CNBQ-AC-001 is genuinely-blocked, and only after a live probe
confirmed no reachable agency-selection UI exists.

---

## Step 3 — Probe results (full detail)

Probe script: `apps/asteron-quote-apply/probes/probe-create-new-business-quote-recon.js`
(kept, not deleted, per the probe-retention convention). Live run, 2026-09-01, account
`hanno.coetzee+1123@resolutionlife.com.au`.

1. **AC01** — landing page body text dump confirms no agency picker; only Status/page-size
   filters exist. See classification above.
2. **AC07 reverse** — `Occupation code` set to `AA` via native `selectOption`; Occupation
   type-ahead combobox/display text remained `"Select..."` (not prepopulated). Confirmed
   discrepancy.
3. **AC09/Smoker** — button-group state read immediately after opening a fresh quote, before
   any interaction with it: `[{"text":"Yes","selected":false},{"text":"No","selected":true}]`
   — "No" is already selected by default. Apply with this untouched default + Life $200k
   produced no visible error (though see the Apply-completion caveat — "no visible error" is
   not proof of a true success given the known issue).
4. **AC11** — confirmed exact message match, see classification above.
5. **AC14** — confirmed exact default + option list, see classification above.
6. **AC15** — confirmed exact default + option list, see classification above.
7. **BR-006** — confirmed 2 independent Payment Frequency selects appear (Personal 1 +
   Business 1), both showing "Monthly".

---

## Step 4 onward

See the generated spec `apps/asteron-quote-apply/tests/quote-screen/create-a-new-business-quote-v1.spec.js`,
its test-documentation matrix, and the auto-generated `report.md` for this run (Steps 4-7).

---

## Step 3 addendum — AC09a input-correctness check

Per the "input-correctness checklist" (`TEST-GENERATION-PROCESS.md` Step 4), verified live
before finalizing AC09a: does clicking "Life" on a COMPLETELY untouched fresh quote (no
Age/Gender/Occupation set at all) actually register, or does it silently no-op (an earlier
project note warned "an entirely empty form silently ignores clicks")? Result: the click DID
register (Sum Insured field appeared) — but clicking Apply with the Sum Insured left at $0
surfaced only the min-premium error (`$240.00 per year per Life insured`), NOT the combined
missing-fields message — a different rule (min-premium) fired first, exactly the class of
risk Step 4's checklist warns about. AC09a's actual test therefore explicitly fills a real
Sum Insured ($200,000) before clicking Apply, so the min-premium rule can't mask the
mandatory-fields check. (One-off verification script, not retained separately — its finding
is fully captured here and folded directly into AC09a's design.)
