/**
 * Recon probe for "Create a New Business Quote" (ACB-2240) test generation.
 * Checks items NOT already confirmed in existing business-rules docs before writing the
 * spec, per TEST-GENERATION-PROCESS.md Step 3 (probe before asserting).
 *
 * 1. AC01: is there an agency-selection UI on the landing page, before "New Quote"?
 * 2. AC07: does selecting Occupation CODE (not Occupation) prepopulate the Occupation
 *    type-ahead field? (PD-07/08 only document the forward direction.)
 * 3. AC09: is Smoking status actually mandatory (blocks Apply if unset)? PD-06 says
 *    "not observed to block pricing" - direct contradiction with the story if so.
 * 4. AC11: does selecting "We Pay Your Premiums" with no lump sum cover active show
 *    "At least one lump sum cover must be selected with We Pay Your Premiums"?
 * 5. AC14: what is the Kids Cover Sum Insured tier's default selected value?
 * 6. AC15: what is Payment Frequency's default value, and full option list?
 * 7. Business rule #6: can Personal and Business policies have independently different
 *    payment frequencies on the same quote?
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
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel, selectFromTypeahead } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: 'https://outsystems-dev.asteronlife.co.nz' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    // === 1. AC01: agency-selection UI on the landing page? ===
    console.log('\n=== 1. AC01: landing page -> agency selection before New Quote ===');
    await page.goto('/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const landingPageDump = await page.evaluate(() => ({
      url: location.href,
      bodyTextSnippet: document.body.innerText.slice(0, 1500),
      selects: [...document.querySelectorAll('select')].map((s) => ({ id: s.id, options: [...s.options].map((o) => o.text).slice(0, 5) })),
    }));
    console.log('  Landing page dump: ' + JSON.stringify(landingPageDump, null, 2));

    // === 2. AC07 reverse: Occupation Code -> Occupation field prepopulation ===
    console.log('\n=== 2. AC07 reverse: selecting Occupation Code, checking Occupation field ===');
    let quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AA' });
    await waitForSettle(quote, 1500);
    const occupationFieldAfterCode = await quote.evaluate(() => {
      const combo = document.querySelector('[aria-label="Select an option"], [role="combobox"]');
      const searchDisplay = document.querySelector('.vscomp-value, .vscomp-toggle-button');
      return {
        comboboxText: combo ? combo.textContent.trim().slice(0, 100) : null,
        searchDisplayText: searchDisplay ? searchDisplay.textContent.trim().slice(0, 100) : null,
      };
    });
    console.log('  Occupation type-ahead display after setting Code=AA: ' + JSON.stringify(occupationFieldAfterCode));

    // === 3. AC09: is Smoking status mandatory? ===
    console.log('\n=== 3. AC09: Smoking status mandatory check ===');
    quote = await openNewQuote(page);
    await setAge(quote, 35);
    await setGender(quote, 'Male');
    await quote.getByRole('combobox', { name: 'Occupation code' }).selectOption({ label: 'AA' });
    await waitForSettle(quote, 1000);
    // Deliberately leave Smoking status untouched (whatever its default is - check what that is).
    const smokingDefault = await quote.evaluate(() => {
      const btns = [...document.querySelectorAll('.button-group-item, .button-group-selected-item')].filter((b) => ['Yes', 'No'].includes(b.innerText.trim()));
      return btns.map((b) => ({ text: b.innerText.trim(), selected: b.className.includes('selected') }));
    });
    console.log('  Smoking status button-group state (untouched): ' + JSON.stringify(smokingDefault));
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await clickApply(quote);
    console.log('  Errors after Apply with Smoking status untouched: ' + JSON.stringify(await getVisibleErrors(quote)));

    // === 4. AC11: We Pay Your Premiums warning with no lump sum cover ===
    console.log('\n=== 4. AC11: We Pay Your Premiums warning, no lump sum cover active ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    const premiumsDropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '30 days' }) }).first();
    const premiumsDropdownCount = await premiumsDropdown.count();
    console.log('  "We Pay Your Premiums" dropdown found: ' + (premiumsDropdownCount > 0));
    if (premiumsDropdownCount > 0) {
      const options = await premiumsDropdown.locator('option').allInnerTexts();
      console.log('  Options: ' + JSON.stringify(options));
      await premiumsDropdown.selectOption({ label: '30 days' });
      await waitForSettle(quote, 1500);
      const bodyText = await quote.evaluate(() => document.body.innerText);
      console.log('  Contains "must be selected with We Pay Your Premiums": ' + bodyText.includes('must be selected with We Pay Your Premiums'));
      console.log('  Visible errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    }

    // === 5. AC14: Kids Cover SI tier default ===
    console.log('\n=== 5. AC14: Kids Cover SI tier default value ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    const numKidsSelect = quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first();
    await numKidsSelect.selectOption('1');
    await waitForSettle(quote, 1500);
    const kidSiTierInfo = await quote.evaluate(() => {
      const sel = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.text.includes('$50,000')));
      return sel ? { selected: sel.options[sel.selectedIndex].text, options: [...sel.options].map((o) => o.text) } : null;
    });
    console.log('  Kid SI tier default: ' + JSON.stringify(kidSiTierInfo));

    // === 6. AC15: Payment Frequency default + options ===
    console.log('\n=== 6. AC15: Payment Frequency default + full option list ===');
    const paymentFreqInfo = await quote.evaluate(() => {
      const sel = document.querySelector('select[id*="PaymentFrequencyDropdown"]');
      return sel ? { selected: sel.options[sel.selectedIndex].text, options: [...sel.options].map((o) => o.text) } : null;
    });
    console.log('  Payment Frequency default+options: ' + JSON.stringify(paymentFreqInfo));

    // === 7. Business rule #6: independent frequency per policy (Personal + Business) ===
    console.log('\n=== 7. Independent Payment Frequency: Personal vs Business policy ===');
    await clickButtonByLabel(quote, 'Business', 'Policy type button');
    await waitForSettle(quote, 1500);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1500);
    const freqSelectsCount = await quote.evaluate(() => document.querySelectorAll('select[id*="PaymentFrequencyDropdown"]').length);
    console.log('  Payment Frequency selects present after adding Business policy too: ' + freqSelectsCount);
    const allFreqInfo = await quote.evaluate(() => {
      return [...document.querySelectorAll('select[id*="PaymentFrequencyDropdown"]')].map((s) => ({ id: s.id, selected: s.options[s.selectedIndex].text }));
    });
    console.log('  All Payment Frequency selects: ' + JSON.stringify(allFreqInfo));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
