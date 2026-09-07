/** Probe 3: AC19/AC20 Business<->Farmers mutual exclusivity with committed benefits + AC12 tooltip. */
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
    // eligible occupation C (5), Self-Employed, high income so min-premium clears
    const std = { age: 40, gender: 'Male', occupationCode: '5', employmentStatus: 'Self-Employed', income: 200000 };

    // AC19/20: Business Disability first, then Farmers, both with committed $5,000 benefits
    let q = await freshBiz(page, std);
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await waitForSettle(q, 1500);
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 1), '5000');
    await waitForSettle(q, 1500);
    await clickApply(q);
    console.log('\nAC19/20 (Business+Farmers, both $5,000 committed, occ C): ' + JSON.stringify(await getVisibleErrors(q), null, 2));

    // AC12 tooltip: full body text scan for the Business Security tooltip phrase, and click a ? icon
    q = await freshBiz(page, std);
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await waitForSettle(q, 1500);
    const bodySnippet = await q.evaluate(() => {
      const body = document.body.innerText || '';
      const idx = body.toLowerCase().indexOf('future increases');
      return idx >= 0 ? body.slice(idx, idx + 160) : '(phrase not in body innerText)';
    });
    console.log('\nAC12 Business Security tooltip text in body: ' + JSON.stringify(bodySnippet));
    // Enumerate question-circle icons and their nearby label to find Business Security's ? icon
    const qIcons = await q.evaluate(() => {
      return [...document.querySelectorAll('i.fa-question-circle')].map((i) => {
        let n = i.parentElement, t = '';
        for (let d = 0; d < 5 && n; d++) { t = (n.innerText || '').trim().split('\n').filter(Boolean)[0] || ''; if (t) break; n = n.parentElement; }
        return { nearby: t, title: i.getAttribute('title'), dataOriginalTitle: i.getAttribute('data-original-title') };
      });
    });
    console.log('AC12 question icons + nearby label: ' + JSON.stringify(qIcons, null, 2));
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
