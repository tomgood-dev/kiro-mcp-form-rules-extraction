/**
 * Disability Covers Business Rules — FULL COVERAGE
 * DC-15: M&L formula (45% x income / 12) — 7 income levels
 * DC-21: IP formula (3-tier progressive, cap $30k) — 7 income levels
 * DC-27: Workability formula (min $10k, 75% x income / 12) — 7 income levels
 * DC-28: Workability + M&L exclusivity
 * Independence checks: gender, age, OCC, employment status
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(600000);

test('DC full coverage: formulas, caps, independence, exclusivity', async ({ page }) => {
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

    function assertVal(actual, expected, ruleId, context) {
      if (actual.indexOf(expected) === -1) {
        throw new Error('FAILED [' + ruleId + ' ' + context + ']: Expected $' + expected + ', got "' + actual + '"');
      }
    }

    // === INITIAL SETUP: baseline persona ===
    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});
    await setAge('35');
    await setGender('Male');
    await setOCC('1'); // AA
    await setEmployment('Employed');

    // ════════════════════════════════════════════════════════════════
    // PART 1: INCOME LEVEL SWEEP (7 levels x 3 covers = 21 assertions)
    // Base persona: Age 35, Male, AA, Employed
    // ════════════════════════════════════════════════════════════════

    var incomeLevels = [
      { income: '100000', ml: '3,750', ip: '6,250', work: '6,250', desc: '$100k (all tier 1, below caps)' },
      { income: '150000', ml: '5,625', ip: '9,375', work: '9,375', desc: '$150k (tier 1)' },
      { income: '160000', ml: '6,000', ip: '10,000', work: '10,000', desc: '$160k (Workability cap boundary)' },
      { income: '200000', ml: '7,500', ip: '12,500', work: '10,000', desc: '$200k (M&L cap + Workability capped)' },
      { income: '320000', ml: '7,500', ip: '20,000', work: '10,000', desc: '$320k (M&L capped, IP tier 1 boundary)' },
      { income: '400000', ml: '7,500', ip: '23,333', work: '10,000', desc: '$400k (M&L capped, IP tier 2)' },
      { income: '700000', ml: '7,500', ip: '30,000', work: '10,000', desc: '$700k (all capped)' }
    ];

    for (var t = 0; t < incomeLevels.length; t++) {
      var lvl = incomeLevels[t];

      // Set income fresh before each cover test
      // M&L
      await enterIncome(lvl.income);
      await activateCover('Mortgage & Living');
      var mlVal = await getAutoDefault();
      assertVal(mlVal, lvl.ml, 'DC-15', lvl.desc);
      await removeAllCovers();

      // IP
      await enterIncome(lvl.income);
      await activateCover('Income Protection');
      var ipVal = await getAutoDefault();
      assertVal(ipVal, lvl.ip, 'DC-21', lvl.desc);
      await removeAllCovers();

      // Workability
      await enterIncome(lvl.income);
      await activateCover('Workability');
      var workVal = await getAutoDefault();
      assertVal(workVal, lvl.work, 'DC-27', lvl.desc);
      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 2: INDEPENDENCE CHECKS
    // Hold income at $150k, change one variable at a time
    // Expected: M&L=$5,625, IP=$9,375, Workability=$9,375 regardless
    // ════════════════════════════════════════════════════════════════

    await enterIncome('150000');

    // --- Gender independence: Female ---
    await setGender('Female');
    await activateCover('Income Protection');
    var ipFemale = await getAutoDefault();
    assertVal(ipFemale, '9,375', 'DC-21 Independence', 'Female gender');
    await removeAllCovers();

    // --- Age independence: 25 ---
    await setAge('25');
    await activateCover('Income Protection');
    var ipYoung = await getAutoDefault();
    assertVal(ipYoung, '9,375', 'DC-21 Independence', 'Age 25');
    await removeAllCovers();

    // --- Age independence: 65 ---
    await setAge('65');
    await activateCover('Income Protection');
    var ipOlder = await getAutoDefault();
    assertVal(ipOlder, '9,375', 'DC-21 Independence', 'Age 65');
    await removeAllCovers();

    // --- OCC independence: B (value 4) ---
    await setAge('35');
    await setOCC('4'); // B
    await activateCover('Income Protection');
    var ipOccB = await getAutoDefault();
    assertVal(ipOccB, '9,375', 'DC-21 Independence', 'OCC=B');
    await removeAllCovers();

    // --- OCC independence: C (value 5) ---
    await setOCC('5'); // C
    await activateCover('Income Protection');
    var ipOccC = await getAutoDefault();
    assertVal(ipOccC, '9,375', 'DC-21 Independence', 'OCC=C');
    await removeAllCovers();

    // --- Employment independence: Self-Employed ---
    await setOCC('1'); // back to AA
    await setEmployment('Self-Employed');
    await activateCover('Income Protection');
    var ipSelfEmp = await getAutoDefault();
    assertVal(ipSelfEmp, '9,375', 'DC-21 Independence', 'Self-Employed');
    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // PART 3: EXCLUSIVITY (DC-28)
    // Workability + M&L on a different persona
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
      throw new Error('FAILED [DC-28 Exclusivity]: Expected error for Workability + M&L (age 50, Male, B, $120k). Got: ' + exclErrors.join(' | ').substring(0, 200));

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
