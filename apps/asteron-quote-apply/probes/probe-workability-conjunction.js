/** Probe 5: AC17/AC18 reachability - personal Workability + business Business/Farmers Disability in one quote. */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, sumInsuredInput,
  fillCalcMask, commitWithoutTyping, clickApply, getVisibleErrors, coverButtonExists, waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel, buttonByLabelExists } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
async function login(page) {
  await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
  const form = page.locator('form.login-form');
  await form.locator('input[type="text"]').first().fill(process.env.ASTERON_LOGIN_EMAIL);
  await form.locator('input[type="password"]').first().fill(process.env.ASTERON_LOGIN_PASSWORD);
  await form.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 90000 });
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  try {
    await login(page); console.log('[login] OK');
    const q = await openNewQuote(page);
    await setMinimumPersonalDetails(q, { age: 40, gender: 'Male', occupationCode: '5', employmentStatus: 'Self-Employed', income: 200000 });
    // On the DEFAULT (personal) policy: is Workability present?
    console.log('Personal policy Workability present: ' + await coverButtonExists(q, 'Workability'));
    // list all policy-type buttons and cover buttons
    const btns = await q.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim().split('\n')[0]).filter(Boolean));
    console.log('All buttons (first-line): ' + JSON.stringify([...new Set(btns)]));
    // Activate personal Workability
    if (await coverButtonExists(q, 'Workability')) {
      await activateCover(q, 'Workability');
      await fillCalcMask(sumInsuredInput(q, 0), '5000');
      await waitForSettle(q, 1500);
      // Now switch to Business policy and add Business Disability
      const hasBusiness = await buttonByLabelExists(q, 'Business');
      console.log('Business policy button present after personal Workability: ' + hasBusiness);
      if (hasBusiness) {
        await clickButtonByLabel(q, 'Business', 'Business policy button');
        await waitForSettle(q, 2500);
        console.log('Business Disability present on Business tab: ' + await coverButtonExists(q, 'Business Disability'));
        if (await coverButtonExists(q, 'Business Disability')) {
          await activateCover(q, 'Business Disability');
          const nInputs = await q.locator('input[id*="SumInsured"]').count();
          await fillCalcMask(sumInsuredInput(q, nInputs - 1), '5000');
          await waitForSettle(q, 1500);
          await clickApply(q);
          console.log('AC18 (personal Workability + Business Disability): ' + JSON.stringify(await getVisibleErrors(q), null, 2));
        }
      }
    }
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
