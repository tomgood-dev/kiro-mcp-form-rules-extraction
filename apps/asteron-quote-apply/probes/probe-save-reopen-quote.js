// Probe for AC18/AC20-25 reachability: can we SAVE a quote (with a chosen IC/RC + per-cover
// commission category) and REOPEN it from the browser, seeing the same values?
//
// Determines which of these are browser-testable vs genuinely blocked:
//   AC18 (save selected IC/RC → reopen shows same), AC22 (new quote gets agency default),
//   AC23/AC25 (open existing quote, values shown / can update), AC20/AC21/AC24 (pre-existing).
//
// Run: node apps/asteron-quote-apply/probes/probe-save-reopen-quote.js
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

// list all buttons/links visible on the current screen (name only)
async function dumpActions(page, tag) {
  const acts = await page.evaluate(() => [...document.querySelectorAll('button, a')]
    .map((e) => (e.innerText || e.getAttribute('aria-label') || '').trim().split('\n')[0])
    .filter((t) => t && t.length < 40));
  const uniq = [...new Set(acts)];
  console.log('\n=== ACTIONS: ' + tag + ' ===\n' + JSON.stringify(uniq));
  return uniq;
}

(async () => {
  preflightCleanup(); await new Promise((r) => setTimeout(r, 3000));
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 30 });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  page.setDefaultTimeout(30000);
  try {
    await login(page);
    // ---- dashboard: is there a "My Quotes" / saved-quotes list? (AC20/23/25 entry point) ----
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
    await dumpActions(page, 'QuoteAndApply landing (look for My Quotes / saved list)');

    // open a new quote
    const qUrl = await page.evaluate(() => new Promise((res) => { window.open = (u) => res(u); const l = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote'); if (l) l.click(); setTimeout(() => res(null), 3000); }));
    if (qUrl) await page.goto(qUrl, { waitUntil: 'domcontentloaded' }); else await page.goto(BASE + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[id*="Input_AgeNextBirthday"]').first().waitFor({ state: 'visible', timeout: 40000 });
    const startUrl = page.url();
    console.log('[probe] new quote URL:', startUrl);

    // build: age/gender/occ + Life $500k + Flexi 15%
    const age = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await age.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete'); await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) b.click(); }); await page.waitForTimeout(1500);
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().split('\n')[0] === 'Life'); if (b) b.click(); }); await page.waitForTimeout(2500);
    const si = page.locator('input[id*="SumInsured"]').first();
    await si.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); await page.keyboard.type('500000', { delay: 20 }); await page.keyboard.press('Tab'); await page.waitForTimeout(2500);
    await page.locator('select[id*="FlexiRate"]').first().selectOption({ label: '15.0%' }).catch((e) => console.log('[probe] FR err', e.message)); await page.waitForTimeout(2500);

    // ---- AC22: does a NEW quote show the agency default (Upfront) applied? open Adviser Use, read category ----
    await page.evaluate(() => { const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use')); if (el) el.click(); }); await page.waitForTimeout(2500);
    // pick IC-50%, RC-50% then a category so we have something to persist (AC18)
    const picked = await page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const icrc = sels.find((s) => { const o = [...s.options].map((x) => x.text); return o.length >= 2 && o[0] === 'Please Select' && o.slice(1).every((t) => /^IC-\d+%, RC-\d+%$/.test(t)); });
      if (!icrc) return null;
      const mid = [...icrc.options].find((o) => /IC-50%, RC-50%/.test(o.text));
      if (mid) { icrc.value = mid.value; icrc.dispatchEvent(new Event('change', { bubbles: true })); return mid.text; }
      return null;
    });
    console.log('[probe] AC18 picked IC/RC =', picked);
    await page.waitForTimeout(2000);
    // set per-cover category = Spread 20 (native)
    const catSet = await page.evaluate(() => {
      function nl(el){var n=el;for(var d=0;d<5&&n;d++){var s=n.previousElementSibling;while(s){var t=(s.innerText||'').trim();if(t)return t.split('\n')[0].slice(0,50);s=s.previousElementSibling;}n=n.parentElement;}return null;}
      var life=[...document.querySelectorAll('select')].find(function(s){return (nl(s)||'').includes('Life Cover');});
      if(!life)return null; var sp=[...life.options].find(function(o){return o.text==='Spread 20';}); if(!sp)return null;
      return life.id;
    });
    if (catSet) { await page.locator('#' + catSet).selectOption({ label: 'Spread 20' }); await page.waitForTimeout(1500); }
    console.log('[probe] set Life Cover category = Spread 20 (id=' + catSet + ')');
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Close'); if (b) b.click(); }); await page.waitForTimeout(1500);

    // ---- Is there a SAVE action on the quote screen? ----
    const quoteActions = await dumpActions(page, 'Quote screen (look for Save / Save Quote / Save Draft)');
    const hasSave = quoteActions.includes('Save');
    console.log('[probe] "Save" action present on quote screen:', hasSave);

    if (hasSave) {
      console.log('[probe] clicking "Save" (exact)');
      await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => (x.innerText || '').trim().split('\n')[0] === 'Save'); if (b) b.click(); }); await page.waitForTimeout(3000);
      // Dump the FULL save dialog field set so we know every required field.
      const saveForm = await page.evaluate(() => {
        function visible(e){return e.offsetParent!==null;}
        function nl(el){var n=el;for(var d=0;d<4&&n;d++){var s=n.previousElementSibling;while(s){var t=(s.innerText||'').trim();if(t)return t.split('\n')[0].slice(0,40);s=s.previousElementSibling;}n=n.parentElement;}return null;}
        const inputs = [...document.querySelectorAll('input')].filter(visible).map((i) => ({ id: i.id, type: i.type, label: nl(i), val: i.value }));
        const selects = [...document.querySelectorAll('select')].filter(visible).map((s) => ({ id: s.id, label: nl(s), opts: [...s.options].map((o) => o.text).slice(0, 6) }));
        const groups = [...document.querySelectorAll('.button-group-item')].filter(visible).map((b) => b.innerText.trim());
        return { inputs, selects, groups };
      });
      console.log('[probe] SAVE DIALOG inputs:', JSON.stringify(saveForm.inputs));
      console.log('[probe] SAVE DIALOG selects:', JSON.stringify(saveForm.selects));
      console.log('[probe] SAVE DIALOG button-groups (gender etc):', JSON.stringify(saveForm.groups));
    }

    // ---- explore the dashboard list + open a row ----
    await page.goto(BASE + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(6000);
    // click the first data row's client-name cell to see if it opens the quote
    const beforeClickUrl = page.url();
    const clicked = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('table tr')].filter((r) => r.querySelectorAll('td').length >= 3);
      if (!rows.length) return { ok: false, reason: 'no data rows' };
      const cell = rows[0].querySelectorAll('td')[2] || rows[0].querySelectorAll('td')[1]; // client name cell
      const clickable = cell.querySelector('a, [onclick], span, div') || cell;
      clickable.click();
      return { ok: true, rowText: (rows[0].innerText || '').replace(/\s+/g, ' ').slice(0, 60) };
    });
    console.log('\n[probe] clicked first row:', JSON.stringify(clicked));
    await page.waitForTimeout(6000);
    console.log('[probe] URL after row click:', page.url());
    const openedQid = await page.evaluate(() => { const m = location.href.match(/QuoteId=([^&]*)/); return m ? decodeURIComponent(m[1]) : null; });
    console.log('[probe] opened QuoteId (non-empty means a saved quote opened):', JSON.stringify(openedQid));
    const openedBody = await page.evaluate(() => document.body.innerText.slice(0, 150));
    console.log('[probe] opened page body (snippet):', JSON.stringify(openedBody));
  } finally {
    await page.locator('button:has-text("Sign out")').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000); await browser.close().catch(() => {});
    console.log('[probe] closed');
  }
})().catch((e) => { console.error('[probe] error:', e.message); process.exit(1); });
