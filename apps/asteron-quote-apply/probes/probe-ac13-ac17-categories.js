// Probe for AC13 (Adviser Use screen defaults with an invalid default+FR combo) and AC17
// (per-benefit commission category selection when a FR supports multiple categories).
//
// AC13: Spread 20 default + FR 2.5% (Spread 20 invalid) → open Adviser Use → Select IC/RC
//   enabled = "Please Select" + only valid IC/RC options; ALL commission category pick lists
//   (per-cover + Select All) DISABLED until an IC/RC is picked; after picking IC/RC, category
//   pick lists ENABLE showing only the category tied to that IC/RC.
// AC17: A FR supporting multiple categories (e.g. 15%) → the per-benefit category pick list
//   lets the user choose any valid category for that FR.
//
// Run: node apps/asteron-quote-apply/probes/probe-ac13-ac17-categories.js
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

// Dump ALL selects inside the Adviser Use modal with a nearest-label + disabled state.
async function dumpCommissionSelects(page, tag) {
  const info = await page.evaluate(() => {
    function nearestLabelText(el) {
      var node = el;
      for (var depth = 0; depth < 5 && node; depth++) {
        var sib = node.previousElementSibling;
        while (sib) { var t = (sib.innerText || '').trim(); if (t) return t.split('\n')[0].slice(0, 50); sib = sib.previousElementSibling; }
        node = node.parentElement;
      }
      return null;
    }
    return [...document.querySelectorAll('select')].map(function (s) {
      return {
        id: s.id,
        label: nearestLabelText(s),
        disabled: s.disabled,
        selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : null,
        options: [...s.options].map(function (o) { return o.text; }),
      };
    });
  });
  console.log('\n=== ' + tag + ' ===');
  info.forEach(function (s, i) {
    console.log('[' + i + '] label="' + s.label + '" disabled=' + s.disabled + ' selected="' + s.selected + '" opts=' + JSON.stringify(s.options));
  });
  return info;
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
    // age/gender/occ + Life $500k
    const age = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await age.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete'); await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) b.click(); }); await page.waitForTimeout(1500);
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Life'); if (b) b.click(); }); await page.waitForTimeout(2500);
    const si = page.locator('input[id*="SumInsured"]').first();
    await si.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); await page.keyboard.type('500000', { delay: 20 }); await page.keyboard.press('Tab'); await page.waitForTimeout(2500);

    // ---- AC13: FR 2.5% (Spread 20 invalid), open Adviser Use, set Default = Spread 20 ----
    await page.locator('select[id*="FlexiRate"]').first().selectOption({ label: '2.5%' }).catch((e) => console.log('[probe] FR err', e.message)); await page.waitForTimeout(2500);
    await page.evaluate(() => { const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use')); if (el) el.click(); }); await page.waitForTimeout(2500);
    // set Default for Agency = Spread 20 via NATIVE selectOption (matches the test's setDefaultAgency,
    // triggers the full OutSystems reactive recalc — unlike raw dispatchEvent)
    const defId = await page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const m = sels.find((s) => { const o = [...s.options].map((x) => x.text); return o.length === 3 && o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20'); });
      return m ? m.id : null;
    });
    if (defId) await page.locator('#' + defId).selectOption({ label: 'Spread 20' });
    await page.waitForTimeout(3000);
    await dumpCommissionSelects(page, 'AC13 — Spread20 default (NATIVE selectOption) + FR 2.5%, BEFORE picking IC/RC');

    // pick an IC/RC option (the first real one after "Please Select") and re-dump
    const picked = await page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const icrc = sels.find((s) => { const o = [...s.options].map((x) => x.text); return o.length >= 2 && o[0] === 'Please Select' && o.slice(1).every((t) => /^IC-\d+%, RC-\d+%$/.test(t)); });
      if (!icrc || icrc.options.length < 2) return null;
      icrc.selectedIndex = 1; icrc.dispatchEvent(new Event('change', { bubbles: true }));
      return icrc.options[1].text;
    });
    console.log('\n[probe] picked IC/RC =', picked);
    await page.waitForTimeout(2500);
    await dumpCommissionSelects(page, 'AC13 — AFTER picking IC/RC ' + picked);

    // close, ---- AC17: FR 15% (multi-category), reopen Adviser Use, inspect per-cover categories ----
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Close'); if (b) b.click(); }); await page.waitForTimeout(1500);
    await page.locator('select[id*="FlexiRate"]').first().selectOption({ label: '15.0%' }).catch((e) => console.log('[probe] FR15 err', e.message)); await page.waitForTimeout(2500);
    await page.evaluate(() => { const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use')); if (el) el.click(); }); await page.waitForTimeout(2500);
    const picked15 = await page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const icrc = sels.find((s) => { const o = [...s.options].map((x) => x.text); return o.length >= 2 && o[0] === 'Please Select' && o.slice(1).every((t) => /^IC-\d+%, RC-\d+%$/.test(t)); });
      if (icrc) { const mid = [...icrc.options].find((o) => /IC-50%, RC-50%/.test(o.text)); if (mid) { icrc.value = mid.value; icrc.dispatchEvent(new Event('change', { bubbles: true })); return mid.text; } }
      return null;
    });
    console.log('\n[probe] AC17 picked IC/RC (15%) =', picked15);
    await page.waitForTimeout(2500);
    await dumpCommissionSelects(page, 'AC17 — FR 15% after picking ' + picked15 + ' (expect multiple categories selectable per cover)');
  } finally {
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000); await browser.close().catch(() => {});
    console.log('[probe] closed');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
