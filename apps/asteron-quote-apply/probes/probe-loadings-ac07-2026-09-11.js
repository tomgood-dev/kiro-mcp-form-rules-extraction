// Focused AC07 re-probe (verify-before-writeup): does entering >$20.00 per mille produce
// "The maximum per mille loading is $20.00"? Minimal script — self-verifies the value actually
// landed, tries typing (keyboard) not just fill, and reads multiple error surfaces.
// Run: BASE_URL=... PROBE_ACCT=a node apps/asteron-quote-apply/probes/probe-loadings-ac07-2026-09-11.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const ACCT = process.env.PROBE_ACCT || 'a';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${ACCT}.json`);
const H = require('../helpers/quote-helpers');

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const out = { steps: [] };
  const log = (m) => { console.log(typeof m === 'string' ? m : JSON.stringify(m)); out.steps.push(m); };
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ storageState: statePath, ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  try {
    const quote = await H.openNewQuote(page);
    await H.setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await H.activateCover(quote, 'Life');
    await H.fillCalcMask(H.sumInsuredInput(quote, 0), '200000');
    await H.waitForSettle(quote, 1500);
    await quote.evaluate(() => { const el = [...document.querySelectorAll('button,a,div,span')].find((b) => (b.innerText || '').trim() === 'Loadings'); if (el) el.click(); });
    await H.waitForSettle(quote, 2500);

    const pmSel = '[id="b25-b16-Input_PerMille"]';
    const pm = quote.locator(pmSel);

    // Type char-by-char (real keyboard) rather than fill, then Tab to blur — closest to a user.
    await pm.click();
    await pm.press('Control+a').catch(() => {});
    await pm.type('25', { delay: 80 });
    await pm.press('Tab');
    await H.waitForSettle(quote, 2000);

    // SELF-VERIFY the value actually landed (rule out "input didn't register").
    const landed = await quote.evaluate((sel) => { const e = document.querySelector(sel); return e ? { value: e.value, valid: e.validity ? e.validity.valid : null, validationMessage: e.validationMessage } : null; }, pmSel);
    log({ valueLanded: landed });

    // Read every plausible error surface.
    const errSurfaces = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const maxLine = (body.match(/[^\n]*maximum per mille[^\n]*/i) || [''])[0].trim();
      // OutSystems validation spans often carry class 'OSFillParent' / role=alert / .feedback-message
      const feedbackEls = [...document.querySelectorAll('[class*="feedback"],[class*="error"],[class*="Error"],[role="alert"],.text-danger')]
        .filter((e) => e.offsetParent !== null).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 20);
      return { hasMaxInBody: /maximum per mille/i.test(body), maxLine, feedbackEls };
    });
    log({ ac07_over20_errSurfaces: errSurfaces });

    // Also try 20.01 (just over) to be sure it's not a >=/> boundary nuance.
    await pm.click(); await pm.press('Control+a').catch(() => {}); await pm.type('20.01', { delay: 80 }); await pm.press('Tab');
    await H.waitForSettle(quote, 2000);
    const landed2 = await quote.evaluate((sel) => { const e = document.querySelector(sel); return e ? e.value : null; }, pmSel);
    const err2 = await quote.evaluate(() => /maximum per mille/i.test(document.body.innerText || ''));
    log({ ac07_2001_value: landed2, ac07_2001_hasMax: err2 });

    fs.writeFileSync(path.join(__dirname, 'probe-loadings-ac07-result.json'), JSON.stringify(out, null, 2));
    log('DONE');
  } catch (e) {
    log(`ERROR: ${e.message}`);
    fs.writeFileSync(path.join(__dirname, 'probe-loadings-ac07-result.json'), JSON.stringify(out, null, 2));
  } finally {
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
