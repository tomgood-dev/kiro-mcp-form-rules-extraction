/**
 * Lump Sum Covers Business Rules — FULL COVERAGE
 * LSC-10: TPD max $5M — multiple personas + exact boundary
 * LSC-27: Acd Death max $1M — multiple personas + exact boundary
 * LSC-19: Major Trauma 300% cap (TRC < $25k) — boundary test
 * LSC-20: $2M ceiling (TRC >= $25k) — boundary test
 * LSC-32: Specific Injury requires companion — different personas
 * Independence: confirm caps don't vary by age/gender/OCC
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(720000);

test('LSC full coverage: caps, boundaries, independence, dependencies', async ({ page }) => {
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
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    // Initial setup
    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});

    // ════════════════════════════════════════════════════════════════
    // PART 1: TPD $5M CAP — 3 personas + exact boundary
    // ════════════════════════════════════════════════════════════════

    var tpdPersonas = [
      { age: '35', gender: 'Male', occ: '1', desc: 'Male 35 AA' },
      { age: '55', gender: 'Female', occ: '4', desc: 'Female 55 B' },
      { age: '22', gender: 'Male', occ: '5', desc: 'Male 22 C' }
    ];

    for (var tp = 0; tp < tpdPersonas.length; tp++) {
      var p = tpdPersonas[tp];
      await setAge(p.age); await setGender(p.gender); await setOCC(p.occ);

      // At cap: $5,000,000 should be OK (no error)
      await activateCover('TPD');
      var tpdSI = page.locator('input[id*="Input_SumInsured"]').first();
      await enterCalcMask(tpdSI, '5000000');
      var errorsAtCap = await getErrors();
      var hasCapErrorAtCap = errorsAtCap.some(function(e) { return e.indexOf('5,000,000') !== -1 && e.indexOf('TPD') !== -1; });
      if (hasCapErrorAtCap)
        throw new Error('FAILED [LSC-10 ' + p.desc + ']: TPD $5M should be valid but got cap error');

      // Just over: $5,000,001 should error
      await enterCalcMask(tpdSI, '5000001');
      var errorsOver = await getErrors();
      var hasCapErrorOver = errorsOver.some(function(e) { return e.indexOf('5,000,000') !== -1 && e.indexOf('TPD') !== -1; });
      if (!hasCapErrorOver)
        throw new Error('FAILED [LSC-10 ' + p.desc + ']: TPD $5,000,001 should error. Got: ' + errorsOver.join(' | ').substring(0, 200));

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 2: ACD DEATH $1M CAP — 3 personas + exact boundary
    // ════════════════════════════════════════════════════════════════

    var acdPersonas = [
      { age: '35', gender: 'Male', occ: '1', desc: 'Male 35 AA' },
      { age: '60', gender: 'Female', occ: '4', desc: 'Female 60 B' },
      { age: '70', gender: 'Male', occ: '3', desc: 'Male 70 A2 (max valid age)' }
    ];

    for (var ap = 0; ap < acdPersonas.length; ap++) {
      var a = acdPersonas[ap];
      await setAge(a.age); await setGender(a.gender); await setOCC(a.occ);

      await activateCover('Acd. Death');
      var acdSI = page.locator('input[id*="Input_SumInsured"]').first();

      // At cap: $1,000,000 should be OK
      await enterCalcMask(acdSI, '1000000');
      var acdErrAt = await getErrors();
      var acdHasErrAt = acdErrAt.some(function(e) { return e.indexOf('1,000,000') !== -1 && e.indexOf('Accidental Death') !== -1; });
      if (acdHasErrAt)
        throw new Error('FAILED [LSC-27 ' + a.desc + ']: Acd Death $1M should be valid but got cap error');

      // Just over: $1,000,001 should error
      await enterCalcMask(acdSI, '1000001');
      var acdErrOver = await getErrors();
      var acdHasErrOver = acdErrOver.some(function(e) { return e.indexOf('1,000,000') !== -1 && e.indexOf('Accidental Death') !== -1; });
      if (!acdHasErrOver)
        throw new Error('FAILED [LSC-27 ' + a.desc + ']: Acd Death $1,000,001 should error. Got: ' + acdErrOver.join(' | ').substring(0, 200));

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 3: MAJOR TRAUMA 300% CAP (TRC < $25k) — exact boundary
    // ════════════════════════════════════════════════════════════════

    // Persona: Female, 40, B
    await setAge('40'); await setGender('Female'); await setOCC('4');

    await activateCover('Trauma');
    var traumaSI = page.locator('input[id*="Input_SumInsured"]').first();
    await enterCalcMask(traumaSI, '20000'); // TRC = $20k

    await activateCover('Major Trauma');
    var mtSI = page.locator('input[id*="Input_SumInsured"]').nth(1);

    // 300% of $20k = $60,000. At boundary should be OK
    await enterCalcMask(mtSI, '60000');
    var mt300Err = await getErrors();
    var mt300HasErr = mt300Err.some(function(e) { return e.indexOf('maximum Sum Insured for Major Trauma Benefit') !== -1; });
    if (mt300HasErr)
      throw new Error('FAILED [LSC-19 boundary]: MT $60,000 (= 300% of $20k) should be valid but got error');

    // Just over: $60,001 should error
    await enterCalcMask(mtSI, '60001');
    var mt300Over = await getErrors();
    var mt300OverErr = mt300Over.some(function(e) { return e.indexOf('maximum Sum Insured for Major Trauma Benefit') !== -1; });
    if (!mt300OverErr)
      throw new Error('FAILED [LSC-19 boundary]: MT $60,001 should error. Got: ' + mt300Over.join(' | ').substring(0, 200));

    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // PART 4: $2M CEILING (TRC >= $25k) — exact boundary
    // ════════════════════════════════════════════════════════════════

    // Persona: Male, 30, AA
    await setAge('30'); await setGender('Male'); await setOCC('1');

    await activateCover('Trauma');
    traumaSI = page.locator('input[id*="Input_SumInsured"]').first();
    await enterCalcMask(traumaSI, '25000'); // TRC = $25k (at threshold)

    await activateCover('Major Trauma');
    mtSI = page.locator('input[id*="Input_SumInsured"]').nth(1);

    // At $2M ceiling: TRC $25k + MT $1,975,000 = $2M exactly. Should be OK.
    await enterCalcMask(mtSI, '1975000');
    var mt2MErr = await getErrors();
    var mt2MHasErr = mt2MErr.some(function(e) { return e.indexOf('maximum total Sum Insured per life for Trauma Recovery Cover') !== -1; });
    if (mt2MHasErr)
      throw new Error('FAILED [LSC-20 boundary]: MT $1,975,000 + TRC $25k = $2M should be valid but got error');

    // Also confirm no 300% error (since TRC >= $25k)
    var mt300CheckAt25k = mt2MErr.some(function(e) { return e.indexOf('maximum Sum Insured for Major Trauma Benefit based on') !== -1; });
    if (mt300CheckAt25k)
      throw new Error('FAILED [LSC-20]: Got 300% cap error at TRC $25k — should only have $2M ceiling');

    // Just over: $1,975,001 should error with $2M ceiling
    await enterCalcMask(mtSI, '1975001');
    var mt2MOver = await getErrors();
    var mt2MOverErr = mt2MOver.some(function(e) { return e.indexOf('maximum total Sum Insured per life for Trauma Recovery Cover') !== -1; });
    if (!mt2MOverErr)
      throw new Error('FAILED [LSC-20 boundary]: MT $1,975,001 + TRC $25k should exceed $2M. Got: ' + mt2MOver.join(' | ').substring(0, 200));

    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // PART 5: SPECIFIC INJURY COMPANION — 2 different personas
    // ════════════════════════════════════════════════════════════════

    var siPersonas = [
      { age: '35', gender: 'Male', occ: '1', emp: 'Employed', desc: 'Male 35 AA Employed' },
      { age: '50', gender: 'Female', occ: '4', emp: 'Self-Employed', desc: 'Female 50 B Self-Employed' }
    ];

    for (var sp = 0; sp < siPersonas.length; sp++) {
      var s = siPersonas[sp];
      await setAge(s.age); await setGender(s.gender); await setOCC(s.occ);
      await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: s.emp });
      await page.waitForTimeout(2000);

      await activateCover('Specific Injury');
      var specSI = page.locator('input[id*="Input_SumInsured"]').first();
      await enterCalcMask(specSI, '50000');

      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      await page.waitForTimeout(3000);

      var siErrors = await getErrors();
      if (!siErrors.some(function(e) { return e.indexOf('Specific Injury Lump Sum requires') !== -1; }))
        throw new Error('FAILED [LSC-32 ' + s.desc + ']: Expected companion error. Got: ' + siErrors.join(' | ').substring(0, 200));

      await removeAllCovers();
    }

    // ════════════════════════════════════════════════════════════════
    // PART 6: CANCER contributes to $2M combined ceiling (LSC-17/LSC-23)
    // TRC $1M + Cancer $1M = $2M (OK), TRC $1M + Cancer $1,000,001 (error)
    // ════════════════════════════════════════════════════════════════

    await setAge('35'); await setGender('Male'); await setOCC('1');

    await activateCover('Trauma');
    var traumaSI2 = page.locator('input[id*="Input_SumInsured"]').first();
    await enterCalcMask(traumaSI2, '1000000');

    await activateCover('Cancer');
    var cancerSI = page.locator('input[id*="Input_SumInsured"]').nth(1);

    // At ceiling: TRC $1M + Cancer $1M = $2M exactly — should be OK
    await enterCalcMask(cancerSI, '1000000');
    var cancerErrAt = await getErrors();
    var cancerHas2M = cancerErrAt.some(function(e) { return e.indexOf('maximum total Sum Insured per life for Trauma Recovery Cover') !== -1; });
    if (cancerHas2M)
      throw new Error('FAILED [LSC-23 boundary]: TRC $1M + Cancer $1M = $2M should be valid but got ceiling error');

    // Over ceiling: TRC $1M + Cancer $1,000,001 = $2,000,001 — should error
    await enterCalcMask(cancerSI, '1000001');
    var cancerErrOver = await getErrors();
    var cancerHas2MOver = cancerErrOver.some(function(e) { return e.indexOf('maximum total Sum Insured per life for Trauma Recovery Cover') !== -1; });
    if (!cancerHas2MOver)
      throw new Error('FAILED [LSC-23 boundary]: TRC $1M + Cancer $1,000,001 should exceed $2M. Got: ' + cancerErrOver.join(' | ').substring(0, 200));

    await removeAllCovers();

    // ════════════════════════════════════════════════════════════════
    // PART 7: NEEDLESTICK companion cover requirement (LSC-31b)
    // Needlestick alone should error on Apply
    // ════════════════════════════════════════════════════════════════

    await setAge('35'); await setGender('Male'); await setOCC('1');

    await activateCover('Needlestick');
    await page.waitForTimeout(2000);

    // Check if Needlestick activated (selects increased)
    var needlestickActive = await page.evaluate(function() {
      var selects = document.querySelectorAll('select');
      // Look for the Needlestick SI dropdown ($0, $50,000, etc.)
      for (var i = 0; i < selects.length; i++) {
        var opts = Array.from(selects[i].options).map(function(o) { return o.text; });
        if (opts.some(function(o) { return o.indexOf('50,000') !== -1; })) return true;
      }
      return false;
    });

    if (needlestickActive) {
      // Select a non-zero SI tier
      await page.evaluate(function() {
        var selects = Array.from(document.querySelectorAll('select'));
        var nsDd = selects.find(function(s) { return Array.from(s.options).some(function(o) { return o.text.indexOf('50,000') !== -1; }); });
        if (nsDd) { nsDd.value = nsDd.options[1].value; nsDd.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await page.waitForTimeout(3000);

      // Click Apply — should get companion error
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      await page.waitForTimeout(3000);

      var nsErrors = await getErrors();
      var hasNsCompanion = nsErrors.some(function(e) { return e.indexOf('Needlestick Cover requires') !== -1; });
      if (!hasNsCompanion)
        throw new Error('FAILED [LSC-31b]: Expected Needlestick companion error. Got: ' + nsErrors.join(' | ').substring(0, 200));
    } else {
      throw new Error('FAILED [LSC-31b]: Needlestick did not activate for OCC=AA');
    }

    await removeAllCovers();

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
