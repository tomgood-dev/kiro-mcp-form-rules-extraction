/**
 * Probe: check Accidental Death button existence at ages 69, 70, 71
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
    // LOGIN
    console.log('Logging in...');
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }

    // NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => { window.open = url => resolve(url); const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote'); if (link) link.click(); setTimeout(() => resolve(null), 3000); }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();

    // Set Male, OCC AA
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    // Test different ages
    for (const age of ['35', '65', '69', '70', '71', '72']) {
      await ageInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.keyboard.type(age, { delay: 40 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);

      const buttons = await page.evaluate(() => {
        return [...document.querySelectorAll('button')].filter(b => {
          const text = b.innerText.trim().split('\n')[0];
          return ['Life', 'TPD', 'Trauma', 'Cancer', 'Accidental Death', 'Needlestick', 'Specific Injury'].includes(text);
        }).map(b => b.innerText.trim().split('\n')[0]);
      });
      console.log('Age ' + age + ': Available covers = [' + buttons.join(', ') + ']');
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
