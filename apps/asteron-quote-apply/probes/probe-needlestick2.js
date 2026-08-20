/**
 * Probe: Click Needlestick with OCC=B, see what happens
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
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }

    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => { window.open = url => resolve(url); const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote'); if (link) link.click(); setTimeout(() => resolve(null), 3000); }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Set age 35, Male, OCC B (value=4)
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('4'); // B
    await page.waitForTimeout(3000);

    // Try clicking Needlestick
    console.log('OCC=B: Clicking Needlestick...');
    const siBefore = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Needlestick'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);
    const siAfter = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    console.log('  SI fields before: ' + siBefore + ', after: ' + siAfter);

    // Check for any new elements (maybe a dropdown instead of calcmask)
    const newFields = await page.evaluate(() => {
      const selects = [...document.querySelectorAll('select')].filter(s => s.id.includes('SumInsured') || s.closest('[class*="cover"]'));
      return selects.map(s => ({ id: s.id.substring(0, 50), options: [...s.options].map(o => o.text).join(', ') }));
    });
    console.log('  New selects near cover area: ' + JSON.stringify(newFields));

    // Check errors
    const errors = await page.evaluate(() => {
      return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
        .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
        .map(n => n.innerText.trim());
    });
    console.log('  Errors: ' + JSON.stringify(errors));

    // Now try with OCC=AA (value=1) for comparison
    console.log('\nOCC=AA: Switching and clicking Needlestick...');
    await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
    await page.waitForTimeout(2000);
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(3000);

    const siBefore2 = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Needlestick'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);
    const siAfter2 = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    console.log('  SI fields before: ' + siBefore2 + ', after: ' + siAfter2);

    // Check what appears - Needlestick uses a select dropdown for SI, not calcmask
    const allNewFields = await page.evaluate(() => {
      // Look for any new visible elements in cover cards
      const cards = document.querySelectorAll('[class*="cover-card"], [class*="CoverCard"]');
      const cardTexts = [...cards].map(c => c.innerText.trim().substring(0, 100));
      return cardTexts;
    });
    console.log('  Cover cards: ' + JSON.stringify(allNewFields));

    const errors2 = await page.evaluate(() => {
      return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
        .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
        .map(n => n.innerText.trim());
    });
    console.log('  Errors: ' + JSON.stringify(errors2));

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
