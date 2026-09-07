/** Probe: Business/Farmers Disability cover controls on the BUSINESS policy (ACB-2691, QA).
 * Confirms: cover buttons present; Business Disability classification/benefit-period/waiting-period
 * dropdown option sets + defaults; Business Security + Partial Disablement checkboxes + defaults;
 * Premium Structure; Farmers Disability (no classification, adds "5 Years" benefit period);
 * occupation-code dropdown option labels available on this account.
 *
 * Run: ASTERON_LOGIN_EMAIL=... ASTERON_LOGIN_PASSWORD=... BASE_URL=... node apps/asteron-quote-apply/probes/probe-business-farmers-disability.js
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, coverButtonExists,
  sumInsuredInput, commitWithoutTyping, waitForSettle, getVisibleErrors,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';

function dumpSelects(page, label) {
  return page.evaluate((lbl) => {
    return [...document.querySelectorAll('select')].map((s) => ({
      id: s.id,
      ariaLabel: s.getAttribute('aria-label'),
      disabled: s.disabled,
      selected: s.selectedIndex >= 0 ? s.options[s.selectedIndex].text.trim() : null,
      options: [...s.options].map((o) => o.text.trim()),
    }));
  }, label);
}
function dumpCheckboxes(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('input[type="checkbox"]')].map((c) => {
      let n = c.parentElement, t = '';
      for (let d = 0; d < 6 && n; d++) { t = (n.innerText || '').trim().split('\n')[0]; if (t) break; n = n.parentElement; }
      return { id: c.id, label: t, checked: c.checked, disabled: c.disabled };
    });
  });
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL / ASTERON_LOGIN_PASSWORD.');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  try {
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 90000 });
    console.log('[login] OK');

    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });

    // Occupation-code dropdown options available on this account
    const occOpts = await quote.evaluate(() => {
      const s = document.querySelector('select[id*="OccupationCode_Dropdown"]');
      return s ? [...s.options].map((o) => ({ value: o.value, text: o.text.trim() })) : null;
    });
    console.log('\n=== OccupationCode options ===\n' + JSON.stringify(occOpts, null, 2));

    // Employment status options
    const empOpts = await quote.evaluate(() => {
      const s = document.querySelector('select[id*="EmploymentStatus_Dropdown"]');
      return s ? [...s.options].map((o) => o.text.trim()) : null;
    });
    console.log('\n=== EmploymentStatus options ===\n' + JSON.stringify(empOpts));

    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 2500);

    console.log('\n=== Cover buttons present on Business policy ===');
    for (const c of ['Business Disability', 'Farmers Disability', 'Business Expenses', 'Income Protection', 'Mortgage & Living', 'Workability']) {
      console.log(`  ${c}: ${await coverButtonExists(quote, c)}`);
    }

    // ---- Business Disability ----
    console.log('\n=== Activate Business Disability ===');
    await activateCover(quote, 'Business Disability');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await waitForSettle(quote, 2000);
    console.log('SELECTS after Business Disability:\n' + JSON.stringify(await dumpSelects(quote), null, 2));
    console.log('CHECKBOXES after Business Disability:\n' + JSON.stringify(await dumpCheckboxes(quote), null, 2));
    const bdBtnState = await quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Business Disability');
      return b ? { disabled: b.disabled, className: b.className } : null;
    });
    console.log('Business Disability +button state after activation: ' + JSON.stringify(bdBtnState));

    // labels / body text snapshot for tooltip search
    const bodyHas = await quote.evaluate(() => {
      const body = document.body.innerText || '';
      const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title')).filter(Boolean);
      return {
        hasBusinessDisabilityLabel: /Business Disability/i.test(body),
        businessSecurityTooltip: titles.filter((t) => /future increases|medical underwriting|Business Security/i.test(t)),
      };
    });
    console.log('Body/tooltip snapshot: ' + JSON.stringify(bodyHas, null, 2));

    // ---- Farmers Disability (fresh quote, self-employed + farming occupation attempt) ----
    console.log('\n=== Fresh quote: Farmers Disability (Self-Employed) ===');
    const quote2 = await openNewQuote(page);
    await setMinimumPersonalDetails(quote2, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Self-Employed', income: 150000 });
    await clickButtonByLabel(quote2, 'Business', 'Business policy button');
    await waitForSettle(quote2, 2500);
    await activateCover(quote2, 'Farmers Disability');
    await commitWithoutTyping(sumInsuredInput(quote2, 0));
    await waitForSettle(quote2, 2000);
    console.log('SELECTS after Farmers Disability:\n' + JSON.stringify(await dumpSelects(quote2), null, 2));
    console.log('CHECKBOXES after Farmers Disability:\n' + JSON.stringify(await dumpCheckboxes(quote2), null, 2));
    console.log('Visible errors after Farmers activation (occ code 1, Self-Employed): ' + JSON.stringify(await getVisibleErrors(quote2)));
    const fdBtnState = await quote2.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Farmers Disability');
      const bd = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Business Disability');
      return {
        farmers: b ? { disabled: b.disabled, className: b.className } : null,
        business: bd ? { disabled: bd.disabled, className: bd.className } : null,
      };
    });
    console.log('Button states after Farmers activation: ' + JSON.stringify(fdBtnState, null, 2));
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
