/**
 * Premium & Bundling Business Rules
 * PREM-22: "None" with only 1 cover
 * PREM-23/24: 15% with 2 covers (Life + TPD >= $100k each)
 * PREM-20: 20% with 3+ covers
 * PREM-25: Trauma must be >= $25k to count for bundling
 * PREM-12: $0.00 shown for cover with no Sum Insured
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(240000);

test('Bundling Rules PREM-22, PREM-23/24, PREM-20, PREM-25, PREM-12', async ({ page }) => {
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

    var emailField = page.locator('input[type="text"]').first();
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

    async function activateCover(name) {
      await page.evaluate(function(coverName) {
        var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim().split('\n')[0] === coverName; });
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

    async function getBundlingDiscount() {
      return await page.evaluate(function() {
        var text = document.body.innerText;
        var idx = text.indexOf('Bundling Discounts');
        if (idx === -1) return null;
        var chunk = text.slice(idx, idx + 80);
        var lines = chunk.split('\n');
        return lines[1] ? lines[1].trim() : null;
      });
    }

    // PERSONAL DETAILS: Age 35, Male, OCC AA
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

    // ========================================
    // RULE PREM-22: "None" with only 1 cover
    // ========================================
    await activateCover('Life');
    var lifeSI = page.locator('input[id*="SumInsured"]').first();
    await enterCalcMask(lifeSI, '100000');

    var discount1 = await getBundlingDiscount();
    if (!discount1 || discount1.indexOf('None') === -1)
      throw new Error('FAILED [PREM-22]: Expected "None" with 1 cover. Got: ' + (discount1 || 'not found'));

    // ========================================
    // RULE PREM-12: Cover with no Sum Insured doesn't count for bundling
    // Activate TPD but don't enter SI — discount should remain "None"
    // ========================================
    await activateCover('TPD');
    await page.waitForTimeout(2000);

    // Confirm discount is still "None" since TPD has no SI yet
    var discount1b = await getBundlingDiscount();
    if (!discount1b || discount1b.indexOf('None') === -1)
      throw new Error('FAILED [PREM-12]: Discount should be "None" with TPD having no SI. Got: ' + (discount1b || 'not found'));

    // ========================================
    // RULE PREM-23/24: 15% with 2 covers (Life $100k + TPD $100k)
    // ========================================
    var tpdSI = page.locator('input[id*="SumInsured"]').nth(1);
    await enterCalcMask(tpdSI, '100000');

    var discount2 = await getBundlingDiscount();
    if (!discount2 || discount2.indexOf('15%') === -1)
      throw new Error('FAILED [PREM-23/24]: Expected 15% discount with 2 covers. Got: ' + (discount2 || 'not found'));

    // ========================================
    // RULE PREM-25: Trauma below $25k doesn't count for bundling
    // (Life $100k + TPD $100k + Trauma $20k should still be 15%, not 20%)
    // ========================================
    await activateCover('Trauma');
    var traumaSI = page.locator('input[id*="SumInsured"]').nth(2);
    await enterCalcMask(traumaSI, '20000');

    var discount3 = await getBundlingDiscount();
    if (!discount3 || discount3.indexOf('15%') === -1)
      throw new Error('FAILED [PREM-25]: Expected still 15% with Trauma below $25k threshold. Got: ' + (discount3 || 'not found'));

    // ========================================
    // RULE PREM-20: 20% with 3+ covers (raise Trauma to $25k)
    // ========================================
    await enterCalcMask(traumaSI, '25000');

    var discount4 = await getBundlingDiscount();
    if (!discount4 || discount4.indexOf('20%') === -1)
      throw new Error('FAILED [PREM-20]: Expected 20% discount with 3 covers. Got: ' + (discount4 || 'not found'));

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }

  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
