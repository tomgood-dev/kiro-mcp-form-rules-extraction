# Multi Lives and Policies — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/multi-lives-and-policies-v1.spec.js`
- **Last run:** 2026-09-03T08-58-19 · Edge (headless) · https://outsystems-dev.asteronlife.co.nz · 42.4 min
- **Source:** Jira ACB-4394 "Multi Lives and Policies" (acceptance-criteria mode; `docs/user-stories/User Story- Multi Lives and Policies.md`). Story ACs 22–25 (Clone) are struck through → out of scope.
- **Result:** 15 passing, 3 confirmed-failing (encoded discrepancies), 8 blocked-with-evidence. Hardened 2026-09-03 with negative/boundary coverage (see MLP-02b, MLP-09, MLP-17b, MLP-16, MLP-18).

## Results

| # | Rule ID | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | MLP-01/AC01 | An "Add life" control exists on a new quote | fresh quote | control present | ✅ Pass | Story labels it "+Life"; app labels it "Add life". |
| 2 | MLP-02/AC02 | New life exposes all Personal Details fields + all cover controls (incl. Kids Cover) | age 35/M/OCC AA | all present | ✅ Pass | |
| 2b | MLP-02b/AC02 | **Boundary:** ANB 11–75 range enforced on an *added* life (below/at/at/over) | Life2 ANB 10 / 11 / 75 / 76, Apply | 10 rejected, 11 accepted, 75 accepted, 76 rejected | ✅ Pass | At-boundary ACCEPT asserted (11 & 75), not just failing side. Range error only fires on Apply for an added life. |
| 3 | MLP-03/AC03 | Add life with no min details → exact block message | fresh quote, click Add life | "Please enter the minimum **requirements**...another life." | ❌ Fail | App says "**requirement**" (singular), no full stop. Wording discrepancy — see business-rules record. |
| 4 | MLP-04/AC04 | With min details + priced cover, Add life succeeds | age35/M/OCC AA, Life $200k | Life 2 tab created | ✅ Pass | |
| 5 | MLP-05/AC05 | Each life shows its own premium; all-lives total present | Life1 $200k, Life2 $300k | 2 priced life tabs + all-lives total | ✅ Pass | Panel shows per-life premium per section + one all-lives grand total (not a repeated heading). |
| 6 | MLP-06/07/08/AC06-08 | "X" on a life tab → "Are you sure you want to delete this life?" + Cancel/Delete | Life1 priced, Life2 added, click Life1 X | delete-confirm modal + Cancel/Delete | ❌ Fail | App shows the "Cannot proceed / minimum requirement / OK" modal instead — no delete-confirmation dialog reachable. See business-rules record. |
| 7 | MLP-09/AC09 | **Boundary:** min-premium $240/life — below rejected, above accepted | Life $50k SI (below) / $500k SI (above), Apply | below→"The minimum premium is $240.00 per year per Life insured."; above→no min-premium error | ✅ Pass | Both sides asserted. ~$1.60/$1k SI at age 35, so $50k(~$80/yr) is below the floor, $500k(~$800/yr) above. |
| 8 | MLP-14/AC14 | Personal policy exposes full field set (incl. Premium Freeze + Kids Cover) | Personal policy | all personal covers + PremiumFreeze + KidsCover | ✅ Pass | |
| 9 | MLP-15/AC15 | Business policy exposes reduced business field set | Business policy | Life/TPD/Trauma/SI + Business Disability/Farmers Disability/Business Expenses; no Cancer/AcdDeath/Needlestick/M&L/IP/Workability; no PremiumFreeze/KidsCover; Inflation present | ✅ Pass | Matches story AC15 list exactly. |
| 10 | MLP-16/AC16 | "X" on a policy tab deletes ONLY that tab | add Business, click its X | Business 1 removed; Personal 1 remains | ✅ Pass | Negative/absence: deleting Business 1 does not remove Personal 1. |
| 11 | MLP-17/AC17 | Right panel: per-policy tabs + per-life premium + all-lives total | Life1 (Personal+Business), Life2 | both policy tabs on Life1, positive Life1 premium, all-lives total | ✅ Pass | Per-life via each active life; all-lives total present. |
| 11b | MLP-17b/AC17 | **Value-level:** per-COVER breakdown reconciles (sum of covers = policy total) | Life $200k + TPD $150k on Personal 1 | Life $ + TPD $ each > 0; Life+TPD == policy Total | ✅ Pass | Arithmetic asserted (probed: $18.53 + $7.76 = $26.29), not just that lines appear. |
| 12 | MLP-18/AC18 | Can navigate to any life and any policy (both policies) | Life1(+Business), Life2; click Life1, then Business1, then Personal 1 | each tab activates on click | ✅ Pass | Navigates to Personal 1 AND Business 1 (any policy, not just last-added). |
| 13 | MLP-27/AC27 | Add life → control moves to the new life | price Life1, Add life | Life 2 is the active tab | ✅ Pass | |
| 14 | MLP-28/AC28 | Add policy → control moves to the new policy | add Business | Business 1 is the active policy tab | ✅ Pass | |
| 15 | BR-B | Max 5 policies (personal+business) per life | add policies until 5 | 6th blocked (both add buttons disabled) | ✅ Pass | Confirms the "Maximum 5 policies per life" business rule is enforced. |
| 16 | MLP-26/AC26 | Add life while a policy has an error → "Please correct the errors before proceeding to another life" | Life active, SI blank/over-cap, Add life | correct-errors modal + OK | ❌ Fail | The AC26 trigger error-state was not reproducible from the browser (blank SI shows no error pre-Apply; over-cap SI shows no error). Encoded to story expected → fails until clarified. See business-rules record. |
| 17 | MLP-13/AC13/BR-A | "Add life" disabled once 10 lives exist | build 10 valid lives | Add life disabled at 10 | 🚫 Blocked | Building 10 valid lives in one session not reliably achievable (transient popup-backdrop under sustained session load; per-life price read flakiness). Rule is real (diagnostic built 5 cleanly in isolation); sibling BR-B passes. See Deferred. |
| 18 | MLP-29/AC29 | Adding a policy with an error highlights the errored policy tab | Personal 1 errored, add Business | errored tab `error-light` highlight | 🚫 Blocked | Highlight mechanism confirmed to exist (recon-3), but the per-policy error STATE is not reproducible from the browser pre-Apply. See Deferred. |
| 19 | MLP-10/AC10 | Multi-life Apply → Client Summary with per-life fields | valid quote, Apply | Client Summary + per-life First/Middle/Last/DOB + Proceed | 🚫 Blocked | Apply does not navigate to Client Summary on this env (reproduced 2×, screenshot). See Deferred. |
| 20 | MLP-11/AC11 | Proceed to Application on Life 1 proceeds for Life 1 only | — | — | 🚫 Blocked | Client Summary unreachable. |
| 21 | MLP-12/AC12 | After submitting Life 1, its Proceed button greys out | — | — | 🚫 Blocked | Requires full app submission past Client Summary (payment/STP-gated). |
| 22 | MLP-19/AC19 | Multi-life Apply → one Start Application per life + status + expand/collapse | — | — | 🚫 Blocked | Client Summary unreachable. Flags AC10 "Proceed" vs AC19 "Start Application" wording inconsistency. |
| 23 | MLP-20/AC20 | Start Application → Continue Application on return + status | — | — | 🚫 Blocked | Client Summary + app flow unreachable. |
| 24 | MLP-21/AC21 | Submit one app → Submitted status + downloads + clone | — | — | 🚫 Blocked | Requires full submission past Client Summary. |

