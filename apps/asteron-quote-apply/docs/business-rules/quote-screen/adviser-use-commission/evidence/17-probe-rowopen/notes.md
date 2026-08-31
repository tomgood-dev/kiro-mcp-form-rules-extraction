# 17 — probe-rowopen (dashboard "Quotes and Applications" row-open investigation)

- **Date/time:** 2026-08-31 ~12:10
- **Command:** `node apps/asteron-quote-apply/probes/probe-rowopen.js` (run ~6 times with escalating triggers)
- **Goal:** Crack the dashboard list row-open so AC18/AC23/AC24/AC25 can read/modify a saved quote.

## Structure — CONFIRMED

The "Quotes and Applications" list is a **real HTML `<table>`**: the client/date/status cells are
`SPAN > TD > TR > TBODY > TABLE` (verified via the date-cell ancestor chain). Rows are `<tr>` with
`class="table-row"`, each containing several `<a>` anchors (client-name link + action links) and
`<i>` icons. So identifying and clicking a row is straightforward *once the rows are rendered*.

The dashboard filters are two `<select>`s: a **Status** filter (Status / Expired / Application in
progress - with Teleinterview / Quote / Pre application / Submitted / Application in progress) and a
**page-size** (10/20/50/100). There is no Adviser `<select>` (the "Adviser Select…" is a typeahead).

## Blocker — list rows render UNRELIABLY under automation

The `<tr>` data rows populate only **intermittently** in the automated (headed msedge, slowMo)
session:
- Two early ad-hoc runs DID capture populated rows (e.g. `1980 ARGIRIOS VISI qwer qwer 16/04/2026
  APPLICATION IN PROGRESS`, `2066 ANNWYN WAIRAMA Test Annwyn 14/03/2026 QUOTE`) and the `<table>`
  structure.
- But ~6 subsequent runs found **no dated `<tr>`** — only the header/filter chrome renders; the
  data rows never appear within the wait.

Triggers tried, none reliably populated the rows:
1. `waitForLoadState('networkidle')` (up to 25s).
2. Clicking **"Refresh content"** up to 6×, 6s apart.
3. `waitForFunction` polling for any `<tr>` containing a `dd/mm/yyyy` date (8s each, 6 attempts).
4. Selecting an adviser-like option via dispatchEvent.
5. Explicit native `selectOption` Status = **Quote** and page-size = **100**.

## Conclusion

Row identification/click is NOT the blocker — the list DOM is a plain table we can drive. The
blocker is **list-render reliability**: the data-row load intermittently fails to complete under
automation (header renders, rows don't). This is the same *class* of environment flakiness already
documented for this app (sustained-session-load hangs, forced logouts, session conflicts — see the
"Environment finding" section of the adviser-use-commission page.md), not a selector/logic issue.

**Verdict update for AC18/AC23/AC24/AC25:** reachable *in principle* (Save exists; the list is a
plain table), but **blocked in practice** by unreliable list-row rendering under automation. To
pursue later: retry against a lighter-loaded environment / a dedicated account, or drive the list
via its underlying data endpoint rather than the rendered widget. AC22 (no save/reopen needed)
remains the one in this group that is encoded and passing.
