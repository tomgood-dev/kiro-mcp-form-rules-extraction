# Occupational Codes — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/occupational-codes-v1.spec.js`
- **Last run:** 2026-09-07 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~13 min · 8 tests
- **Source:** Acceptance-criteria mode — Jira ACB-6504 (`docs/user-stories/User Story - Occupational Codes.md`)
- **Result:** 5/8 passing, 1 confirmed-failing (AC11 discrepancy), 2 deferred

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01/02/03/04 | Occupation typeahead + Code dropdown present; code list = documented risk classes | New quote; read controls | Typeahead present; codes AM/AA/A1/A2/B/C/S/U/IC | ✅ Pass | Value-level: exact code list |
| 2 | AC05 | Life quote on code-only (no occupation name) succeeds | Code = AA, Life $200k, Apply | No occupation-required blocking error | ✅ Pass | |
| 3 | AC08 | TPD + occupation code U → not eligible | Code = U, TPD $200k, Apply | "This occupation is not eligible" | ✅ Pass | Negative path |
| 4 | AC11 | TPD + code IC → Individual-Consideration message | Code = IC, TPD $200k, Apply | "…requires Individual Consideration" | ❌ Fail | App returns "requiRED" (past-tense typo) for TPD; Life says "requires". Expected-fail vs story wording until fixed |
| 5 | AC31 | TPD missing Gender/ANB/Occupation → combined error | TPD $200k, no personal details, Apply | "…complete the following fields - Gender, Age Next Birthday & Occupation" | ✅ Pass | Negative/absence path |
| 6 | AC12 | Life + code IC → Individual-Consideration message | Code = IC, Life $200k, Apply | "…requires Individual Consideration" | ✅ Pass | Confirms Life message is correct ("requires") |
| 7 | AC06/07/13-26/33-38 + AC09/10 | Named-occupation & backend-mapping eligibility rules | — | — | 🚫 Deferred | Require selecting a NAMED occupation via the typeahead or a loading %/L400 backend read (see Deferred) |
| 8 | AC27/28/29 | Occupation-code-change premium-change warning popup (Yes/No) | — | — | 🚫 Deferred | Needs two named occupations with a premium-affecting code delta (see Deferred) |

## Deferred

| AC(s) | Reason |
|---|---|
| AC06, AC07 | Occupation-loading premium VALUE (AC06) and L400 code submission (AC07) are pricing-engine / backend outputs, not asserted from the quote screen. |
| AC13–AC26, AC33–AC38, AC09/AC10 | The M/A/S/IP-code and named-occupation eligibility variants require SELECTING A SPECIFIC NAMED occupation (e.g. Personal Trainer, Sharemilker, Home Duties) from the typeahead rather than a bare single-letter risk-class code. The Code dropdown drives the U and IC branches (encoded as AC08/AC11/AC12); the name-specific branches need a names→codes reference to derive expected values. Encode in a focused named-occupation follow-up. |
| AC27/AC28/AC29 | The premium-change warning popup is triggered by selecting an occupation NAME whose code differs from a previously code-only-priced cover; reliably triggering it needs two named occupations with a known premium-affecting code delta. |

## Discrepancies (confirmed, expected-fail)

| AC | Was (story) | Now (QA app) |
|---|---|---|
| AC11 | "Please contact underwriting as this Occupation **requires** Individual Consideration" (TPD + IC) | App returns "…this Occupation **required** Individual Consideration" — past-tense "required" typo for the TPD message. The Life + IC message (AC12) correctly reads "requires", so the two IC messages are inconsistent. Assertion written to the story's "requires"; fails until the TPD message is corrected. |
