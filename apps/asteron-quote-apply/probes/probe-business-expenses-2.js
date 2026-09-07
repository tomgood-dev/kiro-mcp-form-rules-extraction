/** Probe 2: AC04 occupation suitability sweep, AC08/AC09 boundary, AC10 Workability conjunction.
 * Run: node apps/asteron-quote-apply/probes/probe-business-expenses-2.js
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

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ baseURL: BASE, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  try {
    await login(page, email, password);

    // AC04 — sweep every occupation code value 0..8 (AM/AA/A1/A2/B/C/S/U/IC).
    // Enter the $16,666 max benefit (valid) so min-premium can't mask an occupation error.
    for (const occ of ['AM', 'AA', 'A1', 'A2', 'B', 'C', 'S', 'U', 'IC']) {
      const quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
      // Re-select occupation by LABEL (value != label in this dropdown)
      await quote.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption({ label: occ });
      await waitForSettle(quote, 1500);
      await clickButtonByLabel(quote, 'Business', 'Business policy button');
      await waitForSettle(quote, 1200);
      const present = await coverButtonExists(quote, 'Business Expenses');
      let errs = [];
      if (present) {
        await activateCover(quote, 'Business Expenses');
        await fillCalcMask(sumInsuredInput(quote, 0), '5000');
        await clickApply(quote);
        errs = await getVisibleErrors(quote);
      }
      console.log(`[AC04] occ=${occ} BE present=${present} errors=${JSON.stringify(errs)}`);
    }

    // AC05 boundary: exactly $16,666 accepted (no cap error)
    {
      const quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
      await clickButtonByLabel(quote, 'Business', 'Business policy button');
      await waitForSettle(quote, 1200);
      await activateCover(quote, 'Business Expenses');
      await fillCalcMask(sumInsuredInput(quote, 0), '16666');
      await clickApply(quote);
      console.log('[AC05 boundary $16,666] errors=' + JSON.stringify(await getVisibleErrors(quote)));
    }

    // AC08 boundary: age 61 accepted (no max-age error)
    {
      const quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: 61, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
      await clickButtonByLabel(quote, 'Business', 'Business policy button');
      await waitForSettle(quote, 1200);
      await activateCover(quote, 'Business Expenses');
      await fillCalcMask(sumInsuredInput(quote, 0), '5000');
      await clickApply(quote);
      console.log('[AC08 boundary age 61] errors=' + JSON.stringify(await getVisibleErrors(quote)));
    }

    // AC09 boundary: age 17 accepted (no min-age error)
    {
      const quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: 17, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
      await clickButtonByLabel(quote, 'Business', 'Business policy button');
      await waitForSettle(quote, 1200);
      await activateCover(quote, 'Business Expenses');
      await fillCalcMask(sumInsuredInput(quote, 0), '5000');
      await clickApply(quote);
      console.log('[AC09 boundary age 17] errors=' + JSON.stringify(await getVisibleErrors(quote)));
    }

    // AC10 — Personal Workability + Business Expenses. Count SI inputs at each step.
    {
      const quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: 150000 });
      await activateCover(quote, 'Workability');
      await commitWithoutTyping(sumInsuredInput(quote, 0));
      await waitForSettle(quote, 1500);
      console.log('[AC10] SI count after Workability: ' + await quote.locator('input[id*="SumInsured"]').count());
      await clickButtonByLabel(quote, 'Business', 'Business policy button');
      await waitForSettle(quote, 1800);
      const bePresent = await coverButtonExists(quote, 'Business Expenses');
      console.log('[AC10] Business Expenses present after switching to Business tab: ' + bePresent);
      const siBefore = await quote.locator('input[id*="SumInsured"]').count();
      console.log('[AC10] SI count on Business tab before activating BE: ' + siBefore);
      await activateCover(quote, 'Business Expenses');
      await waitForSettle(quote, 1800);
      const siAfter = await quote.locator('input[id*="SumInsured"]').count();
      console.log('[AC10] SI count after activating BE: ' + siAfter);
      // fill the last SI input
      if (siAfter > 0) {
        await fillCalcMask(sumInsuredInput(quote, siAfter - 1), '5000');
      }
      await clickApply(quote);
      console.log('[AC10] errors (Workability + Business Expenses): ' + JSON.stringify(await getVisibleErrors(quote)));
    }
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();

