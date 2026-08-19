/**
 * Bundling Rules (PREM-23/24, PREM-20)
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180000);

test('Bundling Rules PREM-23/24 and PREM-20', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

    // LOGIN
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', {
      waitUntil: 'domcontentloaded', timeout: 30000,
    });
    await page.waitForTimeout(5000);

    if (page.url().includes('_error.html'))
      throw new Error('FAILED [Login]: Error page. URL: ' + page.url());

    const emailField = page.locator('input[type="text"]').first();
    if (!(await emailField.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [Login]: Form not rendered. URL: ' + page.url());

    await emailField.click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();

    for (var i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      if (!page.url().includes('CentralPortalsLogin')) break;
    }
    if (page.url().includes('CentralPortalsLogin'))
      throw new Error('FAILED [Login]: Credentials rejected');

    // OPEN NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    var quoteUrl = await page.evaluate(function() {
      return new Promise(function(resolve) {
        window.open = function(url) { resolve(url); };
        var link = Array.from(document.querySelectorAll('a')).find(function(a) { return a.innerText.trim() === 'New Quote'; });
        if (link) link.click();
        setTimeout(function() { resolve(null); }, 3000);
      });
    });
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(function() { return false; })))
      throw new Error('FAILED [Quote]: Form not rendered');

    // PERSONAL DETAILS
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);

    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === 'Male'; });
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
    });
    await page.waitForTimeout(2000);

    await page.waitForFunction(function() { return !document.querySelector('select[id*="OccupationCode_Dropdown"]').disabled; }, { timeout: 10000 }).catch(function() {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    // ACTIVATE LIFE $100k
    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === 'Life'; });
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    var lifeSI = page.locator('input[id*="SumInsured"]').first();
    await lifeSI.scrollIntoViewIfNeeded();
    await lifeSI.click();
    await page.waitForTimeout(200);
    for (var j = 0; j < 12; j++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    var digits1 = '100000';
    for (var k = 0; k < digits1.length; k++) { await page.keyboard.press(digits1[k]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
    await page.waitForTimeout(2000);

    // ACTIVATE TPD $200k
    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === 'TPD'; });
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    var tpdSI = page.locator('input[id*="SumInsured"]').nth(1);
    await tpdSI.scrollIntoViewIfNeeded();
    await tpdSI.click();
    await page.waitForTimeout(200);
    for (var m = 0; m < 12; m++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    var digits2 = '200000';
    for (var n = 0; n < digits2.length; n++) { await page.keyboard.press(digits2[n]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
    await page.waitForTimeout(2000);

    // CHECK 15% DISCOUNT
    var discount = await page.evaluate(function() {
      var text = document.body.innerText;
      var idx = text.indexOf('Bundling Discounts');
      if (idx === -1) return null;
      var chunk = text.slice(idx, idx + 60);
      var line = chunk.split('\n')[1];
      return line ? line.trim() : null;
    });
    if (!discount || discount.indexOf('15%') === -1)
      throw new Error('FAILED [PREM-23/24]: Expected 15% discount. Got: ' + (discount || 'not found'));

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }

  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});