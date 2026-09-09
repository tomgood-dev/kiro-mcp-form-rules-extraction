# Apply-Flow Reachability Investigation (2026-09-09)

> Autonomous live exploration on QA to determine whether the Apply / underwriting flow (Duty of
> Disclosure → Insurance History → Doctor/Owner Details → URE → Payment → Submit) can be driven from
> automation, and if not, exactly what blocks it. Network-level evidence, not inference.

## Question
Can we progress past the quote screen into the application flow, so the remaining ~Apply-flow user
stories can be tested rather than deferred?

## Method
Headless Playwright probes (each ~5-6 min due to OutSystems round-trips), building a COMPLETE quote
(ANB/gender/occupation-code + occupation NAME via typeahead + employment status + names + Life $500k),
then attempting to Save and Apply, capturing URL, DOM, and **network POSTs** at each step.

## Findings (evidence-backed)

1. **A fresh quote always opens `ShowApplyNow=false` with an empty `QuoteId`.**
   Confirmed the app's OWN "New Quote" link (captured via the window.open it fires) opens
   `/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`
   — **identical** to our test helper's fallback URL. So the static URL was never the problem; that IS
   how a new quote opens.

2. **Forcing `ShowApplyNow=true` on an empty QuoteId CRASHES the app** — "index out of bounds, index 0
   for empty list". Apply-mode needs a real saved QuoteId; you cannot force it on a blank quote.

3. **The Apply button is inert on an unsaved quote** — clicking it fires NO server action, shows NO
   error, changes NO URL. Not a validation block; the button simply isn't wired to do anything yet.

4. **Save works — but only when the CORRECT button is clicked.** The Save popup contains TWO "Save"
   buttons: the quote-screen action behind the modal (`btn ThemeGrid_MarginGutter`) and the popup's real
   one (**`btn btn-primary`**). Clicking the `btn-primary` one fires
   `screenservices/QuoteAndApply/MainFlow/Quote/**ActionSaveQuote** [200]` — a genuine, successful save.
   (Earlier "click the last Save" logic hit the wrong element and fired only field-recalc calls, no save
   — the reason prior Save/Saved-Quote-Nav probes saw "QuoteId stayed empty".)

5. **A successful save does NOT put a QuoteId in the URL, and does NOT enable Apply.** After a confirmed
   `ActionSaveQuote [200]`: URL still `QuoteId=&ShowApplyNow=false`, and clicking Apply STILL fires no
   action (`APPLY_NET []`). So save-in-place is not sufficient to reach apply-mode.

## Conclusion — where the wall really is
The Apply flow is gated behind opening the quote **with its QuoteId in an apply-enabled context**
(`ShowApplyNow=true`), which a fresh/just-saved-in-place quote never has. The remaining path to test is:
**save (now works) → REOPEN the saved quote from the landing list** (which should load it by QuoteId in
apply-mode) → then Apply. That reopen depends on the **landing-list row-open**, which is the *same*
unsolved, flaky mechanism blocking Save/Saved-Quote-Navigation (list lazily populates / often empty on
the QA test accounts; row-open into a quote not cracked).

**So: Apply-flow reachability = (save ✔ solved) + (reopen-from-list-with-QuoteId ✖ still blocked).**
Until the landing list reliably populates and a row opens into a quote (needs the widget row action +
a dependable populate wait, and likely seeded data), the Apply/underwriting stories cannot be driven and
would be heavily-deferred if written now.

## Durable wins from this investigation (reusable regardless)
- **The correct Save = click the popup's `button.btn-primary` (text "Save"), not "the last Save".**
  Fires `ActionSaveQuote`. This fixes the Save/Saved-Quote-Nav "save didn't persist" issue and should be
  promoted into a `saveQuote()` helper. The success signal is the `ActionSaveQuote [200]` network POST,
  NOT a URL QuoteId change (which never happens in-place).
- Occupation-for-Apply is set via the typeahead: open `.vscomp-toggle-button` → type in
  `.vscomp-search-input` → click a `.vscomp-option`.

## Recommended next steps (for whoever picks this up)
1. Crack the landing-list reopen: reliably populate the list (Refresh + robust wait), locate a saved row
   by its reference, open it, and confirm the quote loads with a non-empty QuoteId + `ShowApplyNow=true`.
   If that works, Apply should finally dispatch — then walk + test each Apply-flow screen.
2. OR obtain a seeded saved/submitted quote whose QuoteId can be opened directly (bypasses the flaky list).
3. Ask an app SME whether Apply requires the reopen, or whether there's an in-place enable we're missing
   (the network shows the Apply button bound to no action pre-reopen — an SME could confirm the intended
   trigger faster than further black-box probing).
