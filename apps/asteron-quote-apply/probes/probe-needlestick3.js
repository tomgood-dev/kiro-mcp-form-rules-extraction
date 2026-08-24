/**
 * Probe: detailed look at page changes after Needlestick click (OCC=AA)
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

    // Set age 35, Male, OCC=AA
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(3000);

    // Snapshot DOM before click
    const htmlBefore = await page.evaluate(() => document.body.innerHTML.length);
    const selectsBefore = await page.evaluate(() => document.querySelectorAll('select').length);
    const inputsBefore = await page.evaluate(() => document.querySelectorAll('input').length);

    console.log('Before Needlestick click:');
    console.log('  HTML length: ' + htmlBefore + ', selects: ' + selectsBefore + ', inputs: ' + inputsBefore);

    // Click using evaluate with .click()
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Needlestick');
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('  Clicked: ' + clicked);
    await page.waitForTimeout(5000); // wait longer

    const htmlAfter = await page.evaluate(() => document.body.innerHTML.length);
    const selectsAfter = await page.evaluate(() => document.querySelectorAll('select').length);
    const inputsAfter = await page.evaluate(() => document.querySelectorAll('input').length);

    console.log('\nAfter Needlestick click (5s wait):');
    console.log('  HTML length: ' + htmlAfter + ', selects: ' + selectsAfter + ', inputs: ' + inputsAfter);
    console.log('  Change: HTML ' + (htmlAfter - htmlBefore) + ', selects +' + (selectsAfter - selectsBefore) + ', inputs +' + (inputsAfter - inputsBefore));

    // Check the Needlestick button state after click
    const btnAfter = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Needlestick');
      if (!btn) return null;
      return { disabled: btn.disabled, className: btn.className, ariaPressed: btn.getAttribute('aria-pressed') };
    });
    console.log('  Needlestick button after click: ' + JSON.stringify(btnAfter));

    // Look for any "Remove" links that might indicate an active cover
    const removeLinks = await page.evaluate(() => {
      return [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').length;
    });
    console.log('  Remove links on page: ' + removeLinks);

    // Look for any Needlestick-related text/elements
    const needlestickText = await page.evaluate(() => {
      const all = [...document.querySelectorAll('*')];
      return all.filter(el => {
        const t = el.innerText || '';
        return t.includes('Needlestick') && el.children.length === 0 && el.tagName !== 'BUTTON';
      }).map(el => ({ tag: el.tagName, text: el.innerText.trim().substring(0, 80), class: el.className.substring(0, 50) }));
    });
    console.log('  Needlestick text elements (non-button, leaf): ' + JSON.stringify(needlestickText));

    // Maybe the cover section needs scrolling into view or it appeared below the fold
    // Let's try first activating Life (known to work), then Needlestick
    console.log('\n=== Try: Activate Life first, then Needlestick ===');
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);
    console.log('  Life activated, SI fields: ' + await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length));

    // Now click Needlestick
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Needlestick'); if (btn) btn.click(); });
    await page.waitForTimeout(5000);

    const selectsNow = await page.evaluate(() => document.querySelectorAll('select').length);
    const inputsNow = await page.evaluate(() => document.querySelectorAll('input').length);
    const removesNow = await page.evaluate(() => [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').length);
    console.log('  After Needlestick: selects=' + selectsNow + ' inputs=' + inputsNow + ' removes=' + removesNow);

    // Look for a dropdown with $50k options (Needlestick SI)
    const allSelects = await page.evaluate(() => {
      return [...document.querySelectorAll('select')].map(s => ({
        id: s.id.substring(0, 60),
        optCount: s.options.length,
        firstOpts: [...s.options].slice(0, 5).map(o => o.text)
      }));
    });
    console.log('  All selects: ' + JSON.stringify(allSelects, null, 2));

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
