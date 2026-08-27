/**
 * Follow-up to probe-update-button-timing.js: confirms AC05 (Update button becomes
 * enabled after a REAL selection change via selectOption - not the mouse.wheel()
 * scroll artifact that caused the earlier false-positive "always enabled" reading).
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

  async function waitSettle(ms) {
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(ms || 500);
  }

  async function sampleUpdateButton(label) {
    const info = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Update');
      return b ? { disabled: b.disabled } : null;
    });
    console.log('[' + label + '] Update button: ' + JSON.stringify(info));
    return info;
  }

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
    const quoteUrl = await page.evaluate(() => new Promise(resolve => {
      window.open = url => resolve(url);
      const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find(x => x.innerText.trim() === 'Male'); if (b) { b.scrollIntoView({block:'center'}); b.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    const siInput = page.locator('input[id*="SumInsured"]').first();
    await siInput.scrollIntoViewIfNeeded(); await siInput.click(); await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
    for (const d of '500000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await waitSettle(2000);

    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    await page.waitForTimeout(1500);
    await sampleUpdateButton('before any change');

    const defaultAgencyId = await page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const match = sels.find(s => {
        const opts = [...s.options].map(o => o.text);
        return opts.length === 3 && opts.includes('Upfront') && opts.includes('Level 30') && opts.includes('Spread 20');
      });
      return match ? match.id : null;
    });
    console.log('Default-for-Agency select id: ' + defaultAgencyId);

    // Real selectOption interaction (not raw evaluate+dispatchEvent, not mouse.wheel)
    await page.locator('#' + defaultAgencyId).selectOption({ label: 'Spread 20' });
    await page.waitForTimeout(500);
    await sampleUpdateButton('immediately after selectOption(Spread 20)');
    await page.waitForTimeout(1500);
    await sampleUpdateButton('1.5s after selectOption(Spread 20)');

    // Revert (never click Update - agency-wide shared setting)
    await page.locator('#' + defaultAgencyId).selectOption({ label: 'Upfront' });
    await page.waitForTimeout(500);
    await sampleUpdateButton('after reverting to Upfront (not clicking Update)');

    await page.screenshot({ path: 'apps/asteron-quote-apply/docs/business-rules/quote-screen/adviser-use-commission/evidence/finding-01-ac05-after-real-change.png' });
    console.log('Screenshot saved.');

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
