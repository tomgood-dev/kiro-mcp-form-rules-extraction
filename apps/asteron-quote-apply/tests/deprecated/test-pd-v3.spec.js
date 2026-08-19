/**
 * Personal Details Business Rules (PD-28 age 15 $50k cap + PD-11 age 76 rejected)
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180000);

test('Business Rule PD-28: Life Cover age-band cap', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL environment variable is not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL environment variable is not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD environment variable is not set');

    // CHECK IP ADDRESS
    await page.goto('https://api.ipify.org');
    const outboundIP = await page.locator('body').innerText();

    // LOGIN
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', {
      waitUntil: 'domcontentloaded', timeout: 30000,
    });
    await page.waitForTimeout(5000);

    if (page.url().includes('_error.html'))
      throw new Error('FAILED [Login Page]: IP not whitelisted - got error page. Outbound IP: ' + outboundIP + '. URL: ' + page.url());

    const emailField = page.locator('input[type="text"]').first();
    if (!(await emailField.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [Login Page]: Login form did not render. Outbound IP: ' + outboundIP + '. URL: ' + page.url());

    await emailField.click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();

    for (var i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      if (!page.url().includes('CentralPortalsLogin')) break;
    }
    if (page.url().includes('CentralPortalsLogin')) {
      const pageText = await page.evaluate(function() { return document.body.innerText.substring(0, 150).replace(/\n/g, ' '); });
      throw new Error('FAILED [Login]: Credentials rejected or timed out. IP: ' + outboundIP + '. Email: ' + LOGIN_EMAIL + '. Page shows: ' + pageText);
    }

    // OPEN NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    if (page.url().includes('_error.html'))
      throw new Error('FAILED [Quote List]: Got error page. URL: ' + page.url());

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
      throw new Error('FAILED [New Quote]: Quote form did not render. URL: ' + page.url());

    // SET AGE 15, MALE, OCC AA
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('15', { delay: 40 });
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

    // ACTIVATE LIFE, ENTER $999,999
    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === 'Life'; });
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    var siField = page.locator('input[id*="SumInsured"]').first();
    if (!(await siField.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [Life Cover]: Sum Insured field not visible after activation');

    await siField.scrollIntoViewIfNeeded();
    await siField.click();
    await page.waitForTimeout(200);
    for (var j = 0; j < 12; j++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    var digits1 = '999999';
    for (var k = 0; k < digits1.length; k++) { await page.keyboard.press(digits1[k]); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    // CHECK FOR $50k CAP ERROR
    var errors = await page.evaluate(function() {
      var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
      return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
    });

    var hasCapError = errors.some(function(e) { return e.includes('50,000') || e.includes('under Age Next Birthday 17'); });
    if (!hasCapError) {
      throw new Error('FAILED [Rule PD-28]: Expected $50,000 cap error for Age < 17. Errors found: ' + (errors.join(' | ').substring(0, 200) || 'None'));
    }

    // --- RULE PD-11: Age must be between 11 and 75 (test age 76 rejected) ---
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('76', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    var errors2 = await page.evaluate(function() {
      var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]'));
      return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
    });

    var hasAgeError = errors2.some(function(e) { return e.includes('between 11 and 75') || e.includes('11 and 75'); });
    if (!hasAgeError) {
      throw new Error('FAILED [Rule PD-11]: Expected age range error for age 76. Errors found: ' + (errors2.join(' | ').substring(0, 200) || 'None'));
    }

  } catch (error) {
    // Sign out before re-throwing
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }

  // Sign out after successful test
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});