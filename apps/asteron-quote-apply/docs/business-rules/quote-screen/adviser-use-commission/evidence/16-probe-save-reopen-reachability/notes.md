# 16 — probe-save-reopen-quote / probe-open-saved-quote (AC18, AC20–AC25 reachability)

- **Date/time:** 2026-08-31 ~11:00
- **Commands:** `node apps/asteron-quote-apply/probes/probe-save-reopen-quote.js`,
  `node apps/asteron-quote-apply/probes/probe-open-saved-quote.js`
- **Goal:** Determine which of the "existing/saved quotes & applications" ACs (AC18, AC20–AC25)
  are reachable from the browser vs genuinely blocked — probe first, per steering Rule #7.

## What the probes found

1. **Save capability EXISTS.** The quote screen has both **"Save"** and **"Save as New"** actions.
   Clicking "Save" reveals a save form with `Input_Reference` ("Add Reference (Optional)") plus the
   full client-detail set (First/Last name, DOB, Age, Gender button-group, Occupation, Employment
   status, income) and the whole commission section (Default for Agency, **Select IC/RC**,
   **Select All**, **per-cover Life Cover** category). Saving requires a *fully valid* client — an
   incomplete client returns `"You must complete the following fields: Gender & Age Next Birthday."`
   (same completeness bar as the Apply gate). → **Saving a quote with a chosen IC/RC + category is
   possible.**

2. **A dashboard "Quotes and Applications" list of EXISTING saved quotes/applications EXISTS.** On
   one populated capture, the landing page listed real rows with columns Adviser No. / Adviser /
   Client name / Last Modified / Status / Reference, e.g.:
   - `1980  ARGIRIOS VISI  qwer qwer  16/04/2026  APPLICATION IN PROGRESS`
   - `2066  ANNWYN WAIRAMA  Test Annwyn  14/03/2026  QUOTE`
   Plus a **Status filter** (`<select>` with Expired / Quote / Pre application / Submitted /
   Application in progress) and a **"Refresh content"** button and page-size selector.
   → The raw material for AC20/AC21/AC23/AC24/AC25 (existing quotes AND applications) is present.

3. **Row-open mechanism NOT yet cracked.** The list rows are **not** plain links — no
   `/QuoteAndApply/Quote?QuoteId=…` anchors exist; rows open via a JS list-widget click handler.
   The list is also **async/lazy-loaded**: it was populated on the first probe run but empty
   (dates/names absent from the DOM) on later runs within an 8s wait — it likely needs the
   "Refresh content" action or a networkidle wait to populate. No iframe (single frame). So opening
   a specific saved row is feasible but requires (a) reliably waiting for/refreshing the list and
   (b) driving the widget's row click — not yet nailed down.

## Reachability verdict per AC

| AC | Verdict | Basis |
|----|---------|-------|
| AC18 (save IC/RC → reopen shows same) | **Reachable** (not blocked) | Save works and carries IC/RC + category; needs row-open cracked to re-read |
| AC22 (new quote gets agency default applied) | **Readily testable now** | A fresh quote's Adviser Use shows the default with no save/reopen needed |
| AC23 (open existing quote, change & save) | **Reachable** | Existing QUOTE rows present; needs row-open |
| AC24 (open existing unsubmitted application, change & save) | **Reachable** | "APPLICATION IN PROGRESS" rows present; needs row-open |
| AC25 (existing selections shown as saved) | **Reachable** | Same as AC23 — needs row-open |
| AC20 (quotes created BEFORE deployment unchanged) | **Partially blocked** | "Before the feature was deployed" precondition can't be manufactured now (feature already live); only verifiable by inspecting genuinely pre-deployment rows |
| AC21 (unsubmitted apps created BEFORE deployment unchanged) | **Partially blocked** | Same temporal-precondition limitation as AC20 |
| AC26 (data integrity post-deployment) | **Blocked** | Backend/DB verification, no browser path |
| AC27 (STP/LIFE400 payload) | **Blocked** | Backend payload inspection, no browser path |

## Next step to fully unblock AC18/AC22/AC23/AC24/AC25

Crack the list row-open: wait for `networkidle` (or click "Refresh content"), then locate a data
row by its Reference/Client-name text and invoke the widget's row action; confirm the quote screen
loads with a non-empty internal QuoteId. AC22 can be written immediately (no save/reopen needed).
