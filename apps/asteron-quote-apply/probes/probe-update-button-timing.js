/**
 * Isolates whether the Update button's disabled state changes over time with
 * ZERO user interaction after Adviser Use is opened. Two prior runs disagreed
 * (probe-commission-category.js: disabled=false immediately; probe-commission-evidence.js:
 * disabled=true immediately) - this either means it starts disabled and something
 * un-prompted flips it to enabled within a few seconds, or the two runs aren't
 * comparable for some other reason. Sample repeatedly, touch nothing, find out.
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
      return b ? { disabled: b.disabled, hasDisabledAttr: b.hasAttribute('disabled') } : null;
    });
    console.log('[' + label + '] Update button: ' + JSON.stringify(info));
    return info;
  }

  try {
    console.log('=== TIMING PROBE — ' + new Date().toISOString() + ' ===');

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
    console.log('Quote priced.');

    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    // Do NOT waitSettle here - we want t=0 as close to modal-open as possible.
    console.log('Clicked Adviser Use at t=0.');

    await sampleUpdateButton('t=0.0s (immediately after click, before any wait)');
    await page.waitForTimeout(500); await sampleUpdateButton('t=0.5s');
    await page.waitForTimeout(500); await sampleUpdateButton('t=1.0s');
    await page.waitForTimeout(1000); await sampleUpdateButton('t=2.0s');
    await page.waitForTimeout(1000); await sampleUpdateButton('t=3.0s');
    await page.waitForTimeout(2000); await sampleUpdateButton('t=5.0s');
    await page.waitForTimeout(3000); await sampleUpdateButton('t=8.0s');
    await page.waitForTimeout(4000); await sampleUpdateButton('t=12.0s (no interaction since modal opened)');

    await page.screenshot({ path: 'apps/asteron-quote-apply/docs/business-rules/quote-screen/adviser-use-commission/evidence/finding-01-timing-t12s.png' });
    console.log('Screenshot saved at t=12s.');

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
