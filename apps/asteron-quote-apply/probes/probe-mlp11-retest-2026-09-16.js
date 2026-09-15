// Probe MLP-11 (retest with the DOB-match fix): the earlier finding was that multi-life per-life
// "Proceed to application" didn't navigate. That predates the discovery that the Client Summary DOB
// must MATCH the quote ANB (which silently blocked single-life proceed too). Retest: build 2 lives,
// reach Client Summary, fill BOTH lives' names + ANB-matching DOBs, click Life 1 Proceed, see if it
// navigates. Run: node apps/asteron-quote-apply/probes/probe-mlp11-retest-2026-09-16.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const H = require('../helpers/quote-helpers');

const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', 'state-qa-a.json');

// Minimal 2-life builder inline (mirrors buildTwoLifeApplyReady; both lives DOB 1985-06-15).
async function buildTwoLives(page) {
  const quote = await H.openNewQuote(page);
  await H.completePersonalDetailsForApply(quote, { firstName: 'Alpha', lastName: 'One', income: 120000, dob: '1985-06-15' });
  await H.setOccupation(quote, 'Accountant').catch(() => {});
  await H.activateCover(quote, 'Life');
  await H.fillCalcMask(H.sumInsuredInput(quote, 0), '1000000');
  await H.waitForSettle(quote, 1500);
  await quote.evaluate(() => { const b = [...document.querySelectorAll('button,a')].find((x) => x.offsetParent !== null && /add life/i.test((x.innerText || '').trim())); if (b) b.click(); });
  await H.waitForSettle(quote, 2500);
  await H.completePersonalDetailsForApply(quote, { firstName: 'Beta', lastName: 'Two', income: 120000, dob: '1985-06-15' }).catch(() => {});
  await H.setOccupation(quote, 'Accountant').catch(() => {});
  await H.activateCover(quote, 'Life').catch(() => {});
  await H.fillCalcMask(H.sumInsuredInput(quote, 0), '1000000').catch(() => {});
  await H.waitForSettle(quote, 2500);
  // Re-set Life 1 occupation (both lives need occupation name for the Apply gate).
  await quote.evaluate(() => { const t = [...document.querySelectorAll('*')].find((e) => e.offsetParent !== null && (e.innerText || '').trim() === 'Life 1'); if (t) t.click(); });
  await H.waitForSettle(quote, 2000);
  await H.setOccupation(quote, 'Accountant').catch(() => {});
  return quote;
}

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const out = { steps: [] };
  const log = (m) => { console.log(typeof m === 'string' ? m : JSON.stringify(m, null, 2)); out.steps.push(typeof m === 'string' ? m : JSON.stringify(m)); };
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ storageState: statePath, ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    if (/login/i.test(page.url())) { log('STALE AUTH'); process.exit(2); }
    const quote = await buildTwoLives(page);
    await H.fillAdviserUse(quote, 'Upfront').catch(() => {});
    await H.clickApplyNow(quote);
    await H.waitForSettle(quote, 4000);
    const cs = await quote.evaluate(() => ({ onCS: /client summary|proceed to application/i.test(document.body.innerText || ''), proceedBtns: [...document.querySelectorAll('button,a')].filter((b) => b.offsetParent !== null && /proceed to application/i.test((b.innerText || '').trim())).length }));
    log(`On Client Summary: ${JSON.stringify(cs)}`);

    // Fill BOTH lives' names + ANB-matching DOBs. Read each per-life ANB, compute a matching DOB.
    const dobInfo = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      const firsts = [...document.querySelectorAll('input[id*="Input_FirstName"]')].filter(vis);
      const lasts = [...document.querySelectorAll('input[id*="Input_LastName"]')].filter(vis);
      const dobs = [...document.querySelectorAll('input[id*="Input_BirthDate"],input[type="date"][id*="BirthDate"]')].filter(vis);
      return { firsts: firsts.map((e) => e.id), lasts: lasts.map((e) => e.id), dobs: dobs.map((e) => ({ id: e.id, val: e.value })) };
    });
    log(`Client Summary inputs: ${JSON.stringify(dobInfo)}`);
    // Fill names + DOB (1985-06-15 to match the build) via real fill on each.
    for (let i = 0; i < dobInfo.firsts.length; i++) await quote.locator(`[id="${dobInfo.firsts[i]}"]`).fill(i === 0 ? 'Alpha' : 'Beta').catch(() => {});
    for (let i = 0; i < dobInfo.lasts.length; i++) await quote.locator(`[id="${dobInfo.lasts[i]}"]`).fill(i === 0 ? 'One' : 'Two').catch(() => {});
    for (const d of dobInfo.dobs) { await quote.locator(`[id="${d.id}"]`).fill('1985-06-15').catch(() => {}); }
    await quote.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
    await H.waitForSettle(quote, 2000);

    // Click Life 1's Proceed to application.
    const beforeUrl = quote.url();
    await quote.evaluate(() => { const b = [...document.querySelectorAll('button,a')].filter((x) => x.offsetParent !== null && /proceed to application/i.test((x.innerText || '').trim()))[0]; if (b) b.click(); });
    await quote.waitForTimeout(6000);
    const after = await quote.evaluate(() => ({
      url: location.pathname,
      onDoD: /duty of disclosure/i.test(document.body.innerText || ''),
      msgs: [...new Set([...document.querySelectorAll('[class*="feedback"],[class*="error"],[class*="message"],[class*="toast"],[class*="alert"],[class*="warning"],[role="alert"]')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter((t) => t && t.length < 120))].slice(0, 6),
    }));
    log(`AFTER Life 1 Proceed: ${beforeUrl} -> ${JSON.stringify(after)}`);

    fs.writeFileSync(path.join(__dirname, 'probe-mlp11-retest-result.json'), JSON.stringify(out, null, 2));
    log('Result written.');
  } catch (e) { log(`ERROR: ${e.message}`); try { fs.writeFileSync(path.join(__dirname, 'probe-mlp11-retest-result.json'), JSON.stringify(out, null, 2)); } catch (_) {} }
  finally { await page.waitForTimeout(1500); await browser.close(); }
})();
