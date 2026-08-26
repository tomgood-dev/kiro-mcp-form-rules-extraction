/**
 * Stress-test Batch B: re-sweep rules originally confirmed with one persona
 * (age35/Male/AA), using Female + varied occupation/age/income, to catch anything
 * secretly persona-specific. One fresh quote per check.
 *
 * 1. DC-15 (M&L = 45% x income / 12): Female, Occupation C, Income $200,000.
 * 2. DC-21 (IP 3-tier 75%/50%/20%, tier-2 crossing): Female, Occupation S, Income $400,000.
 * 3. LSC-10 (TPD $5M cap): Female, Age 60, Occupation A2.
 * 4. LSC-19 (Major Trauma 300% cap below $25k TRC): Female, Age 50, Occupation U.
 * 5. PREM-20 (15% bundling at 2 committed covers): Female, Occupation B.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setAge,
  setGender,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  clickApply,
  getVisibleErrors,
  getBundlingDiscount,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

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

    // === 1. DC-15: M&L 45% formula, Female, Occ=C, Income=$200,000 ===
    console.log('\n=== 1. DC-15 M&L formula: Female, Occ=C, Income=$200,000 (expect max $7,500/mo) ===');
    let quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Female');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'C' });
    await waitForSettle(quote, 1000);
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Employed' });
    await waitForSettle(quote, 1000);
    await fillCalcMask(quote.locator('input[id*="MaskedInput"]').first(), '200000');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Mortgage & Living');
    await fillCalcMask(sumInsuredInput(quote, 0), '7501'); // 1 over the expected $7,500 cap
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 2. DC-21: IP tier-2 crossing, Female, Occ=S, Income=$400,000 ===
    console.log('\n=== 2. DC-21 IP tier formula: Female, Occ=S, Income=$400,000 (expect max $23,333/mo) ===');
    quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Female');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'S' });
    await waitForSettle(quote, 1000);
    await quote.getByRole('combobox', { name: 'Employment status' }).selectOption({ label: 'Employed' });
    await waitForSettle(quote, 1000);
    await fillCalcMask(quote.locator('input[id*="MaskedInput"]').first(), '400000');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Income Protection');
    await fillCalcMask(sumInsuredInput(quote, 0), '23334'); // 1 over the expected $23,333 cap
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 3. LSC-10: TPD $5M cap, Female, Age 60, Occ=A2 ===
    console.log('\n=== 3. LSC-10 TPD $5M cap: Female, Age 60, Occ=A2 ===');
    quote = await openNewQuote(page);
    await setAge(quote, 60);
    await setGender(quote, 'Female');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'A2' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 0), '5000001');
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 4. LSC-19: Major Trauma 300% cap, Female, Age 50, Occ=U ===
    console.log('\n=== 4. LSC-19 Major Trauma 300% cap: Female, Age 50, Occ=U, TRC=$20,000 (expect max $60,000) ===');
    quote = await openNewQuote(page);
    await setAge(quote, 50);
    await setGender(quote, 'Female');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'U' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Trauma');
    await fillCalcMask(sumInsuredInput(quote, 0), '20000');
    await activateCover(quote, 'Major Trauma');
    await fillCalcMask(sumInsuredInput(quote, 1), '60001');
    await clickApply(quote);
    console.log('  Errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 5. PREM-20: 15% bundling at 2 covers, Female, Occ=B ===
    console.log('\n=== 5. PREM-20 bundling 15% at 2 covers: Female, Occ=B ===');
    quote = await openNewQuote(page);
    await setAge(quote, 40);
    await setGender(quote, 'Female');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'B' });
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await activateCover(quote, 'TPD');
    await fillCalcMask(sumInsuredInput(quote, 1), '200000');
    await waitForSettle(quote, 1500);
    console.log('  Bundling discount: ' + JSON.stringify(await getBundlingDiscount(quote)));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
