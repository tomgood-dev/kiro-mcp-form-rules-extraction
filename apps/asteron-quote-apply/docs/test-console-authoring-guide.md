# OutSystems Test Console — Playwright Test Authoring Guide

Everything we learned about writing Playwright tests that work on the OutSystems Test Console (Forge Playwright Plugin).

---

## Quick Reference

| Rule | Details |
|------|---------|
| One `test()` per file | Multiple tests run in parallel and compete for login sessions |
| No unicode characters | `╔║╚╠` etc. cause instant parse failures — use plain ASCII only |
| No shared state | `beforeAll`, `test.describe.configure({ mode: 'serial' })`, shared variables — none of it works |
| Use `{ page }` fixture | Don't launch your own browser with `chromium.launch()` |
| `throw new Error('message')` for failures | Error text shows in the Test Console output |
| Version file names | Test Console caches old files — always upload with a new name (e.g. `test-pd-v2.spec.js`) |
| One user session at a time | OutSystems rejects concurrent logins from the same credentials |
| Sign out after each test | Releases the server-side session for the next test |
| Environment variables | Set `BASE_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD` per test entry |
| 180s timeout minimum | OutSystems is slow — login + form load + interactions takes 40-100s |

---

## File Structure (Template)

```javascript
/**
 * [Category] Business Rules ([Rule IDs])
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180_000);

test('[Test name]', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

    // LOGIN
    // ... (see Login Pattern below)

    // OPEN NEW QUOTE
    // ... (see Quote Pattern below)

    // BUSINESS RULE ASSERTIONS
    // ... (see Assertion Pattern below)

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }

  // Sign out on success
  await page.locator('button:has-text("Sign out")').click().catch(() => {});
  await page.waitForTimeout(2000);
});
```

---

## Login Pattern

```javascript
await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
  waitUntil: 'domcontentloaded', timeout: 30000,
});
await page.waitForTimeout(5000);

if (page.url().includes('_error.html'))
  throw new Error('FAILED [Login]: Error page. URL: ' + page.url());

const emailField = page.locator('input[type="text"]').first();
if (!(await emailField.isVisible().catch(() => false)))
  throw new Error('FAILED [Login]: Form not rendered. URL: ' + page.url());

await emailField.click();
await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
await page.locator('input[type="password"]').first().click();
await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
await page.locator('button:has-text("Log in")').click();

// Poll for redirect (up to 30s)
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  if (!page.url().includes('CentralPortalsLogin')) break;
}
if (page.url().includes('CentralPortalsLogin'))
  throw new Error('FAILED [Login]: Credentials rejected');
```

---

## Open New Quote Pattern

```javascript
await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

const quoteUrl = await page.evaluate(() => {
  return new Promise((resolve) => {
    window.open = function(url) { resolve(url); };
    const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
    if (link) link.click();
    setTimeout(() => resolve(null), 3000);
  });
});
if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
else await page.goto(`${BASE_URL}/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(() => false)))
  throw new Error('FAILED [Quote]: Form not rendered. URL: ' + page.url());
```

---

## Personal Details Pattern

```javascript
// Age
const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
await ageInput.click();
await page.keyboard.press('Control+a');
await page.keyboard.press('Delete');
await page.keyboard.type('35', { delay: 40 });
await page.keyboard.press('Tab');
await page.waitForTimeout(1000);

// Gender (button group — NOT a radio input)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male');
  if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
});
await page.waitForTimeout(2000);

// Occupation Code (wait for dropdown to be enabled after Gender recalculation)
await page.waitForFunction(() => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled, { timeout: 10000 }).catch(() => {});
await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
await page.waitForTimeout(2000);

// Employment Status (if needed for disability covers)
await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
await page.waitForTimeout(2000);
```

---

## Calc-Mask Field Pattern (Sum Insured / Monthly Benefit)

Never use `.fill()` — it corrupts OutSystems calc-mask fields. Always use digit-by-digit entry:

```javascript
const siField = page.locator('input[id*="SumInsured"]').first();
await siField.scrollIntoViewIfNeeded();
await siField.click();
await page.waitForTimeout(200);
for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
await page.waitForTimeout(200);
for (const d of '200000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
await page.keyboard.press('Tab');
await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2000);
```

---

## Cover Activation Pattern

Standard Playwright `.click()` does not trigger OutSystems XHR on cover buttons. Use `evaluate`:

```javascript
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
  if (btn) btn.click();
});
await page.waitForTimeout(3000);
```

---

## Error Checking Pattern

```javascript
const errors = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
  return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
});

if (!errors.some(e => e.includes('expected error text')))
  throw new Error('FAILED [Rule ID]: Expected specific error. Got: ' + (errors.join(' | ').substring(0, 200) || 'None'));
```

---

## Assertion Pattern (How to Report Failures)

Always use `throw new Error('message')` — never `expect()`:

```javascript
// GOOD - shows message in Test Console
if (!condition)
  throw new Error('FAILED [Rule PD-28]: Expected $50,000 cap error. Got: ' + actualErrors);

