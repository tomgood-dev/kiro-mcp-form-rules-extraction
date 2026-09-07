/** Probe: Business Policy Disability Cover - Business Expenses (ACB-2695).
 * Discovers the live DOM for AC02..AC10 before encoding the spec.
 * Run: node apps/asteron-quote-apply/probes/probe-business-expenses.js  (with QA env vars set)
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote, setMinimumPersonalDetails, activateCover, coverButtonExists,
  fillCalcMask, commitWithoutTyping, sumInsuredInput, getVisibleErrors, clickApply, waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

const BASE = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';

async function login(page, email, password) {
  await page.goto(BASE + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
  const form = page.locator('form.login-form');
  await form.locator('input[type="text"]').first().fill(email);
  await form.locator('input[type="password"]').first().fill(password);
  await form.locator('button[type="submit"]').first().click();
  await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
  console.log('[login] OK');
}

async function dumpDisabilityControls(page, tag) {
  const info = await page.evaluate(() => {
    const selects = [...document.querySelectorAll('select')].map((s) => ({
      id: s.id,
      ariaLabel: s.getAttribute('aria-label'),
      disabled: s.disabled,
      className: s.className,
      selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.trim() : null,
      options: [...s.options].map((o) => o.text.trim()),
    }));
    const inputs = [...document.querySelectorAll('input')].filter((i) => /SumInsured|MaskedInput|Benefit/i.test(i.id)).map((i) => ({ id: i.id, disabled: i.disabled, value: i.value }));
    return { selects, inputs };
  });
  console.log(`\n=== [${tag}] disability controls ===`);
  console.log(JSON.stringify(info, null, 2));
  return info;
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL / ASTERON_LOGIN_PASSWORD.');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: BASE, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  try {
    await login(page, email, password);

    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 2000);

    for (const c of ['Business Disability', 'Farmers Disability', 'Business Expenses']) {
      console.log(`[AC02] cover button "${c}" present: ${await coverButtonExists(quote, c)}`);
    }
    const btns = await quote.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim().split('\n')[0]).filter((t) => t));
    console.log('[buttons] ' + JSON.stringify([...new Set(btns)]));

    await activateCover(quote, 'Business Expenses');
    await waitForSettle(quote, 1500);
    await dumpDisabilityControls(quote, 'AC03 after activate Business Expenses');

    const beDisabled = await quote.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Business Expenses');
      return b ? { disabled: b.disabled, className: b.className } : null;
    });
    console.log('[AC06] Business Expenses button after 1 activation: ' + JSON.stringify(beDisabled));

    await fillCalcMask(sumInsuredInput(quote, 0), '99999');
    await clickApply(quote);
    console.log('[AC05] errors after $99,999: ' + JSON.stringify(await getVisibleErrors(quote)));

    await quote.evaluate(() => { const l = [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove'); if (l.length) l[l.length - 1].click(); });
    await waitForSettle(quote, 1500);
    console.log('[AC07] SI inputs after remove: ' + await quote.locator('input[id*="SumInsured"]').count());

    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 62, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 1500);
    await activateCover(quote, 'Business Expenses');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    console.log('[AC08] errors at age 62: ' + JSON.stringify(await getVisibleErrors(quote)));

    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 16, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    await clickButtonByLabel(quote, 'Business', 'Business policy button');
    await waitForSettle(quote, 1500);
    await activateCover(quote, 'Business Expenses');
    await commitWithoutTyping(sumInsuredInput(quote, 0));
    await clickApply(quote);
    console.log('[AC09] errors at age 16: ' + JSON.stringify(await getVisibleErrors(quote)));

    for (const occ of ['5', '6', '7', '8']) {
      quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: occ, employmentStatus: 'Employed', income: 150000 });
      await clickButtonByLabel(quote, 'Business', 'Business policy button');
      await waitForSettle(quote, 1200);
      const present = await coverButtonExists(quote, 'Business Expenses');
      let errs = [];
      if (present) {
        await activateCover(quote, 'Business Expenses');
        await commitWithoutTyping(sumInsuredInput(quote, 0));
        await clickApply(quote);
        errs = await getVisibleErrors(quote);
      }
      console.log(`[AC04] occ=${occ} BE present=${present} errors=${JSON.stringify(errs)}`);
    }

    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
    const wbPresent = await coverButtonExists(quote, 'Workability');
    console.log('[AC10] Workability present on personal policy: ' + wbPresent);
    if (wbPresent) {
      await activateCover(quote, 'Workability');
      await commitWithoutTyping(sumInsuredInput(quote, 0));
      await waitForSettle(quote, 1200);
    }
    const bizBtn = await quote.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.innerText.trim().split('\n')[0] === 'Business'));
    console.log('[AC10] Business policy button still present after Workability: ' + bizBtn);
    if (bizBtn) {
      await clickButtonByLabel(quote, 'Business', 'Business policy button');
      await waitForSettle(quote, 1500);
      const bePresent = await coverButtonExists(quote, 'Business Expenses');
      console.log('[AC10] Business Expenses present after Workability: ' + bePresent);
      if (bePresent) {
        await activateCover(quote, 'Business Expenses');
        await commitWithoutTyping(sumInsuredInput(quote, 1));
        await clickApply(quote);
        console.log('[AC10] errors (Workability + Business Expenses): ' + JSON.stringify(await getVisibleErrors(quote)));
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
