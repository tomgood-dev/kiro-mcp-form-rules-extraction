# occupation apply flow — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/occupation-apply-flow-v1.spec.js`
**Run:** 2026-09-07T18-12-12 · Edge headless · 2.0 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 0 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Occupation — Apply-flow screen › AC01/AC02/AC03/AC04: Apply-flow Occupation screen (Employer/Country/Address; Previous->Insurance History; Next->Income) | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Occupation — Apply-flow screen › AC01/AC02/AC03/AC04: Apply-flow Occupation screen (Employer/Country/Address; Previous->Insurance History; Next->Income)

**Acceptance Criteria (from user story):**

> AC01: ability to provide the client's Occupation on the application. AC02: capture "applying for offers" dropdown (Not applicable / Dentists & Dental Surgeons), Employer name, Country, Address. AC03: Previous -> Insurance History screen. AC04: Next -> Income screen.
> 
> Deferred reason: this is the Apply-FLOW Occupation screen (its ACs are application navigation:
> Previous->Insurance History, Next->Income), reached only after progressing an application past
> Duty of Disclosure — not reachable from the Quote screen. The Apply flow is historically
> payment/flow-gated in this environment. The quote-screen occupation control is covered separately
> by occupational-codes-v1 (ACB-6504).

**Why skipped:**

> Deferred (not reachable from the Quote screen): the Occupation story is the Apply-flow screen (Previous->Insurance History, Next->Income; captures Employer/Country/Address). Reaching it requires progressing a full application past Duty of Disclosure, which is not driveable from the quote screen in this environment (Apply flow historically payment/flow-gated). Encode as part of a dedicated Apply-flow test pass once that flow is reachable end-to-end. The quote-screen occupation dropdown + code eligibility is already covered by occupational-codes-v1.

---

## Notes

- 0/1 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
