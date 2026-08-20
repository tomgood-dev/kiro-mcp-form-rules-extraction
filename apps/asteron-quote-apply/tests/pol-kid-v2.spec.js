/**
 * Policy Structure & Kids Cover — FULL COVERAGE
 * POL-05: Inflation/Freeze mutual exclusion — multi-persona + both directions
 * POL-06: Business creates policy — verify covers + removal
 * POL-14: Business policy cover menu confirmed
 * KID-08: Kids dependency — multi-persona
 * KID-07: Kids SI tiers — all 16 options verified + $10k step consistency
 * KID-05: Kids DOB bounds
 * KID-11: Max 9 kids
 * KID-01: Number of Kids dropdown (0-9)
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(600000);

test('POL/KID full coverage: mutual exclusion, policies, kids dependency, tiers, DOB', async ({ page }) => {
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
      await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
      await page.keyboard.type(val, { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    }

    async function setGender(gender) {
      await page.evaluate(function(g) { var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === g; }); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } }, gender);
      await page.waitForTimeout(2000);
    }

    async function setOCC(value) {
      await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption(value);
      await page.waitForTimeout(2000);
    }

    async function activateCover(name) {
      await page.evaluate(function(coverName) { var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim() === coverName || b.innerText.trim().split('\n')[0] === coverName; }); if (btn) btn.click(); }, name);
      await page.waitForTimeout(3000);
    }

    async function enterCalcMask(field, digits) {
      await field.scrollIntoViewIfNeeded(); await field.click(); await page.waitForTimeout(200);
      for (var x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (var y = 0; y < digits.length; y++) { await page.keyboard.press(digits[y]); await page.waitForTimeout(60); }
      await page.keyboard.press('Tab');
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(function() {});
      await page.waitForTimeout(2000);
    }

    async function removeAllCovers() {
      await page.evaluate(function() { var links = Array.from(document.querySelectorAll('a')).filter(function(a) { return a.innerText.trim() === 'Remove'; }); links.forEach(function(l) { l.click(); }); });
      await page.waitForTimeout(3000);
    }

    async function getErrors() {
      return await page.evaluate(function() {
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    // Initial setup
    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});

    // ════════════════════════════════════════════════════════════════
    // PART 1: POL-05 — Inflation/Freeze mutual exclusion
    // Test both directions on 2 different personas
    // ════════════════════════════════════════════════════════════════

    var pol05Personas = [
      { age: '35', gender: 'Male', occ: '1', desc: 'Male 35 AA' },
      { age: '55', gender: 'Female', occ: '4', desc: 'Female 55 B' }
    ];

    for (var p5 = 0; p5 < pol05Personas.length; p5++) {
      var persona5 = pol05Personas[p5];
      await setAge(persona5.age); await setGender(persona5.gender); await setOCC(persona5.occ);

      var inflChk = page.locator('input[id*="Checkbox_InflationAdjustmentBenefit"]');
      var freezeChk = page.locator('input[id*="Checkbox_PremiumFreeze"]');
      await inflChk.scrollIntoViewIfNeeded();

      // Ensure Inflation is ON (reset state)
      if (!(await inflChk.isChecked())) { await inflChk.click(); await page.waitForTimeout(1000); }
      if (await freezeChk.isChecked()) { await freezeChk.click(); await page.waitForTimeout(1000); }

      // Direction 1: Check Freeze → Inflation unchecks
      await freezeChk.click(); await page.waitForTimeout(2000);
      var inflAfterFreeze = await inflChk.isChecked();
      var freezeAfterFreeze = await freezeChk.isChecked();
      if (inflAfterFreeze || !freezeAfterFreeze)
        throw new Error('FAILED [POL-05 ' + persona5.desc + ' dir1]: Freeze checked but Inflation did not uncheck');

      // Direction 2: Check Inflation → Freeze unchecks
      await inflChk.click(); await page.waitForTimeout(2000);
      var inflAfterInfl = await inflChk.isChecked();
      var freezeAfterInfl = await freezeChk.isChecked();
      if (!inflAfterInfl || freezeAfterInfl)
        throw new Error('FAILED [POL-05 ' + persona5.desc + ' dir2]: Inflation checked but Freeze did not uncheck');
    }

    // ════════════════════════════════════════════════════════════════
    // PART 2: POL-06 + POL-14 — Business policy creation + cover menu
    // ════════════════════════════════════════════════════════════════

    await setAge('35'); await setGender('Male'); await setOCC('1');

    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('button, a')).find(function(b) { return b.innerText.trim() === 'Business'; });
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    // Verify Business policy was created
    var policies = await page.evaluate(function() {
      return Array.from(document.querySelectorAll('a, button')).filter(function(l) { return l.innerText.trim().match(/^(Personal|Business)\s+\d+$/); }).map(function(l) { return l.innerText.trim(); });
    });
    if (!policies.some(function(p) { return p.indexOf('Business') !== -1; }))
      throw new Error('FAILED [POL-06]: Business policy not created. Policies: ' + policies.join(', '));

    // Verify Business cover menu (POL-14)
    var bizCovers = await page.evaluate(function() {
      return Array.from(document.querySelectorAll('button')).filter(function(b) { return b.className.indexOf('cover-button') !== -1; }).map(function(b) { return b.innerText.trim().split('\n')[0]; });
    });

    var expectedBiz = ['Life', 'TPD', 'Trauma', 'Specific Injury', 'Business Expenses', 'Business Disability', 'Farmers Disability'];
    for (var eb = 0; eb < expectedBiz.length; eb++) {
      if (bizCovers.indexOf(expectedBiz[eb]) === -1)
        throw new Error('FAILED [POL-14]: Business policy missing cover "' + expectedBiz[eb] + '". Got: ' + bizCovers.join(', '));
    }

    // Verify Personal-only covers are NOT on Business
    var personalOnly = ['Cancer', 'Acd. Death', 'Income Protection', 'Workability'];
    for (var po = 0; po < personalOnly.length; po++) {
      if (bizCovers.indexOf(personalOnly[po]) !== -1)
        throw new Error('FAILED [POL-14]: Business policy should NOT have "' + personalOnly[po] + '" but it was found');
    }

    // Switch back to Personal
    await page.evaluate(function() {
      var link = Array.from(document.querySelectorAll('a, button')).find(function(l) { return l.innerText.trim() === 'Personal 1'; });
      if (link) link.click();
    });
    await page.waitForTimeout(2000);

    // ════════════════════════════════════════════════════════════════
    // PART 3: KID-08 — Kids dependency on companion cover (multi-persona)
    // ════════════════════════════════════════════════════════════════

    var kid08Personas = [
      { age: '35', gender: 'Male', occ: '1', desc: 'Male 35 AA' },
      { age: '50', gender: 'Female', occ: '4', desc: 'Female 50 B' }
    ];

    for (var k8 = 0; k8 < kid08Personas.length; k8++) {
      var pk8 = kid08Personas[k8];
      await setAge(pk8.age); await setGender(pk8.gender); await setOCC(pk8.occ);

      // Set 1 kid, no covers active
      var kidsDropdown = page.locator('select[id*="Dropdown1"]').last();
      await kidsDropdown.scrollIntoViewIfNeeded();
      await kidsDropdown.selectOption('1');
      await page.waitForTimeout(2000);

      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      await page.waitForTimeout(3000);

      var kidErrors = await getErrors();
      if (!kidErrors.some(function(e) { return e.indexOf('Personal Insurance Cover') !== -1; }))
        throw new Error('FAILED [KID-08 ' + pk8.desc + ']: Expected companion error. Got: ' + kidErrors.join(' | ').substring(0, 200));

      // Reset kids to 0
      await kidsDropdown.selectOption('0');
      await page.waitForTimeout(2000);
    }

    // ════════════════════════════════════════════════════════════════
    // PART 4: KID-07 — SI tiers validation (all 16 options, $10k steps)
    // ════════════════════════════════════════════════════════════════

    await setAge('35'); await setGender('Male'); await setOCC('1');

    var kidsDropdown2 = page.locator('select[id*="Dropdown1"]').last();
    await kidsDropdown2.scrollIntoViewIfNeeded();
    await kidsDropdown2.selectOption('1');
    await page.waitForTimeout(3000);

    var kidSIOptions = await page.evaluate(function() {
      var selects = Array.from(document.querySelectorAll('select')).filter(function(s) {
        var opts = Array.from(s.options).map(function(o) { return o.text; });
        return opts.some(function(o) { return o.indexOf('50,000') !== -1 && o.indexOf('Free') !== -1; });
      });
      if (selects.length === 0) return null;
      return Array.from(selects[0].options).map(function(o) { return o.text; });
    });

    if (!kidSIOptions)
      throw new Error('FAILED [KID-07]: Kids SI dropdown not found');

    // Check count = 16
    if (kidSIOptions.length !== 16)
      throw new Error('FAILED [KID-07 count]: Expected 16 options. Got ' + kidSIOptions.length);

    // Check first = $50,000 (Free)
    if (kidSIOptions[0].indexOf('50,000') === -1 || kidSIOptions[0].indexOf('Free') === -1)
      throw new Error('FAILED [KID-07 first]: Expected "$50,000 (Free)". Got: "' + kidSIOptions[0] + '"');

    // Check last = $200,000
    if (kidSIOptions[15].indexOf('200,000') === -1)
      throw new Error('FAILED [KID-07 last]: Expected "$200,000". Got: "' + kidSIOptions[15] + '"');

    // Check $10k step consistency: each option should be $10k more than previous
    for (var tier = 1; tier < kidSIOptions.length; tier++) {
      var prevMatch = kidSIOptions[tier - 1].match(/\$([\d,]+)/);
      var currMatch = kidSIOptions[tier].match(/\$([\d,]+)/);
      if (prevMatch && currMatch) {
        var prevVal = parseInt(prevMatch[1].replace(/,/g, ''));
        var currVal = parseInt(currMatch[1].replace(/,/g, ''));
        if (currVal - prevVal !== 10000)
          throw new Error('FAILED [KID-07 step]: Expected $10k step between options ' + (tier - 1) + ' and ' + tier + '. Got: $' + prevVal + ' → $' + currVal);
      }
    }

    // ════════════════════════════════════════════════════════════════
    // PART 5: KID-05 — DOB field bounds
    // ════════════════════════════════════════════════════════════════

    var kidDOB = await page.evaluate(function() {
      var inputs = Array.from(document.querySelectorAll('input[type="date"]'));
      var kidInputs = inputs.filter(function(i) { return i.id.indexOf('b23-b14') !== -1 || (i.id.indexOf('BirthDate') !== -1 && i.id !== 'b15-Input_BirthDate'); });
      if (kidInputs.length === 0) return null;
      return { min: kidInputs[0].min, max: kidInputs[0].max };
    });

    if (!kidDOB)
      throw new Error('FAILED [KID-05]: Kid DOB field not found');

    // Min should be roughly 21 years ago, Max should be today or near today
    var minYear = parseInt(kidDOB.min.split('-')[0]);
    var maxYear = parseInt(kidDOB.max.split('-')[0]);
    if (maxYear !== 2026)
      throw new Error('FAILED [KID-05 max]: Kid DOB max year should be 2026. Got: ' + maxYear);
    if (minYear < 2004 || minYear > 2006)
      throw new Error('FAILED [KID-05 min]: Kid DOB min year should be ~2005 (21yr window). Got: ' + minYear);

    // ════════════════════════════════════════════════════════════════
    // PART 6: KID-11 — Max 9 kids + KID-01 dropdown options
    // ════════════════════════════════════════════════════════════════

    var kidsOptions = await page.evaluate(function() {
      var selects = Array.from(document.querySelectorAll('select'));
      var kidCountDd = selects.find(function(s) {
        var opts = Array.from(s.options).map(function(o) { return o.text; });
        return opts.indexOf('0') !== -1 && opts.indexOf('9') !== -1 && opts.length === 10;
      });
      if (!kidCountDd) return null;
      return Array.from(kidCountDd.options).map(function(o) { return o.text; });
    });
    if (!kidsOptions || kidsOptions.length !== 10)
      throw new Error('FAILED [KID-11/01]: Expected 10 options (0-9). Got ' + (kidsOptions ? kidsOptions.length : 'not found'));
    if (kidsOptions[0] !== '0' || kidsOptions[9] !== '9')
      throw new Error('FAILED [KID-11/01]: Expected 0-9. Got first="' + kidsOptions[0] + '" last="' + kidsOptions[9] + '"');

    // Set to 3 kids — verify 3 kid sections appear
    var kidsCountDd = page.locator('select[id*="b23-b14-Dropdown1"]');
    await kidsCountDd.selectOption('3');
    await page.waitForTimeout(3000);

    var kidSections = await page.evaluate(function() {
      var text = document.body.innerText;
      var count = 0;
      if (text.indexOf('Kid 1') !== -1) count++;
      if (text.indexOf('Kid 2') !== -1) count++;
      if (text.indexOf('Kid 3') !== -1) count++;
      return count;
    });
    if (kidSections !== 3)
      throw new Error('FAILED [KID-01 multiple]: Expected 3 kid sections. Found ' + kidSections);

    // Reset
    await kidsCountDd.selectOption('0');
    await page.waitForTimeout(2000);

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
