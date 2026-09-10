# landing online quoting tool — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-online-quoting-tool-v1.spec.js`
**Run:** 2026-09-10T14-59-13 · Edge headless · 1.4 min
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
| On the New Business Quoting Tool UI (Quotes and Applications) | true | true |
| New Quote action available | true | true |
| URL is the Quote & Apply tool | true | true |

</details>

<details>
<summary>✅ Landing page: Online Quoting Tool (ACB-2239) › AC01: the quoting tool is accessed via the Adviser Portal login (login URL is served)</summary>

| Check | Expected | Actual |
|---|---|---|
| Adviser Portal login URL served (HTTP status < 400) | status < 400 | 200 |
| Login screen reached | true | true |

</details>

---

## Notes

- 2/2 tests passing.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
