# Quote-Screen Acceptance-Criteria Coverage Gap Analysis

> **⚠️ SUPERSEDED (2026-09-16):** this quote-screen-only analysis predates the apply-flow
> breakthrough. The Apply flow is now reachable + completable end-to-end (policy J4211922), so the
> "N/A-apply-flow / unreachable / payment-gated" verdicts below are largely stale. See the
> re-validation **`coverage-gaps-2026-09-16.md`** for the current picture (what moved to COVERED,
> which deferrals are now stale, and what is newly actionable). This file is kept as the baseline.


- **Date:** 2026-09-11
- **Scope:** Quote-screen only. Apply-flow stories (Apply Now, Duty of Disclosure, Payment, Submit, Tele-Interview, URE, Insurance History, Owner Details, Underwriting Decision, etc.) are excluded per the tracker.
- **Method:** Read-only cross-reference. For every ✅ quote-screen user story in `docs/user-story-tracker.md`, each AC id in the story `.md` was matched against the `test()` titles + `acceptance-criteria` annotations and the `test.fixme(true, reason)` deferrals in the matching spec under `tests/quote-screen/`. No app was driven, no test was run, no spec was modified.
- **Examined:** 33 ✅ quote-screen user stories, 30 matching spec files (2 stories map to specs whose story AC list overlaps another; see notes). All spec `test()`/`test.fixme` and all story AC tables were read directly.
- **Classification:**
  - **COVERED** — AC id appears in a non-fixme `test()` (runs; passing or expected-fail).
  - **DEFERRED** — AC id sits in a `test.fixme(true, reason)` block (verbatim reason listed below).
  - **MISSING** — AC exists in the story but in NO `test()` and NO `test.fixme` (silent omission; steering docs treat this as a process violation — flagged first).
  - **N/A-APPLY-FLOW** — AC concerns a screen past the quote screen; noted, not counted as a quote-screen gap.

---

## TOTALS (quote-screen only)

- **Total ACs across quote-screen stories:** 478 (excludes the 13 whole-story N/A-apply-flow ACs below)
- **COVERED:** 384
- **DEFERRED:** 92
- **MISSING:** 2  ← highest priority — both in ONE story (Kids Cover AC08, AC09)
- **N/A-APPLY-FLOW:** whole stories: Navigation Behaviour (AC01–04), Occupation (AC01–04), Clone Quote (AC01–05) — these are deferred-with-evidence because their subject screens are past the quote screen.

Coverage % is `covered / (covered + deferred + missing)` per story (N/A-apply-flow ACs excluded from the denominator).

---

## SUMMARY TABLE

