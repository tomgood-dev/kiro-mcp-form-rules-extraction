# landing in progress quotes table — Test Run Report

**Test file:** `apps/asteron-quote-apply/tests/quote-screen/landing-in-progress-quotes-table-v1.spec.js`
**Run:** 2026-09-08T11-10-37 · Edge headless · 2.5 min
**Environment:** https://outsystems-qa.asteronlife.co.nz
**Result:** 4 passed, 0 failed, 6 skipped

---

## Results

| # | Test | Status |
|---|---|---|
| 1 | Landing Page: In Progress Quotes Table (ACB-3570) › AC01: In Progress Quotes UI — search box, status filter, New Quote, entries selector (10/20/50/100), table columns | ✅ Passed |
| 2 | Landing Page: In Progress Quotes Table (ACB-3570) › AC01/AC02 (statuses): the status filter offers all documented quote/application statuses | ✅ Passed |
| 3 | Landing Page: In Progress Quotes Table (ACB-3570) › AC04: a "Refresh content" control is present to reload the table | ✅ Passed |
| 4 | Landing Page: In Progress Quotes Table (ACB-3570) › AC09: the entries-per-page selector offers 10/20/50/100 and is settable | ✅ Passed |
| 5 | Landing Page: In Progress Quotes Table (ACB-3570) › AC03: select agency then click create quote | ⏭️ Skipped |
| 6 | Landing Page: In Progress Quotes Table (ACB-3570) › AC02/AC10/AC11/AC12/AC13: row ordering + open a row by status (Quote→quote page, Pre-App→client summary, App-in-progress[/TIV]→Duty of Disclosure) | ⏭️ Skipped |
| 7 | Landing Page: In Progress Quotes Table (ACB-3570) › AC05/AC06/AC07/AC08: delete "Quote"-status rows via checkbox + confirm popup ("Are you sure you want to delete X lives?") | ⏭️ Skipped |
| 8 | Landing Page: In Progress Quotes Table (ACB-3570) › AC14/AC15/AC16: multi-life records expand/collapse (highest-progressed status; per-life records; per-life delete/reference) | ⏭️ Skipped |
| 9 | Landing Page: In Progress Quotes Table (ACB-3570) › AC17: three-dots menu options by status (Quote: Edit/Delete; Submitted: Download Application/Client Application/Confirmation/Declaration/Quote + Clone Quote; other: Edit) | ⏭️ Skipped |
| 10 | Landing Page: In Progress Quotes Table (ACB-3570) › AC18/AC19: return-to-landing popup (Proceed / Cancel) when opening further quotes from an active quote | ⏭️ Skipped |

---

## Skipped / Blocked Tests — Detail

### ⏭️ Landing Page: In Progress Quotes Table (ACB-3570) › AC03: select agency then click create quote

**Acceptance Criteria (from user story):**

> AC03: on the landing page I should be able to select my agency (one adviser can be associated with multiple agencies) and click create quote.

**Why skipped:**

> Deferred (control not present for this account): probe 2026-09-08 found only the status filter and the "Show items" selector on the landing page — no agency <select> was present. This test account appears tied to a single agency, so the multi-agency selection UI does not render. Reachable only on a multi-agency account. (The "create quote" half is covered by the New Quote action in AC01.)

---

### ⏭️ Landing Page: In Progress Quotes Table (ACB-3570) › AC02/AC10/AC11/AC12/AC13: row ordering + open a row by status (Quote→quote page, Pre-App→client summary, App-in-progress[/TIV]→Duty of Disclosure)

**Acceptance Criteria (from user story):**

> AC02: rows show most-recent-first with each status; AC10-13: clicking a row opens it by status — "Quote"→Quote page prepopulated, "Pre Application"→client summary, "Application In Progress" / "…with Teleinterview"→Duty of Disclosure.

**Why skipped:**

> Deferred (no data rows): probe 2026-09-08 DOM dump found the In Progress table has ZERO data rows on the QA test accounts (only the header row; body ~315 chars) — clicking the fa-refresh anchor, setting 100 entries, and polling 45s did not populate any rows. Row ordering (AC02) and status-dependent row-open routing (AC10-13) cannot be exercised without persisted quote/application rows in each status. Reachable once the test accounts have seeded quotes/applications across the statuses.

---

### ⏭️ Landing Page: In Progress Quotes Table (ACB-3570) › AC05/AC06/AC07/AC08: delete "Quote"-status rows via checkbox + confirm popup ("Are you sure you want to delete X lives?")

**Acceptance Criteria (from user story):**

> AC05: tick checkbox for "Quote"-status rows to delete; AC06: clicking delete shows "Are you sure you want to delete X lives? Deleted lives cannot be recovered" (X dynamic by lives) with Cancel/Delete; AC07: Delete removes the row + refreshes; AC08: Cancel returns with the checkbox ticked.

