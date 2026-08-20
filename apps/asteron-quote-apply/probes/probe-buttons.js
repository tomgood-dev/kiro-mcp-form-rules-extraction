/**
 * Probe: dump exact cover button text at age 35
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

    // Set age 35, Male, OCC AA
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);

    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    // Dump ALL buttons with class "cover-button"
    const coverButtons = await page.evaluate(() => {
      return [...document.querySelectorAll('button')].filter(b => {
        return b.className.indexOf('cover-button') !== -1 || b.closest('[class*="cover"]');
      }).map(b => ({
        text: b.innerText.trim().replace(/\n/g, ' | '),
        id: b.id,
        className: b.className.substring(0, 80),
        disabled: b.disabled
      }));
    });
    console.log('Cover buttons found: ' + coverButtons.length);
    coverButtons.forEach((b, i) => console.log('  [' + i + '] text="' + b.text + '" id="' + b.id + '" disabled=' + b.disabled));

    // Also dump ALL buttons on page that contain cover-like words
    const allButtons = await page.evaluate(() => {
      const keywords = ['life', 'tpd', 'trauma', 'cancer', 'accidental', 'needlestick', 'specific', 'death'];
      return [...document.querySelectorAll('button')].filter(b => {
        const t = b.innerText.toLowerCase();
        return keywords.some(k => t.includes(k));
      }).map(b => ({
        text: b.innerText.trim().replace(/\n/g, ' | ').substring(0, 80),
        id: b.id,
        className: b.className.substring(0, 60)
      }));
    });
    console.log('\nButtons containing cover keywords:');
    allButtons.forEach((b, i) => console.log('  [' + i + '] text="' + b.text + '" class="' + b.className + '"'));

    // Check for Accidental Death specifically - maybe it's a link or different element
    const acdElements = await page.evaluate(() => {
      return [...document.querySelectorAll('*')].filter(el => {
        return el.innerText && el.innerText.includes('Accidental') && el.tagName !== 'BODY' && el.tagName !== 'HTML' && !el.querySelector('[class]');
      }).slice(0, 10).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim().substring(0, 60),
        className: el.className ? el.className.substring(0, 60) : ''
      }));
    });
    console.log('\nElements containing "Accidental":');
    acdElements.forEach((el, i) => console.log('  [' + i + '] <' + el.tag + '> text="' + el.text + '" class="' + el.className + '"'));

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
