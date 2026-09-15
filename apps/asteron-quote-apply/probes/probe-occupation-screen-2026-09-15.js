// Probe: reach the Apply-flow OCCUPATION screen (inside Insurance & Financial Details) and dump its
// real structure + what Previous/Next navigate to, to reconcile against User Story- Occupation ACs
// (AC02 fields: offers dropdown / Employer / Country / Address; AC03 Previous->Insurance History;
// AC04 Next->Income). Run: node apps/asteron-quote-apply/probes/probe-occupation-screen-2026-09-15.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const H = require('../helpers/quote-helpers');

const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const ACCT = process.env.PROBE_ACCT || 'a';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${ACCT}.json`);

async function pageInfo(page) {
  return page.evaluate(() => {
    function vis(e) { return e && e.offsetParent !== null; }
    const section = (document.body.innerText.match(/(OCCUPATION|FINANCIAL|INSURANCE HISTORY|Unanswered Questions|Questionnaire Completed)/) || [''])[0];
    return {
      url: location.pathname,
      section,
      bodyStart: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 400),
      selects: [].slice.call(document.querySelectorAll('select')).filter(vis).map((s) => ({ id: s.id.slice(-30), opts: [].slice.call(s.options).map((o) => o.text).slice(0, 6) })),
      texts: [].slice.call(document.querySelectorAll('input[type="text"]')).filter(vis).map((i) => ({ id: i.id.slice(-30) })),
      radios: [].slice.call(document.querySelectorAll('input[type="radio"]')).filter(vis).map((r) => r.id.slice(-26) + '=' + r.value),
    };
  });
}

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const out = { steps: [] };
  const log = (m) => { console.log(m); out.steps.push(typeof m === 'string' ? m : JSON.stringify(m)); };
  if (!fs.existsSync(statePath)) { log(`NO auth state — refresh first`); process.exit(2); }

  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ storageState: statePath, ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    if (/login/i.test(page.url())) { log('STALE AUTH -> login'); process.exit(2); }

    log('Building quote to Client Summary...');
    const quote = await H.reachApplicationFlow(page, { cover: 'Life', sumInsured: '1000000', personal: { age: 40, dob: '1986-12-15' } });
    log('Proceed through Client Summary...');
    await H.proceedThroughClientSummary(quote, { firstName: 'Solo', lastName: 'One' });
    log('Duty of Disclosure...');
    await H.passDutyOfDisclosure(quote);
    log(`After DoD: ${JSON.stringify(await H.applyFlowScreen(quote))}`);
    log('Personal Details...');
    await H.fillPersonalDetailsScreen(quote, { dob: '1986-12-15' });
    // Verify what landed BEFORE Next.
    const pdState = await quote.evaluate(() => {
      function v(sel) { const e = document.querySelector(sel); return e ? (e.tagName === 'SELECT' ? (e.options[e.selectedIndex] || {}).text : e.value) : '(missing)'; }
      function vis(e) { return e && e.offsetParent !== null; }
      return {
        title: v('select[id*="b5-Dropdown_Title"]'), marital: v('select[id*="b5-Dropdown_MaritalStatus"]'),
        cm: v('input[id*="b5-Input_Cm"]'), kg: v('input[id*="b5-Input_Kg"]'),
        mobile: v('input[id*="b5-Input_MobileNumber"]'), email: v('input[id*="b5-Input_Email"]'),
        addr: v('input[id*="b5-b20-Input_AddressLookup"]'),
        btnGroupsActive: [].slice.call(document.querySelectorAll('.button-group-item')).filter((b) => vis(b) && /active|selected|checked/i.test(b.className)).map((b) => (b.innerText || '').trim()),
        errs: [...new Set([].slice.call(document.querySelectorAll('[class*="feedback"],[class*="error"]')).filter(vis).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter((t) => t && t.length < 80))],
      };
    });
    log(`PD STATE AFTER FILL: ${JSON.stringify(pdState)}`);
    // Button-group questions + their selected answer.
    const bgroups = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      const items = [].slice.call(document.querySelectorAll('.button-group-item')).filter(vis);
      const seen = []; const groups = [];
      items.forEach((it) => {
        // Climb until the ancestor's text is meaningfully longer than just "Yes No" (i.e. includes the question).
        let c = it; let q = '';
        for (let k = 0; k < 9 && c; k++) { c = c.parentElement; if (c) { const t = (c.innerText || '').replace(/\s+/g, ' ').trim(); if (t.length > 15 && /yes\s*no/i.test(t)) { q = t; break; } } }
        const container = c;
        if (container && seen.indexOf(container) < 0) { seen.push(container); const active = [].slice.call(container.querySelectorAll('.button-group-item')).find((b) => /active|selected|checked/i.test(b.className)); groups.push({ q: q.slice(0, 70), answer: active ? (active.innerText || '').trim() : '(none)' }); }
      });
      const postalBlock = !!document.querySelector('input[id*="b5-b21-Input_AddressLookup"]');
      const postalVisible = (() => { const e = document.querySelector('input[id*="b5-b21-Input_AddressLookup"]'); return e ? e.offsetParent !== null : false; })();
      return { groups, postalBlock, postalVisible };
    });
    log(`PD BUTTON-GROUPS: ${JSON.stringify(bgroups)}`);
    await H.applyFlowNext(quote, 6000);
    const stillPD = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      if (!/PersonalDetails/.test(location.pathname)) return { advanced: true, url: location.pathname };
      // list empty required + any red-flagged field
      const empties = [].slice.call(document.querySelectorAll('input,select')).filter((e) => vis(e) && (e.required || /is-invalid|has-error|not-valid-field/.test(e.className)) && (!e.value || e.value === '-1' || e.value === '.')).map((e) => e.id.slice(-26) + '=' + (e.value || ''));
      const flagged = [].slice.call(document.querySelectorAll('.not-valid-field,.is-invalid,[class*="has-error"]')).filter(vis).map((e) => (e.id || e.className).slice(0, 30));
      return { advanced: false, empties, flagged };
    });
    log(`AFTER NEXT: ${JSON.stringify(stillPD)}`);
    const afterPD = await H.applyFlowScreen(quote);
    log(`After Personal Details Next: ${JSON.stringify(afterPD)}`);

    // We land on INSURANCE HISTORY first. Answer it No, Next -> should reach OCCUPATION.
    let occReached = false;
    for (let i = 0; i < 4; i++) {
      const s = await H.applyFlowScreen(quote);
      log(`  loop screen: ${s.section} (${s.url})`);
      if (/OCCUPATION/.test(s.section)) { occReached = true; break; }
      await H.answerAllNoOnPage(quote);
      await quote.waitForTimeout(800);
      await H.applyFlowNext(quote, 5000);
    }
    log(`Reached OCCUPATION page: ${occReached}`);
    const occ = await pageInfo(quote);
    log('=== OCCUPATION SCREEN (as reached) ===');
    log(occ);

    // AC03: from OCCUPATION, Previous -> should go to Insurance History.
    await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const p=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^previous$/i.test((b.innerText||'').trim())); if(p)p.click(); });
    await quote.waitForTimeout(4000);
    const afterPrev = await pageInfo(quote);
    log('=== AFTER PREVIOUS (AC03 expects Insurance History) ===');
    log({ url: afterPrev.url, section: afterPrev.section, bodyStart: afterPrev.bodyStart.slice(0, 120) });

    // Return to OCCUPATION (Next from Insurance History; answer it No first if needed).
    await H.answerAllNoOnPage(quote);
    await quote.waitForTimeout(600);
    await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const n=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^next$/i.test((b.innerText||'').trim())); if(n)n.click(); });
    await quote.waitForTimeout(4000);
    const backOnOcc = await pageInfo(quote);
    log('=== BACK ON OCCUPATION (via Next) ===');
    log({ url: backOnOcc.url, section: backOnOcc.section });

    // AC04: from OCCUPATION, answer No then Next -> should go to Income/Financial.
    await H.answerAllNoOnPage(quote);
    await quote.waitForTimeout(800);
    await quote.evaluate(() => { function vis(e){return e&&e.offsetParent!==null;} const n=[].slice.call(document.querySelectorAll('button,a,span')).find((b)=>vis(b)&&/^next$/i.test((b.innerText||'').trim())); if(n)n.click(); });
    await quote.waitForTimeout(4000);
    const afterNext = await pageInfo(quote);
    log('=== AFTER OCCUPATION NEXT (AC04 expects Income) ===');
    log({ url: afterNext.url, section: afterNext.section, bodyStart: afterNext.bodyStart.slice(0, 120) });

    fs.writeFileSync(path.join(__dirname, 'probe-occupation-screen-result.json'), JSON.stringify(out, null, 2));
    log('Result written.');
  } catch (e) {
    log(`ERROR: ${e.message}`);
    try { fs.writeFileSync(path.join(__dirname, 'probe-occupation-screen-result.json'), JSON.stringify(out, null, 2)); } catch (_) {}
  } finally {
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
