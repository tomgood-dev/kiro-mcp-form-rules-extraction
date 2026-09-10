# landing online quoting tool — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-online-quoting-tool-v1.spec.js`
**Run:** 2026-09-10T15-17-11 · Edge headless · 1.6 min
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
| Landing UI renders with the Quotes and Applications heading | The New Business Quoting Tool landing page renders. The page displays the heading "Quotes and Applications". | Heading "Quotes and Applications" is displayed |
| New Quote call-to-action is available | A "New Quote" button/link is present on the landing page. This is the entry point an adviser clicks to create a new quote. | "New Quote" action is present |
| Browser is on the Quote & Apply tool URL | The adviser is directed to the New Business Quoting tool UI. The URL contains "/QuoteAndApply". | On /QuoteAndApply (https://outsystems-qa.asteronlife.co.nz/QuoteAndApply/) |

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
