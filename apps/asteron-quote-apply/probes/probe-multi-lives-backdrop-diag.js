/**
 * Root-cause diagnostic for MLP-13's persistent popup-backdrop interception when building many
 * lives. After each "Add life", dump: is there a backdrop? what modal text/buttons exist? does
 * clicking OK via evaluate clear the backdrop? This informs the correct fix instead of guessing.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

async function backdropState(page) {
  return page.evaluate(() => {
    const backdrops = [...document.querySelectorAll('.popup-backdrop, [data-popup-backdrop]')].filter((b) => b.offsetParent !== null);
    const allButtons = [...document.querySelectorAll('button')].filter((b) => b.offsetParent !== null).map((b) => (b.innerText || '').trim()).filter((t) => t.length && t.length < 20);
    // find text near any backdrop's sibling/parent
    const dialogs = [...document.querySelectorAll('[role="dialog"], [class*="popup" i], [class*="modal" i], [class*="Dialog" i]')]
      .filter((m) => m.offsetParent !== null && !(m.className || '').toString().toLowerCase().includes('vscomp'))
      .map((m) => ({ cls: (m.className || '').toString().slice(0, 60), text: (m.innerText || '').trim().slice(0, 120) }));
    return { backdropCount: backdrops.length, visibleButtons: [...new Set(allButtons)], dialogs };
  });
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: 'https://outsystems-dev.asteronlife.co.nz' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    const quote = await openNewQuote(page);
    for (let i = 1; i <= 4; i++) {
      await setMinimumPersonalDetails(quote);
      await activateCover(quote, 'Life');
      await fillCalcMask(sumInsuredInput(quote, 0), '200000');
      await waitForSettle(quote, 800);
      console.log(`\n--- life ${i} priced. Clicking Add life ---`);
      await clickButtonByLabel(quote, 'Add life', 'Add life');
      await waitForSettle(quote, 1500);
      const st = await backdropState(quote);
      console.log(`  after Add life ${i}: ` + JSON.stringify(st));
      // Try to clear: click OK via evaluate
      const cleared = await quote.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].filter((b) => b.offsetParent !== null).find((b) => /^OK$/i.test((b.innerText || '').trim()));
        if (btn) { btn.click(); return 'clicked OK'; }
        return 'no OK button found';
      });
      console.log('  clear attempt: ' + cleared);
      await waitForSettle(quote, 1000);
      const st2 = await backdropState(quote);
      console.log(`  after OK click: backdropCount=${st2.backdropCount}`);
    }
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
