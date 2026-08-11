# Asteron Life Form Automation Playbook

This file is auto-loaded every session. It captures all hard-won interaction knowledge
so future iterations do not rediscover what failed the first time.

---

## 1. Technology Stack

The form runs on **OutSystems Reactive Web** (React under the hood). Key consequences:

- Standard Playwright `fill()` and `selectOption()` work on the DOM but **do not fire React
  synthetic events**. OutSystems listens to keyboard/change events, not just value writes.
- Element IDs are **regenerated on every page load and sometimes on re-render**. Never rely
  on a hardcoded ID across sessions. Re-query before every interaction.
- The app is a **SPA with sequential step enforcement** — navigating to a later URL directly
  redirects back to the earliest incomplete step.
- OutSystems shows a "Loading" indicator during XHR; always wait for it to disappear before
  reading state or interacting with newly rendered elements.

---

## 2. server.js Action Reference

All commands are HTTP POST to `http://localhost:3333` with a JSON body.

| Action | Body keys | Use for | Notes |
|--------|-----------|---------|-------|
| `state` | — | Read full page state (url, buttons, fields, errors, modals) | Scrolls to top first |
| `eval` | `code` | Arbitrary JS in page context; returns `result` | Use for complex queries, scrollIntoView, getBoundingClientRect |
| `goto` | `url` | Hard navigate to URL | Waits for Loading to clear |
| `back` | — | Browser back | — |
| `click` | `id` or `selector` | Click a button/link by id or CSS selector | Uses `force:true`; reads new state after |
| `mouse-click` | `x`, `y` | Click at viewport coordinates | **Required for checkboxes, radios, button-groups** after scrollIntoView |
| `type` | `id` or `selector`, `value` | Type text into an input | **Required for OutSystems text inputs** — clears field first, types with 40ms delay, Tabs out |
| `fill` | `id` or `selector`, `value` | Set input value directly (no keyboard events) | Only for fields that don't use OutSystems reactive binding (rare) |
| `select` | `id` or `selector`, `value` | Set a `<select>` dropdown value | May 500 on complex hyphenated IDs — use eval fallback |
| `scroll` | `direction: "bottom"\|"top"` | Scroll page | — |
| `wait` | `ms` | Explicit pause | Use sparingly; prefer Loading indicator wait |
| `press` | `key` | Keyboard key press | e.g. `Tab`, `Enter` |

---

## 3. Core Interaction Patterns

These patterns were discovered through trial and error. Apply them consistently.

### 3.1 Text Input → always use `type`

```json
{ "action": "type", "id": "the-element-id", "value": "the text" }
```

Never use `fill` for text inputs in the apply flow. `type` clicks the field, clears it
with `Ctrl+A + Delete`, then types character-by-character at 40ms delay, and Tabs out to
trigger OutSystems blur binding.

Set `"blur": false` only when you need to keep focus (e.g. to check a dropdown that
appears while typing).

---

### 3.2 Checkbox / Radio → scrollIntoView + mouse-click

`label.click()` via eval and `click(id=...)` both register the DOM change but **do not
trigger OutSystems synthetic events**. The only reliable method:

```javascript
// Step 1 — get viewport coordinates via eval
{
  "action": "eval",
  "code": "var el = document.getElementById('the-checkbox-or-radio-id'); el.scrollIntoView({block:'center'}); var r = el.getBoundingClientRect(); return {x: r.x + r.width/2, y: r.y + r.height/2};"
}
// Step 2 — mouse-click at those coordinates
{ "action": "mouse-click", "x": <from step 1>, "y": <from step 1> }
```

Always re-query `getBoundingClientRect()` after `scrollIntoView` — the scroll changes
the element's position in the viewport.

Use this pattern for:
- `<input type="checkbox">`
- `<input type="radio">`
- `<button class="button-group-item">` (Yes/No button groups)

---

### 3.3 Off-screen elements

Any element where the initial `y` coordinate is outside the viewport (negative, or greater
than the viewport height) **will not receive mouse clicks**. Always scroll it into view first.

```javascript
// Check if element is on screen before clicking
{
  "action": "eval",
  "code": "var el = document.getElementById('the-id'); var r = el.getBoundingClientRect(); return {y: r.y, inView: r.y >= 0 && r.y <= window.innerHeight};"
}
```

If `inView` is false, use the scrollIntoView + mouse-click pattern from 3.2.

