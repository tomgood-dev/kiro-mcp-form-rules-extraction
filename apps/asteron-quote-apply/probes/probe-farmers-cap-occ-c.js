/** Probe 4: AC16 Farmers $10k cap on ELIGIBLE occupation C (5), Self-Employed. */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, sumInsuredInput,
  fillCalcMask, clickApply, getVisibleErrors, waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
async function login(page) {
  await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
  const form = page.locator('form.login-form');
  await form.locator('input[type="text"]').first().fill(process.env.ASTERON_LOGIN_EMAIL);
  await form.locator('input[type="password"]').first().fill(process.env.ASTERON_LOGIN_PASSWORD);
  await form.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 90000 });
}
async function freshBiz(page, opts) {
  const q = await openNewQuote(page);
  await setMinimumPersonalDetails(q, opts);
  await clickButtonByLabel(q, 'Business', 'Business policy button');
  await waitForSettle(q, 2500);
  return q;
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  try {
    await login(page); console.log('[login] OK');
    const std = { age: 40, gender: 'Male', occupationCode: '5', employmentStatus: 'Self-Employed', income: 200000 };
    // over cap
    let q = await freshBiz(page, std);
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '10001');
    await clickApply(q);
    console.log('\nAC16 over (Farmers $10,001 occ C): ' + JSON.stringify(await getVisibleErrors(q), null, 2));
    // at boundary
    q = await freshBiz(page, std);
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '10000');
    await clickApply(q);
    console.log('AC16 boundary (Farmers $10,000 occ C): ' + JSON.stringify(await getVisibleErrors(q), null, 2));
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
