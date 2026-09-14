# Quote-Screen Coverage — Summary

*Simplified view of `coverage-gaps-2026-09-11.md`. Scope: quote screen. Date: 2026-09-11.*

## The numbers

| | ACs | Share |
|---|---|---|
| ✅ **Covered** (runs — passing or expected-fail) | 384 | ~80% |
| ⏸️ **Deferred** (documented reason, work still to do) | 92 | ~19% |
| ❌ **Missing** (silent gap — should be closed) | 2 | ~0.4% |
| **Total** | **478** | across 33 stories |

**Bottom line:** ~80% of quote-screen acceptance criteria are covered. The remaining ~20% is
almost entirely *deferred with a known reason* — not overlooked. Only **2 ACs** are true gaps.

## The one real gap to close now

- **Kids Cover AC08 & AC09** — per-kid premium calculation and the single aggregated "Kids"
  premium line. Both are on-screen behaviours (testable today) but currently have no test. This
  is the only silent omission on the quote screen.

## Why the 92 deferred ACs aren't done yet (grouped by cause)

| Blocker | ~ACs | What would unblock it |
|---|---|---|
| **Needs pricing-engine reference values** | ~30 | The day-2 tax-tier pricing figures (disability cover benefit calcs) — can't be hand-verified without them. |
| **Needs seeded test data** | ~30 | Saved quotes / landing-table rows in specific statuses. QA accounts start empty; the saved-quote reopen isn't reliably cracked. |
| **Needs the Apply flow / backend** | ~15 | Screens past the quote screen (Client Summary, submitted applications, STP/LIFE400 payloads). *Note: the Apply flow was since proven reachable — some of these are now re-testable.* |
| **Needs named-occupation data** | ~22 | The occupation typeahead needs a reference list of occupation names → codes (single-letter code dropdown only covers part). |
| **Needs multi-agency / historic account state** | a few | UI tied to a single agency; some ACs need pre-existing (pre-deployment) records. |
| **Genuinely external** | 1 | Opens an intranet URL outside the app (Loadings underwriting guide). |

*(Counts are approximate — a few ACs share more than one blocker. Full per-AC reasons are in the detailed report.)*

## Coverage by story

**Fully covered (100%) — 11 stories:** Landing Online Quoting Tool · Create a New Business Quote ·
Premium Details · Personal Standalone TPD · Personal Cancer · Acd. Death · Needlestick ·
Personal Specific Injury · Business Expenses · Discounts & Bundling · (Business Trauma effectively).

**Partially covered — most work remaining:**

| Story | Covered | Deferred |
|---|---|---|
| Occupational Codes | 27% | 22 (named-occupation data) |
| Landing: In Progress Table | 21% | 15 (seeded data) |
| Personal Disability — Mortgage & Living | 50% | 15 (pricing values) |
| Personal Disability — Income Protection | 54% | 11 (pricing values) |
| Business Life + Additional | 66% | 11 (sub-cover structure / pricing) |
| Saved Quote / Application Navigation | 33% | 10 (seeded data / Apply flow) |
| Multi Lives and Policies | 72% | 8 (Apply flow) |
| Enter Commissions | 58% | 5 (overlaps commission spec) |
| Save Quote / Save As New | 62% | 5 (seeded data) |
| Select Default Commission Category | 74% | 7 (historic data / backend) |
| *(remaining partials each have 1–4 deferred)* | | |

**Out of quote-screen scope (whole story sits on the Apply flow):** Occupation · Clone Quote ·
Navigation Behaviour.

---

*Full detail — every AC, every verbatim deferral reason — is in `coverage-gaps-2026-09-11.md`.*
