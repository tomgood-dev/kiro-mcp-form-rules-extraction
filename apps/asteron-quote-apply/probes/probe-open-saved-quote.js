// Focused probe: crack how the dashboard "Quotes and Applications" list opens a row, and open
// an existing QUOTE to confirm AC20/AC23/AC25 are reachable (open saved quote → see its
// commission category / IC-RC).
// Run: node apps/asteron-quote-apply/probes/probe-open-saved-quote.js
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
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(8000);

    // Is the list inside an iframe? dump all frames and whether any contains a dd/mm/yyyy date.
    const frames = page.frames();
    console.log('[probe] frame count:', frames.length);
    for (const f of frames) {
      const hasDate = await f.evaluate(() => /\d{2}\/\d{2}\/\d{4}/.test(document.body ? document.body.innerText : '')).catch(() => false);
      console.log('[probe] frame url=' + f.url().slice(0, 80) + ' hasDatedRows=' + hasDate);
    }
    // Also: how many rows does the MAIN doc report, and a sample of the list container tag around a client name?
    const containerInfo = await page.evaluate(() => {
      const nameEl = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /ARGIRIOS|ASHOK|ANNWYN|Test /i.test((e.innerText || '')));
      if (!nameEl) return { found: false };
      let up = nameEl;
      const chain = [];
      for (let i = 0; i < 8 && up; i++) { chain.push(up.tagName + '.' + (up.className || '').toString().split(' ')[0]); up = up.parentElement; }
      return { found: true, text: (nameEl.innerText || '').slice(0, 30), chain };
    });
    console.log('[probe] client-name element chain:', JSON.stringify(containerInfo));
    // Find the REAL data row by a known client-name text (not the status-filter <select>).
    const rowDom = await page.evaluate(() => {
      // a data row contains a date like dd/mm/yyyy
      const dateEls = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /\d{2}\/\d{2}\/\d{4}/.test((e.innerText || '').trim()));
      if (!dateEls.length) return { found: false };
      let row = dateEls[0];
      for (let i = 0; i < 8 && row.parentElement; i++) { row = row.parentElement; const cells = row.querySelectorAll('*'); if ((row.innerText || '').match(/\d{2}\/\d{2}\/\d{4}/) && cells.length >= 5 && (row.innerText || '').length > 25) break; }
      const clickables = [...row.querySelectorAll('a,[onclick],[role="button"],button,span[class*="link"],div[class*="clickable"]')].map((c) => ({ tag: c.tagName, cls: (c.className || '').toString().slice(0, 45), text: (c.innerText || '').trim().slice(0, 25), href: c.href || null }));
      return { found: true, rowTag: row.tagName, rowCls: (row.className || '').toString().slice(0, 60), rowText: (row.innerText || '').replace(/\s+/g, ' ').slice(0, 90), rowHasOnclick: !!row.getAttribute('onclick'), clickables };
    });
    console.log('[probe] REAL data row DOM:', JSON.stringify(rowDom, null, 1));

    // Try clicking that real data row
    const before2 = page.url();
    const clickRes = await page.evaluate(() => {
      const dateEls = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /\d{2}\/\d{2}\/\d{4}/.test((e.innerText || '').trim()));
      if (!dateEls.length) return { ok: false, reason: 'no dated data row' };
      let row = dateEls[0];
      for (let i = 0; i < 8 && row.parentElement; i++) { row = row.parentElement; if ((row.innerText || '').length > 25 && row.querySelectorAll('*').length >= 5) break; }
      const clk = row.querySelector('a,[onclick],[role="button"]') || row;
      clk.click();
      return { ok: true, text: (row.innerText || '').replace(/\s+/g, ' ').slice(0, 60) };
    });
    console.log('[probe] clicked REAL data row:', JSON.stringify(clickRes));
    await page.waitForTimeout(7000);
    console.log('[probe] URL after real-row click:', page.url());
    const qid2 = await page.evaluate(() => { const m = location.href.match(/QuoteId=([^&]*)/); return m ? decodeURIComponent(m[1]) : null; });
    console.log('[probe] opened QuoteId:', JSON.stringify(qid2), '(non-empty = a saved quote opened)');
    const onQuote2 = await page.evaluate(() => document.body.innerText.includes('Illustration') || !!document.querySelector('input[id*="Input_AgeNextBirthday"]'));
    console.log('[probe] appears to be on a quote/illustration screen:', onQuote2);
  } finally {
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000); await browser.close().catch(() => {});
    console.log('[probe] closed');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
