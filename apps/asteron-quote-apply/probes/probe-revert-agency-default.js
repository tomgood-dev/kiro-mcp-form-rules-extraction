// Reads the persisted agency Default-for-Agency value and, if not Upfront, sets it back to
// Upfront and clicks Update to restore the shared baseline. Also reports whether the AC07
// confirmation message appears (to see if the save/confirmation regression is now fixed).
// Run: node apps/asteron-quote-apply/probes/probe-revert-agency-default.js
const { chromium } = require('@playwright/test');
const { preflightCleanup } = require('../../../tools/session-cleanup');
const BASE = process.env.BASE_URL || 'https://outsystems-dev.asteronlife.co.nz';
const EMAIL = process.env.ASTERON_LOGIN_EMAIL, PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

async function login(page) {
  await page.goto(BASE + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.locator('input[type="text"]').first().click(); await page.keyboard.type(EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click(); await page.keyboard.type(PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
  if (page.url().includes('CentralPortalsLogin')) throw new Error('login failed');
  console.log('[probe] logged in');
}

(async () => {
  preflightCleanup(); await new Promise((r) => setTimeout(r, 3000));
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 30 });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  page.setDefaultTimeout(30000);
  try {
    await login(page);
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
    const qUrl = await page.evaluate(() => new Promise((res) => { window.open = (u) => res(u); const l = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote'); if (l) l.click(); setTimeout(() => res(null), 3000); }));
    if (qUrl) await page.goto(qUrl, { waitUntil: 'domcontentloaded' }); else await page.goto(BASE + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[id*="Input_AgeNextBirthday"]').first().waitFor({ state: 'visible', timeout: 40000 });
    const age = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await age.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete'); await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) b.click(); }); await page.waitForTimeout(1500);
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Life'); if (b) b.click(); }); await page.waitForTimeout(2500);
    const si = page.locator('input[id*="SumInsured"]').first();
    await si.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); await page.keyboard.type('500000', { delay: 20 }); await page.keyboard.press('Tab'); await page.waitForTimeout(2500);
    await page.evaluate(() => { const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use')); if (el) el.click(); }); await page.waitForTimeout(2500);

    function defSelId() {
      const sels = [...document.querySelectorAll('select')];
      const m = sels.find((s) => { const o = [...s.options].map((x) => x.text); return o.length === 3 && o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20'); });
      return m ? m.id : null;
    }
    const before = await page.evaluate(() => { const sels = [...document.querySelectorAll('select')]; const m = sels.find((s) => { const o = [...s.options].map((x) => x.text); return o.length === 3 && o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20'); }); return m ? m.options[m.selectedIndex].text : null; });
    console.log('[probe] persisted agency default (before) =', before);

    if (before !== 'Upfront') {
      const id = await page.evaluate(defSelId);
      await page.locator('#' + id).selectOption({ label: 'Upfront' }); await page.waitForTimeout(1500);
      await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Update'); if (b) b.click(); }); await page.waitForTimeout(3000);
      const conf = await page.evaluate(() => document.body.innerText.includes('Your default commission structure setting has been updated.'));
      console.log('[probe] clicked Update → confirmation message shown =', conf);
    } else {
      console.log('[probe] already Upfront — nothing to revert');
    }
  } finally {
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000); await browser.close().catch(() => {});
    console.log('[probe] closed');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
