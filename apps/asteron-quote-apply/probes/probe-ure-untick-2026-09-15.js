// Probe AC02/AC04 (Navigation Behaviour): after completing the URE questionnaire, navigate back into
// the Personal Statement, flip a health question No->Yes (which should spawn follow-up questions),
// then re-read the progress-sidebar tick state to confirm the section un-ticks (AC02) and later
// sections un-tick (AC04). Run: node apps/asteron-quote-apply/probes/probe-ure-untick-2026-09-15.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const H = require('../helpers/quote-helpers');

const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const statePath = path.join(__dirname, '..', '.auth', 'state-qa-a.json');

async function sidebar(page) {
  return H.getApplyFlowSidebar(page);
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
    const quote = await H.reachApplicationFlow(page, { cover: 'Life', sumInsured: '1000000', personal: { age: 40, dob: '1986-12-15' } });
    await H.proceedThroughClientSummary(quote, { firstName: 'Solo', lastName: 'One' });
    await H.passDutyOfDisclosure(quote);
    await H.fillPersonalDetailsScreen(quote, { dob: '1986-12-15' });
    await H.applyFlowNext(quote, 6000);
    await H.passInsuranceAndFinancial(quote, 120000);
    await H.passTeleInterview(quote);
    await H.passPersonalStatement(quote, { drinks: '5' });
    log(`After questionnaire: ${JSON.stringify(await H.applyFlowScreen(quote))}`);
    log('Sidebar (baseline, all complete):');
    log(await sidebar(quote));

    // Navigate BACK to the Personal Statement via Previous (repeat until we land on it).
    for (let i = 0; i < 4; i++) {
      const s = await H.applyFlowScreen(quote);
      if (/PersonalStatement/.test(s.url)) break;
      await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const p=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^previous$/i.test((b.innerText||'').trim())); if(p)p.click(); });
      await quote.waitForTimeout(4000);
    }
    log(`Back on: ${JSON.stringify(await H.applyFlowScreen(quote))}`);
    log('Sidebar after navigating back to Personal Statement:');
    const backSidebar = await sidebar(quote);
    log(backSidebar);

    // Walk Previous within the Personal Statement to reach a HEALTH page (Mental/Physical Health),
    // where flipping a Yes genuinely spawns follow-up questions.
    let onHealth = false;
    for (let i = 0; i < 8; i++) {
      const s = await H.applyFlowScreen(quote);
      log(`  walk-back page: ${s.section}`);
      if (/MENTAL HEALTH|PHYSICAL HEALTH/.test(s.section)) { onHealth = true; break; }
      if (!/PersonalStatement/.test(s.url)) break;
      await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const p=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^previous$/i.test((b.innerText||'').trim())); if(p)p.click(); });
      await quote.waitForTimeout(3500);
    }
    log(`Reached a health page: ${onHealth} — ${JSON.stringify(await H.applyFlowScreen(quote))}`);

    // Flip the FIRST health Yes/No to Yes (should reveal a "select the condition(s)" follow-up).
    const flip = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      const y = [].slice.call(document.querySelectorAll('input[type="radio"][id*="RadioButton1-input"]')).filter(vis)[0];
      if (y) { y.click(); y.checked = true; y.dispatchEvent(new Event('change', { bubbles: true })); return { flipped: true, id: y.id.slice(-30) }; }
      return { flipped: false };
    });
    log(`Flipped a health answer to Yes: ${JSON.stringify(flip)}`);
    await quote.waitForTimeout(3000);
    // Did follow-up questions / a "select conditions" checklist appear?
    const spawned = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      return { checkboxes: [].slice.call(document.querySelectorAll('input[type="checkbox"]')).filter(vis).length, bodyHasSelect: /please select the condition|select all that apply/i.test(document.body.innerText || '') };
    });
    log(`Follow-up spawned signal: ${JSON.stringify(spawned)}`);
    log('Sidebar immediately AFTER flip (AC02 — tick should disappear):');
    const afterFlip = await sidebar(quote);
    log(afterFlip.filter((s) => /Personal Statement|Summary/i.test(s.label)));
    // AC04: click Next after the change, then re-check.
    await H.applyFlowNext(quote, 5000);
    log('Sidebar after Next (AC04):');
    const afterNext = await sidebar(quote);
    log(afterNext.filter((s) => /Personal Statement|Summary/i.test(s.label)));

    fs.writeFileSync(path.join(__dirname, 'probe-ure-untick-result.json'), JSON.stringify(out, null, 2));
    log('Result written.');
  } catch (e) { log(`ERROR: ${e.message}`); try { fs.writeFileSync(path.join(__dirname, 'probe-ure-untick-result.json'), JSON.stringify(out, null, 2)); } catch (_) {} }
  finally { await page.waitForTimeout(1500); await browser.close(); }
})();
