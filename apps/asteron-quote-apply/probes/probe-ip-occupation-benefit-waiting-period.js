/**
 * Follow-up: isolate the IP Benefit Period / Waiting Period occupation-restriction found
 * as a side effect in stress-test Batch B (Occ=S: "benefit period... restricted to 2
 * years", "waiting period... restricted to 90 days"). Determine:
 * 1. What are the actual field values right after activating IP at Occ=S (do they
 *    auto-default to something, or stay at DC-19/20's documented defaults)?
 * 2. Does explicitly setting Benefit Period=2 Years + Waiting Period=90 Days at Occ=S
 *    clear the error (confirms these ARE the allowed values, not just any mismatch)?
 * 3. Is this occupation-specific (compare Occ=S vs Occ=AA control) or universal?
 * 4. Does the same restriction apply to Mortgage & Living (DC-12/13, same field types)?
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setAge,
  setGender,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  clickApply,
  getVisibleErrors,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

async function readBenefitWaitingPeriod(quote) {
  return quote.evaluate(() => {
    const selects = [...document.querySelectorAll('select')];
    const benefitPeriod = selects.find((s) => {
      const opts = [...s.options].map((o) => o.text);
      return opts.includes('2 Years') && opts.includes('To Age 65');
    });
    const waitingPeriod = selects.find((s) => {
      const opts = [...s.options].map((o) => o.text);
      return opts.includes('90 Days') && (opts.includes('30 Days') || opts.includes('14 Days'));
    });
    return {
      benefitPeriodId: benefitPeriod ? benefitPeriod.id : null,
      waitingPeriodId: waitingPeriod ? waitingPeriod.id : null,
      benefitPeriod: benefitPeriod ? { options: [...benefitPeriod.options].map((o) => o.text), selected: benefitPeriod.options[benefitPeriod.selectedIndex]?.text, disabled: benefitPeriod.disabled } : null,
      waitingPeriod: waitingPeriod ? { options: [...waitingPeriod.options].map((o) => o.text), selected: waitingPeriod.options[waitingPeriod.selectedIndex]?.text, disabled: waitingPeriod.disabled } : null,
    };
  });
}

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

    // === 1. Field state right after activating IP at Occ=S ===
    console.log('\n=== 1. IP Benefit/Waiting Period field state at Occ=S ===');
    let quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'S' });
    await waitForSettle(quote, 1000);
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Employed' });
    await waitForSettle(quote, 1000);
    await fillCalcMask(quote.locator('input[id*="MaskedInput"]').first(), '400000');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Income Protection');
    await waitForSettle(quote, 1500);
    const fieldsAtActivation = await readBenefitWaitingPeriod(quote);
    console.log('  Fields right after activation (before any SI entry): ' + JSON.stringify(fieldsAtActivation, null, 2));

    // === 2. Set explicitly to 2 Years / 90 Days, does the error clear? ===
    console.log('\n=== 2. Set Benefit Period=2 Years, Waiting Period=90 Days - does error clear? ===');
    // Use the exact IDs captured in step 1's read, not a fresh fuzzy re-match - the
    // waiting-period dropdown's option list appears to narrow dynamically after the
    // benefit-period selection, which broke a content-based re-match mid-run earlier.
    await quote.locator(`[id="${fieldsAtActivation.benefitPeriodId}"]`).selectOption({ label: '2 Years' });
    await waitForSettle(quote, 1500);
    const wpStateAfterBP = await quote.evaluate((id) => {
      const el = document.getElementById(id);
      return el ? { options: [...el.options].map((o) => o.text), selected: el.options[el.selectedIndex]?.text } : null;
    }, fieldsAtActivation.waitingPeriodId);
    console.log('  Waiting Period field state after setting Benefit Period=2 Years: ' + JSON.stringify(wpStateAfterBP));
    if (wpStateAfterBP && wpStateAfterBP.options.includes('90 Days')) {
      await quote.locator(`[id="${fieldsAtActivation.waitingPeriodId}"]`).selectOption({ label: '90 Days' });
    } else {
      console.log('  "90 Days" not in the (possibly narrowed) options - selecting whatever is available instead: ' + JSON.stringify(wpStateAfterBP?.options));
    }
    await waitForSettle(quote, 1000);
    await fillCalcMask(sumInsuredInput(quote, 0), '20000'); // well within cap
    await clickApply(quote);
    console.log('  Errors with BP=2 Years, WP=90 Days: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 3. Control: same setup at Occ=AA ===
    console.log('\n=== 3. Control: IP at Occ=AA, default Benefit/Waiting Period ===');
    quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AA' });
    await waitForSettle(quote, 1000);
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Employed' });
    await waitForSettle(quote, 1000);
    await fillCalcMask(quote.locator('input[id*="MaskedInput"]').first(), '400000');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Income Protection');
    await waitForSettle(quote, 1500);
    const fieldsControlAA = await readBenefitWaitingPeriod(quote);
    console.log('  Fields at Occ=AA (control): ' + JSON.stringify(fieldsControlAA, null, 2));
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await clickApply(quote);
    console.log('  Errors at Occ=AA with default BP/WP: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 4. Does M&L have the same restriction at Occ=S? ===
    console.log('\n=== 4. Mortgage & Living at Occ=S, default Benefit/Waiting Period ===');
    quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'S' });
    await waitForSettle(quote, 1000);
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Employed' });
    await waitForSettle(quote, 1000);
    await fillCalcMask(quote.locator('input[id*="MaskedInput"]').first(), '400000');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Mortgage & Living');
    await waitForSettle(quote, 1500);
    await fillCalcMask(sumInsuredInput(quote, 0), '5000');
    await clickApply(quote);
    console.log('  Errors for M&L at Occ=S with default BP/WP: ' + JSON.stringify(await getVisibleErrors(quote)));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
