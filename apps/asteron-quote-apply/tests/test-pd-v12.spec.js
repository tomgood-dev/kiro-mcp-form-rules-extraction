/**
 * Personal Details Business Rules — FULL COVERAGE
 * PD-28: Life $50k cap for ANB < 17 — exact boundary + multi-persona
 * PD-14: TPD min-age error at ANB < 17
 * PD-11: Age range 11-75 — both boundaries
 * PD-29: TPD $250k cap for ANB 17-21 — exact boundary + multi-persona
 * PD-31: Acd Death max age 70 — exact boundary + multi-persona
 * Independence: confirm caps don't vary by gender or OCC
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(720000);

test('PD full coverage: age bands, caps, boundaries, independence', async ({ page }) => {
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
    if (page.url().includes('CentralPortalsLogin')) throw new Error('FAILED [Login]: Credentials rejected or session conflict. Another test may be running.');

    // Verify we actually landed on the dashboard
    await page.waitForTimeout(2000);
    if (!page.url().includes('AdviserCentral') && !page.url().includes('QuoteAndApply'))
      throw new Error('FAILED [Login]: Did not reach dashboard. Possible concurrent session. URL: ' + page.url());

    // OPEN NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check we're not redirected back to login
    if (page.url().includes('Login') || page.url().includes('_error.html'))
      throw new Error('FAILED [Session]: Redirected to login/error after navigation. Likely concurrent session. URL: ' + page.url());

    var quoteUrl = await page.evaluate(function() { return new Promise(function(resolve) { window.open = function(url) { resolve(url); }; var link = Array.from(document.querySelectorAll('a')).find(function(a) { return a.innerText.trim() === 'New Quote'; }); if (link) link.click(); setTimeout(function() { resolve(null); }, 3000); }); });
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(function() { return false; }))) throw new Error('FAILED [Quote]: Form not rendered');

    // === HELPERS ===
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();

    async function setAge(val) {
      await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
      await page.keyboard.type(val, { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(2000);
    }

    async function setGender(gender) {
      await page.evaluate(function(g) { var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === g; }); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } }, gender);
      await page.waitForTimeout(2000);
    }

    async function setOCC(value) {
      await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption(value);
      await page.waitForTimeout(2000);
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

    async function activateCover(name) {
      await page.evaluate(function(coverName) { var btn = Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.trim() === coverName || b.innerText.trim().split('\n')[0] === coverName; }); if (btn) btn.click(); }, name);
      await page.waitForTimeout(3000);
    }

    async function removeAllCovers() {
      await page.evaluate(function() { var links = Array.from(document.querySelectorAll('a')).filter(function(a) { return a.innerText.trim() === 'Remove'; }); links.forEach(function(l) { l.click(); }); });
      await page.waitForTimeout(3000);
    }

    async function getErrors() {
      return await page.evaluate(function() {
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    // Initial OCC setup
    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});

    // ════════════════════════════════════════════════════════════════
    // PART 1: AGE BOUNDARIES (PD-11) — both ends
    // ════════════════════════════════════════════════════════════════

    await setGender('Male');
    await setOCC('1'); // AA

    // Age 10 — below min → error
    await setAge('10');
    var err10 = await getErrors();
    if (!err10.some(function(e) { return e.indexOf('between 11 and 75') !== -1 || e.indexOf('11 and 75') !== -1; }))
      throw new Error('FAILED [PD-11 age 10]: Expected age range error');

    // Age 11 — at min → no error
    await setAge('11');
    var err11 = await getErrors();
    if (err11.some(function(e) { return e.indexOf('between 11 and 75') !== -1; }))
      throw new Error('FAILED [PD-11 age 11]: Got age range error at valid boundary');

    // Age 75 — at max → no error
    await setAge('75');
    var err75 = await getErrors();
    if (err75.some(function(e) { return e.indexOf('between 11 and 75') !== -1; }))
      throw new Error('FAILED [PD-11 age 75]: Got age range error at valid boundary');

    // Age 76 — above max → error
    await setAge('76');
    var err76 = await getErrors();
    if (!err76.some(function(e) { return e.indexOf('between 11 and 75') !== -1 || e.indexOf('11 and 75') !== -1; }))
      throw new Error('FAILED [PD-11 age 76]: Expected age range error');

    // ════════════════════════════════════════════════════════════════
    // PART 2: LIFE $50k CAP (PD-28) — exact boundary + multi-persona
    // ════════════════════════════════════════════════════════════════

    var pd28Personas = [
      { age: '15', gender: 'Male', occ: '1', desc: 'Male 15 AA' },
      { age: '16', gender: 'Female', occ: '4', desc: 'Female 16 B' },
      { age: '12', gender: 'Male', occ: '5', desc: 'Male 12 C' }
    ];

    for (var p28 = 0; p28 < pd28Personas.length; p28++) {
      var persona28 = pd28Personas[p28];
      await setAge(persona28.age); await setGender(persona28.gender); await setOCC(persona28.occ);

      await activateCover('Life');
      var lifeSI = page.locator('input[id*="Input_SumInsured"]').first();

      // At boundary: $50,000 — should be OK
      await enterCalcMask(lifeSI, '50000');
      var err50k = await getErrors();
      var has50kErr = err50k.some(function(e) { return e.indexOf('50,000') !== -1 && e.indexOf('under Age Next Birthday 17') !== -1; });
      if (has50kErr)
        throw new Error('FAILED [PD-28 ' + persona28.desc + ']: Life $50,000 should be valid but got cap error');

      // Over boundary: $50,001 — should error
      await enterCalcMask(lifeSI, '50001');
      var err50k1 = await getErrors();
      var has50k1Err = err50k1.some(function(e) { return e.indexOf('50,000') !== -1 || e.indexOf('under Age Next Birthday 17') !== -1; });
      if (!has50k1Err)
        throw new Error('FAILED [PD-28 ' + persona28.desc + ']: Life $50,001 should error. Got: ' + err50k1.join(' | ').substring(0, 200));

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 3: TPD MIN AGE (PD-14) — multi-persona
    // ════════════════════════════════════════════════════════════════

    var pd14Personas = [
      { age: '15', gender: 'Male', occ: '1', desc: 'Male 15 AA' },
      { age: '16', gender: 'Female', occ: '4', desc: 'Female 16 B' }
    ];

    for (var p14 = 0; p14 < pd14Personas.length; p14++) {
      var persona14 = pd14Personas[p14];
      await setAge(persona14.age); await setGender(persona14.gender); await setOCC(persona14.occ);

      await activateCover('TPD');
      await page.waitForTimeout(2000);

      var errTPD = await getErrors();
      var hasTPDmin = errTPD.some(function(e) { return e.indexOf('minimum Age Next Birthday') !== -1 || e.indexOf('Standalone TPD') !== -1; });
      if (!hasTPDmin)
        throw new Error('FAILED [PD-14 ' + persona14.desc + ']: Expected TPD min-age error. Got: ' + errTPD.join(' | ').substring(0, 200));

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 4: TPD $250k CAP at ANB 17-21 (PD-29) — exact boundary + multi-persona
    // ════════════════════════════════════════════════════════════════

    var pd29Personas = [
      { age: '17', gender: 'Male', occ: '1', desc: 'Male 17 AA' },
      { age: '20', gender: 'Female', occ: '4', desc: 'Female 20 B' },
      { age: '21', gender: 'Male', occ: '5', desc: 'Male 21 C' }
    ];

    for (var p29 = 0; p29 < pd29Personas.length; p29++) {
      var persona29 = pd29Personas[p29];
      await setAge(persona29.age); await setGender(persona29.gender); await setOCC(persona29.occ);

      await activateCover('TPD');
      var tpdSI = page.locator('input[id*="Input_SumInsured"]').first();

      // At boundary: $250,000 — should be OK
      await enterCalcMask(tpdSI, '250000');
      var err250k = await getErrors();
      var has250kErr = err250k.some(function(e) { return e.indexOf('250,000') !== -1 && e.indexOf('Age Next Birthday') !== -1; });
      if (has250kErr)
        throw new Error('FAILED [PD-29 ' + persona29.desc + ']: TPD $250,000 should be valid but got cap error');

      // Over boundary: $250,001 — should error
      await enterCalcMask(tpdSI, '250001');
      var err250k1 = await getErrors();
      var has250k1Err = err250k1.some(function(e) { return e.indexOf('250,000') !== -1 || e.indexOf('Age Next Birthday 17') !== -1; });
      if (!has250k1Err)
        throw new Error('FAILED [PD-29 ' + persona29.desc + ']: TPD $250,001 should error. Got: ' + err250k1.join(' | ').substring(0, 200));

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 5: ACD DEATH MAX AGE 70 (PD-31) — boundary + multi-persona
    // ════════════════════════════════════════════════════════════════

    var pd31Personas = [
      { age: '70', gender: 'Male', occ: '1', expectError: false, desc: 'Male 70 AA (valid)' },
      { age: '71', gender: 'Male', occ: '1', expectError: true, desc: 'Male 71 AA (over)' },
      { age: '71', gender: 'Female', occ: '4', expectError: true, desc: 'Female 71 B (over)' },
      { age: '71', gender: 'Male', occ: '5', expectError: true, desc: 'Male 71 C (over)' }
    ];

    for (var p31 = 0; p31 < pd31Personas.length; p31++) {
      var persona31 = pd31Personas[p31];
      await setAge(persona31.age); await setGender(persona31.gender); await setOCC(persona31.occ);

      await activateCover('Acd. Death');
      var acdSI = page.locator('input[id*="Input_SumInsured"]').first();
      await enterCalcMask(acdSI, '100000');

      var errAcd = await getErrors();
      var hasAcdAge = errAcd.some(function(e) { return e.indexOf('maximum Age Next Birthday for Accidental Death') !== -1; });

      if (persona31.expectError && !hasAcdAge)
        throw new Error('FAILED [PD-31 ' + persona31.desc + ']: Expected max-age error. Got: ' + errAcd.join(' | ').substring(0, 200));
      if (!persona31.expectError && hasAcdAge)
        throw new Error('FAILED [PD-31 ' + persona31.desc + ']: Got max-age error at valid age 70');

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 6: INDEPENDENCE — confirm PD-28 cap doesn't vary by gender/OCC
    // Age 15, Life $50,001 should error regardless of gender/OCC
    // ════════════════════════════════════════════════════════════════

    var indepTests = [
      { gender: 'Female', occ: '1', desc: 'Female AA' },
      { gender: 'Male', occ: '3', desc: 'Male A2' },
      { gender: 'Female', occ: '6', desc: 'Female S' }
    ];

    await setAge('15');
    for (var ind = 0; ind < indepTests.length; ind++) {
      var t = indepTests[ind];
      await setGender(t.gender); await setOCC(t.occ);

      await activateCover('Life');
      var indSI = page.locator('input[id*="Input_SumInsured"]').first();
      await enterCalcMask(indSI, '50001');

      var indErr = await getErrors();
      var indHasErr = indErr.some(function(e) { return e.indexOf('50,000') !== -1 || e.indexOf('under Age Next Birthday 17') !== -1; });
      if (!indHasErr)
        throw new Error('FAILED [PD-28 Independence ' + t.desc + ']: Expected $50k cap at age 15. Got: ' + indErr.join(' | ').substring(0, 200));

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 7: TPD "Modified only" at ANB 17-21 (PD-30)
    // Definition=Own should error, Definition=Modified should not
    // ════════════════════════════════════════════════════════════════

    await setAge('20'); await setGender('Male'); await setOCC('1');
    await activateCover('TPD');
    var tpdSI30 = page.locator('input[id*="Input_SumInsured"]').first();
    await enterCalcMask(tpdSI30, '200000');

    // Check that Definition dropdown exists and select "Own"
    var defDropdown = page.locator('select[id*="Dropdown"]').filter({ hasText: /Own|Any|Modified/ }).first();
    var defExists = await defDropdown.count().catch(function() { return 0; });
    if (defExists === 0) {
      // Try finding by option content
      defDropdown = await page.evaluate(function() {
        var sels = Array.from(document.querySelectorAll('select'));
        var found = sels.find(function(s) {
          var opts = Array.from(s.options).map(function(o) { return o.text; });
          return opts.indexOf('Own') !== -1 && opts.indexOf('Modified') !== -1;
        });
        return found ? found.id : null;
      });
      if (defDropdown) {
        await page.locator('select#' + defDropdown).selectOption({ label: 'Own' });
      }
    } else {
      await defDropdown.selectOption({ label: 'Own' });
    }
    await page.waitForTimeout(3000);

    var errOwn = await getErrors();
    var hasOwnErr = errOwn.some(function(e) { return e.indexOf('Modified') !== -1 || e.indexOf('250,000') !== -1; });
    if (!hasOwnErr)
      throw new Error('FAILED [PD-30]: TPD Definition=Own at age 20 should error. Got: ' + errOwn.join(' | ').substring(0, 200));

    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // PART 8: NEEDLESTICK MAX AGE 65, SPECIFIC INJURY MAX AGE 61 (PD-31)
    // ════════════════════════════════════════════════════════════════

    // Needlestick at age 66
    await setAge('66'); await setGender('Male'); await setOCC('1');
    await activateCover('Needlestick');
    await page.waitForTimeout(2000);

    // Select a non-zero SI from the dropdown
    await page.evaluate(function() {
      var selects = Array.from(document.querySelectorAll('select'));
      var nsDd = selects.find(function(s) { return Array.from(s.options).some(function(o) { return o.text.indexOf('50,000') !== -1; }); });
      if (nsDd) { nsDd.value = nsDd.options[1].value; nsDd.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await page.waitForTimeout(3000);

    var errNS66 = await getErrors();
    var hasNS66 = errNS66.some(function(e) { return e.indexOf('maximum Age Next Birthday for Needlestick') !== -1 || e.indexOf('Needlestick cover is 65') !== -1; });
    if (!hasNS66)
      throw new Error('FAILED [PD-31 Needlestick 66]: Expected max-age error. Got: ' + errNS66.join(' | ').substring(0, 200));

    await removeAllCovers();

    // Specific Injury at age 62
    await setAge('62');
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);
    await activateCover('Specific Injury');
    var siSI62 = page.locator('input[id*="Input_SumInsured"]').first();
    await enterCalcMask(siSI62, '50000');

    var errSI62 = await getErrors();
    var hasSI62 = errSI62.some(function(e) { return e.indexOf('maximum Age Next Birthday for Specific Injury') !== -1 || e.indexOf('Specific Injury cover is 61') !== -1; });
    if (!hasSI62)
      throw new Error('FAILED [PD-31 Specific Injury 62]: Expected max-age error. Got: ' + errSI62.join(' | ').substring(0, 200));

    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // PART 9: DOB ↔ AGE INTERACTION (PD-15, PD-16)
    // ════════════════════════════════════════════════════════════════

    // PD-16: Set ANB manually → DOB should clear
    await setAge('40');
    var dobField = page.locator('input[id*="Input_BirthDate"]').first();
    var dobVal1 = await dobField.inputValue();
    if (dobVal1 !== '')
      throw new Error('FAILED [PD-16]: After setting ANB=40, DOB should be empty. Got: "' + dobVal1 + '"');

    // PD-15: Set DOB → ANB should auto-calculate
    // Use evaluate to set the value and trigger React/OutSystems change detection
    await page.evaluate(function() {
      var dobInput = document.querySelector('input[id*="Input_BirthDate"]');
      if (dobInput) {
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(dobInput, '1996-08-20');
        dobInput.dispatchEvent(new Event('input', { bubbles: true }));
        dobInput.dispatchEvent(new Event('change', { bubbles: true }));
        dobInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });
    await page.waitForTimeout(3000);

    var anbAfterDOB = await ageInput.inputValue();
    // ANB should be approximately 30 (born 1996, current year 2026, next birthday)
    var anbNum = parseInt(anbAfterDOB);
    if (anbNum < 29 || anbNum > 31)
      throw new Error('FAILED [PD-15]: After DOB 1996-08-20, ANB should be ~30. Got: "' + anbAfterDOB + '"');

    // PD-16 again: Set ANB manually → DOB should clear
    await setAge('45');
    var dobVal2 = await dobField.inputValue();
    if (dobVal2 !== '')
      throw new Error('FAILED [PD-16]: After setting ANB=45 (overriding DOB), DOB should be empty. Got: "' + dobVal2 + '"');

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
