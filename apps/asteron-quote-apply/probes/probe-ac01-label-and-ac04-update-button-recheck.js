/**
 * Probe: independent re-check of two separate findings from today's user-story test run:
 * 1. AC01 - the "Default for Agency (...)" label text (received a garbled blob instead
 *    of the expected "Default for Agency (12345)" pattern in the spec run).
 * 2. AC04 - whether the Update button is genuinely disabled before any change.
 * Deliberately does NOT use helpers/adviser-use-helpers.js's getDefaultAgencyLabelText/
 * getUpdateButtonInfo - independent DOM reads, per the "verify with a different, minimal
 * script" rule. 2 fresh quotes total (well under the session-load ceiling).
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, waitForSettle } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

const screenshotDir = path.join(__dirname, '..', 'test-runs', '_investigation-screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'https://outsystems-dev.asteronlife.co.nz', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    // --- Scenario 1: AC01 label text ---
    console.log('\n=== AC01: Default for Agency label ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    await quote.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (!el) throw new Error('Adviser Use control not found');
      el.click();
    });
    await waitForSettle(quote, 2000);

    const labelInfo = await quote.evaluate(() => {
      // Find every occurrence of "Default for Agency" in the DOM, not just body.innerText's
      // first match, to see if there are multiple (which would explain a garbled slice).
      const all = [...document.querySelectorAll('*')].filter(
        (el) => el.children.length === 0 && (el.innerText || el.textContent || '').includes('Default for Agency')
      );
      const occurrences = all.map((el) => ({
        tag: el.tagName,
        class: el.className.slice(0, 60),
        text: (el.innerText || el.textContent || '').trim().slice(0, 150),
      }));
      const bodyIdx = document.body.innerText.indexOf('Default for Agency');
      return {
        occurrenceCount: occurrences.length,
        occurrences,
        bodyInnerTextSlice: bodyIdx === -1 ? null : document.body.innerText.slice(bodyIdx, bodyIdx + 150),
      };
    });
    console.log('  Label investigation: ' + JSON.stringify(labelInfo, null, 2));
    await quote.screenshot({ path: path.join(screenshotDir, 'ac01-default-for-agency-label.png') }).catch(() => {});

    await quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Close');
      if (b) b.click();
    });
    await waitForSettle(quote, 1000);

    // --- Scenario 2: AC04 Update button disabled state ---
    console.log('\n=== AC04: Update button state on fresh Adviser Use open ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    await quote.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (!el) throw new Error('Adviser Use control not found');
      el.click();
    });
    await waitForSettle(quote, 2000);

    const updateInfo = await quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Update');
      if (!b) return { found: false };
      return { found: true, disabled: b.disabled, className: b.className, ariaDisabled: b.getAttribute('aria-disabled') };
    });
    console.log('  Update button (immediately after opening, zero interaction): ' + JSON.stringify(updateInfo));
    await quote.screenshot({ path: path.join(screenshotDir, 'ac04-update-button-state.png') }).catch(() => {});

    // Sample again after a pure wait with zero interaction, to rule out a timing race
    // (per "if the behavior could plausibly be time-dependent" rule).
    await quote.waitForTimeout(3000);
    const updateInfo2 = await quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Update');
      return b ? { disabled: b.disabled } : null;
    });
    console.log('  Update button (3s later, zero interaction): ' + JSON.stringify(updateInfo2));

    await quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Close');
      if (b) b.click();
    });
    await waitForSettle(quote, 1000);
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
