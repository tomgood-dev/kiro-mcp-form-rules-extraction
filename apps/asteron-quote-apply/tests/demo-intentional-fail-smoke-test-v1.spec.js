/**
 * DEMO step 1: Login + open quote (testing if this file works)
 * Fake rule XYZ-99 intentional fail
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180000);

test('DEMO step 1: login and open quote', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

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
      throw new Error('FAILED [Quote]: Form not rendered. URL: ' + page.url());

    // SET AGE 35, MALE, OCC AA
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

    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    // ACTIVATE LIFE, ENTER $200,000
    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === 'Life'; });
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    var siField = page.locator('input[id*="SumInsured"]').first();
    await siField.scrollIntoViewIfNeeded();
    await siField.click();
    await page.waitForTimeout(200);
    for (var j = 0; j < 12; j++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    var digits1 = '200000';
    for (var k = 0; k < digits1.length; k++) { await page.keyboard.press(digits1[k]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    // FAKE RULE XYZ-99: Check for $10,000 cap (DOES NOT EXIST)
    var errors = await page.evaluate(function() {
      var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
      return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
    });

    if (!errors.some(function(e) { return e.includes('10,000'); }))
      throw new Error('FAILED [Rule XYZ-99 FAKE]: Expected $10,000 cap error. This rule does not exist - intentional demo fail. Actual errors: ' + (errors.join(' | ').substring(0, 150) || 'None'));

    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
});