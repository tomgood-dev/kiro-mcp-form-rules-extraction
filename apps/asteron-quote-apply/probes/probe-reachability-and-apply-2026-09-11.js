// Probe: confirm QA environment reachable + re-test Apply-flow navigation (which recent helper
// commits claim now works). Determines which "Apply does not navigate" defers are stale.
// Run: node apps/asteron-quote-apply/probes/probe-reachability-and-apply-2026-09-11.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const ACCT = process.env.PROBE_ACCT || 'a';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${ACCT}.json`);

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const out = { baseUrl: BASE_URL, acct: ACCT, steps: [] };
  const log = (m) => { console.log(m); out.steps.push(m); };

  if (!fs.existsSync(statePath)) { log(`NO auth state at ${statePath} — need fresh login`); process.exit(2); }

  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ storageState: statePath, ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  try {
    log(`Navigating to dashboard ${BASE_URL}/AdviserCentral_Uplift/ ...`);
    const resp = await page.goto(`${BASE_URL}/AdviserCentral_Uplift/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    log(`HTTP ${resp && resp.status()} — landed ${page.url()}`);
    await page.waitForTimeout(3000);
    const onLogin = /login/i.test(page.url());
    log(onLogin ? 'REDIRECTED TO LOGIN — auth state stale, needs refresh' : 'Session valid (not bounced to login)');
    // OutSystems SPA hydrates after load — wait for real content before reading.
    await page.waitForFunction(() => (document.body.innerText || '').length > 50, { timeout: 30000 }).catch(() => {});
    const bodyLen = await page.evaluate(() => (document.body.innerText || '').length);
    log(`Dashboard body length: ${bodyLen} chars`);

    if (!onLogin && bodyLen > 0) {
      // Re-test Apply-flow navigation with the new helpers (the key stale-defer question).
      const H = require('../helpers/quote-helpers');
      log('Driving reachApplicationFlow (Life $500k, Upfront commission)...');
      try {
        const quote = await H.reachApplicationFlow(page, { cover: 'Life', sumInsured: '500000' });
        const onClientSummary = await quote.evaluate(() => /client summary|proceed to application/i.test(document.body.innerText || ''));
        log(`APPLY FLOW: reached Client Summary = ${onClientSummary}`);
        const cs = await H.proceedThroughClientSummary(quote, {});
        log(`APPLY FLOW: reached Duty of Disclosure = ${cs.reachedDoD}`);
        out.applyFlowReachable = onClientSummary;
        out.dodReachable = cs.reachedDoD;
      } catch (e) {
        log(`APPLY FLOW probe error: ${e.message}`);
        out.applyFlowReachable = false;
      }
    }

    fs.writeFileSync(path.join(__dirname, 'probe-reachability-result.json'), JSON.stringify(out, null, 2));
    log(`Result written. Reachable=${!onLogin && resp && resp.status() < 400}`);
  } catch (e) {
    log(`ERROR: ${e.message}`);
  } finally {
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
