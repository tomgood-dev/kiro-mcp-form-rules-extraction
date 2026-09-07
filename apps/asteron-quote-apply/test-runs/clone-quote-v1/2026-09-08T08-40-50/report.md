# clone quote — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/clone-quote-v1.spec.js`
**Run:** 2026-09-08T08-40-50 · Edge headless · 2.0 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 0 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Clone Quote (ACB-5748) › AC01/AC02/AC03/AC04/AC05: clone a submitted application (prepopulated quote; birthday-locked variant; Apply Now uses quote-level data only) | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Clone Quote (ACB-5748) › AC01/AC02/AC03/AC04/AC05: clone a submitted application (prepopulated quote; birthday-locked variant; Apply Now uses quote-level data only)

**Acceptance Criteria (from user story):**

> AC01: when an application has been submitted, I can select the option to Clone the quote for it.
> AC02: clicking Clone Quote on the landing page successfully clones the quote.
> AC03: the cloned quote is displayed with Personal Details, all covers/options (personal+business), Kids Cover, Premium & Frequency, Discounts, Commissions & Loadings prepopulated, and I can Apply Now.
> AC04: if a client had a birthday before the Clone action, the cloned quote is prepopulated AND greyed out with the "quote is locked … select CREATE NEW" message.
> AC05: after cloning, Apply Now uses only quote-level data (no prior application answers/interview/personal details/payment).
> 
> Deferred reason: PC01 requires a SUBMITTED application. Probe 2026-09-08 — the landing status filter
> includes "Submitted" but returned ZERO submitted rows on the test account; creating one requires the
> full Apply → Payment → Submit flow (payment-gated). Clone is a landing-page action on a submitted
> application and cannot be reached from the quote screen without that submission.

**Why skipped:**

> Deferred (not reachable): PC01 is a Submitted application. Probe 2026-09-08 found 0 rows under the landing "Submitted" status filter, and producing a submitted application requires the full Apply+Payment+Submit flow (payment-gated in this environment). Clone Quote therefore has no browser path here. Reachable once a submitted-application fixture exists on a test account (or the payment gate is bypassable in a test env), then encode AC01-AC05 against a real cloned quote.

---

## Notes

- 0/1 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