**Why skipped:**

> Deferred (no data rows): the delete checkbox + confirm popup require at least one "Quote"-status data row. Probe 2026-09-08 confirmed the table is empty on the QA test accounts (only a header checkbox present, no per-row checkboxes; zero data rows). The dynamic "X lives" count in the confirm message also needs real multi-life rows. Reachable once seeded "Quote"-status rows exist.

---

### ⏭️ Landing Page: In Progress Quotes Table (ACB-3570) › AC14/AC15/AC16: multi-life records expand/collapse (highest-progressed status; per-life records; per-life delete/reference)

**Acceptance Criteria (from user story):**

> AC14-16: a multi-life record can be expanded to show individual per-life records (each with its own status, a delete checkbox only if "Quote", and an add/update reference), and collapsed to show the main record with the highest-progressed status and all life names, searchable by any life name, with no Reference on the collapsed main record.

**Why skipped:**

> Deferred (no data rows): requires a persisted MULTI-LIFE quote/application row to expand/collapse. Probe 2026-09-08 confirmed the table is empty on the QA test accounts. Reachable once a seeded multi-life record exists.

---

### ⏭️ Landing Page: In Progress Quotes Table (ACB-3570) › AC17: three-dots menu options by status (Quote: Edit/Delete; Submitted: Download Application/Client Application/Confirmation/Declaration/Quote + Clone Quote; other: Edit)

**Acceptance Criteria (from user story):**

> AC17: the per-row three-dots menu shows Edit/Delete for "Quote"; Download Application/Client Application/Confirmation/Declaration/Quote + Clone Quote for "Submitted"; Edit for other statuses.

**Why skipped:**

> Deferred (no data rows): the three-dots menu is a per-row control; probe 2026-09-08 confirmed zero data rows on the QA test accounts (and zero Submitted rows), so the status-specific menu options cannot be read. Reachable once seeded rows exist in the "Quote" and "Submitted" statuses.

---

### ⏭️ Landing Page: In Progress Quotes Table (ACB-3570) › AC18/AC19: return-to-landing popup (Proceed / Cancel) when opening further quotes from an active quote

**Acceptance Criteria (from user story):**

> AC18: when working on a quote and returning to the landing page to open/create another quote, a popup is shown; AC19: Proceed navigates to the new/saved quote, Cancel keeps the user in the current quote.

**Why skipped:**

> Deferred (needs an active-quote + reliable saved-row context): AC18/19 trigger when navigating from an in-progress quote back to the landing and opening another — which depends on the not-reliably-cracked saved-row open and a persisted quote to return to (probe 2026-09-08: post-save QuoteId empty + empty landing list). Reachable once the saved-quote open + a reliable active-quote-return context are established.

---

## What Each Passing Test Checked

<details>
<summary>✅ Landing Page: In Progress Quotes Table (ACB-3570) › AC01: In Progress Quotes UI — search box, status filter, New Quote, entries selector (10/20/50/100), table columns</summary>

| Check | Expected | Actual |
|---|---|---|
| Search box present | true | true |
| Search box placeholder | Search Quotes And Applications | Search Quotes And Applications |
| Status filter present | true | true |
| New Quote action present | true | true |
| Entries selector options | 10/20/50/100 | 10/20/50/100 |
| Table header columns | Adviser No. / Adviser / Client name / Last Modified / Status / Reference | Adviser No. Adviser Client name Last Modified Status Reference |

</details>

<details>
<summary>✅ Landing Page: In Progress Quotes Table (ACB-3570) › AC01/AC02 (statuses): the status filter offers all documented quote/application statuses</summary>

| Check | Expected | Actual |
|---|---|---|
| Status filter options | Quote, Pre application, Submitted, Application in progress, Application in progress - with Teleinterview, Expired | Status \| Expired \| Application in progress - with Teleinterview \| Quote \| Pre application \| Submitted \| Application in progress |

</details>

<details>
<summary>✅ Landing Page: In Progress Quotes Table (ACB-3570) › AC04: a "Refresh content" control is present to reload the table</summary>

| Check | Expected | Actual |
|---|---|---|
| Refresh content control present | true | true |

</details>

<details>
<summary>✅ Landing Page: In Progress Quotes Table (ACB-3570) › AC09: the entries-per-page selector offers 10/20/50/100 and is settable</summary>

| Check | Expected | Actual |
|---|---|---|
| Entries selector options | 10/20/50/100 | 10/20/50/100 |
| Entries selector accepts 100 | 100 | 100 |

</details>

---

## Notes

- 4/10 tests passing, 6 skipped.
- Test assertions are written to the spec's expected behavior — they pass automatically once the app matches the requirement.
