/**
 * Disability Covers Business Rules
 * DC-15: M&L formula (45% x income / 12)
 * DC-21: IP formula (75% tier 1, cap $30k)
 * DC-27: Workability formula (min $10k, 75% x income / 12)
 * DC-28: Workability + M&L exclusivity
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(240000);

test('DC rules: DC-15, DC-21, DC-27, DC-28', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

    // LOGIN
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    if (page.url().includes('_error.html')) throw new Error('FAILED [Login]: Error page');

    var emailField = page.locator('input[type="text"]').first();
    if (!(await emailField.isVisible().catch(function() { return false; }))) throw new Error('FAILED [Login]: Form not rendered');
    await emailField.click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();

    for (var i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    if (page.url().includes('CentralPortalsLogin')) throw new Error('FAILED [Login]: Credentials rejected');

    // OPEN NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    var quoteUrl = await page.evaluate(function() { return new Promise(function(resolve) { window.open = function(url) { resolve(url); }; var link = Array.from(document.querySelectorAll('a')).find(function(a) { return a.innerText.trim() === 'New Quote'; }); if (link) link.click(); setTimeout(function() { resolve(null); }, 3000); }); });
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(function() { return false; }))) throw new Error('FAILED [Quote]: Form not rendered');

    // === HELPERS ===
    async function enterCalcMask(field, digits) {
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await page.waitForTimeout(200);
      for (var x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (var y = 0; y < digits.length; y++) { await page.keyboard.press(digits[y]); await page.waitForTimeout(60); }
      await page.keyboard.press('Tab');
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
      await page.waitForTimeout(2000);
    }

    async function getErrors() {
      return await page.evaluate(function() {
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    async function activateCover(name) {
      await page.evaluate(function(coverName) {
        var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim() === coverName || b.innerText.trim().split('\n')[0] === coverName; });
        if (btn) btn.click();
      }, name);
      await page.waitForTimeout(3000);
    }

    async function removeAllCovers() {
      await page.evaluate(function() {
        var links = Array.from(document.querySelectorAll('a')).filter(function(a) { return a.innerText.trim() === 'Remove'; });
        links.forEach(function(l) { l.click(); });
      });
      await page.waitForTimeout(3000);
    }

    // SETUP: Age 35, Male, AA, Employed, $150,000 income
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);

    await page.evaluate(function() { var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === 'Male'; }); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);

    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);

    // Enter income $150,000
    var incomeField = page.locator('input[id*="Input_AnnualIncome"]').first();
    var incomeVisible = await incomeField.isVisible().catch(function() { return false; });
    if (!incomeVisible) { incomeField = page.locator('input[id*="MaskedInput"]').first(); }
    await incomeField.scrollIntoViewIfNeeded();
    await incomeField.click(); await page.waitForTimeout(200);
    for (var j = 0; j < 12; j++) await page.keyboard.press('Backspace');
    var incDigits = '150000';
    for (var k = 0; k < incDigits.length; k++) { await page.keyboard.press(incDigits[k]); await page.waitForTimeout(40); }
    await page.keyboard.press('Tab'); await page.waitForTimeout(2000);

    // ========================================
    // RULE DC-15: M&L max = 45% x $150k / 12 = $5,625
    // ========================================
    await activateCover('Mortgage & Living');

    var mlSI = page.locator('input[id*="Input_SumInsured"]').first();
    if (!(await mlSI.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [DC-15]: M&L Sum Insured field not visible');

    // Focus+blur to get auto-default
    await mlSI.scrollIntoViewIfNeeded(); await mlSI.click();
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

    var mlVal = await mlSI.inputValue();
    if (mlVal.indexOf('5,625') === -1 && mlVal.indexOf('5625') === -1)
      throw new Error('FAILED [DC-15]: M&L auto-default expected $5,625 (45% x $150k / 12). Got: "' + mlVal + '"');

    // Exceed the cap
    await enterCalcMask(mlSI, '6000');

    var mlErrors = await getErrors();
    if (!mlErrors.some(function(e) { return e.indexOf('maximum') !== -1 && e.indexOf('Mortgage') !== -1 && e.indexOf('5,625') !== -1; }))
      throw new Error('FAILED [DC-15]: Expected M&L cap error at $6,000. Got: ' + mlErrors.join(' | ').substring(0, 200));

    await removeAllCovers();

    // ========================================
    // RULE DC-21: IP max = 75% x $150k / 12 = $9,375
    // ========================================
    await activateCover('Income Protection');

    var ipSI = page.locator('input[id*="Input_SumInsured"]').first();
    if (!(await ipSI.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [DC-21]: IP Sum Insured field not visible');

    await ipSI.scrollIntoViewIfNeeded(); await ipSI.click();
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

    var ipVal = await ipSI.inputValue();
    if (ipVal.indexOf('9,375') === -1 && ipVal.indexOf('9375') === -1)
      throw new Error('FAILED [DC-21]: IP auto-default expected $9,375 (75% x $150k / 12). Got: "' + ipVal + '"');

    // Exceed the cap
    await enterCalcMask(ipSI, '10000');

    var ipErrors = await getErrors();
    if (!ipErrors.some(function(e) { return e.indexOf('maximum') !== -1 && e.indexOf('Income Protection') !== -1 && e.indexOf('9,375') !== -1; }))
      throw new Error('FAILED [DC-21]: Expected IP cap error at $10,000. Got: ' + ipErrors.join(' | ').substring(0, 200));

    await removeAllCovers();

    // ========================================
    // RULE DC-27: Workability max = min($10k, 75% x $150k / 12) = $9,375
    // ========================================
    await activateCover('Workability');

    var workSI = page.locator('input[id*="Input_SumInsured"]').first();
    if (!(await workSI.isVisible().catch(function() { return false; })))
      throw new Error('FAILED [DC-27]: Workability Sum Insured field not visible');

    await workSI.scrollIntoViewIfNeeded(); await workSI.click();
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

    var workVal = await workSI.inputValue();
    if (workVal.indexOf('9,375') === -1 && workVal.indexOf('9375') === -1)
      throw new Error('FAILED [DC-27]: Workability auto-default expected $9,375 (min($10k, 75% x $150k / 12)). Got: "' + workVal + '"');

    await removeAllCovers();

    // ========================================
    // RULE DC-28: Workability + M&L exclusivity
    // ========================================
    await activateCover('Mortgage & Living');
    var mlSI2 = page.locator('input[id*="Input_SumInsured"]').first();
    await mlSI2.scrollIntoViewIfNeeded(); await mlSI2.click();
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

    await activateCover('Workability');
    // Commit Workability
    var siCount = await page.evaluate(function() { return document.querySelectorAll('input[id*="Input_SumInsured"]').length; });
    if (siCount >= 2) {
      var workSI2 = page.locator('input[id*="Input_SumInsured"]').nth(1);
      await workSI2.scrollIntoViewIfNeeded(); await workSI2.click();
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    }

    var exclErrors = await getErrors();
    if (!exclErrors.some(function(e) { return e.indexOf('not available to be taken in conjunction') !== -1; }))
      throw new Error('FAILED [DC-28]: Expected exclusivity error for Workability + M&L. Got: ' + exclErrors.join(' | ').substring(0, 200));

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