// BAD - shows only "Assertion failed" with no detail
expect(condition).toBe(true);
```

---

## Test Console Limitations

### Things that DO NOT work

| Feature | What happens |
|---------|-------------|
| Multiple `test()` in one file | Run in parallel, compete for login session |
| `test.describe.configure({ mode: 'serial' })` | Ignored |
| `test.beforeAll` with shared page | Each test gets its own fresh page |
| `--workers=1` | Cannot be set from the Test Console |
| `expect().toBe()` with custom message | Shows "Assertion failed" — no message text |
| Unicode characters in code | Causes instant 3-second parse failure |
| Updating a file with the same name | Test Console caches the old version |
| Screenshots from `expect()` failures | Not rendered inline (only timeout errors show screenshots) |
| `chromium.launch()` (manual browser) | Bypasses the fixture system, screenshots don't work |

### Things that DO work

| Feature | Notes |
|---------|-------|
| `throw new Error('message')` | Error text displays in the Test Console |
| `{ page }` fixture | Use this — enables screenshot capture |
| Screenshots from timeout errors | Shown inline (e.g. `page.locator('text=xyz').click({ timeout: 5000 })`) |
| `page.evaluate()` | Works for DOM queries and button clicks |
| Environment variables via `process.env` | Set per test entry in the Test Console UI |
| `test.setTimeout(180_000)` | Respected — set to at least 180s |
| `page.waitForTimeout()` | Works for explicit waits |
| Sign out via button click | Releases session for next test |

### The Caching Problem

The Test Console caches uploaded scripts by filename. If you update a script and re-upload with the same name, it may continue running the OLD version.

**Solution:** Always change the filename when updating. Use version suffixes:
```
test-pd-v1.spec.js  →  test-pd-v2.spec.js  →  test-pd-v3.spec.js
```

### Single Session Limitation

OutSystems only allows one active login session per user account. If two tests try to log in concurrently with the same credentials, one will be rejected with "incorrect login details."

**Solution:**
- Run tests one at a time (never "Execute all")
- Sign out at the end of every test (both success and failure paths)
- Wait for one test to fully complete before starting the next
- Or use separate test accounts for each test entry

---

## Environment Variables

Set these on EVERY test entry in the Test Console:

| Name | Value | Notes |
|------|-------|-------|
| `BASE_URL` | `https://outsystems-dev.asteronlife.co.nz` | No trailing slash |
| `LOGIN_EMAIL` | `hanno.coetzee+1123@resolutionlife.com.au` | Must not be logged in elsewhere |
| `LOGIN_PASSWORD` | `P@ssw0rd135` | |

Access in code: `process.env.BASE_URL`

Always `.trim()` the values — the Test Console may add whitespace:
```javascript
const BASE_URL = (process.env.BASE_URL || '').trim();
```

---

## IP Whitelisting

The OutSystems dev environment rejects requests from non-whitelisted IPs at the application layer (returns 200 but redirects to `_error.html`).

- Test Console IP: `54.253.37.176`
- Amazon Workspace IP: `10.248.94.105`
- Whitelist via: OutSystems Service Center > Administration > Security > Internal Network

To check the IP from a test:
```javascript
await page.goto('https://api.ipify.org');
const ip = await page.locator('body').innerText();
```

---

## Naming Convention

```
[category]-[description]-v[version].spec.js
```

Examples:
```
test-pd-v1.spec.js          — Personal Details rules, version 1
test-lsc-v1.spec.js         — Lump Sum Cover rules, version 1
prem-check-v1.spec.js       — Premium/Bundling rules, version 1
demo-check-v1.spec.js       — Intentional fail demo, version 1
connection-test.spec.js     — Diagnostic (no version needed)
ip-check.spec.js            — Diagnostic (no version needed)
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Assertion failed" in 3 seconds, no message | File has unicode chars OR env vars not set OR cached old version | Remove unicode, check env vars, rename file |
| Login fails intermittently | Another test or user has an active session | Wait, run one at a time, sign out after each test |
| "Error page" on login | IP not whitelisted | Add IP to Service Center Internal Network |
| Form doesn't render after login | Login succeeded but SPA needs more load time | Increase `waitForTimeout` after navigation |
| Sum Insured field shows garbled value | Used `.fill()` instead of digit-by-digit | Use the calc-mask pattern (Backspace x12 + digit keys) |
| Cover button click does nothing | Used standard `.click()` | Use `page.evaluate(() => btn.click())` |
| Screenshot not showing inline | Used `expect()` or `throw` (not a timeout error) | Timeout errors show screenshots; throws show text only |
| Same file works locally but fails on Test Console | Test Console uses different Node version or caches files | Rename file, check for Node v24 compatibility |

---

## Complete Working Example

See `test-pd-v1.spec.js` for a full working test that:
1. Validates environment variables
2. Logs in with polling
3. Opens a new quote
4. Sets personal details
5. Activates a cover
6. Enters a value via calc-mask
7. Checks for the expected validation error
8. Signs out (both success and failure paths)
9. Reports clear error messages on any failure