---

### 3.4 `<select>` dropdowns with complex IDs

`page.selectOption()` can return a 500 when the element ID contains many hyphens.
Fallback:

```javascript
{
  "action": "eval",
  "code": "var el = document.getElementById('b6-l2-6535_0-Dropdown_PolicyOwnerRelatedParty'); el.value = '1'; el.dispatchEvent(new Event('change', {bubbles:true}));"
}
```

---

### 3.5 Button groups (Yes/No)

These are `<button class="button-group-item">` elements, not radios. Selected state is
`class="button-group-selected-item"`. Apply the scrollIntoView + mouse-click pattern.

Check current state before clicking — if the correct answer is already selected (class
includes `button-group-selected-item`), **do not click it again** or it may deselect.

```javascript
{
  "action": "eval",
  "code": "return [...document.querySelectorAll('.button-group-item')].map(b => ({text: b.innerText.trim(), selected: b.className.includes('button-group-selected-item'), id: b.id}));"
}
```

---

### 3.6 React Select (searchable dropdowns)

Used for the Occupation field. Standard `selectOption` does not work.

```
1. click the React Select input to focus it
2. type search text (partial match is fine)
3. wait for option list: [id^=react-select-N-option] elements appear
4. click the matching option element
```

---

### 3.7 Calc-mask (Sum Insured) fields

Right-to-left digit shifting. Do NOT use `type` or `fill` directly.

```
1. click the field to focus
2. press Backspace 10 times (clears to ".")
3. type each digit individually via press or type
```

---

### 3.8 Modals and popups

After every navigation or button click, check for open modals:

```javascript
{ "action": "eval", "code": "return [...document.querySelectorAll('[role=\"dialog\"]')].filter(m => m.getBoundingClientRect().width > 50).map(m => ({text: m.innerText.substring(0,200), buttons: [...m.querySelectorAll('button')].map(b=>b.innerText.trim())}));" }
```

**Adviser Use popups and separate block dialogs must have their OK or Apply button pressed
before proceeding on the main screen.** If a modal is open, interacting with the page
behind it will silently fail.

---

### 3.9 Cover buttons (Quote form only)

Standard Playwright click does not trigger OutSystems XHR for cover toggle buttons.
Always use eval:

```javascript
{ "action": "eval", "code": "[...document.querySelectorAll('button.cover-button')].find(b=>b.innerText.trim()==='Life').click()" }
```

---

## 4. Navigation & Wait Patterns

### After any click or navigation

```javascript
// Check the current URL
{ "action": "url" }

// Wait for Loading spinner to clear (server.js does this automatically in most actions)
// If you need to wait manually:
{ "action": "wait", "ms": 500 }
```

### Personal Statement pagination

Each page has a Next button in the footer (no stable id). Use:

```javascript
{ "action": "eval", "code": "return [...document.querySelectorAll('button')].find(b => b.innerText.trim()==='Next').id;" }
```

Then `click` that id, or use `click` with selector `text=Next`.

The Personal Statement enforces completion — all 7 pages must be fully answered before
the Underwriting Decision is reachable. Unanswered questions surface at:
`/QuoteAndApply/UnderwritingSummary?l=1&ApplicationId=...`

---

## 5. Section-by-Section Gotchas

### Quote Form

| Element | Pattern | Gotcha |
|---------|---------|--------|
| Sum Insured fields | Calc-mask (10× Backspace, then digits) | Tab/blur triggers auto-save immediately — no separate save step needed |
| Occupation | React Select (type + click option) | — |
| Employment Status | `select` action | Required before Apply is active |
| Cover buttons | eval `.click()` | Standard click fails silently |
| Sub-cover buttons | eval `.click()` inside cover section | Must activate parent cover first |

### Duty of Disclosure (Step 3)

- Only interactive field is the **Adviser Confirmation** button group (Yes/No).
- The Next button in the footer is a plain `<a>` or `<button>` with no stable id.
  Locate it by selector: `.btn.btn-primary.ThemeGrid_MarginGutter`
- Do NOT click the hidden `id="Next"` element — it has `display:none`.

### Insurance & Financial Details (Step 4a–4c)

- Insurance History: Yes/No radios — use scrollIntoView + mouse-click.
- Occupation Details: outer Yes/No radio first, then individual checkboxes if Yes.
- Financial Details: single text input — use `type` action.

### Tele Interview (Step 4d)

