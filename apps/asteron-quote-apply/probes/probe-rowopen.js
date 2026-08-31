// Crack the dashboard "Quotes and Applications" row-open. Reliably populate the async list, dump
// a real data row's DOM (so we can find the clickable element), click it, confirm a quote opens.
// Run: node apps/asteron-quote-apply/probes/probe-rowopen.js
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

// Wait until a <tr> containing a dd/mm/yyyy date exists, clicking "Refresh content" / bumping page size between tries.
async function waitForList(page) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {});
    try {
      await page.waitForFunction(() => {
        return [...document.querySelectorAll('tr')].some((tr) => /\d{2}\/\d{2}\/\d{4}/.test(tr.innerText || ''));
      }, { timeout: 8000 });
      console.log('[probe] list <tr> populated on attempt', attempt);
      return true;
    } catch (e) {
      console.log('[probe] no dated <tr> yet (attempt ' + attempt + '), refreshing...');
      await page.evaluate(() => { const b = [...document.querySelectorAll('button,a')].find((x) => /refresh content/i.test((x.innerText || '').trim())); if (b) b.click(); });
      await page.waitForTimeout(6000);
    }
  }
  return false;
}

(async () => {
  preflightCleanup(); await new Promise((r) => setTimeout(r, 3000));
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 30 });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  page.setDefaultTimeout(30000);
  try {
    await login(page);
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    // PATIENT single wait first: is the list merely slow (loads in 15-40s) or does it never load?
    console.log('[probe] patient wait up to 40s for a dated <tr> with no interaction...');
    const patient = await page.waitForFunction(() => [...document.querySelectorAll('tr')].some((tr) => /\d{2}\/\d{2}\/\d{4}/.test(tr.innerText || '')), { timeout: 40000 }).then(() => true).catch(() => false);
    console.log('[probe] dated <tr> appeared within 40s (no interaction):', patient);
    await page.waitForTimeout(3000);
    // The list often renders empty until a filter is chosen. Dump filter selects, then pick an
    // Adviser (first real option) to trigger the data load.
    const filters = await page.evaluate(() => [...document.querySelectorAll('select')].map((s) => ({ id: (s.id || '').slice(0, 40), label: (s.previousElementSibling && s.previousElementSibling.innerText || '').trim().slice(0, 20), opts: [...s.options].map((o) => o.text).slice(0, 8) })));
    console.log('[probe] dashboard filter selects:', JSON.stringify(filters));
    // pick the first select that looks like an Adviser picker and choose its first non-empty option
    await page.evaluate(() => {
      const advSel = [...document.querySelectorAll('select')].find((s) => /adviser/i.test((s.previousElementSibling && s.previousElementSibling.innerText) || '') || [...s.options].some((o) => /\d{3,}/.test(o.text)));
      if (advSel) { const opt = [...advSel.options].find((o) => o.text.trim() && !/select/i.test(o.text)); if (opt) { advSel.value = opt.value; advSel.dispatchEvent(new Event('change', { bubbles: true })); } }
    });
    await page.waitForTimeout(4000);
    // Explicitly set Status = Quote and page size = 100 via NATIVE selectOption (real user action).
    const statusSel = page.locator('select').first();
    await statusSel.selectOption({ label: 'Quote' }).catch((e) => console.log('[probe] status select err', e.message));
    await page.waitForTimeout(4000);
    const sizeSel = page.locator('select').nth(1);
    await sizeSel.selectOption({ label: '100' }).catch(() => {});
    await page.waitForTimeout(4000);
    const populated = await waitForList(page);
    console.log('[probe] list populated:', populated);

    // Dump the date cell's ANCESTOR CHAIN (tag/class/childCount/text) to find the true row container.
    const chain = await page.evaluate(() => {
      const dateLeaf = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /\d{2}\/\d{2}\/\d{4}/.test((e.innerText || '').trim()));
      if (!dateLeaf) return { found: false };
      const out = [];
      let el = dateLeaf;
      for (let i = 0; i < 9 && el; i++) {
        out.push({
          lvl: i, tag: el.tagName, id: (el.id || '').slice(0, 45), cls: (el.className || '').toString().slice(0, 55),
          role: el.getAttribute('role'), onclick: !!el.getAttribute('onclick'), cursor: getComputedStyle(el).cursor,
          childCount: el.children.length, textLen: (el.innerText || '').length,
          text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 70),
        });
        el = el.parentElement;
      }
      return { found: true, chain: out };
    });
    console.log('[probe] DATE-CELL ANCESTOR CHAIN:', JSON.stringify(chain, null, 1));

    // The list is a real <table>. Dump the first data <tr>: its cells and every anchor/icon detail.
    const trDump = await page.evaluate(() => {
      const tr = [...document.querySelectorAll('tr')].find((r) => /\d{2}\/\d{2}\/\d{4}/.test(r.innerText || ''));
      if (!tr) return { found: false };
      const cells = [...tr.querySelectorAll('td')].map((td) => (td.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30));
      const anchors = [...tr.querySelectorAll('a')].map((a) => ({ text: (a.innerText || '').trim().slice(0, 25), title: a.getAttribute('title'), aria: a.getAttribute('aria-label'), cls: (a.className || '').toString().slice(0, 40), href: (a.getAttribute('href') || '').slice(0, 50) }));
      const icons = [...tr.querySelectorAll('i,[class*="icon"]')].map((ic) => ({ cls: (ic.className || '').toString().slice(0, 45), title: ic.getAttribute('title'), aria: ic.getAttribute('aria-label') })).slice(0, 8);
      const trOnclick = !!tr.getAttribute('onclick');
      const trCursor = getComputedStyle(tr).cursor;
      return { found: true, cells, anchors, icons, trOnclick, trCursor };
    });
    console.log('[probe] FIRST <tr> DETAIL:', JSON.stringify(trDump, null, 1));

    // Try clicking the best candidate (prefer role=button / pointer-cursor element; else the row).
    const before = page.url();
    const clickRes = await page.evaluate(() => {
      const tr = [...document.querySelectorAll('tr')].find((r) => /\d{2}\/\d{2}\/\d{4}/.test(r.innerText || ''));
      if (!tr) return { ok: false, reason: 'no dated tr' };
      // prefer the first anchor with visible text (client name / reference), else any anchor, else the row
      const anchors = [...tr.querySelectorAll('a')];
      const named = anchors.find((a) => (a.innerText || '').trim().length > 1) || anchors[0];
      const target = named || tr;
      target.click();
      return { ok: true, clickedTag: target.tagName, clickedText: (target.innerText || '').trim().slice(0, 30), clickedCls: (target.className || '').toString().slice(0, 40) };
    });
    console.log('[probe] clicked:', JSON.stringify(clickRes));
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('[probe] URL after click:', page.url());
    const onQuote = await page.evaluate(() => !!document.querySelector('input[id*="Input_AgeNextBirthday"]') || document.body.innerText.includes('Illustration'));
    console.log('[probe] on a quote/illustration screen after click:', onQuote);
    const bodySnip = await page.evaluate(() => document.body.innerText.slice(0, 150));
    console.log('[probe] body after click:', JSON.stringify(bodySnip));
  } finally {
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000); await browser.close().catch(() => {});
    console.log('[probe] closed');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
