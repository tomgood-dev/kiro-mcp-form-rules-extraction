// Probe: reach Personal Details in the Apply flow and enumerate EVERY required field + state, so
// fillPersonalDetailsScreen can be completed. Run: node apps/asteron-quote-apply/probes/probe-pd-required-2026-09-15.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const H = require('../helpers/quote-helpers');

const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', 'state-qa-a.json');

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
    const quote = await H.reachApplicationFlow(page, { cover: 'Life', sumInsured: '1000000', personal: { age: 40, dob: '1986-12-15' } });
    await H.proceedThroughClientSummary(quote, { firstName: 'Solo', lastName: 'One' });
    await H.passDutyOfDisclosure(quote);
    log(`After DoD: ${JSON.stringify(await H.applyFlowScreen(quote))}`);
    // Now on Personal Details. Dump everything.
    const dump = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      function labelFor(el) { var p = el; for (var k = 0; k < 5 && p; k++) { p = p.parentElement; if (p && p.innerText && p.innerText.length > 3 && p.innerText.length < 60) return p.innerText.replace(/\s+/g, ' ').trim(); } return ''; }
      const req = [];
      [].slice.call(document.querySelectorAll('input,select,textarea')).filter(vis).forEach((e) => {
        const isReq = e.required || e.getAttribute('aria-required') === 'true' || /\*/.test(labelFor(e));
        req.push({ id: e.id, tag: e.tagName, type: e.type || '', val: (e.tagName === 'SELECT' ? (e.options[e.selectedIndex] || {}).text : e.value), req: isReq, label: labelFor(e).slice(0, 30) });
      });
      const btnGroups = [].slice.call(document.querySelectorAll('.button-group-item')).filter(vis).map((b) => (b.innerText || '').trim());
      const errs = [...new Set([].slice.call(document.querySelectorAll('[class*="feedback"],[class*="error"],[class*="required"]')).filter(vis).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter((t) => t && t.length < 80))];
      return { url: location.pathname, fields: req.filter((f) => f.type !== 'hidden'), btnGroups, errs };
    });
    log('=== PERSONAL DETAILS FIELD DUMP ===');
    log(dump);
    fs.writeFileSync(path.join(__dirname, 'probe-pd-required-result.json'), JSON.stringify({ dump }, null, 2));
  } catch (e) { log(`ERROR: ${e.message}`); }
  finally { await page.waitForTimeout(1500); await browser.close(); }
})();
