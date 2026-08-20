/**
 * Personal Details Business Rules
 * PD-28: Life $50k cap for age <17
 * PD-14: TPD blocked below age 17
 * PD-11: Age range 11-75 (age 76 rejected)
 * PD-29: TPD $250k cap for age 17-21
 * PD-31: Max age per cover (Acc Death max 70)
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(240000);

test('Personal Details age-band rules PD-28, PD-14, PD-11, PD-29, PD-31', async ({ page }) => {
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
      var pageText = await page.evaluate(function() { return document.body.innerText.substring(0, 150).replace(/\n/g, ' '); });
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

    // === HELPER: set age ===
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();

    // === HELPER: enter digits into calc-mask field ===
    async function enterCalcMask(field, digits) {
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await page.waitForTimeout(200);
      for (var x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (var y = 0; y < digits.length; y++) { await page.keyboard.press(digits[y]); await page.waitForTimeout(60); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
    }

    // === HELPER: get visible errors ===
    async function getErrors() {
      return await page.evaluate(function() {
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    // === HELPER: set age value ===
    async function setAge(val) {
      await ageInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.keyboard.type(val, { delay: 40 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);
    }

    // === HELPER: activate cover button ===
    async function activateCover(name) {
      await page.evaluate(function(coverName) {
        var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === coverName; });
        if (btn) btn.click();
      }, name);
      await page.waitForTimeout(3000);
    }

    // === HELPER: remove all active covers ===
    async function removeAllCovers() {
      await page.evaluate(function() {
        var links = Array.from(document.querySelectorAll('a')).filter(function(a) { return a.innerText.trim() === 'Remove'; });
        links.forEach(function(l) { l.click(); });
      });
      await page.waitForTimeout(3000);
    }

    // ========================================
    // RULE PD-28: Life $50k cap for Age < 17
    // ========================================
    await setAge('15');

    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === 'Male'; });
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
    });
    await page.waitForTimeout(2000);

    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    await activateCover('Life');

    var siField = page.locator('input[id*="SumInsured"]').first();
    if (!(await siField.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [Life Cover]: Sum Insured field not visible after activation');

    await enterCalcMask(siField, '999999');

    var errors = await getErrors();
    var hasCapError = errors.some(function(e) { return e.indexOf('50,000') !== -1 || e.indexOf('under Age Next Birthday 17') !== -1; });
    if (!hasCapError) {
      throw new Error('FAILED [Rule PD-28]: Expected $50,000 cap error for Age < 17. Errors: ' + (errors.join(' | ').substring(0, 200) || 'None'));
    }

    // ========================================
    // RULE PD-14: TPD at age 15 produces min-age error
    // (TPD activates but is invalid — "minimum Age Next Birthday for Stepped" error)
    // ========================================
    await activateCover('TPD');

    // TPD may show an error immediately, or we need to trigger it via Apply
    var errorsPD14 = await getErrors();
    var hasTPDminAge = errorsPD14.some(function(e) { return e.indexOf('minimum Age Next Birthday') !== -1 || e.indexOf('Standalone TPD') !== -1; });
    if (!hasTPDminAge) {
      // Try clicking Apply to surface the server-side error
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      await page.waitForTimeout(3000);
      errorsPD14 = await getErrors();
      hasTPDminAge = errorsPD14.some(function(e) { return e.indexOf('minimum Age Next Birthday') !== -1 || e.indexOf('Standalone TPD') !== -1; });
    }
    if (!hasTPDminAge) {
      throw new Error('FAILED [Rule PD-14]: Expected min-age error for TPD at age 15. Errors: ' + (errorsPD14.join(' | ').substring(0, 200) || 'None'));
    }

    // Remove TPD before continuing
    await removeAllCovers();

    // ========================================
    // RULE PD-11: Age 76 rejected (out of 11-75 range)
    // ========================================
    await setAge('76');
    await page.waitForTimeout(1000);

    var errors2 = await getErrors();
    var hasAgeError = errors2.some(function(e) { return e.indexOf('between 11 and 75') !== -1 || e.indexOf('11 and 75') !== -1; });
    if (!hasAgeError) {
      throw new Error('FAILED [Rule PD-11]: Expected age range error for age 76. Errors: ' + (errors2.join(' | ').substring(0, 200) || 'None'));
    }

    // ========================================
    // RULE PD-29: TPD $250k cap for age 17-21
    // ========================================
    await removeAllCovers();
    await setAge('20');
    await page.waitForTimeout(1000);

    await activateCover('TPD');
    var tpdSI = page.locator('input[id*="SumInsured"]').first();
    if (!(await tpdSI.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [Rule PD-29]: TPD Sum Insured field not visible at age 20');

    await enterCalcMask(tpdSI, '300000');

    var errors3 = await getErrors();
    var has250kCap = errors3.some(function(e) { return e.indexOf('250,000') !== -1 || e.indexOf('Age Next Birthday 17') !== -1; });
    if (!has250kCap) {
      throw new Error('FAILED [Rule PD-29]: Expected $250,000 cap error for TPD at age 20. Errors: ' + (errors3.join(' | ').substring(0, 200) || 'None'));
    }

    // ========================================
    // RULE PD-31: Accidental Death max age 70
    // At age 71, cover activates but shows max-age error after SI entry
    // Button text is "Acd. Death" (abbreviated)
    // ========================================
    await removeAllCovers();
    await setAge('71');
    await page.waitForTimeout(1000);

    await activateCover('Acd. Death');

    var acdSI = page.locator('input[id*="SumInsured"]').first();
    if (!(await acdSI.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [Rule PD-31]: Acd. Death Sum Insured field not visible at age 71');

    await enterCalcMask(acdSI, '100000');

    var errors4 = await getErrors();
    var hasAcdDeathAge = errors4.some(function(e) { return e.indexOf('maximum Age Next Birthday for Accidental Death') !== -1; });
    if (!hasAcdDeathAge) {
      throw new Error('FAILED [Rule PD-31]: Expected max age error for Accidental Death at age 71. Errors: ' + (errors4.join(' | ').substring(0, 200) || 'None'));
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
