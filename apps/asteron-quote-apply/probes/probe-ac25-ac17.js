/** Probe 6: AC25 classification/benefit-period combo + AC17 Farmers+Workability. */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, sumInsuredInput,
  fillCalcMask, clickApply, getVisibleErrors, coverButtonExists, waitForSettle,
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
function pick(page, matchOptions, label) {
  return page.evaluate(({ matchOptions, label }) => {
    const sel = [...document.querySelectorAll('select')].find((s) => { const o = [...s.options].map((x) => x.text.trim()); return matchOptions.every((m) => o.includes(m)); });
    if (!sel) return 'SELECT NOT FOUND';
    const opt = [...sel.options].find((o) => o.text.trim() === label);
    if (!opt) return 'OPTION NOT FOUND';
    sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true }));
    return 'set ' + label + ' selected=' + sel.options[sel.selectedIndex].text.trim();
  }, { matchOptions, label });
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  try {
    await login(page); console.log('[login] OK');
    const std = { age: 40, gender: 'Male', occupationCode: '5', employmentStatus: 'Self-Employed', income: 200000 };

    // AC25: Business Disability, Classification = Equity Owner (>75%), Benefit Period = 18 Months
    let q = await freshBiz(page, std);
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await waitForSettle(q, 1500);
    console.log('Set classification: ' + await pick(q, ['Employed', 'Equity Owner (>75%)'], 'Equity Owner (>75%)'));
    await waitForSettle(q, 1500);
    console.log('Set benefit period: ' + await pick(q, ['6 Months', '24 Months'], '18 Months'));
    await waitForSettle(q, 1500);
    // verify the selects actually reflect the change
    const state = await q.evaluate(() => {
      const cls = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.text.includes('Equity Owner')));
      const bp = [...document.querySelectorAll('select')].find((s) => { const o = [...s.options].map((x) => x.text.trim()); return o.includes('6 Months') && o.includes('24 Months'); });
      return { classification: cls ? cls.options[cls.selectedIndex].text.trim() : null, benefitPeriod: bp ? bp.options[bp.selectedIndex].text.trim() : null };
    });
    console.log('State before Apply: ' + JSON.stringify(state));
    await clickApply(q);
    console.log('AC25 (Equity Owner >75% + 18 Months): ' + JSON.stringify(await getVisibleErrors(q), null, 2));

    // AC17: personal Workability + business Farmers
    q = await openNewQuote(page);
    await setMinimumPersonalDetails(q, std);
    if (await coverButtonExists(q, 'Workability')) {
      await activateCover(q, 'Workability');
      await fillCalcMask(sumInsuredInput(q, 0), '5000');
      await waitForSettle(q, 1500);
      await clickButtonByLabel(q, 'Business', 'Business policy button');
      await waitForSettle(q, 2500);
      await activateCover(q, 'Farmers Disability');
      const n = await q.locator('input[id*="SumInsured"]').count();
      await fillCalcMask(sumInsuredInput(q, n - 1), '5000');
      await waitForSettle(q, 1500);
      await clickApply(q);
      console.log('\nAC17 (personal Workability + Farmers): ' + JSON.stringify(await getVisibleErrors(q), null, 2));
    }
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
