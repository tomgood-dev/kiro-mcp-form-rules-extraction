# Quote-Screen Acceptance-Criteria Coverage Gap Analysis — RE-VALIDATION

- **Date:** 2026-09-16
- **Baseline:** `coverage-gaps-2026-09-11.md` (read in full).
- **Trigger for re-validation:** The Apply flow (everything past the Quote screen) was previously
  treated as **N/A-apply-flow / unreachable / payment-gated**. That is now **WRONG**. As of
  2026-09-15/16 the full **Quote → Apply → Submit** flow was proven reachable and completable
  end-to-end on QA (real policy **J4211922**). Evidence + full screen map:
  `docs/apply-flow-end-to-end-2026-09-15.md`. Reusable apply-flow helpers were added to
  `helpers/quote-helpers.js` (`reachApplicationFlow`, `proceedThroughClientSummary`,
  `passDutyOfDisclosure`, `fillPersonalDetailsScreen`, `passInsuranceAndFinancial`,
  `passTeleInterview`, `passPersonalStatement`, `applyFlowScreen/Next`, `getApplyFlowSidebar`,
  `clickApplyFlowStep`, `submitApplication`, etc.).
- **Method:** Read-only cross-reference. Every `test()` title, `acceptance-criteria` annotation,
  and `test.fixme(true, reason)` block under `tests/quote-screen/` was read directly and compared
  to the 2026-09-11 baseline. No app driven, no test run, no spec modified.

---

## (a) CHANGES SINCE 2026-09-11 — the headline

Nine ACs moved from DEFERRED / MISSING / N/A-apply-flow to **COVERED** (encoded as running
tests, passing or expected-fail). Four more deferred ACs had their **reason materially changed**
(the old "unreachable / payment-gated" blocker was retracted; a narrower, real blocker replaces
it). Two whole stories flipped from "N/A-apply-flow" (0% denominator) to real, partly-covered
specs.

