/**
 * Probe: test income field re-entry at increasing values
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

    // Setup
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

    // Find income field
    let incomeField = page.locator('input[id*="Input_AnnualIncome"]').first();
    let visible = await incomeField.isVisible().catch(() => false);
    if (!visible) incomeField = page.locator('input[id*="MaskedInput"]').first();

    // Enter income values sequentially and check what sticks
    const incomes = ['100000', '150000', '200000', '320000', '400000'];

    for (const inc of incomes) {
      // Method 1: select all + delete + type
      await incomeField.scrollIntoViewIfNeeded();
      await incomeField.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);
      // Also clear with backspaces
      for (let x = 0; x < 15; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (const d of inc) { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);

      const val = await incomeField.inputValue();
      console.log('Entered ' + inc + ' → field shows: "' + val + '"');

      // Activate M&L, check default, remove
      await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Mortgage & Living'); if (btn) btn.click(); });
      await page.waitForTimeout(3000);
      const siField = page.locator('input[id*="Input_SumInsured"]').first();
      await siField.scrollIntoViewIfNeeded(); await siField.click();
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
      const mlVal = await siField.inputValue();
      console.log('  M&L auto-default: "' + mlVal + '"');

      await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
      await page.waitForTimeout(2000);
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
