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

## ⚠️ CORRECTION (2026-09-09, confirmed by manual test)

**The conclusions in items 3 & 5 below were WRONG. Root cause: a missing MANDATORY field.**
Apply does not progress because **Pre-tax Annual Income** (a required field, marked with a red
asterisk `*`) was left blank. My probes only filled the fields needed to PRICE a quote and never
completed the mandatory-for-APPLY set — so Apply produced a "please enter income" validation and
(in my DOM-injected runs) I misread the non-progression as the button being "inert". Manual test
confirmed: **fill Pre-tax Annual Income → Apply progresses into the application flow.** No
landing-list reopen or `ShowApplyNow` trickery is required.

**The Apply flow IS reachable** by completing ALL mandatory personal-details fields (red asterisk),
then Apply. This was a basic oversight — mandatory-field checking must be step one, not an
afterthought (see the new mandatory-field rule in `.kiro/steering/project-context.md`).

Items 1-2 & 4 below remain valid (fresh-quote URL is ShowApplyNow=false; forcing true on empty
QuoteId crashes; the correct Save = the popup's `button.btn-primary` firing ActionSaveQuote — still
a useful finding). Items 3, 5 and the "Conclusion" below are SUPERSEDED by this correction.

---


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



## FINAL STATE (2026-09-09, after full investigation)

After extensive diagnosis, the accurate picture is:

- ✅ **Entry via the real New Quote popup is the correct + required path.** `openNewQuote` was rewritten
  to arm a popup waiter and click the real New Quote link (the OutSystems `chooseNav` handler runs
  `UpdateAdviserInSession` then `window.open` to a new tab). It now THROWS rather than silently
  deep-linking (the old fallback produced an inert Apply). The popup viewport is forced to 1920x1080.
- ✅ **All mandatory Apply fields land** via `completePersonalDetailsForApply` (names, DOB, occupation
  name+code, employment status, **Pre-tax Annual Income**) — verified by reading back every field.
- ✅ **`saveQuote`** clicks the popup's `button.btn-primary` Save (fires `ActionSaveQuote`).
- ✅ **The footer action bar (Close / View PDF / Save as New / Save / Apply) renders on ALL 10 accounts**
  once entered via the popup. (Earlier "viewport" and "wrong account" theories were both DISPROVEN — a
  10-account probe showed Apply present everywhere; the true cause of earlier failures was the old
  deep-link entry, not viewport or account.)
- ❌ **REMAINING BLOCKER: the Apply button click does not fire from automation.** With a complete, priced,
  saved quote and the Apply button visibly present + enabled (solid blue, bottom-right, not disabled),
  clicking it — via `getByRole().click()`, via eval `element.click()`, scrolled into view — produces
  NO server action (network shows only field-recalc calls, never an Apply/navigation action), no URL
  change, no body change, and no validation error. Screenshots before/after are identical.
  **Yet the same steps work MANUALLY** (a real user gets the income-required validation, then progresses).
  This is the classic OutSystems "reactive action button needs a TRUSTED user gesture" problem —
  `element.click()` / Playwright click is not triggering the bound action handler here.

### Next attempt should focus ONLY on: making the Apply action fire
Everything upstream is solved. Options to try for the Apply click (bounded, focused):
- A trusted click via CDP (`Input.dispatchMouseEvent`) at the button's coordinates, or Playwright
  `page.mouse.click(x, y)` on the reported box (~x1797,y1032 at 1920x1080) — a real pointer gesture
  rather than `element.click()`.
- Keyboard activation: focus the Apply button and press Enter/Space.
- Investigate whether Apply is wired to a parent/child element or requires a preceding focus/blur.
- Confirm timing: the popup's reactive bindings may attach late — wait for a readiness signal
  (e.g. a specific network idle or an attribute) before clicking.

The helper fixes (openNewQuote popup capture, completePersonalDetailsForApply, saveQuote, and the
mandatory-field + footer-bar knowledge) are committed and correct regardless — they unblock everything
except the final Apply-action trigger.



## ✅ RESOLVED-IN-PRINCIPLE (2026-09-09 EOD, user-confirmed) — Apply DOES work; it was blocked by more mandatory fields

The Apply CLICK was never the problem. My click mechanisms (element.click, getByRole, mouse,
CDP) all fired correctly. The reason Apply "did nothing" in my probes: **clicking Apply surfaced
on-screen VALIDATION ERRORS that I failed to read** — specifically it required selecting dropdowns
in the **Adviser Use** popup (commission details) before it will progress. I highlighted the right
button (user visually confirmed: red button / yellow text / lime border / magenta outline) and the
click registered — the page showed errors, not nothing.

**The correct Apply prerequisite chain (user-confirmed):**
1. Complete ALL mandatory quote fields (names, DOB, gender, smoking, occupation+code, employment
   status, **Pre-tax Annual Income**) — DONE, works.
2. **Open the "Adviser Use" panel (right-hand side) and fill out its popup** — select the required
   commission dropdowns. This is a MANDATORY step before Apply progresses and I was NOT doing it.
   (Adviser Use popup patterns already exist in the suite — see enter-commissions-v1 /
   select-default-commission-category specs + the adviser-use-commission business-rules page.)
3. THEN click Apply → it progresses to **Client summary** (Step 2, status PRE APPLICATION) →
   "Proceed to application" → Duty of Disclosure → ... (full flow already mapped in
   apply-flow/page.md from iteration-001).

**CRITICAL PROCESS FAILURE TO NOT REPEAT:** After clicking Apply, ALWAYS read the visible validation
errors (getVisibleErrors) and act on them — "no progress" almost always means an unfilled mandatory
field/section the app is telling you about on screen. I ran ~a dozen 6-minute probes concluding
"Apply is inert" when the app was displaying the Adviser-Use validation errors the whole time.

### Tomorrow's plan (do this, don't re-investigate)
- Extend the Apply path: after completePersonalDetailsForApply + cover, **fill the Adviser Use popup**
  (reuse the existing commission-popup helpers/patterns), THEN clickApplyNow. Read+assert any errors
  at each step. That reaches Client summary → then drive the documented apply-flow steps.
- clickApplyNow already uses a real click; keep it, but make it RETURN + LOG the visible errors so
  they're never missed again (it does capture errors — the probes just didn't surface them prominently).
