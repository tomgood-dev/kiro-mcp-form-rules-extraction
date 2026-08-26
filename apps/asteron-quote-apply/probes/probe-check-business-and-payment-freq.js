/** Quick diagnostic: are the "Business" toggle button and "Payment frequency" combobox
 * still present/reachable, or did their selector/accessible-name change? */
const { chromium } = require('@playwright/test');
const path = require('path');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, waitForSettle } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set env vars.');
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

    console.log('\n=== Business button ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    const businessInfo = await quote.evaluate(() => {
      const candidates = [...document.querySelectorAll('button')].filter((b) => b.innerText.trim().includes('Business'));
      return candidates.map((b) => ({ text: b.innerText.trim(), role: b.getAttribute('role'), disabled: b.disabled, ariaLabel: b.getAttribute('aria-label') }));
    });
    console.log('Buttons containing "Business": ' + JSON.stringify(businessInfo, null, 2));
    const byRoleCount = await quote.getByRole('button', { name: 'Business', exact: true }).count();
    console.log('getByRole(button, {name:"Business", exact:true}) count: ' + byRoleCount);

    console.log('\n=== Payment frequency combobox ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 2000);
    const pfInfo = await quote.evaluate(() => {
      const candidates = [...document.querySelectorAll('select')].filter((s) => {
        const opts = [...s.options].map((o) => o.text);
        return opts.includes('Fortnightly') || opts.includes('Monthly');
      });
      return candidates.map((s) => ({ id: s.id, ariaLabel: s.getAttribute('aria-label'), options: [...s.options].map((o) => o.text) }));
    });
    console.log('Selects with Fortnightly/Monthly options: ' + JSON.stringify(pfInfo, null, 2));
    const pfByRoleCount = await quote.getByRole('combobox', { name: 'Payment frequency' }).count();
    console.log('getByRole(combobox, {name:"Payment frequency"}) count: ' + pfByRoleCount);
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
