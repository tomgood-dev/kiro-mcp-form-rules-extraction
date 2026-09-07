# landing inflight quotes — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-inflight-quotes-v1.spec.js`
**Run:** 2026-09-08T09-26-54 · Edge headless · 2.0 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 2 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Landing page: Inflight Quotes › AC01: clicking quote & apply lands on the New Business Quoting Tool UI | ✅ Passed |
| 2 | Landing page: Inflight Quotes › AC02: inflight quotes with all statuses can be viewed (the status filter exposes every status) | ✅ Passed |
| 3 | Landing page: Inflight Quotes › AC03/AC04: 45-day expiry (Application-in-progress/Pre-App expire; Quote >45 days shows rate-change validation) | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Landing page: Inflight Quotes › AC03/AC04: 45-day expiry (Application-in-progress/Pre-App expire; Quote >45 days shows rate-change validation)

**Acceptance Criteria (from user story):**

> AC03: an Application in Progress / …with TIV / Pre Application more than 45 days from last-modified expires (status "Expired"). AC04: a "Quote" more than 45 days old does not expire, but if premium rates/cover types have changed a validation message pops up on re-entry.

**Why skipped:**

> Deferred (time-dependent, not manufacturable): AC03/AC04 depend on records whose last-modified date is more than 45 days in the past (to trigger expiry / the stale-rate validation). This elapsed-time state cannot be created on demand from the browser, and the QA test accounts have no such aged records (the In Progress table is empty — probe 2026-09-08). Reachable only with seeded records backdated >45 days, or a backend clock/date fixture.

---

## What Each Passing Test Checked

<details>
<summary>✅ Landing page: Inflight Quotes › AC01: clicking quote & apply lands on the New Business Quoting Tool UI</summary>

| Check | Expected | Actual |
|---|---|---|
| On the quoting tool UI (Quotes and Applications) | true | true |
| New Quote action available | true | true |

</details>

<details>
<summary>✅ Landing page: Inflight Quotes › AC02: inflight quotes with all statuses can be viewed (the status filter exposes every status)</summary>

| Check | Expected | Actual |
|---|---|---|
| Inflight statuses available in filter | Quote, Pre application, Submitted, Application in progress, Application in progress - with Teleinterview, Expired | Status \| Expired \| Application in progress - with Teleinterview \| Quote \| Pre application \| Submitted \| Application in progress |

</details>

---

## Notes

- 2/3 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
