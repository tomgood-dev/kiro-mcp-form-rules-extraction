// Probe for AC17 (zero-income young client → $250k cap) and AC18 (part-time worker → $500k
// underwriting referral). Resolves: what are the Employment Status options, is there a "part
// time" path, and what income control is used — so both ACs can be WRITTEN, not deferred.
//
// Run: node apps/asteron-quote-apply/probes/probe-young-income-caps.js
const { chromium } = require('@playwright/test');
const { preflightCleanup } = require('../../../tools/session-cleanup');

const BASE = process.env.BASE_URL || 'https://outsystems-dev.asteronlife.co.nz';
const EMAIL = process.env.ASTERON_LOGIN_EMAIL;
const PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

async function login(page) {
  await page.goto(BASE + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.locator('input[type="text"]').first().click(); await page.keyboard.type(EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click(); await page.keyboard.type(PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
  if (page.url().includes('CentralPortalsLogin')) throw new Error('Login failed — still on login page.');
  console.log('[probe] logged in OK');
}

(async () => {
  if (!EMAIL || !PASSWORD) { console.error('set creds'); process.exit(1); }
  preflightCleanup();
  await new Promise((r) => setTimeout(r, 3000));
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 40 });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  page.setDefaultTimeout(30000);
  try {
    await login(page);
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise((resolve) => {
      window.open = (u) => resolve(u);
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote');
      if (link) link.click(); setTimeout(() => resolve(null), 3000);
    }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[id*="Input_AgeNextBirthday"]').first().waitFor({ state: 'visible', timeout: 40000 });
    await page.waitForTimeout(1500);
    console.log('[probe] quote form rendered');

    // Employment Status options — is "part time" among them?
    const empStatus = await page.evaluate(() => {
      const sel = document.querySelector('select[id*="EmploymentStatus_Dropdown"]');
      return sel ? { id: sel.id, options: [...sel.options].map((o) => o.text.trim()) } : null;
    });
    console.log('[probe] Employment Status:', JSON.stringify(empStatus, null, 2));

    // Occupation options — does any encode "part time"?
    const occ = await page.evaluate(() => {
      const sel = document.querySelector('select[id*="OccupationCode_Dropdown"]');
      return sel ? { id: sel.id, options: [...sel.options].map((o) => o.text.trim()) } : null;
    });
    console.log('[probe] Occupation Code:', JSON.stringify(occ, null, 2));

    // Income control — id + label
    const income = await page.evaluate(() => {
      const inp = document.querySelector('input[id*="AnnualIncome"], input[id*="MaskedInput"]');
      if (!inp) return null;
      let c = inp.parentElement, txt = '';
      for (let d = 0; d < 5 && c; d++) { txt = (c.innerText || '').trim(); if (txt) break; c = c.parentElement; }
      return { id: inp.id, nearbyText: txt.replace(/\s+/g, ' ').slice(0, 80) };
    });
    console.log('[probe] Income control:', JSON.stringify(income, null, 2));

    // Free-text hunt for "part" anywhere on the screen
    const partHits = await page.evaluate(() => {
      return [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /part[- ]?time/i.test(e.innerText || '')).map((e) => e.innerText.trim().slice(0, 60)).slice(0, 5);
    });
    console.log('[probe] "part time" text hits on quote screen:', JSON.stringify(partHits));
  } finally {
    console.log('[probe] signing out + closing...');
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close().catch(() => {});
    console.log('[probe] closed cleanly.');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
