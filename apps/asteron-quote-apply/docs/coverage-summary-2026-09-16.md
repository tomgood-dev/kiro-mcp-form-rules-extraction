# Quote & Apply — Acceptance-Criteria Coverage (re-validation, 2026-09-16)

_Updated after the Apply flow was proven reachable + completable end-to-end (real policy J4211922).
Supersedes the 2026-09-11 quote-screen-only summary. Full working detail:
`docs/coverage-gaps-2026-09-16.md`._

|  | ACs | Share |
|---|---|---|
| ✅ Covered (runs — passing or expected-fail) | **393** | ~75% |
| ⏸️ Deferred (documented reason, work still to do) | **131** | ~25% |
| ❌ Missing (silent gap — should be closed) | **0** | 0% |
| **Total** | **524** | across 34 stories (now incl. the Apply-flow stories) |

**Bottom line:** coverage improved on every real measure since 2026-09-11 — the **2 silent gaps are
now closed (Missing 2 → 0)** and **8 Apply-flow ACs became testable and were encoded**. The headline
% moved from ~80% to ~75% only because the denominator **grew**: the three Apply-flow stories that
used to be excluded as "out of scope / unreachable" (Occupation, Clone Quote, Navigation Behaviour)
are now **in scope** — so their still-to-do ACs now count. Like-for-like (quote-screen only),
coverage went **up**.

## What changed since the first analysis

| Change | Detail |
|---|---|
| ❌ → ✅ **Both silent gaps closed** | Kids Cover **AC08 & AC09** (per-kid >$50k premium; single aggregated "Kids" line) are now running value-level tests. Missing count **2 → 0**. |
| 🆕 **Apply flow proven reachable** | The whole Quote → Apply → Submit flow completes end-to-end on QA (policy **J4211922**). The old "payment-gated / unreachable" verdict is retired. |
| ⏸️ → ✅ **Occupation** | Story **0% → 100%**. AC01/AC03/AC04 pass; AC02 encoded as an expected-fail (a real discrepancy — the offers/Employer/Country/Address fields are absent on the live Occupation screen). |
| ⏸️ → ✅ **Navigation Behaviour** | Story **0% → 50%**. AC01 (completion ticks) + AC03 (previous-page nav + tick retained) pass; AC02/AC04 deferred with a narrower, documented reason. |
| ⏸️ → ✅ **Multi Lives** | **AC10 + AC19** (multi-life Client Summary) now pass. Story **72% → 79%**. |
| 🔁 **Stale reasons corrected** | 5 deferrals that still claimed "Apply doesn't navigate / payment-gated / unreachable" were corrected — the real remaining blockers are narrower (see below). |

## The gaps to close now (newly unblocked — highest value)

These were deferred on "can't reach the Apply flow"; that's no longer true, so they're actionable:

| Item | Effort | What's needed |
|---|---|---|
| **Select Default Commission — AC18** (save IC/RC on the quote) | Low | The employment-details Apply gate is now clearable (occupation-name typeahead). Drive Apply, confirm the selection persists. |
| **Select Default Commission — AC23** | Low–Med | Same gate clearable; also needs "Spread 20" seeded as the agency default. |
| **Saved Quote/Application Nav — AC08/09/10** | Med | Pre-Application / In-Progress statuses are now manufacturable; remaining blocker is the landing saved-row reopen. |
| **Clone Quote — AC01–05** | Med | A submitted application can now be produced; needs a seeded submitted fixture + the saved-row reopen. Re-word the "payment-gated" reason. |
| **Multi Lives — MLP-11/12/20/21** | High | Client Summary is reachable; needs a hardened multi-life build + per-life Proceed confirmation. |
| **Navigation Behaviour — AC02/AC04** | Med | Needs a probe to find the questionnaire's answer re-open affordance (tick-clear on answer change). |

## Why the 131 deferred ACs aren't done yet (grouped by cause)

| Blocker | ~ACs | What would unblock it |
|---|---|---|
| Needs pricing-engine reference values | ~30 | Day-2 tax-tier figures (disability benefit calcs) — can't be hand-verified without them. |
| Needs seeded test data | ~30 | Saved quotes / landing rows in specific statuses; QA accounts start empty; saved-row reopen not cracked. |
| Needs named-occupation data | ~22 | Occupation typeahead reference list (name → code); single-letter dropdown covers only part. |
| **Apply-flow follow-through** (now reachable) | **~15** | Multi-life per-life Proceed, submitted-app fixtures, in-progress statuses, URE answer-mutation. **No longer a hard gate — see "gaps to close now".** |
| Needs multi-agency / historic account state | a few | UI tied to a single agency; some ACs need pre-deployment records. |
| Genuinely external | 1 | Loadings underwriting guide opens an intranet URL outside the app. |

_(Counts approximate — a few ACs share more than one blocker. Full per-AC reasons in the detailed report.)_

## Coverage by story

**Fully covered (100%) — 12 stories:** Landing Online Quoting Tool · Create a New Business Quote ·
Premium Details · Personal Standalone TPD · Personal Cancer · Acd. Death · Needlestick · Personal
Specific Injury · Business Expenses · Discounts & Bundling · **Kids Cover (was 78%)** ·
**Occupation (was N/A / 0%)**. _(Business Trauma & Business Standalone TPD each sit at 94–96% with 1
residual note.)_

**Partially covered — most work remaining:**

| Story | Covered | Deferred (cause) |
|---|---|---|
| Occupational Codes | 27% | 22 (named-occupation data) |
| Landing: In Progress Table | 21% | 15 (seeded data) |
| Personal Disability — Mortgage & Living | 50% | 15 (pricing values) |
| Personal Disability — Income Protection | 54% | 11 (pricing values) |
| Business Life + Additional | 66% | 11 (sub-cover structure / pricing) |
| Saved Quote / Application Navigation | 33% | 10 (seeded data — Apply-flow half now reachable) |
| Select Default Commission Category | 74% | 7 (historic data / backend — Apply-gate half now clearable) |
| Multi Lives and Policies | 79% | 6 (multi-life build + per-life Proceed) |
| Enter Commissions | 58% | 5 (overlaps commission spec) |
| Save Quote / Save As New | 62% | 5 (seeded data) |
| Clone Quote | 0% | 5 (submitted-app fixture — now producible) |
| Navigation Behaviour | 50% | 2 (URE answer-mutation) |

_(remaining partials each have 1–4 deferred.)_

**No longer "out of quote-screen scope":** Occupation (now 100%) and Navigation Behaviour (now 50%)
are covered against the real, driveable Apply flow. Only **Clone Quote** remains fully deferred — and
on a **data-fixture** basis (a seeded submitted application), not because the flow is unreachable.
