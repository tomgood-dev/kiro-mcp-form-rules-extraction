// Probe: after setting age/gender/occ/employment/income + Life + Flexi 12.5%, what does Apply
// complain about? Confirms whether Employment Status actually stuck and what's needed to reach
// the IC/RC validation (AC16). Run: node apps/asteron-quote-apply/probes/probe-ac16-apply.js
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
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 40 });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  page.setDefaultTimeout(30000);
  try {
    await login(page);
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
    const qUrl = await page.evaluate(() => new Promise((res) => { window.open = (u) => res(u); const l = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote'); if (l) l.click(); setTimeout(() => res(null), 3000); }));
    if (qUrl) await page.goto(qUrl, { waitUntil: 'domcontentloaded' }); else await page.goto(BASE + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[id*="Input_AgeNextBirthday"]').first().waitFor({ state: 'visible', timeout: 40000 });
    // age/gender/occ
    const age = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await age.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete'); await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) b.click(); }); await page.waitForTimeout(1500);
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); await page.waitForTimeout(1500);
    // Life + Flexi 12.5% FIRST
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Life'); if (b) b.click(); }); await page.waitForTimeout(2500);
    const si = page.locator('input[id*="SumInsured"]').first();
    await si.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); await page.keyboard.type('1000000', { delay: 20 }); await page.keyboard.press('Tab'); await page.waitForTimeout(2500);
    await page.locator('select[id*="Dropdown_FlexiRate"]').first().selectOption({ label: '12.5%' }).catch((e) => console.log('[probe] flexi err', e.message)); await page.waitForTimeout(2500);
    // employment status = Employed LAST (after Flexi, in case Flexi resets it)
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' }).catch((e) => console.log('[probe] emp status select err:', e.message));
    await page.waitForTimeout(2000);

    const empVal = await page.evaluate(() => { const s = document.querySelector('select[id*="EmploymentStatus_Dropdown"]'); return s ? s.options[s.selectedIndex].text : null; });
    console.log('[probe] Employment Status right before Apply:', empVal);

    // Apply and read errors
    await page.getByRole('button', { name: 'Apply', exact: true }).click(); await page.waitForTimeout(5000);
    const errs = await page.evaluate(() => [...document.querySelectorAll('[class*="error"],[class*="Error"],[role="alert"]')].map((n) => (n.innerText || '').trim()).filter(Boolean).slice(0, 10));
    console.log('[probe] Apply errors:', JSON.stringify(errs, null, 2));
  } finally {
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000); await browser.close().catch(() => {});
    console.log('[probe] closed');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
