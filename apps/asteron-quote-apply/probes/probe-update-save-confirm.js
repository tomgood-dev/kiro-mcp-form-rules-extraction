/**
 * AC06/AC07/AC08 investigation: does clicking Update on the Default-for-Agency
 * dropdown (a) actually persist the new value as the agency default, (b) show
 * the exact confirmation message text from the user story, and (c) make the
 * new default show up for a brand-new quote (not just the one it was set in)?
 *
 * Mutates the shared agency-wide default for the duration of this probe, then
 * reverts it back to Upfront at the end so it doesn't break other tests in
 * this suite that assume Upfront is the live default (e.g. Part 1, row 1).
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  if (!LOGIN_EMAIL) throw new Error('Set ASTERON_LOGIN_EMAIL env var before running this probe.');
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;
  if (!LOGIN_PASSWORD) throw new Error('Set ASTERON_LOGIN_PASSWORD env var before running this probe.');

  async function waitSettle(ms) {
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(ms || 500);
  }

  async function openFreshQuote() {
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise((resolve) => {
      window.open = (url) => resolve(url);
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    }));
    let url = quoteUrl;
    if (url && url.indexOf('http') !== 0) url = BASE_URL + (url.indexOf('/') === 0 ? '' : '/') + url;
    if (url) await page.goto(url, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  async function pricedQuote() {
    await openFreshQuote();
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 });
    await page.keyboard.press('Tab');
    await waitSettle(1500);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male');
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
    });
    await waitSettle(2000);
    await page.waitForFunction(() => {
      const el = document.querySelector('select[id*="OccupationCode_Dropdown"]');
      return el && !el.disabled;
    }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await waitSettle(1500);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Life');
      if (btn) btn.click();
    });
    await waitSettle(1500);
    const siInput = page.locator('input[id*="SumInsured"]').first();
    await siInput.scrollIntoViewIfNeeded();
    await siInput.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
    for (const d of '500000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await waitSettle(2000);
  }

  async function openAdviserUse() {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    await waitSettle(1500);
  }

  function findDefaultAgencySelectId() {
    return page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const match = sels.find((s) => {
        const o = [...s.options].map((x) => x.text);
        return o.length === 3 && o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20');
      });
      return match ? match.id : null;
    });
  }

  function currentDefaultAgencyValue(id) {
    return page.evaluate((selId) => {
      const s = document.getElementById(selId);
      return s ? s.options[s.selectedIndex].text : null;
    }, id);
  }

  function findUpdateButton() {
    return page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Update');
      return btn ? { disabled: btn.disabled, text: btn.innerText.trim() } : null;
    });
  }

  function dumpVisibleText() {
    return page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 4000));
  }

  try {
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    console.log('Login OK');

    // --- STEP 1: fresh quote, confirm current default is Upfront, then change + Update ---
    await pricedQuote();
    await openAdviserUse();
    const defId = await findDefaultAgencySelectId();
    console.log('\n=== STEP 1: quote A, before any change ===');
    console.log('Default-for-Agency current value:', await currentDefaultAgencyValue(defId));
    console.log('Update button state:', JSON.stringify(await findUpdateButton()));

    await page.locator('#' + defId).selectOption({ label: 'Level 30' });
    await waitSettle(1000);
    console.log('\n=== After selecting Level 30 (Update not yet clicked) ===');
    console.log('Update button state:', JSON.stringify(await findUpdateButton()));

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Update');
      if (btn) btn.click();
    });
    await waitSettle(2000);
    console.log('\n=== STEP 2: immediately after clicking Update ===');
    console.log(await dumpVisibleText());
    console.log('Update button state:', JSON.stringify(await findUpdateButton()));

    // --- STEP 3: reopen Adviser Use in the SAME quote - is the change reflected immediately? ---
    await page.keyboard.press('Escape').catch(() => {});
    await waitSettle(500);
    await openAdviserUse();
    console.log('\n=== STEP 3: reopened Adviser Use, same quote ===');
    console.log('Default-for-Agency current value:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));

    // --- STEP 4: brand new quote - does the NEW default apply automatically? ---
    await pricedQuote();
    await openAdviserUse();
    console.log('\n=== STEP 4: quote B (brand new), after Update was clicked in quote A ===');
    console.log('Default-for-Agency current value:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));

    // --- STEP 5: revert back to Upfront so the rest of the suite's assumptions hold ---
    const defIdB = await findDefaultAgencySelectId();
    await page.locator('#' + defIdB).selectOption({ label: 'Upfront' });
    await waitSettle(1000);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Update');
      if (btn) btn.click();
    });
    await waitSettle(2000);
    console.log('\n=== STEP 5: reverted to Upfront and clicked Update ===');
    console.log('Default-for-Agency current value:', await currentDefaultAgencyValue(defIdB));

    // Confirm the revert actually took, from a THIRD fresh quote
    await pricedQuote();
    await openAdviserUse();
    console.log('\n=== STEP 6: quote C (brand new), confirming revert to Upfront took effect ===');
    console.log('Default-for-Agency current value:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
