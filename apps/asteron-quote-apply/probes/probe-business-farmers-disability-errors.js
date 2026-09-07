/** Probe 2: Business/Farmers Disability Apply-time errors (ACB-2691, QA).
 * Confirms verbatim error strings for: AC15 $50k Business cap, AC16 $10k Farmers cap,
 * AC13/AC14 age>61, AC22 Business Security age>56, AC23/AC24 age<17, AC19/AC20 mutual exclusivity,
 * AC07 Farmers+Employed employment-status error, AC12 Business Security tooltip.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, sumInsuredInput,
  commitWithoutTyping, fillCalcMask, clickApply, getVisibleErrors, waitForSettle,
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
async function tickBS(page) {
  await page.evaluate(() => {
    const c = [...document.querySelectorAll('input[type="checkbox"]')].find((x) => {
      let n = x.parentElement, t = ''; for (let d = 0; d < 6 && n; d++) { t = (n.innerText || '').trim().split('\n')[0]; if (t) break; n = n.parentElement; }
      return /Business Security/i.test(t);
    });
    if (c && !c.checked) { c.scrollIntoView({ block: 'center' }); c.click(); }
  });
  await waitForSettle(page, 1500);
}

(async () => {
  if (!process.env.ASTERON_LOGIN_EMAIL) throw new Error('Set creds.');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  try {
    await login(page);
    console.log('[login] OK');
    const std = { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Self-Employed', income: 150000 };

    // AC15: Business Disability $50k cap
    let q = await freshBiz(page, std);
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '50001');
    await clickApply(q);
    console.log('\nAC15 (Business $50,001): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC15 boundary: exactly 50000 accepted
    q = await freshBiz(page, std);
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '50000');
    await clickApply(q);
    console.log('AC15 boundary (Business $50,000): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC16: Farmers $10k cap
    q = await freshBiz(page, std);
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '10001');
    await clickApply(q);
    console.log('\nAC16 (Farmers $10,001): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC16 boundary
    q = await freshBiz(page, std);
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '10000');
    await clickApply(q);
    console.log('AC16 boundary (Farmers $10,000): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC13: Business age>61
    q = await freshBiz(page, { ...std, age: 62 });
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await clickApply(q);
    console.log('\nAC13 (Business age 62): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC14: Farmers age>61
    q = await freshBiz(page, { ...std, age: 62 });
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await clickApply(q);
    console.log('AC14 (Farmers age 62): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC23: Business age<17
    q = await freshBiz(page, { ...std, age: 16 });
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await clickApply(q);
    console.log('\nAC23 (Business age 16): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC24: Farmers age<17
    q = await freshBiz(page, { ...std, age: 16 });
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await clickApply(q);
    console.log('AC24 (Farmers age 16): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC22: Business Security age>56
    q = await freshBiz(page, { ...std, age: 57 });
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await tickBS(q);
    await clickApply(q);
    console.log('\nAC22 (Business Security age 57): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC22 boundary: age 56 accepted
    q = await freshBiz(page, { ...std, age: 56 });
    await activateCover(q, 'Business Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await tickBS(q);
    await clickApply(q);
    console.log('AC22 boundary (Business Security age 56): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC19/AC20: Business + Farmers mutual exclusivity
    q = await freshBiz(page, std);
    await activateCover(q, 'Business Disability');
    await commitWithoutTyping(sumInsuredInput(q, 0));
    await waitForSettle(q, 1000);
    await activateCover(q, 'Farmers Disability');
    await commitWithoutTyping(sumInsuredInput(q, 1));
    await clickApply(q);
    console.log('\nAC19/20 (Business + Farmers): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC07: Farmers + Employed
    q = await freshBiz(page, { ...std, employmentStatus: 'Employed' });
    await activateCover(q, 'Farmers Disability');
    await fillCalcMask(sumInsuredInput(q, 0), '5000');
    await clickApply(q);
    console.log('\nAC07 (Farmers + Employed, occ AA): ' + JSON.stringify(await getVisibleErrors(q)));

    // AC08: Farmers + ineligible occupation? Try occ IC (8) and U (7)
    for (const occ of ['8', '7', '5']) {
      q = await freshBiz(page, { ...std, occupationCode: occ });
      await activateCover(q, 'Farmers Disability');
      await fillCalcMask(sumInsuredInput(q, 0), '5000');
      await clickApply(q);
      console.log(`AC06/08 (Farmers + occ code ${occ}, Self-Employed): ` + JSON.stringify(await getVisibleErrors(q)));
    }

    // AC12: tooltip - search titles/help icons for Business Security text
    q = await freshBiz(page, std);
    await activateCover(q, 'Business Disability');
    await commitWithoutTyping(sumInsuredInput(q, 0));
    await waitForSettle(q, 1500);
    const tips = await q.evaluate(() => {
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title')).filter(Boolean);
      const aria = [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter(Boolean);
      const bodyHas = /future increases without medical underwriting/i.test(document.body.innerText || '');
      return { titles: titles.filter((t) => /increase|underwriting|security|justification/i.test(t)), aria: aria.filter((t) => /increase|underwriting|security|justification/i.test(t)), bodyHas };
    });
    console.log('\nAC12 tooltip candidates: ' + JSON.stringify(tips, null, 2));
    // also list all help/question icons near Business Security
    const helpIcons = await q.evaluate(() => {
      return [...document.querySelectorAll('i, span, a')].filter((e) => /^\?$/.test((e.innerText || '').trim()) || /help|question|info|tooltip/i.test(e.className)).map((e) => ({ tag: e.tagName, cls: e.className, title: e.getAttribute('title'), aria: e.getAttribute('aria-label') })).slice(0, 20);
    });
    console.log('AC12 help-icon elements: ' + JSON.stringify(helpIcons, null, 2));
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
