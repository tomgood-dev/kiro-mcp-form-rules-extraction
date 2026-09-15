# Occupation — Apply-flow screen (occupation-apply-flow-v1)

- **Test file:** `tests/quote-screen/occupation-apply-flow-v1.spec.js`
- **Last run:** 2026-09-15, QA (`outsystems-qa.asteronlife.co.nz`), ~7 min. 3/4 ACs passing; AC02 confirmed-failing (real discrepancy, expected-to-fail).
- **Source:** `docs/user-stories/User Story- Occupation.md` (acceptance-criteria mode). Reachability + navigation confirmed live via `probes/probe-occupation-screen-2026-09-15.js`; full apply-flow evidence in `docs/apply-flow-end-to-end-2026-09-15.md`.
- **Result:** AC01/AC03/AC04 pass; AC02 fails on purpose (spec fields absent from the live screen).

## Results

| # | AC | What's Tested | Test Input | Expected | Status | Notes |
|---|----|---------------|-----------|----------|--------|-------|
| 1 | — | Reached the Occupation screen | Priced Life quote → Apply → ... → Insurance&Financial → Next | section = OCCUPATION | ✅ Pass | Occupation is the page between Insurance History and Financial. |
| 2 | AC01 | Occupation captured on the application | Accountant (quote-screen occupation) | "Principal Occupation: <name>" shown in section header | ✅ Pass | Carried from the quote screen; header reads "Principal Occupation: Accountant - not university-qualified. Employment status: Employee". |
| 3 | AC03 | Previous → Insurance History | Click Previous on OCCUPATION | section = INSURANCE HISTORY | ✅ Pass | Confirmed live. |
| 4 | AC04 | Next → Income | Answer occupation No, click Next | section = FINANCIAL (income question) | ✅ Pass | The "Income screen" the story means is the FINANCIAL page ("What is your annual earned income?"). |
| 5 | AC02 | Offers dropdown / Employer / Country / Address ON the Occupation screen | Read OCCUPATION page for those fields | Fields present (spec) | ❌ Fail | **Discrepancy (expected-fail).** The live OCCUPATION page asks only hazardous-duties. The "applying for offers" dropdown, Employer name, Country, Address are NOT on this screen. Occupation name+code are captured on the quote screen. Test asserts the spec's expected value so it goes green if these fields are added. |

## Discrepancy (AC02)

- **AC / Rule ID:** AC02
- **Verbatim requirement:** "Then I must be able to capture the following information for my client - Are you applying for any of the following offers (Dropdown - Not applicable / Dentists & Dental Surgeons) - Name of the Employer - Country (Dropdown) - Address"
- **Reproduction:** reach the OCCUPATION page (Insurance & Financial Details) as in the steps above; read the page.
- **Expected:** an "applying for offers" dropdown, Employer name, Country dropdown, and Address field on the Occupation screen.
- **Actual:** the OCCUPATION page contains only the hazardous-duties question ("As part of your job, are you involved in any of the following?"). No offers dropdown / Employer / Country / Address. Occupation name + code were captured on the quote screen and are shown here as a read-only "Principal Occupation: <name>" header.
- **Environment:** QA, account a, 2026-09-15.
- **Test encoding:** `expect(ac02.offersDropdown).toBe(true)` + `expect(ac02.employer).toBe(true)` in this spec — expected-to-fail until the app adds these fields (or the story is reconciled with the BA).

## Deferred

None — all four ACs are now encoded (3 passing assertions + 1 expected-fail). Reachability is no longer a blocker (the earlier "address-service / payment-gated" deferrals were wrong; see `docs/apply-flow-end-to-end-2026-09-15.md`).
