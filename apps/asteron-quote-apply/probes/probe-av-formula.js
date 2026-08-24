/**
 * Probe: M&L Agreed Value formula - narrow down tiers with more data points
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

    async function getAVCap(income) {
      await enterIncome(income);
      await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Mortgage & Living'); if (btn) btn.click(); });
      await page.waitForTimeout(3000);

      // Switch to Agreed Value
      const offsetDropdown = page.locator('select[id*="MLCOffsetBenefit"]').first();
      await offsetDropdown.selectOption({ label: 'Agreed Value' });
      await page.waitForTimeout(2000);

      // Enter high value to trigger cap
      const siField = page.locator('input[id*="Input_SumInsured"]').first();
      await siField.scrollIntoViewIfNeeded(); await siField.click();
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '99999') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

      const errors = await page.evaluate(() => {
        return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
          .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
          .map(n => n.innerText.trim());
      });
      const capError = errors.find(e => e.includes('maximum') && e.includes('Agreed Value'));
      const capMatch = capError ? capError.match(/\$([\d,]+)/) : null;
      const capVal = capMatch ? parseInt(capMatch[1].replace(/,/g, '')) : null;

      await removeAllCovers();
      return capVal;
    }

    // Test at many income levels to derive formula
    console.log('=== M&L AGREED VALUE — DETAILED FORMULA DERIVATION ===');
    console.log('Income | Cap ($/mo) | Annual Cap | Marginal from prev');

    const incomes = [
      '20000', '40000', '50000', '60000', '70000', '80000', '90000', '100000',
      '120000', '140000', '150000', '160000', '180000', '200000', '250000', '300000',
      '400000', '500000', '600000'
    ];

    let prevIncome = 0;
    let prevCap = 0;

    for (const inc of incomes) {
      const cap = await getAVCap(inc);
      const incNum = parseInt(inc);
      const annualCap = cap ? cap * 12 : 0;
      const pct = cap ? (annualCap / incNum * 100).toFixed(1) : '?';

      let marginal = '';
      if (prevIncome > 0 && cap && prevCap) {
        const deltaIncome = incNum - prevIncome;
        const deltaCap = (cap - prevCap) * 12;
        marginal = (deltaCap / deltaIncome * 100).toFixed(1) + '%';
      }

      console.log('  $' + inc.padStart(6) + ' | $' + (cap || '?').toString().padStart(6) + ' | $' + annualCap.toString().padStart(7) + ' | ' + marginal);

      prevIncome = incNum;
      prevCap = cap;
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
