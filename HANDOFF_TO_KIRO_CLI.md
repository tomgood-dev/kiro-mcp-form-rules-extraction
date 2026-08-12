# Handoff: Continue Quote-Screen Business-Rules Testing via Kiro CLI + Node Server

**Why this file exists:** The previous testing session ran on a different network/machine using Claude Code's built-in Playwright MCP browser tool driven directly (no `server.js` involved). That machine can't reach the target app from the new environment, so this pass needs to run through **this project's own Node.js automation** (`server.js` + `explore-form.js`) from inside an Amazon Workspace via Kiro CLI instead.

**What's already done:** `output/iteration-002/quote-screen-business-rules.md` is a complete, verified business-rules reference for the Quote/Illustration screen. Read it first — it documents the covers, limits, dependencies, and (critically) the interaction gotchas discovered so far. This handoff is only about the **remaining gaps**, listed in that file's own §13, reproduced and expanded below with a priority order and concrete step-by-step instructions.

**Priority for this pass: the Major Trauma ≥$25,000 cap formula (§1 below).** The user explicitly asked for this to be tackled first.

---

## 0. Environment setup checklist (do this first, in order)

1. **Confirm network reachability** from the Workspace to `https://outsystems-dev.asteronlife.co.nz` — this is a dev/test environment, likely only reachable from specific networks/VPN. If it doesn't resolve or times out, stop and sort out connectivity before anything else.
2. `cd` into this project directory (wherever it lands inside the Workspace — same repo, so just re-clone/re-sync if needed).
3. `npm install` — installs `@playwright/test` (already the sole dependency in `package.json`). This also needs Playwright's browser binaries: run `npx playwright install chromium` if `npm install` didn't already pull them.
4. Copy `.env.example` to `.env` and fill in:
   ```
   ASTERON_LOGIN_EMAIL=<adviser login email>
   ASTERON_LOGIN_PASSWORD=<adviser login password>
   ASTERON_SCREENSHOT_DIR=./screenshots
   ```
   **Ask the user for these credentials if they aren't already sitting in a password manager/secrets store you have access to — do not guess or reuse ones found elsewhere.**
5. Decide which of the two available drivers to use (see §2) — the recommendation is **`server.js`** (interactive HTTP-command server), not `explore-form.js`'s fully-automated `login.spec.js` flow, because this pass is targeted manual/semi-scripted probing of specific covers, not a full blind sweep.

---

## 1. PRIORITY: Major Trauma cap formula for Trauma Recovery Cover ≥ $25,000

### What's already known
- Tooltip on the "Major Trauma" sub-benefit: *"This benefit provides additional cover on top of any Trauma Recovery Cover (TRC) for more severe conditions likely to require more financial support. Please note: A maximum of 300% of the TRC sum insured applied if TRC is less than $25,000."*
- The `<$25,000` case is confirmed: cap = 300% × TRC sum insured.
- The `>=$25,000` case is **unresolved**. The last attempt to test it was interrupted by a genuine application error (`Request failed with an error` banner) partway through — this looked like an app-side/session hiccup, not something caused by the test technique itself, but be alert for it recurring.

