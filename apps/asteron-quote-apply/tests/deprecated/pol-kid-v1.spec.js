/**
 * Policy Structure & Kids Cover Business Rules
 * POL-05: Inflation Adj + Premium Freeze mutual exclusion (silent)
 * POL-06: Business creates new independent policy
 * KID-08: Kids Cover requires companion Personal Insurance Cover
 * KID-07: Kids SI tiers ($50k Free to $200k in $10k steps)
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(240000);

test('POL/KID rules: POL-05, POL-06, KID-08, KID-07', async ({ page }) => {
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
    async function getErrors() {
      return await page.evaluate(function() {
        var nodes = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]'));
        return nodes.filter(function(n) { return n.innerText && n.getBoundingClientRect().width > 0; }).map(function(n) { return n.innerText.trim(); });
      });
    }

    // SETUP: Age 35, Male, AA
    var ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);

    await page.evaluate(function() { var btn = Array.from(document.querySelectorAll('.button-group-item')).find(function(b) { return b.innerText.trim() === 'Male'; }); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);

    await page.waitForFunction(function() { var el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(function() {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    // ========================================
    // RULE POL-05: Inflation Adj + Premium Freeze mutual exclusion
    // ========================================
    var inflChk = page.locator('input[id*="Checkbox_InflationAdjustmentBenefit"]');
    var freezeChk = page.locator('input[id*="Checkbox_PremiumFreeze"]');

    await inflChk.scrollIntoViewIfNeeded();
    var inflBefore = await inflChk.isChecked();
    var freezeBefore = await freezeChk.isChecked();

    if (!inflBefore) throw new Error('FAILED [POL-05]: Inflation Adj should default to ON');
    if (freezeBefore) throw new Error('FAILED [POL-05]: Premium Freeze should default to OFF');

    // Check Premium Freeze — Inflation should silently uncheck
    await freezeChk.click();
    await page.waitForTimeout(2000);

    var inflAfter = await inflChk.isChecked();
    var freezeAfter = await freezeChk.isChecked();
    if (inflAfter || !freezeAfter)
      throw new Error('FAILED [POL-05]: After checking Freeze, expected Inflation=OFF Freeze=ON. Got Inflation=' + inflAfter + ' Freeze=' + freezeAfter);

    // Check Inflation back — Freeze should silently uncheck
    await inflChk.click();
    await page.waitForTimeout(2000);

    var inflFinal = await inflChk.isChecked();
    var freezeFinal = await freezeChk.isChecked();
    if (!inflFinal || freezeFinal)
      throw new Error('FAILED [POL-05]: After re-checking Inflation, expected Inflation=ON Freeze=OFF. Got Inflation=' + inflFinal + ' Freeze=' + freezeFinal);

    // ========================================
    // RULE POL-06: Business creates new independent policy
    // ========================================
    var policiesBefore = await page.evaluate(function() {
      return Array.from(document.querySelectorAll('a, button')).filter(function(l) { return l.innerText.trim().match(/^(Personal|Business)\s+\d+$/); }).map(function(l) { return l.innerText.trim(); });
    });

    await page.evaluate(function() {
      var btn = Array.from(document.querySelectorAll('button, a')).find(function(b) { return b.innerText.trim() === 'Business'; });
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    var policiesAfter = await page.evaluate(function() {
      return Array.from(document.querySelectorAll('a, button')).filter(function(l) { return l.innerText.trim().match(/^(Personal|Business)\s+\d+$/); }).map(function(l) { return l.innerText.trim(); });
    });

    if (policiesAfter.length <= policiesBefore.length)
      throw new Error('FAILED [POL-06]: Expected new Business policy created. Before: ' + policiesBefore.join(',') + ' After: ' + policiesAfter.join(','));

    var hasBusiness = policiesAfter.some(function(p) { return p.indexOf('Business') !== -1; });
    if (!hasBusiness)
      throw new Error('FAILED [POL-06]: No Business policy in list. Got: ' + policiesAfter.join(','));

    // Switch back to Personal 1
    await page.evaluate(function() {
      var link = Array.from(document.querySelectorAll('a, button')).find(function(l) { return l.innerText.trim() === 'Personal 1'; });
      if (link) link.click();
    });
    await page.waitForTimeout(2000);

    // ========================================
    // RULE KID-08: Kids Cover requires companion cover
    // ========================================
    // Set Kids to 1 (without any covers active)
    var kidsDropdown = page.locator('select[id*="Dropdown1"]').last();
    await kidsDropdown.scrollIntoViewIfNeeded();
    await kidsDropdown.selectOption('1');
    await page.waitForTimeout(3000);

    // Click Apply — should get dependency error
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.waitForTimeout(3000);

    var kidErrors = await getErrors();
    if (!kidErrors.some(function(e) { return e.indexOf('Personal Insurance Cover') !== -1; }))
      throw new Error('FAILED [KID-08]: Expected "add at least one Personal Insurance Cover" error. Got: ' + kidErrors.join(' | ').substring(0, 200));

    // ========================================
    // RULE KID-07: Kids SI tiers (16 options, $50k Free to $200k)
    // ========================================
    var kidSIOptions = await page.evaluate(function() {
      var selects = Array.from(document.querySelectorAll('select')).filter(function(s) {
        var opts = Array.from(s.options).map(function(o) { return o.text; });
        return opts.some(function(o) { return o.indexOf('50,000') !== -1 || o.indexOf('Free') !== -1; });
      });
      if (selects.length === 0) return null;
      return Array.from(selects[0].options).map(function(o) { return o.text; });
    });

    if (!kidSIOptions)
      throw new Error('FAILED [KID-07]: Kids SI dropdown not found');

    if (kidSIOptions.length !== 16)
      throw new Error('FAILED [KID-07]: Expected 16 SI options ($50k-$200k). Got ' + kidSIOptions.length + ': ' + kidSIOptions.join(', ').substring(0, 150));

    if (kidSIOptions[0].indexOf('50,000') === -1 || kidSIOptions[0].indexOf('Free') === -1)
      throw new Error('FAILED [KID-07]: First option should be "$50,000 (Free)". Got: "' + kidSIOptions[0] + '"');

    if (kidSIOptions[15].indexOf('200,000') === -1)
      throw new Error('FAILED [KID-07]: Last option should be "$200,000". Got: "' + kidSIOptions[15] + '"');

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(function() {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }
  await page.locator('button:has-text("Sign out")').click().catch(function() {});
  await page.waitForTimeout(2000);
});