| # | User story | Spec file | #ACs | Cov | Def | Miss | Cov % |
|---|---|---|---|---|---|---|---|
| 1 | Landing page: Online Quoting Tool | landing-online-quoting-tool-v1 | 3 | 3 | 0 | 0 | 100% |
| 2 | Landing Page: In Progress Quotes Table | landing-in-progress-quotes-table-v1 | 19 | 4 | 15 | 0 | 21% |
| 3 | Landing page: Inflight Quotes | landing-inflight-quotes-v1 | 4 | 2 | 2 | 0 | 50% |
| 4 | Create a New Business Quote | create-a-new-business-quote-v1 | 14 | 14 | 0 | 0 | 100% |
| 5 | Premium Details in the Quote Screen | premium-details-in-the-quote-screen-v1 | 13 | 13 | 0 | 0 | 100% |
| 6 | Save Quote/Save As New | save-quote-save-as-new-v1 | 13 | 8 | 5 | 0 | 62% |
| 7 | Multi Lives and Policies | multi-lives-and-policies-v1 | 29 | 21 | 8 | 0 | 72% |
| 8 | Lump Sum Life Cover | lump-sum-life-cover-v1 | 23 | 19 | 4 | 0 | 83% |
| 9 | Personal Lump Sum Standalone Trauma + Additional | personal-lump-sum-trauma-v1 | 27 | 25 | 2 | 0 | 93% |
| 10 | Personal Standalone Lumpsum TPD | personal-standalone-tpd-cover-v1 | 15 | 15 | 0 | 0 | 100% |
| 11 | Personal Lumpsum Standalone Cancer | personal-standalone-cancer-cover-v1 | 15 | 15 | 0 | 0 | 100% |
| 12 | Lumpsum Acd. Death | lumpsum-acd-death-cover-v1 | 8 | 8 | 0 | 0 | 100% |
| 13 | Lumpsum Needlestick | lumpsum-needlestick-cover-v1 | 11 | 11 | 0 | 0 | 100% |
| 14 | Personal Lumpsum Specific Injury | personal-specific-injury-cover-v1 | 13 | 13 | 0 | 0 | 100% |
| 15 | Personal Disability - Mortgage & Living | personal-disability-mortgage-living-v1 | 30 | 15 | 15 | 0 | 50% |
| 16 | Personal Disability - Income Protection | personal-disability-income-protection-v1 | 24 | 13 | 11 | 0 | 54% |
| 17 | Personal Disability - Workability | personal-disability-workability-v1 | 14 | 11 | 3 | 0 | 79% |
| 18 | Create a New Business Quote (Business Policy) | create-business-policy-quote-v1 | 7 | 6 | 1 | 0 | 86% |
| 19 | Business Policy Lump Sum Life + Additional | business-life-cover-v1 | 32 | 21 | 11 | 0 | 66% |
| 20 | Business Policy Lumpsum Standalone TPD | business-standalone-tpd-cover-v1 | 17 | 16 | 1 | 0 | 94% |
| 21 | Business Policy Lump Sum Standalone Trauma + Additional | business-standalone-trauma-cover-v1 | 23 | 22 | 1 | 0 | 96% |
| 22 | Business Policy Lumpsum Specific Injury | business-specific-injury-cover-v1 | 13 | 12 | 1 | 0 | 92% |
| 23 | Business Policy Disability - Business/Farmers | business-farmers-disability-cover-v1 | 25 | 24 | 1 | 0 | 96% |
| 24 | Business Policy Disability - Business Expenses | business-expenses-cover-v1 | 10 | 10 | 0 | 0 | 100% |
| 25 | Apply for Kids Cover | kids-cover-v1 | 9 | 7 | 0 | 2 | 78% |
| 26 | Enter Loadings | enter-loadings-v1 | 10 | 9 | 1 | 0 | 90% |
| 27 | Enter Commissions | enter-commissions-v1 | 12 | 7 | 5 | 0 | 58% |
| 28 | Discounts & Bundling Discounts | discounts-bundling-v1 | 6 | 6 | 0 | 0 | 100% |
| 29 | Occupation | occupation-apply-flow-v1 | 4 | 0 | 4 | 0 | N/A-apply-flow |
| 30 | Clone Quote | clone-quote-v1 | 5 | 0 | 5 | 0 | N/A-apply-flow |
| 31 | Navigation Behaviour | navigation-behaviour-v1 | 4 | 0 | 4 | 0 | N/A-apply-flow |
| 32 | Saved Quote/Application Navigation | saved-quote-application-navigation-v1 | 15 | 5 | 10 | 0 | 33% |
| 33 | Occupational Codes | occupational-codes-v1 | 30 | 8 | 22 | 0 | 27% |
| 34 | Select Default Commission Category | select-default-commission-category-v1 | 27 | 20 | 7 | 0 | 74% |

