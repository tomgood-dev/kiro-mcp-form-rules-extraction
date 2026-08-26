/**
 * Probe: exhaustive LSC-02/LSC-03 occupation-gating sweep.
 *
 * For every Occupation Code option in the dropdown, on a FRESH quote (avoids the
 * documented stale-state-carryover issue), attempts to activate Needlestick, Cancer,
 * Acd. Death, and Specific Injury (no companion cover pre-activated — matches what
 * the automated LSC-02/LSC-03 tests do) and records whether a cover card actually
 * appeared (a new "Remove" link), i.e. whether the click was a no-op or not.
 *
 * Does NOT stop at the first failing code/cover — every combination is recorded,
 * unlike the Playwright test suite which aborts a `test()` on first failed assertion.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  removeAllCoverCards,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

const COVERS = ['Needlestick', 'Cancer', 'Acd. Death', 'Specific Injury'];

async function countRemoveLinks(page) {
  return page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove').length);
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars before running.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'https://outsystems-dev.asteronlife.co.nz', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const results = [];

  async function login() {
    console.log('[login] Logging in...');
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');
  }

  async function openNewQuoteResilient() {
    try {
      return await openNewQuote(page);
    } catch (err) {
      if (page.url().includes('CentralPortalsLogin')) {
        console.log('[recover] Session dropped — logging in again and retrying...');
        await login();
        return await openNewQuote(page);
      }
      throw err;
    }
  }

  try {
    await login();

    // Discover the full Occupation Code option list once, from a fresh quote.
    let quote = await openNewQuoteResilient();
    await setMinimumPersonalDetails(quote);
    const occOptions = await quote.evaluate(() => {
      const sel = document.querySelector('select[id*="OccupationCode_Dropdown"]');
      return [...sel.options].map((o) => ({ value: o.value, text: o.text.trim() })).filter((o) => o.value !== '');
    });
    console.log('[discover] Occupation Code options: ' + JSON.stringify(occOptions));

    const filter = (process.env.OCC_CODES_FILTER || '').split(',').map((s) => s.trim()).filter(Boolean);
    const codesToTest = filter.length ? occOptions.filter((o) => filter.includes(o.text)) : occOptions;
    console.log('[discover] Testing codes: ' + JSON.stringify(codesToTest.map((o) => o.text)));

    for (const opt of codesToTest) {
      console.log(`\n=== Occupation Code = ${opt.text} (value=${opt.value}) ===`);
      quote = await openNewQuoteResilient();
      await setMinimumPersonalDetails(quote, { occupationCode: opt.value });
      await waitForSettle(quote, 1000);

      for (const cover of COVERS) {
        const before = await countRemoveLinks(quote);
        let activated = null;
        let error = null;
        try {
          await activateCover(quote, cover);
          await waitForSettle(quote, 1500); // extra margin — avoid false "no-op" from a slow recalculation chain
          const after = await countRemoveLinks(quote);
          activated = after > before;
        } catch (err) {
          error = err.message;
          if (/not found/i.test(err.message)) {
            const allButtons = await quote.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim().split('\n')[0]).filter(Boolean));
            console.log(`    [diag] Button not found for "${cover}" — all visible button labels: ${JSON.stringify(allButtons)}`);
          }
        }
        console.log(`  ${cover}: ${error ? 'ERROR: ' + error : activated ? 'ACTIVATED (card added)' : 'no-op (gated)'}`);
        results.push({ occCode: opt.text, occValue: opt.value, cover, activated, error });
        // Clean up so the next cover in this loop isn't confounded by a leftover card.
        await removeAllCoverCards(quote).catch(() => {});
      }
    }
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    console.log('\n=== RESULTS TABLE ===');
    console.log('OccCode | Cover | Outcome');
    for (const r of results) {
      console.log(`${r.occCode} | ${r.cover} | ${r.error ? 'ERROR: ' + r.error : r.activated ? 'ACTIVATED' : 'no-op'}`);
    }
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
