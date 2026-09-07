# early trauma benefit — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/early-trauma-benefit-v1.spec.js`
**Run:** 2026-09-07T18-12-12 · Edge headless · 4.2 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 1 passed, 0 failed, 1 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Early Trauma Benefit (ACB-10105) › AC00 (reachable part): Early Trauma Benefit is a selectable option on a Trauma cover | ✅ Passed |
| 2 | Early Trauma Benefit (ACB-10105) › AC01/AC02/AC03/AC04/AC05: calculated Early Trauma SI (20% / min $10k / max $100k) + PDF/L400 | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Early Trauma Benefit (ACB-10105) › AC01/AC02/AC03/AC04/AC05: calculated Early Trauma SI (20% / min $10k / max $100k) + PDF/L400

**Acceptance Criteria (from user story):**

> AC01-AC04: Early Trauma SI = (<=10k -> =Trauma SI; 10-50k -> 10k; >50k -> 20% of Trauma SI capped $100k). AC05: correct SIs shown in the PDF and sent to L400.

**Why skipped:**

> Deferred (not browser-reachable): probe 2026-09-07 confirmed the calculated Early Trauma Benefit SI is NOT surfaced on the quote screen — ticking the Early Trauma checkbox did not add/display an Early Trauma SI input (the only SI input still showed the Trauma SI). Per the story AC05, the Early Trauma SI is delivered via the PDF / L400 (backend). So the SI-calc rules (AC01-AC04) and the PDF/L400 output (AC05) cannot be asserted from the browser quote screen. Verify via a generated PDF / an L400 payload capture (backend/document test), outside this browser suite. The reachable checkbox behaviour is covered by AC00 above.

---

## What Each Passing Test Checked

<details>
<summary>✅ Early Trauma Benefit (ACB-10105) › AC00 (reachable part): Early Trauma Benefit is a selectable option on a Trauma cover</summary>

| Check | Expected | Actual |
|---|---|---|
| Early Trauma Benefit checkbox present + default unticked | present, unticked | {"checked":false,"disabled":false} |
| Early Trauma Benefit can be ticked | true | true |

</details>

---

## Notes

- 1/2 tests passing, 1 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