- Button group (Yes/No). Use scrollIntoView + mouse-click pattern.
- Choosing Yes may reveal a scheduling interface; choosing No proceeds immediately.

### Personal Statement — Page 5 (Family History)

- Multi-select checkboxes. Must select at least one.
- "None of the above" is a valid single selection.
- `label.click()` does not work — use scrollIntoView + mouse-click on the `<input>` element.

### Personal Statement — Page 7 (Tobacco field)

- The tobacco/nicotine question is a `<select>` dropdown, not a radio or button-group.
- Default option is "Please select an option" (value ""). Must explicitly set Yes or No.
- Use `select` action or eval fallback if the id is complex.

### Personal Statement — Page 7 (NZ Citizen)

- Yes/No radio. If NZ citizen = Yes, the "How long in NZ?" dropdown is **hidden** and
  should not be interacted with.
- Use scrollIntoView + mouse-click on the Yes `<input>` element.

### Owner and Address Detail (Step 6b)

- Selecting from the Policy Owner dropdown does **not** add the owner.
- You must click the **Add** button after selecting. Without this, clicking Next shows:
  "At least one owner must be added to the policy"

### Payment — Direct Debit (Step 6c)

- Apply to Policy button must be clicked per product row before the DD form appears.
- NZ bank account format: `BB-BBBB-AAAAAAA-SS`
- Backend modulus check — test accounts like `01-0001-0000001-00` will fail.
  Use real-world combinations (e.g. ASB: bank `06`, branch `0141`).
- All six inputs (`BankName`, `AccountName`, `Bank`, `Branch`, `AccountNumber`,
  `AccountNumber2`) must use the `type` action.
- The DD confirmation checkbox (`b6-Checkbox2`) requires scrollIntoView + mouse-click.

### Payment — Credit Card (Step 6c)

- Uses a QuickStream cross-domain iframe. **Cannot be automated with Playwright.**
- If you need to reach Submit Application, use Direct Debit with a valid account.

---

## 6. State Reading Patterns

### Read all interactive fields on the current page

```javascript
{ "action": "fields" }
```

Returns: tag, type, id, label, value, required, disabled, visible, options (for selects).

### Read all buttons on the current page

```javascript
{ "action": "buttons" }
```

### Check for validation errors

```javascript
{ "action": "errors" }
```

Returns text from elements matching error/invalid/feedback class patterns. Check after
every interaction that might trigger validation.

### Find an element's current value (checkboxes, radios)

```javascript
{
  "action": "eval",
  "code": "var el = document.getElementById('the-id'); return {checked: el.checked, value: el.value};"
}
```

### Find all Yes/No button group states on page

```javascript
{
  "action": "eval",
  "code": "return [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].map(b=>({id:b.id,text:b.innerText.trim(),selected:b.className.includes('selected')}));"
}
```

---

## 7. ID Discovery

Because OutSystems regenerates IDs, use these patterns to find elements:

```javascript
// Find input by label text
{ "action": "eval", "code": "return [...document.querySelectorAll('label')].find(l=>l.innerText.includes('Annual earned income'))?.htmlFor;" }

// Find select by partial id match
{ "action": "eval", "code": "return document.querySelector('select[id*=BankName]')?.id;" }

// Find button by text
{ "action": "eval", "code": "return [...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Add')?.id;" }

// Find input near a label
{ "action": "eval", "code": "return document.querySelector('label[for]')?.closest('.form-group, [class*=row], [class*=field]')?.querySelector('input')?.id;" }
```

---

## 8. Page Completion Checklist

Before clicking Next on any page:

1. Read `errors` — resolve any visible validation errors
2. Read `fields` — confirm all required fields have non-empty values
3. Check for open modals — dismiss with OK/Apply before proceeding
4. Check button groups — confirm the correct option shows `button-group-selected-item`
5. For Personal Statement pages — verify every radio/checkbox has been answered

---

## 9. Output Conventions

Each iteration writes to its own folder:

```
output/
  iteration-001/   ← first run (2026-08-04)
    form-spec.json
    confluence-page.md
    [scratch files]
  iteration-002/   ← next run
    form-spec.json
    confluence-page.md
```

The `form-spec.json` and `confluence-page.md` in the latest iteration folder are the
authoritative field/rule reference for that run. The playbook you are reading now
captures *how* to interact; the iteration outputs capture *what* was found.
