/**
 * Probe: M&L Agreed Value formula at multiple income levels
 * Also IP Loss of Earnings at multiple income levels
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  if (!LOGIN_EMAIL) throw new Error('Set ASTERON_LOGIN_EMAIL env var before running this probe.');
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;
  if (!LOGIN_PASSWORD) throw new Error('Set ASTERON_LOGIN_PASSWORD env var before running this probe.');

  try {
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

    // Setup: 35, Male, AA, Employed
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 30 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);

    async function enterIncome(digits) {
      let field = page.locator('input[id*="Input_AnnualIncome"]').first();
      let v = await field.isVisible().catch(() => false);
      if (!v) field = page.locator('input[id*="MaskedInput"]').first();
      await field.scrollIntoViewIfNeeded(); await field.click();
      await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
      for (let x = 0; x < 15; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (const d of digits) { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab'); await page.waitForTimeout(2000);
    }

    async function removeAllCovers() {
      await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
      await page.waitForTimeout(3000);
    }

    // ═══════════════════════════════════════
    // M&L AGREED VALUE — formula test at multiple incomes
    // ═══════════════════════════════════════
    console.log('=== M&L AGREED VALUE — FORMULA DERIVATION ===');

    const incomes = ['80000', '100000', '120000', '150000', '200000', '300000'];

    for (const inc of incomes) {
      await enterIncome(inc);

      await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Mortgage & Living'); if (btn) btn.click(); });
      await page.waitForTimeout(3000);

      // Switch to Agreed Value
      const offsetDropdown = page.locator('select[id*="MLCOffsetBenefit"]').first();
      await offsetDropdown.selectOption({ label: 'Agreed Value' });
      await page.waitForTimeout(2000);

      // Enter a high value to trigger the cap error
      const siField = page.locator('input[id*="Input_SumInsured"]').first();
      await siField.scrollIntoViewIfNeeded(); await siField.click();
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '50000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

      const errors = await page.evaluate(() => {
        return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
          .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
          .map(n => n.innerText.trim());
      });
      const capError = errors.find(e => e.includes('maximum') && e.includes('Agreed Value'));
      const capMatch = capError ? capError.match(/\$[\d,]+/) : null;
      const capVal = capMatch ? capMatch[0] : 'NO CAP FOUND';

      const incNum = parseInt(inc);
      const pct = capVal !== 'NO CAP FOUND' ? (parseFloat(capVal.replace(/[$,]/g, '')) / incNum * 12 * 100).toFixed(1) + '%' : '?';
      console.log('  Income $' + inc + ': Cap = ' + capVal + ' (' + pct + ' of income / 12)');

      await removeAllCovers();
    }

    // ═══════════════════════════════════════
    // IP LOSS OF EARNINGS — formula test
    // ═══════════════════════════════════════
    console.log('\n=== IP LOSS OF EARNINGS — FORMULA DERIVATION ===');

    for (const inc of ['100000', '150000', '200000']) {
      await enterIncome(inc);

      await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Income Protection'); if (btn) btn.click(); });
      await page.waitForTimeout(3000);

      // Switch to Loss of Earnings
      await page.evaluate(() => {
        const sel = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.text.includes('Loss Of Earnings Plus')));
        if (sel) { sel.selectedIndex = 0; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await page.waitForTimeout(3000);

      // Enter high value to trigger cap
      const ipSI = page.locator('input[id*="Input_SumInsured"]').first();
      await ipSI.scrollIntoViewIfNeeded(); await ipSI.click();
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '50000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

      const ipErrors = await page.evaluate(() => {
        return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
          .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
          .map(n => n.innerText.trim());
      });
      const ipCapError = ipErrors.find(e => e.includes('maximum') && e.includes('Income Protection'));
      console.log('  Income $' + inc + ': IP (Loss of Earnings) cap error = ' + (ipCapError || 'NONE'));

      await removeAllCovers();
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
