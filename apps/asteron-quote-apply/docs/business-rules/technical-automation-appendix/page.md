# Technical / Automation Appendix

> Child of [Business Rules](../page.md). **Not needed by BAs** — this page exists for developers and QA automating tests against the rules documented in [Quote Screen](../quote-screen/page.md) and [Apply Flow](../apply-flow/page.md). No Rule ID scheme is used here since nothing on this page is itself a business rule.

## Platform

The form is built on **OutSystems Reactive Web** (React under the hood). This has consequences for automation regardless of tool:

- Standard Playwright `fill()`/`selectOption()` write the DOM value but **do not fire React's synthetic events** — OutSystems listens for real keyboard/change events, not just a value write.
- Element IDs **regenerate on every page load and on many re-renders** — never hardcode an ID across sessions or even across two actions on the same page; re-query immediately before each interaction.
- The app enforces **sequential steps** — navigating directly to a later step's URL redirects back to the earliest incomplete one.
- An OutSystems "Loading" indicator appears during XHR calls — always wait for it to clear before reading state or interacting with newly-rendered elements.

## The calc-mask Sum Insured / Monthly Benefit fields

The single most error-prone interaction in the whole app.

- These fields use a right-to-left digit-shifting mask. **Never** use a plain `fill()`/`pressSequentially()` on them — it corrupts the value into garbage like `.2.0.0.0.0.0.`.
- Correct sequence: click the field → press Backspace ~10 times until the display shows just `.` (the empty state) → press each digit key **individually** as real keystrokes → Tab out to blur.
- Even after correct entry, the raw `element.value` DOM property can read back stale/garbled — trust the **rendered/accessible value** (e.g. `"200,000"`) over the raw property.
- `server.js` gained a dedicated action for this during the 2026-08-12 session (see the project's own `server.js` for the current implementation) — use that action rather than reimplementing the backspace-then-digit-by-digit sequence by hand each time.

## The Disability-cover "commitment" mechanism

Directly affects test design, not just interaction mechanics — see [Disability Covers — DC-01 through DC-03](../quote-screen/disability-covers/page.md) for the business-rule framing. Mechanically: a benefit field needs a genuine `focus` then `blur` event (even with nothing typed) before the app treats the cover as real. Toggling the cover's button alone is not sufficient and will produce a false negative in any test that later checks the cover's presence, premium contribution, or Bundling Discount participation.

## Field/interaction patterns by control type

| Control | Method | Why |
|---|---|---|
| Text input (Apply flow) | `pressSequentially()`/keyboard `type` with delay, then Tab to blur | Plain `fill()` doesn't fire React synthetic events |
| Date of Birth (Personal Details) | React's **native value setter** (`Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set`) + dispatch `input`, `change`, and `blur` events, in that order | A simple `.value =` assignment plus a `change` event does **not** trigger the Age Next Birthday auto-calculation — confirmed the native setter + all three events is required |
| Checkbox | `element.click()` via `eval`, or a genuine Playwright mouse click | Both work in this app for the Quote screen; the Apply-flow's older automation notes recommend `scrollIntoView` + coordinate-based `mouse-click` instead — the discrepancy may be screen-specific, verify per-screen rather than assuming one technique for the whole app |
| Radio button / button-group (Yes/No, Male/Female) | Genuine Playwright mouse click works directly on the Quote screen; Apply-flow notes recommend `scrollIntoView` + coordinate `mouse-click` | Same caveat as checkboxes above |
| Select dropdown (visible) | Playwright `selectOption`, or `eval`: set `.value` then dispatch a `change` event | `selectOption` can fail/500 on elements that are off-screen or have long hyphenated IDs |
| Select dropdown (inside a collapsed accordion / off-screen) | `eval`: `el.value = '...'; el.dispatchEvent(new Event('change', {bubbles:true}))` | Playwright's built-in methods often can't reach an off-screen or not-yet-expanded element |
| Cover activation buttons (Life, TPD, Income Protection, etc.) | `eval` → `button.click()` | A standard Playwright `.click()` may not reliably trigger the OutSystems XHR that actually activates the cover |
| Occupation search | Click the combobox to open it, type into the dynamically-IDed `.vscomp-search-input` element, click the matching `.vscomp-option` | Virtual-select widget, not a native `<select>` — the search-input ID is not stable across page loads, always re-query it |
| "New Quote" navigation | Patch `window.open` before clicking the New Quote link, or otherwise handle the popup/new-tab it spawns | The link opens a new browser tab/window by default |

## Dynamic ID patterns observed

| Section | ID pattern | Notes |
|---|---|---|
| Personal Details | `b15-*` | Comparatively stable prefix |
| Policy Settings | `b23-b1-*` | Comparatively stable prefix |
| Lump Sum Covers | `b23-l2-{SESSION}_{INDEX}-b7-*` | `SESSION` changes every page load/re-render |
| Disability Covers | `b23-b12-l9-{SESSION}_{INDEX}-*` | Index order seen: 0 = Mortgage & Living, 1 = Income Protection, 2 = Workability (on a Personal policy) |
| Kids Cover | `b23-b14-l2-{SESSION}_{INDEX}-b5-*` | Index is per-kid, zero-based |
| Premium panel | `b25-l4-{SESSION}_{INDEX}-*` | Per-life premium sections; also changes after every Save |
| Payment Frequency dropdown | `...-PaymentFrequencyDropdown` suffix is the only stable part | Prefix changes on every re-render — locate via `select[id*=PaymentFrequencyDropdown]` or `select[id$="PaymentFrequencyDropdown"]`, never a hardcoded full ID |

## Known automation blockers / gotchas

1. **Multi-policy / Personal-Business ambiguity** — see the [open discrepancy on the Policy Structure page](../quote-screen/policy-structure/page.md). Whichever model is confirmed correct has direct implications for how a test script should create/select policies — resolve this before building automated coverage of multi-policy scenarios.
2. **Apply's same-URL silent navigation** — see [Validation & Navigation — VAL-08/VAL-09](../quote-screen/validation-and-navigation/page.md). Detect the transition via DOM content (heading/footer button set), not the URL.
3. **Flexi Rate / We Pay Your Premiums dropdowns** are not interactable while the Policies accordion is collapsed — expand it first.
4. **Modal dialogs block all page interaction** — always check for and dismiss an open dialog before proceeding (the "Add Reference" Save modal, the "Cannot proceed" multi-life modal, etc.).
5. **Auto-save on Sum Insured/Benefit blur** can race with an immediately-following action — add a short settle point after any blur that touches one of these fields.
6. **Life 2+ starts completely blank** — don't assume any field state carries over from Life 1 when scripting multi-life scenarios.
7. **Rapid, unpaced programmatic interactions can desync the UI from the server-side calculated state** — observed as premium figures appearing "stuck" at a stale value after a long unpaced sequence of scripted actions. Add explicit settle waits (or poll for the Loading indicator to clear) between actions, especially around cover add/remove and Apply clicks, rather than firing dozens of state changes back-to-back.
8. **Credit Card payment** uses a cross-domain QuickStream iframe — not automatable as part of this application's own test surface.
9. **Direct Debit** requires a real, valid NZ bank/branch/account combination (backend modulus-checked) — a syntactically-plausible fake will be rejected.

## Where to drive this from

This project has two existing automation entry points — see `HANDOFF_TO_KIRO_CLI.md` at the project root for full setup instructions:

- **`server.js`** — an interactive HTTP command server (`POST http://localhost:3333`) for targeted, single-step-at-a-time probing. Preferred for verifying/extending anything on this page or in the business-rules pages, since you can inspect state after every action.
- **`login.spec.js` + `explore-form.js`** — a fully automated blind sweep (clicks everything, fills everything, cycles until stuck). Useful for a broad regression baseline, not for deliberate single-variable rule testing.