### Exact steps to resolve it
1. Log in, start a **brand-new quote** (see §2.3 for the exact click path — don't resume an existing one).
2. On Life 1 Personal Details, set the minimum fields needed to price a Lump Sum cover: **Age next birthday**, **Gender**, **Occupation** (search e.g. "Civil Engineer" and pick a qualified option), **Employment status**. (Annual Income is not required for Lump Sum covers, only Disability ones — skip it here.)
3. Activate **Trauma** under Lump Sum Covers.
4. Set Trauma's **Sum Insured** to a value **at or above $25,000** — e.g. exactly `25000` for the boundary, and separately `100000` for a clear above-threshold case. **Use the calc-mask technique** in §3.1 below, not a plain fill — this is the single most common way this kind of test silently fails.
5. Activate the **Major Trauma** sub-benefit toggle (it's a button inside the Trauma card, not a separate top-level cover). **Wait for the page to fully settle after this click** (a short explicit pause, or poll for the "Loading" indicator to clear) before doing anything else — the previous attempt's app error happened right around here, and rushing straight into the next action is the leading suspect.
6. Take a state snapshot (`{"action":"state"}` via `server.js`, or `eval` with a custom DOM query) and inspect whether Major Trauma exposes **its own Sum Insured / benefit field**, or whether it's purely a percentage-of-TRC multiplier with no separate input. This was not conclusively determined last time — resolve it explicitly as step one, because it changes how you probe for the formula:
   - If it has its own field: use the oversized-value technique (enter something absurd like `9999999`, blur, click Apply) and read the resulting error text — it should name the exact cap formula, exactly like every other cover's max-value error documented in `quote-screen-business-rules.md`.
   - If it has no separate field (pure multiplier on TRC): instead, systematically vary the **Trauma Sum Insured** itself across several values ≥$25,000 (e.g. $25,000, $30,000, $50,000, $100,000, $250,000) with Major Trauma active each time, and read whatever premium/benefit figure or validation text appears for Major Trauma specifically at each TRC level. Look for a pattern (e.g. always exactly 100% of TRC, or a flat cap regardless of TRC, or a sliding scale).
7. Apply the same "Apply-time diagnostic" technique documented in the main report (§1 there): click **Apply**, read the exact error text verbatim, adjust one variable at a time, re-click Apply, and note how the message changes. Capture the **exact wording** of any formula-revealing error — that literal text is what goes in the report.
8. Write down: the exact formula (or confirm there is no cap at all above $25,000, if that's what the evidence shows), plus the exact error/tooltip text as supporting evidence.

### If it errors out again
- Note the exact error text, what action immediately preceded it, and whether reloading the quote (or starting a fresh one) clears it.
- Don't burn excessive time retrying blindly — 2–3 clean attempts with deliberate pacing (explicit waits between actions) is enough. If it keeps failing, document it as a reproducible app-level issue rather than a test-technique problem, and move on to the next item — the user would rather have a clean "this appears to be a genuine app bug, reproduced N times" note than a report weakened by chasing one broken formula.

---

## 2. Two ways to drive the browser from this project — pick one

### 2.1 `server.js` — interactive HTTP command server (recommended for this pass)
```
node server.js https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ
```
Leaves a **headed** Chromium window open and listens on `http://localhost:3333` for POSTed JSON commands. This is the right tool for targeted, exploratory probing (exactly what §1 and the rest of this checklist need) because you can inspect state after every single action and adjust course immediately — same style of interaction as the previous session's live Playwright-MCP-driven testing.

Full action reference is already documented in `.kiro/steering/form-automation-playbook.md` §2 and in the comment block at the top of `server.js` itself — read both before starting. Quick summary of the actions you'll use most for this pass:

| Action | Purpose |
|---|---|
| `{"action":"state"}` | Read full current page state: buttons, fields, errors, modals |
| `{"action":"click","id":"..."}` or `{"selector":"text=Apply"}` | Click something (uses `force:true`) |
| `{"action":"type","id":"...","value":"..."}` | Type into a field — clears with Ctrl+A+Delete first, types at 40ms/char, Tabs out. **Do not trust this for calc-mask Sum Insured/benefit fields — see §3.1, use `eval` instead for those.** |
| `{"action":"select","id":"...","value":"..."}` | Set a native `<select>` |
| `{"action":"eval","code":"..."}` | Run arbitrary JS in the page — your escape hatch for anything not covered by a built-in action, including the calc-mask workaround |
| `{"action":"wait","ms":1000}` | Explicit pause |
| `{"action":"errors"}` | Just the current validation-error text |

Drive it with `curl`, a tiny script, or whatever's convenient from the Kiro CLI shell, e.g.:
```
curl -s -X POST http://localhost:3333 -H "Content-Type: application/json" -d '{"action":"state"}'
```

### 2.2 `login.spec.js` + `explore-form.js` — fully automated blind sweep
Runs via `npx playwright test login.spec.js` (needs `.env` populated per §0). This logs in, opens a new quote, and then `explore-form.js` **blindly clicks every button and fills every field it can find**, cycling until it either proceeds through the whole flow or gets stuck, dumping screenshots and a `form-report.json`. This is a broad, unattended crawler — **not suited to this pass**, since every item in this checklist needs deliberate, single-variable-at-a-time testing (activate exactly one cover, set exactly one value, read exactly one error). Only reach for this if you specifically want a fresh blind baseline sweep for comparison; otherwise use `server.js`.

### 2.3 Getting to a fresh Quote screen (either driver)
1. Navigate to `https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ`, log in with the `.env` credentials.
2. Navigate to `https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/` (page title `StartJourney`).
3. Click the **"New Quote"** link — this opens a **new browser tab/window** with a URL like `.../QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`. A blank `QuoteId=`/`ApplicationId=` confirms it's genuinely new, not resumed.
4. If using `server.js`, you'll need to make sure it's driving that **new** tab/window, not the one left behind on the StartJourney list — check `page` handling in `server.js` if this trips you up (it currently only tracks a single `page` variable set at launch, so opening a new tab via a click that spawns a popup may need a small server.js tweak to switch `page` to the new tab — check for this and patch if needed, it's a ~5 line fix using `context.waitForEvent('page')` the same way `login.spec.js` already does at its "Click New Quote" step).

---

## 3. Interaction gotchas carried over from the previous session (apply to whichever driver you use)

These are hard-won and will waste your time if rediscovered from scratch — read all of them before starting.

### 3.1 Calc-mask Sum Insured / Monthly Benefit fields — THE #1 GOTCHA
Every Sum Insured and Monthly Benefit field uses a right-to-left digit-shifting mask, not a plain text input.
- **Never** use `server.js`'s `type` action (or plain Playwright `fill`) on these fields — it corrupts the value into garbage like `.2.0.0.0.0.0.`.
- The reliable method: click the field, press Backspace ~10 times to clear it down to `.`, then press each digit key **individually** as real keystrokes, then Tab out to blur.
- Via `server.js`, since there's no built-in "press single key" loop action, use `eval` to drive `page.keyboard.press()` in a loop, e.g.:
  ```json
  {"action":"eval","code":"return (async () => { const p = arguments[0]; })();"}
  ```
  Realistically, the cleanest fix is to **add a small dedicated action to `server.js`** (a `calcmask` action taking `id` and `value`, implementing exactly this backspace-then-digit-by-digit sequence) rather than fighting the existing generic actions through `eval` every time. This is a worthwhile ~15-minute investment before starting the rest of the checklist — it will be used on nearly every cover.
- Even after correct entry, reading the raw `element.value` can show a stale/garbled string — trust the rendered/displayed value (e.g. what `state`'s `fields` reader reports, or a direct `innerText`/computed display check) over the raw input's `.value` property.
- Exceeding a cover's real max does not clamp — the premium shows `$0.00` and an error banner appears instead.

### 3.2 Disability covers require focus+blur to "commit" — or they silently vanish
Merely activating a Disability cover's toggle button (Income Protection, Mortgage & Living, Workability, Business Expenses, Business Disability, Farmers Disability) does **not** make it real. Its Monthly Benefit field must receive focus and then blur (even with zero characters typed) before:
- it contributes anything to the premium,
- it counts toward the Bundling Discount cover-type tally,
- it survives being persisted when you click Apply.
An activated-but-never-focused Disability cover is silently dropped on Apply. **Always click into the benefit field and Tab out, even if you intend to rely on its auto-default value.**

### 3.3 Apply can silently navigate — without changing the URL
When the current policy's configuration is fully valid, clicking **Apply** silently moves the single-page app forward to a **"Client summary"** screen (new mandatory fields: First Name*, Middle Name, Last Name*, Date of Birth*; footer collapses to a single "Return to Quote" button) — but `page.url()` stays **byte-for-byte identical** to the Quote screen's URL. Never use the URL to detect this transition — check the page's visible heading/footer content instead (e.g. does "Illustration" or "Client summary" appear). If Apply fails validation instead, the screen stays on "Illustration" and shows error text.

### 3.4 "Personal" / "Business" are ADD-POLICY buttons, not a toggle
Each click of "Personal" or "Business" creates a **new, independently-numbered policy** (Personal 1, Personal 2, Business 1, ...) — a single Life can carry several of each simultaneously. Previously-created policy links switch the view back to that policy's own independent cover configuration. Each policy link has an adjacent icon-only "remove this policy" control with no confirmation dialog.

### 3.5 Occupation can gate cover availability outright
Confirmed for Farmers Disability (blocked entirely for non-farming occupations, not just capped at $0) — worth checking for Needlestick too (§4 below), since its tooltip hints "for certain occupations."

### 3.6 General OutSystems notes (from the pre-existing playbook, still true)
- Element IDs regenerate on every page load — never hardcode an ID across sessions, always re-query.
- The app enforces sequential steps — navigating to a later URL directly redirects back to the earliest incomplete step.
- Always wait for the "Loading" indicator to disappear before reading state or interacting with newly-rendered elements.

---

## 4. Remaining checklist, in priority order (Major Trauma is §1 above — do that first)

For every item below, use the same "Apply-time diagnostic" technique from the main report: set up the scenario, click Apply, read the exact error text verbatim, adjust one thing at a time.

2. **Save / Save as New / Close / View PDF footer buttons** — never clicked in the previous pass. Click each on a valid, priced quote and document exactly what happens (does it navigate, show a dialog, generate a file, persist silently, do nothing visible?).
3. **Business Expenses / Farmers Disability occupation-based formula** — confirmed occupation-table-driven, not a flat number or simple income %. Try 3–4 different occupations (varying occupation *class/code*, not just job title) and record the resulting max-benefit figure for each, to see if a pattern emerges (e.g. tied to the occupation code AM/AA/A1/A2/B/C/S/U/IC shown next to the Occupation field).
4. **Phantom-until-focused check for Lump Sum covers** — does an activated-but-never-focused Life/TPD/etc. Sum Insured field (left completely blank, never clicked into) also silently vanish on Apply, the same way Disability covers do (§3.2)? Lump Sum covers have no valid $0 default, so the mechanism may differ — find out.
5. **Duplicate top-level Lump Sum cover instances** — after "Life Cover A" exists, click the "Life" toggle button again. Does it create a "Life Cover B", throw an error, or no-op? (Card naming with an "A" suffix throughout the report suggests multiple instances may be supported.)
6. **Minimum bar for switching Life tabs** — the app blocks switching away from an incomplete Life with *"Cannot proceed — Please enter the minimum requirement for a quote before proceeding to another life."* Find the exact minimum (just Personal Details? A priced cover? The $240/yr rule?) by incrementally adding fields/covers to Life 1 and retrying the tab switch after each addition.
7. **Specific Injury cross-policy dependency scope** — Specific Injury requires ≥1 companion cover (Life, Trauma, TPD, etc.) to also be selected. Test whether that companion cover can live on a **different policy** under the same Life, or must be on the *same* policy as the Specific Injury cover itself.
8. **Fortnightly ×26 payment-frequency conversion** — confirm by comparing a Fortnightly premium figure against the known annual total (the tooltip already states "monthly × 12 or half-yearly × 2" as the pattern; fortnightly should be annual ÷ 26 by the same logic — verify against a live number).
9. **Needlestick occupation-availability gate** — its tooltip says "for certain occupations." Test whether it's outright blocked for some occupations the same way Farmers Disability is (§3.5), or just priced differently.

---

## 5. Where everything lives

- **Main deliverable to update:** `output/iteration-002/quote-screen-business-rules.md` — merge new findings into this file directly, closing out §13 items as they're resolved (or updating them with a confirmed "genuine app limitation" note if unresolvable).
- **Raw working notes:** `output/iteration-002/scratch-notes.md` — append to this as you go, same style as the existing entries, before doing the final polish pass on the main report.
- **Project overview / iteration log:** `.kiro/steering/project-context.md` — add a new row to the iteration table once this pass is done.
- **Interaction playbook:** `.kiro/steering/form-automation-playbook.md` — this predates the current findings and is now missing/outdated on several points (the calc-mask technique, the disability-cover commitment mechanism, Apply's silent navigation, the multi-policy architecture). **Worth updating this file too** once this pass is done, so the next person driving `server.js` doesn't have to re-derive it from this handoff doc and the iteration-002 report separately.
- **This file** can be deleted once its checklist is fully absorbed into the main report and no longer needed as a working reference.