| Story | AC | Was (2026-09-11) | Now (2026-09-16) | Note |
|---|---|---|---|---|
| Apply for Kids Cover | **AC08** | **MISSING** (silent omission) | **COVERED** | Now a running test: "kid SI above $50k dynamically calculates + displays a premium" (value-level, baseline $296.16 → increases). |
| Apply for Kids Cover | **AC09** | **MISSING** (silent omission) | **COVERED** | Now a running test: "multiple kids >$50k show a single aggregated Kids premium line" (3 kids = 1 line). |
| Occupation | **AC01** | N/A-apply-flow (deferred) | **COVERED** | Occupation captured — "Principal Occupation: `<name>`" header asserted. |
| Occupation | **AC03** | N/A-apply-flow (deferred) | **COVERED** | Previous → Insurance History asserted. |
| Occupation | **AC04** | N/A-apply-flow (deferred) | **COVERED** | Next → Income (FINANCIAL page) asserted. |
| Occupation | **AC02** | N/A-apply-flow (deferred) | **COVERED (expected-fail)** | Encoded to the spec's expected value: offers-dropdown/Employer/Country/Address fields asserted present on the Occupation screen — they are absent, so it fails until the app adds them (a real discrepancy, per the rulebook). |
| Navigation Behaviour | **AC01** | N/A-apply-flow (deferred) | **COVERED** | Completion ticks on completed sidebar sections asserted (≥4 ticked; Personal Details ticked). |
| Navigation Behaviour | **AC03** | N/A-apply-flow (deferred) | **COVERED** (2 tests) | (a) sidebar-step-click-navigates encoded as expected-fail (sidebar is a read-only `<div>`); (b) footer-Previous navigation + tick-retention encoded as passing (story's underlying intent). |
| Multi Lives and Policies | **MLP-10 / AC10** | DEFERRED — "Apply does not navigate to Client Summary on this environment" | **COVERED** | Running test: multi-life Apply reaches Client Summary; ≥2 "Proceed to application" controls asserted. |
| Multi Lives and Policies | **MLP-19 / AC19** | DEFERRED — "Client Summary unreachable (Apply does not navigate)" | **COVERED** | Running test: one Start/Proceed control per life + one status per life asserted. |
| Multi Lives and Policies | **MLP-11 / AC11** | DEFERRED — "Client Summary unreachable" | DEFERRED — **reason changed** | Old "Apply does not navigate" retracted. New blocker: single-life Proceed now works (policy J4211922), but the 2-life BUILD is flaky (masked-SI/occupation-name racing) so it doesn't reliably re-reach multi-life Client Summary; needs a hardened multi-life builder. |
| Multi Lives and Policies | **MLP-12 / AC12** | DEFERRED — "payment/STP-gated … full submission unreachable" | DEFERRED — **reason changed** | Explicitly retracts the "payment-gated" claim (single-life submits end-to-end). Remaining blocker = multi-life per-life Proceed navigation, not any gate. |
| Multi Lives and Policies | **MLP-20 / AC20** | DEFERRED — "Client Summary + application flow unreachable" | DEFERRED — **reason changed** | Same chain as MLP-11 — hardened multi-life build needed first; Start→Continue transition testable only once per-life app-entry works. |
| Multi Lives and Policies | **MLP-21 / AC21** | DEFERRED — "submission payment/STP-gated" | DEFERRED — **reason changed** | Explicitly retracts "payment/STP-gated" (single-life submission confirmed). Remaining blocker = multi-life per-life Proceed navigation. |
| Navigation Behaviour | **AC02 / AC04** | N/A-apply-flow (deferred) | DEFERRED — **reason changed** | No longer "not reachable from the quote screen". Now: reachable flow, but the mid-questionnaire answer-mutation path that spawns follow-ups + unticks a section has not been characterized by a probe (a documented, narrower blocker). |

**Tally:** 9 ACs moved to COVERED (2 were MISSING → covered; 4 Occupation + 2 Navigation Behaviour
from N/A-apply-flow → covered/expected-fail; 2 MLP from deferred → covered). 6 further ACs
(MLP-11/12/20/21, Navigation AC02/AC04) stay deferred but with the false "unreachable/payment-gated"
reason retracted and replaced by a real, narrower blocker.

---

## (b) UPDATED PER-STORY SUMMARY TABLE

Coverage % = `covered / (covered + deferred + missing)`. Rows that changed since 2026-09-11 are
flagged in **Note**. (Expected-fail assertions count as COVERED — they run.)

| # | User story | Spec file | #ACs | Cov | Def | Miss | Cov % | Note |
|---|---|---|---|---|---|---|---|---|
| 1 | Landing page: Online Quoting Tool | landing-online-quoting-tool-v1 | 3 | 3 | 0 | 0 | 100% | — |
| 2 | Landing Page: In Progress Quotes Table | landing-in-progress-quotes-table-v1 | 19 | 4 | 15 | 0 | 21% | data-fixture blocked (unchanged) |
| 3 | Landing page: Inflight Quotes | landing-inflight-quotes-v1 | 4 | 2 | 2 | 0 | 50% | time-dependent (unchanged) |
| 4 | Create a New Business Quote | create-a-new-business-quote-v1 | 14 | 14 | 0 | 0 | 100% | — |
| 5 | Premium Details in the Quote Screen | premium-details-in-the-quote-screen-v1 | 13 | 13 | 0 | 0 | 100% | — |
| 6 | Save Quote/Save As New | save-quote-save-as-new-v1 | 13 | 8 | 5 | 0 | 62% | data-fixture blocked (unchanged) |
| 7 | Multi Lives and Policies | multi-lives-and-policies-v1 | 29 | **23** | **6** | 0 | **79%** | **↑ AC10/AC19 now covered (were deferred); +7% vs 72%** |
| 8 | Lump Sum Life Cover | lump-sum-life-cover-v1 | 23 | 19 | 4 | 0 | 83% | — |
| 9 | Personal Lump Sum Standalone Trauma + Additional | personal-lump-sum-trauma-v1 | 27 | 25 | 2 | 0 | 93% | — |
| 10 | Personal Standalone Lumpsum TPD | personal-standalone-tpd-cover-v1 | 15 | 15 | 0 | 0 | 100% | — |
| 11 | Personal Lumpsum Standalone Cancer | personal-standalone-cancer-cover-v1 | 15 | 15 | 0 | 0 | 100% | — |
| 12 | Lumpsum Acd. Death | lumpsum-acd-death-cover-v1 | 8 | 8 | 0 | 0 | 100% | — |
| 13 | Lumpsum Needlestick | lumpsum-needlestick-cover-v1 | 11 | 11 | 0 | 0 | 100% | — |
| 14 | Personal Lumpsum Specific Injury | personal-specific-injury-cover-v1 | 13 | 13 | 0 | 0 | 100% | — |
| 15 | Personal Disability - Mortgage & Living | personal-disability-mortgage-living-v1 | 30 | 15 | 15 | 0 | 50% | day-2 excel value blocked (unchanged) |
| 16 | Personal Disability - Income Protection | personal-disability-income-protection-v1 | 24 | 13 | 11 | 0 | 54% | day-2 excel value blocked (unchanged) |
| 17 | Personal Disability - Workability | personal-disability-workability-v1 | 14 | 11 | 3 | 0 | 79% | — |
| 18 | Create a New Business Quote (Business Policy) | create-business-policy-quote-v1 | 7 | 6 | 1 | 0 | 86% | multi-agency UI absent (unchanged) |
| 19 | Business Policy Lump Sum Life + Additional | business-life-cover-v1 | 32 | 21 | 11 | 0 | 66% | — |
| 20 | Business Policy Lumpsum Standalone TPD | business-standalone-tpd-cover-v1 | 17 | 16 | 1 | 0 | 94% | — |
| 21 | Business Policy Lump Sum Standalone Trauma + Additional | business-standalone-trauma-cover-v1 | 23 | 22 | 1 | 0 | 96% | — |
| 22 | Business Policy Lumpsum Specific Injury | business-specific-injury-cover-v1 | 13 | 12 | 1 | 0 | 92% | — |
| 23 | Business Policy Disability - Business/Farmers | business-farmers-disability-cover-v1 | 25 | 24 | 1 | 0 | 96% | named-occupation blocked (unchanged) |
| 24 | Business Policy Disability - Business Expenses | business-expenses-cover-v1 | 10 | 10 | 0 | 0 | 100% | — |
| 25 | Apply for Kids Cover | kids-cover-v1 | 9 | **9** | 0 | **0** | **100%** | **↑ AC08/AC09 now covered (were the only 2 MISSING in the whole suite); +22% vs 78%** |
| 26 | Enter Loadings | enter-loadings-v1 | 10 | 9 | 1 | 0 | 90% | external-intranet host (unchanged) |
| 27 | Enter Commissions | enter-commissions-v1 | 12 | 7 | 5 | 0 | 58% | duplicate-of-commission-spec (unchanged) |
| 28 | Discounts & Bundling Discounts | discounts-bundling-v1 | 6 | 6 | 0 | 0 | 100% | — |
| 29 | Occupation | occupation-apply-flow-v1 | 4 | **4** | **0** | 0 | **100%** | **↑ was N/A-apply-flow 0-cov; now AC01/03/04 pass + AC02 expected-fail** |
| 30 | Clone Quote | clone-quote-v1 | 5 | 0 | 5 | 0 | 0% | **still deferred — but blocker reason is now STALE (see §c)** |
| 31 | Navigation Behaviour | navigation-behaviour-v1 | 4 | **2** | **2** | 0 | **50%** | **↑ was N/A-apply-flow 0-cov; AC01/AC03 pass, AC02/AC04 deferred (reason changed)** |
| 32 | Saved Quote/Application Navigation | saved-quote-application-navigation-v1 | 15 | 5 | 10 | 0 | 33% | **partly STALE — AC08/09/10 reachability claim now false (see §c)** |
| 33 | Occupational Codes | occupational-codes-v1 | 30 | 8 | 22 | 0 | 27% | named-occupation blocked (unchanged) |
| 34 | Select Default Commission Category | select-default-commission-category-v1 | 27 | 20 | 7 | 0 | 74% | **AC18/AC23/AC24 reasons partly STALE — Apply gate now clearable (see §c)** |

**Suite-level movement:** MISSING dropped from **2 → 0** (both Kids Cover ACs now covered). The
three N/A-apply-flow whole-stories (Occupation, Navigation Behaviour, Clone Quote) are no longer a
blanket "past the quote screen, deferred with evidence" — Occupation is now 100% and Navigation
Behaviour 50% covered against a real, driveable Apply flow; only Clone Quote remains fully deferred
(on a DATA-fixture basis, not reachability — see §c).

---

## (c) STALE DEFERRALS — reasons that cite a blocker we now know is FALSE

The Apply flow / Client Summary / Duty of Disclosure / Personal Details / Payment / Submit are all
**reachable and completable** (policy J4211922). Any live `test.fixme` reason still asserting these
are "unreachable" / "payment-gated" / "STP-gated" / "Apply does not navigate" is **now incorrect**
and should be re-worded or re-tested.

### C1 — Reachability now a FALSE blocker (re-word / re-test)

| Spec | AC | Stale phrase (verbatim excerpt) | Why now false |
|---|---|---|---|
| **clone-quote-v1** | AC01–AC05 | *"producing a submitted application requires the full Apply+Payment+Submit flow (**payment-gated in this environment**). Clone Quote therefore has **no browser path here**."* | A full submission was completed end-to-end (J4211922) — there is **no payment gate**. A submitted application CAN now be produced from the browser. The reason must drop "payment-gated / no browser path". **BUT** the residual blocker is legitimate-but-narrower: producing the submitted-application FIXTURE requires driving the whole (fragile Personal-Statement) flow once, and then a landing-list "Submitted"-row open (the not-yet-cracked saved-row open). So Clone is no longer *reachability*-blocked, it is **data-fixture + landing-row-open** blocked. Re-word accordingly and re-test once a submitted fixture is seeded. |
| **saved-quote-application-navigation-v1** | AC08 / AC09 / AC10 | *"manufacturing saved quotes in the 'Pre-Application' and 'Application In Progress' statuses, which **requires progressing an application past the quote screen (Duty of Disclosure / Personal Statement) — not creatable from the quote screen**."* | Progressing past the quote screen (through DoD / Personal Statement) is now proven driveable. Pre-Application / Application-In-Progress statuses ARE now manufacturable via the apply-flow helpers. The "not creatable" clause is false. Residual blocker = the landing-list saved-row open (still genuinely not cracked) — re-word to that only. |
| **multi-lives-and-policies-v1** | AC11 / AC20 | (annotation text, still present) *"depends on the Client Summary, which is **unreachable (Apply does not navigate** — see MLP-10 evidence)"* / *"depends on the Client Summary + application flow, **unreachable** (see MLP-10)"* | Client Summary IS reachable (MLP-10/MLP-19 now pass). The `acceptance-criteria` annotation blocks for AC11/AC20 still carry the old "unreachable / Apply does not navigate" wording even though the `test.fixme` reason itself has been updated (2026-09-16). The annotation text should be brought in line with the updated fixme reason. |
| **multi-lives-and-policies-v1** | AC12 / AC21 | (annotation text, still present) *"full application submission was documented as **payment/STP-gated** in iteration-001"* / *"submission is **payment/STP-gated**"* | The `test.fixme` reason for both explicitly retracts "payment-gated"; but the AC12/AC21 **annotation** blocks above the fixme still state "payment/STP-gated". Re-word the annotations to match (the real blocker is multi-life per-life Proceed navigation, not any gate). |

### C2 — Still genuinely blocked (NOT reachability — do NOT re-open on the apply-flow finding)

These deferrals are unaffected by the apply-flow finding; their blockers are real and remain.

| Spec | AC(s) | Genuine blocker (not reachability) |
|---|---|---|
| clone-quote-v1 | AC01–AC05 | Needs a seeded **submitted-application fixture** + the not-cracked **landing-list saved-row open** (data/UI-mechanism, not a gate). |
| saved-quote-application-navigation-v1 | AC03 / AC06 | Post-save **QuoteId stays empty** + lazy/flaky landing list — a save-signal / list-populate problem, not apply-flow. |
| saved-quote-application-navigation-v1 | AC11–AC15 | Requires a **client birthday since save** (elapsed-time / backdated-DOB fixture) — genuinely not manufacturable on demand. |
| landing-in-progress-quotes-table-v1 | AC02/AC05-AC19 (cluster) | **Empty landing table** on QA accounts — needs seeded rows across statuses; data-fixture, not apply-flow. |
| landing-inflight-quotes-v1 | AC03 / AC04 | Records **>45 days old** — time-dependent fixture. |
| occupational-codes-v1 | AC06/AC07/AC09-AC29 (cluster) | Needs **named-occupation typeahead** selection + pricing-engine loading VALUE / L400 backend — data/backend, not apply-flow. |
| business-farmers-disability-cover-v1 | AC21 | Named occupation **"Sharemilker - Not an employee milker"** not in the single-letter dropdown — named-occupation. |
| enter-loadings-v1 | AC05 | **External intranet host** `asteron-advisernet.int.corp.sun` — out-of-app window, network-blocked. |
| early-trauma-benefit-v1 | AC01-AC05 | Early Trauma SI is **PDF/L400 backend** output, not surfaced on the quote screen. |
| personal-disability-mortgage-living-v1 / -income-protection-v1 / business-life-cover-v1 | value ACs | **Day-2 tax-tier / pricing-engine excel** values not hand-verifiable — reference-data, not apply-flow. |
| create-a-new-business-quote-v1 / create-business-policy-quote-v1 | AC01 | **Multi-agency selection UI** absent for this single-agency account. |
| navigation-behaviour-v1 | AC02 / AC04 | Flow IS reachable; blocker is the un-mapped **mid-questionnaire answer-mutation** path (which answer spawns follow-ups + unticks) — a characterization gap, not reachability. |
| multi-lives-and-policies-v1 | MLP-11/12/20/21 | Flow/Client-Summary IS reachable; blocker is the **flaky multi-life build** + **per-life Proceed navigation** — not a gate. |
| multi-lives-and-policies-v1 | AC13 (10 lives) / AC29 (error state) | Session-load 10-life build fragility / error-state not reproducible pre-Apply — unchanged. |

### C3 — Select Default Commission Category — Apply-gate deferrals now partly stale

| Spec | AC | Stale phrase (verbatim) | Status |
|---|---|---|---|
| select-default-commission-category-v1 | **AC18** | *"Unreachable — sits behind the '**complete employment details' Apply gate**, which now blocks Apply even with Employment Status set."* | **Partly stale.** The employment-details Apply gate is now known to be clearable by supplying the **occupation NAME per life** via the vscomp typeahead (proven live 2026-09-15; used by MLP-10/MLP-19 which now pass, and by `setOccupationName`/`reachApplicationFlow`). "Unreachable" is no longer accurate — the gate is passable. Re-test AC18 (save selected IC/RC on the quote through a real Apply). |
| select-default-commission-category-v1 | **AC23** | *"Apply is gated earlier by the '**complete employment details' block** (see AC16), and this also needs Spread 20 saved as the agency default first — not yet set up."* | **Partly stale.** The Apply-gate half is now clearable (as above). The residual "Spread 20 saved as the agency default first" precondition is a real setup step, not a reachability wall — split the two: re-test the Apply path, keep the agency-default-setup as the remaining prerequisite. |
| select-default-commission-category-v1 | AC20/AC21/AC24/AC25/AC26/AC27 | historic-record / STP-LIFE400 backend | **Not stale** — genuinely blocked (pre-deployment historic fixture / backend submission). |

---

## (d) NEWLY ACTIONABLE (prioritised) — deferred ACs now genuinely encodable

The apply flow is reachable + completable and the helpers exist, so the following are now
encodable. Ordered by value / ease.

1. **DONE / verify-only — Occupation (occupation-apply-flow-v1) AC01/AC03/AC04 + AC02 expected-fail.**
   Already encoded as running tests. No new work beyond confirming they pass in a run.

2. **DONE / verify-only — Navigation Behaviour AC01 + AC03.** Already encoded (ticks; Previous-nav +
   tick-retention). AC03-literal sidebar-click is an intentional expected-fail (read-only `<div>`).

3. **DONE / verify-only — Kids Cover AC08 + AC09.** Already encoded (per-kid >$50k premium; single
   aggregated Kids line). This closed the suite's only 2 MISSING ACs.

4. **select-default-commission-category AC18** (save selected IC/RC on the quote). **High value,
   low effort.** The employment-details Apply gate is now clearable via `setOccupationName` /
   `reachApplicationFlow`. Drive Apply through, confirm the IC/RC selection persists on the quote.

5. **select-default-commission-category AC23** (manually update existing quote). Same gate now
   clearable; remaining prerequisite is seeding "Spread 20" as the agency default. Split the Apply
   path (now testable) from the agency-default setup.

6. **saved-quote-application-navigation AC08 / AC09 / AC10** (Pre-Application / Application-In-Progress
   statuses). The status-manufacturing half is now doable (drive an application partway via the
   helpers and leave it in-progress). Remaining real blocker: the landing-list **saved-row open**
   (not-yet-cracked) — worth a dedicated probe now that in-progress applications can be produced.

7. **Clone Quote AC01–AC05.** A submitted application can now be produced (no payment gate). Produce
   one via the full apply-flow helpers → it becomes a "Submitted" landing row → then Clone. Gated
   only on (a) running the fragile Personal-Statement flow once to mint the fixture and (b) the
   landing-row open. Medium effort; re-word the fixme to drop "payment-gated".

8. **multi-lives-and-policies MLP-11 / MLP-12 / MLP-20 / MLP-21** (per-life Proceed / Submitted-status
   / clone). Client Summary is reachable (MLP-10/19 pass). Blocked on **hardening the multi-life
   builder** (promote `buildTwoLifeApplyReady` with price-verify + occupation-name retry so it
   reliably re-reaches multi-life Client Summary), then confirming per-life Proceed navigation.
   Highest effort of this list (multi-life build flakiness), but no longer gate-blocked.

9. **navigation-behaviour AC02 / AC04** (tick clears when an answer spawns follow-ups). Flow is
   reachable; needs a **probe** to find the questionnaire's internal edit/re-open affordance and the
   specific answer that spawns follow-up questions, then encode the untick assertion
   (`getApplyFlowSidebar` already reads tick state — only the re-open mechanism is missing).

Not newly actionable (still genuinely blocked on data/backend/time, per §C2): landing-table clusters,
inflight >45-day records, named-occupation clusters (Occupational Codes, Farmers AC21), day-2 excel
value ACs, external-intranet Loadings AC05, Early Trauma PDF/L400, multi-agency AC01s, historic-record
commission ACs.