Status key: ✅ Pass / ❌ Fail (encoded discrepancy, red until the app is fixed) / 🚫 Blocked (see Deferred).

## Deferred

| AC(s) | Reason |
|---|---|
| MLP-10, 11, 12, 19, 20, 21 | Apply does not navigate to the Client Summary on this environment (documented, still-open Apply-completion issue; reproduced twice + screenshot in `kids-cover-and-multi-life/evidence/01-probe-multi-lives-recon-3/`). Everything gated on reaching Client Summary / submitting an application is browser-unreachable. Testable once Apply completes. |
| MLP-13 | Building 10 valid lives in one browser session was not reliably achievable across 6 live attempts / 3 interaction strategies — a transient popup-backdrop appears deep in the build (sustained-session-load instability) and the per-life price self-verify reads flaky under load. The max-10 rule is real (a diagnostic built 5 lives cleanly in isolation) and the sibling BR-B (max 5 policies) passes. Testable via a dedicated split session or a seeded 10-life quote. |
| MLP-29 | The per-policy error STATE that AC29 assumes ("there is an error on policies" at add-policy time) is not reproducible from the reachable Quote screen (blank/over-cap SI produce no visible error pre-Apply). The error-highlight mechanism itself IS confirmed to exist (recon-3 observed `background-color: var(--color-error-light)` on an errored Personal 1 tab). Needs BA clarification on the AC29 trigger. |

## Business Rule Corrections

None. This run introduced new [Story ACB-4394] rules to `kids-cover-and-multi-life/page.md` and recorded 3 candidate discrepancies (MLP-03 wording, MLP-06/07/08 delete modal, MLP-26 correct-errors modal) — no previously-documented rule was overturned.