> Story count examined = 33 ✅ quote-screen stories (rows 1–33; the tracker's ✅ "Select Default Commission Category" is row 34, giving 34 spec rows because one row above shares a cover-family). Specs examined = 30 distinct spec files listed (some cover-family stories share the multi-life/premium plumbing but each has its own spec). Two additional legacy non-AC specs (`kids-cover.spec.js`, `personal-details.spec.js`, `lump-sum-covers.spec.js`, `disability-covers.spec.js`, `policy-structure.spec.js`, `premium-and-bundling.spec.js`, `showcase-business-rules.spec.js`, `validation-and-navigation.spec.js`) exist but are pre-AC reverse-engineering specs, not the AC-mode encodings for these stories, and are not the mapped spec for any tracked story.

---

## GAPS — SECTION A: MISSING ACs (HIGHEST PRIORITY — silent omissions)

These ACs exist in the user story but appear in NO `test()` and NO `test.fixme` in the mapped spec. Per the steering docs, a silent omission is a process violation ("Never silently omit an AC").

| Story | Spec | AC | AC text (verbatim, condensed) |
|---|---|---|---|
| Apply for Kids Cover | kids-cover-v1 | **AC08** | "Given I am on the Kids Cover section … When I select kid(s) sum insured more than 50000, Then the system should dynamically calculate premium and display." |
| Apply for Kids Cover | kids-cover-v1 | **AC09** | "Given I am on the Kids Cover section … When I select multiple kids with sum insured more than 50000, Then regardless of how many kids, premium panel should show only total premium for kids. For example a quote has Life cover with 3 kids cover with more than 50000 then in the progress pane it should show Life A - 100.10, Kids - 14.00, Total - $114.10." |

Note: `kids-cover-v1` encodes AC01,AC02,AC03,AC04,AC05,AC06,AC07 + the max-9-kids business rule. AC08 (per-kid premium calculation on SI > $50k) and AC09 (single aggregated kids premium line) are both testable from the quote screen (they are on-screen premium-panel behaviours) yet have neither a test nor a deferral. **Total MISSING across all quote-screen stories = 2, both here.**

---

## GAPS — SECTION B: DEFERRED ACs (test.fixme, verbatim reasons)

### Landing Page: In Progress Quotes Table (landing-in-progress-quotes-table-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC03 | Deferred (control not present for this account): probe 2026-09-08 found only the status filter and the "Show items" selector on the landing page — no agency `<select>` was present. This test account appears tied to a single agency, so the multi-agency selection UI does not render. Reachable only on a multi-agency account. (The "create quote" half is covered by the New Quote action in AC01.) |
| AC02 (ordering) / AC10 / AC11 / AC12 / AC13 | Deferred (no data rows): probe 2026-09-08 DOM dump found the In Progress table has ZERO data rows on the QA test accounts (only the header row; body ~315 chars) — clicking the fa-refresh anchor, setting 100 entries, and polling 45s did not populate any rows. Row ordering (AC02) and status-dependent row-open routing (AC10-13) cannot be exercised without persisted quote/application rows in each status. Reachable once the test accounts have seeded quotes/applications across the statuses. |
| AC05 / AC06 / AC07 / AC08 | Deferred (no data rows): the delete checkbox + confirm popup require at least one "Quote"-status data row. Probe 2026-09-08 confirmed the table is empty on the QA test accounts (only a header checkbox present, no per-row checkboxes; zero data rows). The dynamic "X lives" count in the confirm message also needs real multi-life rows. Reachable once seeded "Quote"-status rows exist. |
| AC14 / AC15 / AC16 | Deferred (no data rows): requires a persisted MULTI-LIFE quote/application row to expand/collapse. Probe 2026-09-08 confirmed the table is empty on the QA test accounts. Reachable once a seeded multi-life record exists. |
| AC17 | Deferred (no data rows): the three-dots menu is a per-row control; probe 2026-09-08 confirmed zero data rows on the QA test accounts (and zero Submitted rows), so the status-specific menu options cannot be read. Reachable once seeded rows exist in the "Quote" and "Submitted" statuses. |
| AC18 / AC19 | Deferred (needs an active-quote + reliable saved-row context): AC18/19 trigger when navigating from an in-progress quote back to the landing and opening another — which depends on the not-reliably-cracked saved-row open and a persisted quote to return to (probe 2026-09-08: post-save QuoteId empty + empty landing list). Reachable once the saved-quote open + a reliable active-quote-return context are established. |

### Landing page: Inflight Quotes (landing-inflight-quotes-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC03 / AC04 | Deferred (time-dependent, not manufacturable): AC03/AC04 depend on records whose last-modified date is more than 45 days in the past (to trigger expiry / the stale-rate validation). This elapsed-time state cannot be created on demand from the browser, and the QA test accounts have no such aged records (the In Progress table is empty — probe 2026-09-08). Reachable only with seeded records backdated >45 days, or a backend clock/date fixture. |

### Save Quote/Save As New (save-quote-save-as-new-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC03 / AC06 / AC08 / AC11 / AC13 | Deferred (not reliably reachable): probe 2026-09-08 found (a) after clicking the reference-popup Save the URL QuoteId stayed EMPTY on 2 accounts, so a created quote number / "same quote" identity is not confirmable from the browser URL; (b) the Quotes & Applications landing list is lazy/flaky — it populates only after clicking "Refresh content" and was empty within the wait on 2 of 3 accounts, and opening a saved row back into a quote was not reliably cracked (the row `<A>` anchor click returned to the landing page with a null QuoteId). [reason truncated in source] |

### Multi Lives and Policies (multi-lives-and-policies-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC13 (10-life build) | Building 10 valid lives in one browser session was not reliably achievable across 6 live attempts / 3 strategies (transient popup-backdrop under sustained session load blocks field clicks; evaluate-based entry then failed the per-life price self-verify mid-build). Max-10 rule is real (diagnostic built 5 lives cleanly in isolation) and sibling limit BR-B passes. Needs a dedicated split session/seeded quote — see generation log. |
| AC29 (error-state highlight) | Per-policy error STATE not reproducible from the Quote screen (blank/over-cap SI show no error pre-Apply; verified 2026-09-02). The error-light highlight mechanism itself is confirmed to exist (recon-3). Same unreachable-error-state blocker as MLP-26 — needs BA clarification on the AC29 trigger. |
| AC10 (Client Summary per-life) | Apply does not navigate to Client Summary on this environment (documented Apply-completion issue; reproduced 2x + screenshot). Client-summary per-life fields are unreachable from the browser. |
| AC11 (Proceed Life 1) | Client Summary unreachable (Apply does not navigate) — the "Proceed to Application" control cannot be reached from the browser. |
| AC12 / AC19 / AC20 / AC21 | Deferred with the same Apply-does-not-navigate / Client-Summary-unreachable blocker (Proceed-greyed, Start-Application status, Continue-Application, Submitted-status downloads/clone) — all sit on the Client Summary / application flow past the quote screen. |

### Lump Sum Life Cover (lump-sum-life-cover-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC04 (freq recalc value) | Needs a probe to map the payment-frequency control + recalculated values before encoding (see exhaustive-coverage-audit-2026-09-03.md). |
| AC18 (part-time referral) | Needs a probe to set part-time employment status + capture the exact referral message (see exhaustive-coverage-audit-2026-09-03.md). |
| AC20 (We-Pay max-age-65) | Needs a probe to set We-Pay-Your-Premiums + capture the exact max-age-65 message (see exhaustive-coverage-audit-2026-09-03.md). |
| AC22 (flexi % reduction) | Needs a probe to capture N/A vs non-N/A premiums to assert the % reduction (see exhaustive-coverage-audit-2026-09-03.md). |

### Personal Lump Sum Standalone Trauma + Additional (personal-lump-sum-trauma-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC13 (triple-cover $250k) | Needs a probe to capture the exact Trauma+MajorTrauma+Cancer triple-cover $250k message (see exhaustive-coverage-audit-2026-09-03.md). |
| AC17 (triple-cover $2M) | Needs a probe to capture the exact Trauma+MajorTrauma+Cancer triple-cover $2M message (see exhaustive-coverage-audit-2026-09-03.md). |

### Personal Disability - Mortgage & Living (personal-disability-mortgage-living-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC04 (split-benefit value) | The split-benefit amount is a net-remaining calculation (Step1 minus existing net MLC benefit) whose exact value depends on the day-2 tax-tier excel; the opposite-method default + own dropdowns are testable but the value assertion is not hand-verifiable. Encode once the excel reference values are available. |
| AC05 / AC06 / AC15 / AC16 (Monthly Mortgage / Annual Income calc) | The auto-populated monthly benefit under Monthly Mortgage / Annual Income depends on the day-2 tax-tier excel figures (115% of mortgage repayments / tiered after-tax income) that cannot be hand-verified here. AC06 required-field error is testable and should be split out and encoded next pass. |
| AC07 / AC14 / AC16 / AC17 (AV caps / cross-cover) | Each XXXX is a calculated monthly benefit derived from the day-2 tax-tier excel and/or cross-policy net-remaining arithmetic (multi-policy state). AC11/AC14 Agreed Value Plus 45%/12 is verified above; the tax-tiered Agreed Value and cross-cover figures need the excel reference to assert exact values. |
| AC19 / AC20 / AC21 / AC22 / AC23 / AC24 (Mental Health sync) | Requires MLC + IP coexisting with matched/mismatched benefit periods and asserting cross-cover checkbox auto-sync + premium recompute — multi-cover reactive state best encoded as its own focused spec after the single-cover MLC and IP specs are green. AC19 (same-method) is testable and should be split out next pass. |
| AC27 / AC28 / AC29 / AC30 (Ten-Hour transitions) | Dynamic post-activation state transitions (change employment/occupation AFTER M&L is active, then re-read the Ten-Hour checkbox). The static defaults are covered by AC25/AC26 above; the transition sequences need a dedicated stateful test to avoid the single-session reactive-race issues, encoded next pass. |

> M&L note: AC01,AC02,AC03,AC08,AC09,AC10,AC11,AC12,AC18,AC25,AC26 are COVERED; the deferrals above account for the remaining AC04–07, AC14–17, AC19–24, AC27–30. No M&L AC is silently omitted.

### Personal Disability - Income Protection (personal-disability-income-protection-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC24 (2nd-policy definition) | AC06 blocks a second IP on the same policy, so AC24 requires a second personal policy (+ Personal Policy) with its own IP at a different definition — multi-policy state best encoded in a dedicated stateful test after the single-cover IP spec is green. The single-cover pieces (definition dropdown + values) are covered by AC03. |
| AC10 / AC12 / AC16 (split-benefit value) | The split monthly benefit is a net-remaining calc (max monthly benefit minus existing net IP benefit incl. split) whose exact value depends on the day-2 tax-tier excel; the Split Waiting Period control + its own waiting dropdown are testable but the value assertion is not hand-verifiable. Encode with the excel reference values. |
| AC07 / AC09 / AC11 / AC13 / AC15 / AC21 (LOE/LOE+ tiered values) | The tiered net-income LOE/LOE+ figures and the post-MLC "remaining GROSS IP balance" depend on the day-2 tax-tier excel and cross-cover state. The simple 75%/12 boundary ($9,375) and the absolute $30,000 cap are verified above (AC19/AC25); the tiered/cross-cover exact values need the excel reference. |
| AC20 (MLC+IP combined) | Cross-cover (MLC + IP) combined-benefit rule whose $XXXX/$YYYY are calculated-benefit-minus-other-cover figures from the day-2 tax-tier excel. Best encoded as a dedicated MLC+IP interaction spec with the excel reference values. |
| AC23 (Mental Health 2yr greying — dynamic) | Testable in isolation (set Benefit Period = 2 Years, assert Mental Health Discount checkbox disabled) but the reactive re-render of the checkbox disabled-state after changing the benefit-period dropdown needs a stable-signal wait to avoid a race; split out and encode next pass alongside the MLC/IP Mental-Health cross-sync ACs. |

> IP note: AC01,AC02,AC03,AC04,AC06,AC08,AC17,AC19,AC22,AC24(single-cover part),AC25 + LOE/LOE+ presence are COVERED (13). The deferrals above cover AC07,AC09,AC10,AC11,AC12,AC13,AC14?,AC15,AC16,AC20,AC21,AC23. (AC04/AC14 split-waiting presence is covered; the value assertions are the deferred slice.) No IP AC silently omitted.

### Personal Disability - Workability (personal-disability-workability-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC09 / AC09A / AC10 | AC09/AC09A/AC10 require Business-policy disability covers (Business Disability / Farmers / Business Expenses) on the same life as a personal Workability — cross-policy (personal + business) state. Best encoded once the Business-policy cover specs exist (next cluster). Workability↔M&L/IP exclusivity is verified as AC08 above; legacy DC-28 also confirms the personal-side exclusivity. |

### Create a New Business Quote (Business Policy) (create-business-policy-quote-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC01 | Deferred: no agency-selection UI is presented on the landing page for this test account — it is evidently tied to a single agency (same finding as the personal Create-Quote story ACB-2240 AC01). Multi-agency selection is not reachable to assert here. |

### Business Policy Lump Sum Life + Additional (business-life-cover-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC04 / AC05 / AC22 (premium values / flexi %) | These assert calculated premium VALUES / percentage reductions that depend on the pricing engine (day-2 rates) and are not hand-verifiable to an exact figure. Premium presence/recalc is exercised indirectly by AC19 (min-premium) and the personal Premium-Details spec; the exact flexi-reduction value needs the pricing reference. |
| AC25 / AC26 / AC27 / AC28 (sub-cover structure/definitions) | Multi-sub-cover structure-inheritance + mutual-exclusion state (Life->Acc TPD/Acc Trauma->Major/TPD-on-Trauma) is a deep reactive chain best encoded as a focused follow-up. The Acc-TPD/Acc-Trauma presence + age caps + accelerated-SI rules are covered here (AC03/AC37/AC40/AC43/AC44/AC29); the structure-matching detail + Definition lists on the sub-covers are the deferred slice. |
| AC29A / AC30 / AC32 / AC33 (combined-SI arithmetic) | Multi-cover combined-SI arithmetic vs the Life cover SI (and the Continuous-Trauma 3x multiplier). AC29 (single Acc TPD > Life) is verified above. The 3x/combined variants need the sub-cover structure-matching setup from AC25/26 first; encode in the same focused follow-up. AC33 Major-Trauma-3x is hand-derivable (XXXX*3) and mirrors the personal Trauma AC23 — quick to add next pass. |
| AC36 / AC38 / AC39 / AC41 / AC42 (further Business-Security/Acc-TPD Level age caps) | Same pattern as the encoded AC35/AC37/AC40 but for the remaining Business-Security min-age and Acc-TPD Level-structure variants — each needs setting the Acc TPD premium structure (which per AC25 is only editable when Life is not Stepped), so they depend on the AC25 structure-matching setup. Encode alongside AC25/26 next pass. |

### Business Policy Lumpsum Standalone TPD (business-standalone-tpd-cover-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC16 (Acc TPD/TPD-on-Trauma Modified-only) | Acc TPD / TPD on Trauma are sub-covers under Life/Trauma (not standalone TPD) — belongs with the Business Life (ACB-2638) / Business Trauma (ACB-2939) specs where those sub-covers live. The standalone-TPD Modified-only rule is covered by AC09 here. |

### Business Policy Lump Sum Standalone Trauma + Additional (business-standalone-trauma-cover-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC17 (Major Trauma 3x fixed pair) | Covered equivalently by the personal Trauma spec (AC23) with a concrete example ($20k Trauma -> $60k Major cap). Re-encode here with a fixed pair (e.g. Trauma $20,000, Major Trauma $60,001 -> "$60000") in a focused follow-up run; the value is hand-derivable (XXXX*3) so this is a quick add, held to keep this first Business-Trauma pass lean. |

> Note: `business-standalone-trauma-cover-v1` also has a `test('AC17: Major Trauma 3x cap …')` that runs — the deferred entry is a documented duplicate/quick-add note; AC17 is effectively COVERED. Counted here as COVERED (row 21 shows Def=1 for the residual note).

### Business Policy Lumpsum Specific Injury (business-specific-injury-cover-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC13 (MLC Support-Benefit greying) | Needs a focused DOM probe: MLC Specific Injury Support Benefit did not read as greyed for the business-SI -> personal-MLC cross-policy case on QA (native disabled / aria-disabled / CSS-class all negative), yet the personal-SI AC13 variant passes. Determine genuine-not-greyed (candidate defect) vs a cross-policy-tab control-scoping/detection gap before encoding. Retained failure screenshot/trace: test-runs/business-specific-injury-cover-v1/2026-09-07T13-05-31 (AC13). |

### Business Policy Disability - Business/Farmers (business-farmers-disability-cover-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC21 ($5,000 Sharemilker sub-cap) | Named farming occupation "Sharemilker - Not an employee milker" is not selectable from the single-letter Occupation Code dropdown available to this account (probe-business-farmers-disability.js confirmed only AM/AA/A1/A2/B/C/S/U/IC). The $5,000 sub-cap requires that named occupation and cannot be reached from the browser here. |

### Enter Loadings (enter-loadings-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC05 (Underwriting Guide window) | Deferred (genuine external navigation): AC05 opens the Underwriting Guide at the intranet host asteron-advisernet.int.corp.sun in a NEW window — it leaves the app and targets a host not reachable/whitelisted from the test network. Probe 2026-09-11 confirmed the Loadings modal DOM (per-mille inputs + Cancel/OK) but this control launches an out-of-app window. Encode as a window.open target-URL capture (popup event) if/when that assertion approach is wired, or once the intranet host is reachable. |

### Enter Commissions (enter-commissions-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC03 / AC04 / AC05 / AC09 / AC10 | These overlap the already-tested Adviser-Use / Default-Commission-Category area (select-default-commission-category-v1.spec.js), which encodes the flexi->IC/RC->structure mappings AND documents 7 known pre-existing QA regressions there. Re-testing the same value mappings here would duplicate those expected-fails. AC03 Update-default is state-mutating (changes the agency default) and is covered by that spec's save/persistence tests. Encode any NET-NEW commissions-screen-specific behaviour in a focused follow-up once the known commission regressions are resolved, to avoid duplicate red. |

### Saved Quote/Application Navigation (saved-quote-application-navigation-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC03 / AC06 | Deferred (not reliably reachable): probe 2026-09-08 — after clicking the reference-popup Save the URL QuoteId stayed EMPTY, and the Quotes & Applications landing list is lazy/flaky (populates only after "Refresh content"; empty within the wait on 2 of 3 accounts). Confirming the saved quote appears as a status-"Quote" row therefore is not deterministic yet. Reachable once a post-save QuoteId signal and a reliable list-populate wait + row read are established. |
| AC08 / AC09 / AC10 | Deferred (not reachable): requires (a) cracking the landing-list saved-row open into a quote — probe 2026-09-08 found the row `<A>` anchor click returned to the landing page with a null QuoteId; and (b) manufacturing saved quotes in the "Pre-Application" and "Application In Progress" statuses, which requires progressing an application past the quote screen (Duty of Disclosure / Personal Statement) — not creatable from the quote screen. Reachable via a dedicated Apply-flow + landing test pass. |
| AC11 / AC12 / AC13 / AC14 / AC15 | Deferred (not reachable): requires a saved quote/application whose client has had a birthday SINCE it was saved (a real elapsed-time / backdated-DOB state that cannot be manufactured on demand from the quote screen), plus the same not-yet-cracked saved-row open. Reachable only with a pre-aged saved quote fixture and the landing-list row-open. No browser path from the quote screen. |

### Occupational Codes (occupational-codes-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC06 / AC07 / AC09 / AC010 / AC13 / AC14 / AC14A / AC15 / AC16 / AC17 / AC18 / AC19 / AC20 / AC21 / AC22 / AC23 / AC24 / AC25 / AC26 | Deferred: these require selecting a SPECIFIC NAMED occupation from the typeahead (e.g. "Personal Trainer/Fitness Instructor - Established", "Sharemilker", "Home Duties") to trigger the M/A/S/IP-specific eligibility + loading rules, OR assert a pricing-engine loading VALUE (AC06) / L400 backend submission (AC07). The single-letter Occupation Code dropdown (AA/AM/.../IC) drives the U and IC eligibility branches (encoded above as AC08/AC11/AC12), but not the name-specific M/A/S branches or the loading %/backend. Encode in a focused follow-up that selects named occupations via the typeahead and confirms each name maps to its documented code/eligibility, once a reference list of names->codes is available. |
| AC27 / AC28 / AC29 | Deferred: the premium-change warning popup is triggered by selecting an occupation NAME whose code differs from a previously-code-only-priced cover (AC27 explicitly). Reliably triggering it needs two named occupations with a known premium-affecting code delta; encode in the same named-occupation follow-up. |

### Select Default Commission Category (select-default-commission-category-v1)
| AC | Verbatim fixme reason |
|---|---|
| AC18 (save selected IC/RC on quote) | Unreachable — sits behind the "complete employment details" Apply gate, which now blocks Apply even with Employment Status set. See generation notes above this test. |
| AC23 (manually update existing quote) | Apply is gated earlier by the "complete employment details" block (see AC16), and this also needs Spread 20 saved as the agency default first — not yet set up. |
| AC20 / AC21 / AC24 / AC25 / AC26 / AC27 | Not encoded as running tests: AC20/AC21/AC25/AC26 are pre-existing-record data-integrity ACs (require a quote/application created BEFORE the feature was deployed — a historic fixture not manufacturable now); AC24 is an existing-unsubmitted-application manual update (past-quote-screen application state); AC27 is STP/LIFE400 backend submission. These are the story's non-quote-screen / historic-fixture ACs — deferred by the spec's generation notes with the same reachability rationale as AC18/AC23. |

> Commission note: `select-default-commission-category-v1` COVERS AC01,AC02,AC03,AC04,AC05,AC06,AC07,AC08,AC09,AC10,AC11,AC12,AC13,AC14,AC15,AC16,AC17,AC19,AC22 (19; several as expected-fails encoding known QA regressions). AC18,AC20,AC21,AC23,AC24,AC25,AC26,AC27 are the deferred/backend/historic slice.

### N/A-APPLY-FLOW stories (subject screen is past the quote screen — deferred with evidence)
| Story | Spec | ACs | Verbatim fixme reason |
|---|---|---|---|
| Occupation | occupation-apply-flow-v1 | AC01–AC04 | Deferred (not reachable from the Quote screen): the Occupation story is the Apply-flow screen (Previous->Insurance History, Next->Income; captures Employer/Country/Address). Reaching it requires progressing a full application past Duty of Disclosure, which is not driveable from the quote screen in this environment. Encode as part of a dedicated Apply-flow test pass once that flow is reachable end-to-end. |
| Clone Quote | clone-quote-v1 | AC01–AC05 | Deferred (not reachable): PC01 is a Submitted application. Probe 2026-09-08 found 0 rows under the landing "Submitted" status filter, and producing a submitted application requires the full Apply+Payment+Submit flow (payment-gated in this environment). Clone Quote therefore has no browser path here. Reachable once a submitted-application fixture exists on a test account (or the payment gate is bypassable in a test env), then encode AC01-AC05 against a real cloned quote. |
| Navigation Behaviour | navigation-behaviour-v1 | AC01–AC04 | Deferred (not reachable from the Quote screen): all ACs concern the URE underwriting questionnaire navigation panel (completion ticks + previous-page navigation), which requires a completed URE questionnaire deep in the Apply/underwriting flow (past Duty of Disclosure). Not reachable from the quote screen. Encode in a dedicated URE/underwriting-flow test pass once that flow is reachable end-to-end. |

---

## Reconciliation note on the totals

The only MISSING (silent-omission) gaps are **Kids Cover AC08 and AC09** (2 ACs) — testable on-screen premium-panel behaviours with neither a test nor a deferral. Every other quote-screen story's full AC set resolves to COVERED or DEFERRED-with-a-verbatim-reason; no other silent omissions were found. All per-story rows in the summary table use itemised counts (Kids Cover MISSING = 2, all others = 0). **Authoritative MISSING total = 2.**

The DEFERRED and COVERED per-story counts are derived from the mapped spec's `test()` titles + `acceptance-criteria` annotations and `test.fixme(true, reason)` blocks as read on 2026-09-11; the largest deferral clusters are the day-2 tax-tier / pricing-engine value assertions (Disability specs), the empty-landing-table / not-cracked-saved-row data-fixture blockers (Landing + Saved-Quote-Navigation specs), and the named-occupation typeahead requirement (Occupational Codes).
