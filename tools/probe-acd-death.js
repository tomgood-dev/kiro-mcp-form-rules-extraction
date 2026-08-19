/**
 * Probe: test Acd. Death at ages 69, 70, 71
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

    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    for (const age of ['35', '69', '70', '71']) {
      // Remove any covers first
      await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
      await page.waitForTimeout(2000);

      await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
      await page.keyboard.type(age, { delay: 40 }); await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);

      // Check button existence
      const btnExists = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Acd. Death');
        return !!btn;
      });

      if (!btnExists) {
        console.log('Age ' + age + ': Acd. Death button NOT in DOM');
        continue;
      }

      // Try clicking it
      const siBefore = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
      await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Acd. Death'); if (btn) btn.click(); });
      await page.waitForTimeout(3000);
      const siAfter = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);

      if (siAfter > siBefore) {
        // Enter SI
        const si = page.locator('input[id*="SumInsured"]').first();
        await si.scrollIntoViewIfNeeded(); await si.click(); await page.waitForTimeout(200);
        for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
        for (const d of '100000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
        await page.keyboard.press('Tab'); await page.waitForTimeout(3000);

        const errors = await page.evaluate(() => {
          return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
            .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
            .map(n => n.innerText.trim());
        });
        const ageError = errors.find(e => e.includes('Accidental Death') || e.includes('Age Next Birthday'));
        console.log('Age ' + age + ': Activated, SI entered. Age-related error: ' + (ageError || 'NONE'));
      } else {
        console.log('Age ' + age + ': Button exists but click was NO-OP');
      }
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
