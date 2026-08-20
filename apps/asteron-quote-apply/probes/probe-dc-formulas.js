/**
 * FOCUSED PROBE: DC formulas with correct income field, exclusivity, occupation gating
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = 'hanno.coetzee+1123@resolutionlife.com.au';
  const LOGIN_PASSWORD = 'P@ssw0rd135';

  try {
    // LOGIN + NEW QUOTE
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 20 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 20 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }

    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => { window.open = url => resolve(url); const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote'); if (link) link.click(); setTimeout(() => resolve(null), 3000); }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    console.log('Quote loaded.\n');

    // HELPERS
    async function enterCalcMask(selector, digits) {
      const field = page.locator(selector).first();
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (const d of digits) { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
    }

    async function getErrors() {
      return await page.evaluate(() => {
        return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
          .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
          .map(n => n.innerText.trim());
      });
    }

    async function removeAllCovers() {
      await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
      await page.waitForTimeout(3000);
    }

    async function activateCover(name) {
      await page.evaluate((n) => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === n || b.innerText.trim().split('\n')[0] === n); if (btn) btn.click(); }, name);
      await page.waitForTimeout(3000);
    }

    // SETUP: age 35, Male, AA, Employed, Income $150,000
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 30 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);

    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(2000);
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);

    // Enter income $150,000 using the correct field ID
    console.log('=== ENTERING INCOME ===');
    await enterCalcMask('input[id*="Input_AnnualIncome"], input[id*="MaskedInput"]', '150000');
    const incomeVal = await page.locator('input[id*="Input_AnnualIncome"], input[id*="MaskedInput"]').first().inputValue();
    console.log('Income field value: "' + incomeVal + '"');

    // ═══════════════════════════════════════
    // DC-15: M&L max = 45% x $150k / 12 = $5,625
    // ═══════════════════════════════════════
    console.log('\n=== DC-15: M&L FORMULA ===');
    await activateCover('Mortgage & Living');

    // Focus+blur the benefit field (nth SI field)
    const mlSI = page.locator('input[id*="Input_SumInsured"]').first();
    await mlSI.scrollIntoViewIfNeeded();
    await mlSI.click();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);
    const mlVal = await mlSI.inputValue();
    console.log('M&L auto-default: "' + mlVal + '"');

    // Try exceeding the cap
    await enterCalcMask('input[id*="Input_SumInsured"]', '10000');
    const mlErrors = await getErrors();
    const mlCapError = mlErrors.find(e => e.includes('maximum') && e.includes('Mortgage'));
    console.log('M&L $10,000 cap error: ' + (mlCapError || 'NONE'));

    await removeAllCovers();

    // ═══════════════════════════════════════
    // DC-21: IP formula (75% x $150k / 12 = $9,375)
    // ═══════════════════════════════════════
    console.log('\n=== DC-21: IP FORMULA ===');
    await activateCover('Income Protection');

    const ipSI = page.locator('input[id*="Input_SumInsured"]').first();
    await ipSI.scrollIntoViewIfNeeded();
    await ipSI.click();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);
    const ipVal = await ipSI.inputValue();
    console.log('IP auto-default: "' + ipVal + '"');

    // Try exceeding the cap
    await enterCalcMask('input[id*="Input_SumInsured"]', '15000');
    const ipErrors = await getErrors();
    const ipCapError = ipErrors.find(e => e.includes('maximum') && e.includes('Income Protection'));
    console.log('IP $15,000 cap error: ' + (ipCapError || 'NONE'));

    await removeAllCovers();

    // ═══════════════════════════════════════
    // DC-27: Workability formula (min($10k, 75% x $150k / 12) = $9,375)
    // ═══════════════════════════════════════
    console.log('\n=== DC-27: WORKABILITY FORMULA ===');
    await activateCover('Workability');

    const workSI = page.locator('input[id*="Input_SumInsured"]').first();
    await workSI.scrollIntoViewIfNeeded();
    await workSI.click();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);
    const workVal = await workSI.inputValue();
    console.log('Workability auto-default: "' + workVal + '"');

    await removeAllCovers();

    // ═══════════════════════════════════════
    // DC-28: Workability + M&L exclusivity
    // ═══════════════════════════════════════
    console.log('\n=== DC-28: WORKABILITY + M&L EXCLUSIVITY ===');
    await activateCover('Mortgage & Living');
    // Commit M&L
    const mlSI2 = page.locator('input[id*="Input_SumInsured"]').first();
    await mlSI2.scrollIntoViewIfNeeded(); await mlSI2.click(); await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    // Now activate Workability
    await activateCover('Workability');
    // Commit Workability
    const siFields = await page.evaluate(() => document.querySelectorAll('input[id*="Input_SumInsured"]').length);
    if (siFields >= 2) {
      const workSI2 = page.locator('input[id*="Input_SumInsured"]').nth(1);
      await workSI2.scrollIntoViewIfNeeded(); await workSI2.click(); await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
    }

    const exclusErrors = await getErrors();
    const hasExclError = exclusErrors.some(e => e.includes('not available to be taken in conjunction'));
    console.log('Exclusivity error present: ' + hasExclError);
    console.log('Exclusivity errors: ' + exclusErrors.filter(e => e.includes('conjunction') || e.includes('Workability')).join(' | '));

    await removeAllCovers();

    // ═══════════════════════════════════════
    // DC-28b: Workability + IP exclusivity
    // ═══════════════════════════════════════
    console.log('\n=== DC-28b: WORKABILITY + IP EXCLUSIVITY ===');
    await activateCover('Income Protection');
    const ipSI2 = page.locator('input[id*="Input_SumInsured"]').first();
    await ipSI2.scrollIntoViewIfNeeded(); await ipSI2.click(); await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    await activateCover('Workability');
    const siFields2 = await page.evaluate(() => document.querySelectorAll('input[id*="Input_SumInsured"]').length);
    if (siFields2 >= 2) {
      const workSI3 = page.locator('input[id*="Input_SumInsured"]').nth(1);
      await workSI3.scrollIntoViewIfNeeded(); await workSI3.click(); await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
    }

    const exclusErrors2 = await getErrors();
    const hasExclError2 = exclusErrors2.some(e => e.includes('not available to be taken in conjunction'));
    console.log('Exclusivity error (IP+Work): ' + hasExclError2);
    console.log('Errors: ' + exclusErrors2.filter(e => e.includes('conjunction') || e.includes('Workability')).join(' | '));

    await removeAllCovers();

    // ═══════════════════════════════════════
    // DC-28c: M&L + IP can coexist (no exclusivity)
    // ═══════════════════════════════════════
    console.log('\n=== DC-28c: M&L + IP COEXISTENCE ===');
    await activateCover('Mortgage & Living');
    const mlSI3 = page.locator('input[id*="Input_SumInsured"]').first();
    await mlSI3.scrollIntoViewIfNeeded(); await mlSI3.click(); await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    await activateCover('Income Protection');
    const siFields3 = await page.evaluate(() => document.querySelectorAll('input[id*="Input_SumInsured"]').length);
    if (siFields3 >= 2) {
      const ipSI3 = page.locator('input[id*="Input_SumInsured"]').nth(1);
      await ipSI3.scrollIntoViewIfNeeded(); await ipSI3.click(); await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
    }

    const coexistErrors = await getErrors();
    const hasCoexistError = coexistErrors.some(e => e.includes('not available to be taken in conjunction'));
    console.log('M&L+IP exclusivity error: ' + hasCoexistError + ' (should be false)');

    await removeAllCovers();

    // ═══════════════════════════════════════
    // DC-21 TIER 2: IP at $400k income
    // ═══════════════════════════════════════
    console.log('\n=== DC-21 TIER 2: IP at $400k income ===');
    await enterCalcMask('input[id*="Input_AnnualIncome"], input[id*="MaskedInput"]', '400000');

    await activateCover('Income Protection');
    const ipSI4 = page.locator('input[id*="Input_SumInsured"]').first();
    await ipSI4.scrollIntoViewIfNeeded(); await ipSI4.click(); await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);
    const ipVal2 = await ipSI4.inputValue();
    console.log('IP auto-default at $400k: "' + ipVal2 + '"');
    // Expected: (75% x $320k + 50% x ($400k - $320k)) / 12 = ($240k + $40k) / 12 = $23,333

    await removeAllCovers();

    // ═══════════════════════════════════════
    // DC-27 CAP: Workability at $200k income (should hit $10k cap)
    // ═══════════════════════════════════════
    console.log('\n=== DC-27 CAP: Workability at $200k ===');
    await enterCalcMask('input[id*="Input_AnnualIncome"], input[id*="MaskedInput"]', '200000');

    await activateCover('Workability');
    const workSI4 = page.locator('input[id*="Input_SumInsured"]').first();
    await workSI4.scrollIntoViewIfNeeded(); await workSI4.click(); await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);
    const workVal2 = await workSI4.inputValue();
    console.log('Workability auto-default at $200k: "' + workVal2 + '"');
    // Expected: min($10k, 75% x $200k / 12) = min($10k, $12,500) = $10,000

    await removeAllCovers();

    // ═══════════════════════════════════════
    // NEEDLESTICK: OCC=AA activation, OCC=B no-op (re-confirm)
    // ═══════════════════════════════════════
    console.log('\n=== NEEDLESTICK OCC GATE (fresh state) ===');
    // Set OCC=B
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('4'); // B
    await page.waitForTimeout(3000);

    const selectsBefore = await page.evaluate(() => document.querySelectorAll('select').length);
    await activateCover('Needlestick');
    const selectsAfter = await page.evaluate(() => document.querySelectorAll('select').length);
    console.log('OCC=B: Needlestick selects before=' + selectsBefore + ' after=' + selectsAfter + ' (should be equal)');

    // Set OCC=AA
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(3000);

    const selectsBefore2 = await page.evaluate(() => document.querySelectorAll('select').length);
    await activateCover('Needlestick');
    const selectsAfter2 = await page.evaluate(() => document.querySelectorAll('select').length);
    console.log('OCC=AA: Needlestick selects before=' + selectsBefore2 + ' after=' + selectsAfter2 + ' (should increase)');

  } catch (err) {
    console.error('FATAL ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
