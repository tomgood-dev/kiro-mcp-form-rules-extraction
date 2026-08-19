/**
 * Disability Covers Business Rules — Multi-Persona Coverage
 * DC-15: M&L formula (45% x income / 12) at multiple incomes/personas
 * DC-21: IP formula (75% tier 1, 50% tier 2, cap $30k)
 * DC-27: Workability formula (min $10k, 75% x income / 12) including cap
 * DC-28: Workability + M&L exclusivity
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(360000);

test('DC rules multi-persona: DC-15, DC-21, DC-27, DC-28', async ({ page }) => {
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
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();

    async function setAge(val) {
      await ageInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.keyboard.type(val, { delay: 40 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1500);
    }

    async function setGender(gender) {
      await page.evaluate(function(g) {
        var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === g; });
        if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
      }, gender);
      await page.waitForTimeout(2000);
    }

    async function setOCC(value) {
      await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption(value);
      await page.waitForTimeout(2000);
    }

    async function setEmployment(label) {
      await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: label });
      await page.waitForTimeout(2000);
    }

    async function enterIncome(digits) {
      var field = page.locator('input[id*="Input_AnnualIncome"]').first();
      var visible = await field.isVisible().catch(function() { return false; });
      if (!visible) { field = page.locator('input[id*="MaskedInput"]').first(); }
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await page.waitForTimeout(200);
      for (var x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (var y = 0; y < digits.length; y++) { await page.keyboard.press(digits[y]); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);
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

    async function getAutoDefault() {
      var field = page.locator('input[id*="Input_SumInsured"]').first();
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
      return await field.inputValue();
    }

    async function getErrors() {
      return await page.evaluate(function() {
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    // === TEST PERSONAS ===
    // Each persona tests the formula at a different income/age/gender/OCC combination
    var personas = [
      { age: '35', gender: 'Male', occ: '1', occLabel: 'AA', emp: 'Employed', income: '150000', mlExpected: '5,625', ipExpected: '9,375', workExpected: '9,375', desc: 'Young male AA $150k' },
      { age: '55', gender: 'Female', occ: '4', occLabel: 'B', emp: 'Self-Employed', income: '200000', mlExpected: '7,500', ipExpected: '12,500', workExpected: '10,000', desc: 'Older female B self-employed $200k' },
      { age: '28', gender: 'Male', occ: '5', occLabel: 'C', emp: 'Employed', income: '100000', mlExpected: '3,750', ipExpected: '6,250', workExpected: '6,250', desc: 'Young male C $100k' },
    ];

    // ════════════════════════════════════════════════════════════════
    // DC-15 / DC-21 / DC-27: FORMULA TESTS ACROSS PERSONAS
    // ════════════════════════════════════════════════════════════════

    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});

    for (var p = 0; p < personas.length; p++) {
      var persona = personas[p];

      // Set persona
      await setAge(persona.age);
      await setGender(persona.gender);
      await setOCC(persona.occ);
      await setEmployment(persona.emp);
      await enterIncome(persona.income);

      // --- DC-15: M&L ---
      await activateCover('Mortgage & Living');
      var mlVal = await getAutoDefault();
      if (mlVal.indexOf(persona.mlExpected) === -1)
        throw new Error('FAILED [DC-15 ' + persona.desc + ']: M&L expected $' + persona.mlExpected + ', got "' + mlVal + '"');
      await removeAllCovers();

      // --- DC-21: IP ---
      await activateCover('Income Protection');
      var ipVal = await getAutoDefault();
      if (ipVal.indexOf(persona.ipExpected) === -1)
        throw new Error('FAILED [DC-21 ' + persona.desc + ']: IP expected $' + persona.ipExpected + ', got "' + ipVal + '"');
      await removeAllCovers();

      // --- DC-27: Workability ---
      await activateCover('Workability');
      var workVal = await getAutoDefault();
      if (workVal.indexOf(persona.workExpected) === -1)
        throw new Error('FAILED [DC-27 ' + persona.desc + ']: Workability expected $' + persona.workExpected + ', got "' + workVal + '"');
      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // DC-21 TIER 2: IP at $400k income (crosses into tier 2)
    // Formula: (75% x $320k + 50% x $80k) / 12 = ($240k + $40k) / 12 = $23,333
    // ════════════════════════════════════════════════════════════════
    await setAge('42');
    await setGender('Female');
    await setOCC('3'); // A2
    await setEmployment('Employed');
    await enterIncome('400000');

    await activateCover('Income Protection');
    var ipTier2Val = await getAutoDefault();
    if (ipTier2Val.indexOf('23,333') === -1)
      throw new Error('FAILED [DC-21 Tier 2]: IP at $400k expected $23,333, got "' + ipTier2Val + '"');
    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // DC-21 CAP: IP at $700k income (hard cap $30k/mo)
    // ════════════════════════════════════════════════════════════════
    await enterIncome('700000');
    await activateCover('Income Protection');
    var ipCapVal = await getAutoDefault();
    if (ipCapVal.indexOf('30,000') === -1)
      throw new Error('FAILED [DC-21 Cap]: IP at $700k expected $30,000 cap, got "' + ipCapVal + '"');
    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // DC-27 CAP: Workability at $200k income (hits $10k cap)
    // Already tested in persona 2 above — assert $10,000 explicitly
    // Test at $300k to confirm cap holds well above boundary
    // ════════════════════════════════════════════════════════════════
    await enterIncome('300000');
    await activateCover('Workability');
    var workCapVal = await getAutoDefault();
    if (workCapVal.indexOf('10,000') === -1)
      throw new Error('FAILED [DC-27 Cap]: Workability at $300k expected $10,000 cap, got "' + workCapVal + '"');
    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // DC-28: EXCLUSIVITY (Workability + M&L)
    // Test with a different persona than the formula tests
    // ════════════════════════════════════════════════════════════════
    await setAge('50');
    await setGender('Male');
    await setOCC('4'); // B
    await setEmployment('Employed');
    await enterIncome('120000');

    await activateCover('Mortgage & Living');
    var mlSI = page.locator('input[id*="Input_SumInsured"]').first();
    await mlSI.scrollIntoViewIfNeeded(); await mlSI.click();
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

    await activateCover('Workability');
    var siCount = await page.evaluate(function() { return document.querySelectorAll('input[id*="Input_SumInsured"]').length; });
    if (siCount >= 2) {
      var workSI = page.locator('input[id*="Input_SumInsured"]').nth(1);
      await workSI.scrollIntoViewIfNeeded(); await workSI.click();
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    }

    var exclErrors = await getErrors();
    if (!exclErrors.some(function(e) { return e.indexOf('not available to be taken in conjunction') !== -1; }))
      throw new Error('FAILED [DC-28]: Expected exclusivity error for Workability + M&L (age 50, Male, B, $120k). Got: ' + exclErrors.join(' | ').substring(0, 200));

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
