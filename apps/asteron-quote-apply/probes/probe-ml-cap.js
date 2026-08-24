/**
 * Probe: M&L cap at high income - what error does it give?
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
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

    // Setup: 35, Male, AA, Employed, $320k income
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

    // Enter $320k income
    let incomeField = page.locator('input[id*="Input_AnnualIncome"]').first();
    let visible = await incomeField.isVisible().catch(() => false);
    if (!visible) incomeField = page.locator('input[id*="MaskedInput"]').first();
    await incomeField.scrollIntoViewIfNeeded(); await incomeField.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    for (let x = 0; x < 15; x++) await page.keyboard.press('Backspace');
    for (const d of '320000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
    await page.keyboard.press('Tab'); await page.waitForTimeout(2000);
    console.log('Income: ' + await incomeField.inputValue());

    // Activate M&L
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Mortgage & Living'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    // Enter a high value to see the error
    const siField = page.locator('input[id*="Input_SumInsured"]').first();
    await siField.scrollIntoViewIfNeeded(); await siField.click();
    for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
    for (const d of '20000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

    const errors = await page.evaluate(() => {
      return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
        .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
        .map(n => n.innerText.trim());
    });
    console.log('M&L errors at $20k with $320k income:');
    errors.forEach(e => console.log('  ' + e));

    // Also check what the auto-default would be
    await siField.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    const autoVal = await siField.inputValue();
    console.log('M&L auto-default at $320k income: "' + autoVal + '"');

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
