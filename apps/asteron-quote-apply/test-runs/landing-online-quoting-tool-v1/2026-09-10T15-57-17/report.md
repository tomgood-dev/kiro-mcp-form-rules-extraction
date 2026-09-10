# landing online quoting tool — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-online-quoting-tool-v1.spec.js`
**Run:** 2026-09-10T15-57-17 · Edge headless · 1.7 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 2 passed, 0 failed

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Landing page: Online Quoting Tool (ACB-2239) › AC02/AC03: from the portal I can navigate to the New Business Quoting Tool UI | ✅ Passed |
| 2 | Landing page: Online Quoting Tool (ACB-2239) › AC01: the quoting tool is accessed via the Adviser Portal login (login URL is served) | ✅ Passed |

---

## What Each Passing Test Checked

<details>
<summary>✅ Landing page: Online Quoting Tool (ACB-2239) › AC02/AC03: from the portal I can navigate to the New Business Quoting Tool UI</summary>

| Check | Expected | Actual |
|---|---|---|
| Adviser Portal dashboard (logged in) | The Adviser Portal dashboard is displayed for the logged-in adviser. | On the Adviser Portal dashboard (https://outsystems-qa.asteronlife.co.nz/AdviserCentral_Uplift/Dashboard?msg=) |
| Open the Quotes menu in the portal navigation | The "Quotes" menu expands and reveals the "Quote & Apply" navigation item. | "Quotes" menu opened; "Quote & Apply" item shown |
| Directed to the New Business Quoting Tool UI | The adviser lands on the New Business Quoting Tool UI. Page shows the "Quotes and Applications" heading and a "New Quote" action; URL contains /QuoteAndApply. | Heading shown: true  \|  New Quote action: true  \|  URL: https://outsystems-qa.asteronlife.co.nz/quoteandapply/ |

</details>

<details>
<summary>✅ Landing page: Online Quoting Tool (ACB-2239) › AC01: the quoting tool is accessed via the Adviser Portal login (login URL is served)</summary>

| Check | Expected | Actual |
|---|---|---|
| Adviser Portal login endpoint is served | The Adviser Portal login endpoint responds successfully (HTTP status < 400). The quoting tool is reached only via the adviser portal, so this endpoint must be served. | HTTP 200 (served OK) |

</details>

---

## Notes

- 2/2 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
