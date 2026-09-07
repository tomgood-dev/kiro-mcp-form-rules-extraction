# Landing Page: In Progress Quotes Table — Test Documentation

- **Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-in-progress-quotes-table-v1.spec.js`
- **Last run:** 2026-09-08 · QA (`https://outsystems-qa.asteronlife.co.nz`) · ~2 min · 10 tests
- **Source:** Acceptance-criteria mode — Jira ACB-3570 (`docs/user-stories/User Story- Landing Page- In Progress Quotes Table.md`)
- **Result:** 4/10 passing, 6 deferred (empty table on the QA test accounts)

## Results

| # | AC(s) | What's Tested | Test Input | Expected | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | AC01 | In Progress UI: search box, status filter, New Quote, entries 10/20/50/100, table columns | Land on /QuoteAndApply/ | Unified search + status filter + New Quote + Show items 10/20/50/100 + 6 columns | ✅ Pass | Value-level: placeholder, entries list, column header |
| 2 | AC02 (statuses) | Status filter exposes all documented statuses | Read status filter | Quote/Pre application/Submitted/App-in-progress/…with TIV/Expired | ✅ Pass | |
| 3 | AC04 | Refresh content control present | Land on page | fa-refresh control present | ✅ Pass | |
| 4 | AC09 | Entries selector offers 10/20/50/100 and is settable | Read + set to 100 | Options 10/20/50/100; accepts 100 | ✅ Pass | |
| 5 | AC03 | Select agency then create quote | — | — | 🚫 Deferred | No agency select present (single-agency account) |
| 6 | AC02/AC10-13 | Row ordering + status-dependent row-open routing | — | — | 🚫 Deferred | No data rows |
| 7 | AC05-08 | Delete "Quote" rows via checkbox + confirm popup | — | — | 🚫 Deferred | No data rows |
| 8 | AC14-16 | Multi-life records expand/collapse | — | — | 🚫 Deferred | No multi-life rows |
| 9 | AC17 | Three-dots menu options by status | — | — | 🚫 Deferred | No data rows / no Submitted rows |
| 10 | AC18/19 | Return-to-landing popup (Proceed/Cancel) | — | — | 🚫 Deferred | Needs active-quote + reliable saved-row context |

## Deferred

| AC(s) | Reason |
|---|---|
| AC03 | Probe 2026-09-08 found no agency `<select>` on the landing page — only the status filter and the "Show items" selector. The test account is evidently tied to a single agency, so the multi-agency selection UI does not render. Reachable only on a multi-agency account. (The "create quote" half is covered by New Quote in AC01.) |
| AC02 (ordering), AC10, AC11, AC12, AC13 | The In Progress table has ZERO data rows on the QA test accounts (DOM dump: only the header row, body ~315 chars; clicking the fa-refresh anchor + setting 100 entries + polling 45s did not populate rows). Row ordering and status-dependent row-open routing need persisted rows across the statuses. |
| AC05, AC06, AC07, AC08 | Delete checkbox + confirm popup ("Are you sure you want to delete X lives?") require at least one "Quote"-status data row (and multi-life rows for the dynamic "X lives" count). Table is empty on the test accounts. |
| AC14, AC15, AC16 | Multi-life expand/collapse requires a persisted multi-life record. Table is empty. |
| AC17 | The three-dots menu is per-row; no data rows (and no Submitted rows) on the test accounts, so status-specific menu options can't be read. |
| AC18, AC19 | The return-to-landing popup triggers when navigating from an active quote back to the landing to open another — depends on the not-reliably-cracked saved-row open and a persisted quote to return to (post-save QuoteId empty + empty landing list, probe 2026-09-08). |
