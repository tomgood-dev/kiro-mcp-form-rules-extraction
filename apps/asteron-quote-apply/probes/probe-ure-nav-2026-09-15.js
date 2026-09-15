// Probe: inspect the URE/questionnaire navigation panel (Navigation Behaviour ACs) — find how the
// "completion tick" renders per page and whether clicking a nav-panel page navigates. Reaches the
// Personal Statement (the URE questionnaire) and dumps the nav panel structure.
// Run: node apps/asteron-quote-apply/probes/probe-ure-nav-2026-09-15.js
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
    await H.fillPersonalDetailsScreen(quote, { dob: '1986-12-15' });
    await H.applyFlowNext(quote, 6000);
    await H.passInsuranceAndFinancial(quote, 120000);
    await H.passTeleInterview(quote);
    log(`Reached: ${JSON.stringify(await H.applyFlowScreen(quote))}`);

    // Dump the progress sidebar + questionnaire pager markup to locate tick indicators.
    const panels = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      // 1) The left progress sidebar: find the element containing "1. Quote".
      let sidebar = null;
      [].slice.call(document.querySelectorAll('*')).forEach((e) => { if (!sidebar && vis(e) && /1\.\s*Quote/.test(e.innerText || '') && e.children.length && (e.innerText || '').length < 400) sidebar = e; });
      // 2) The questionnaire pager: elements showing "1 2 3 4 5 6 7".
      let pager = null;
      [].slice.call(document.querySelectorAll('*')).forEach((e) => { if (!pager && vis(e) && /Previous\s*1\s*2\s*3/.test((e.innerText || '').replace(/\s+/g, ' ')) && (e.innerText || '').length < 200) pager = e; });
      // Look for any tick/check/complete iconography anywhere.
      const tickEls = [].slice.call(document.querySelectorAll('[class*="check"],[class*="tick"],[class*="complete"],[class*="Complete"],.fa-check,i[class*="icon"],svg')).filter(vis).slice(0, 12).map((e) => ({ tag: e.tagName, cls: (e.className.baseVal || e.className || '').toString().slice(0, 40), near: (e.closest('li,div,span') ? (e.closest('li,div,span').innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30) : '') }));
      return {
        sidebarHtml: sidebar ? sidebar.outerHTML.replace(/\s+/g, ' ').slice(0, 1200) : '(no sidebar)',
        pagerHtml: pager ? pager.outerHTML.replace(/\s+/g, ' ').slice(0, 600) : '(no pager)',
        tickEls,
      };
    });
    log('=== SIDEBAR HTML ==='); log(panels.sidebarHtml);
    log('=== PAGER HTML ==='); log(panels.pagerHtml);
    log('=== TICK-LIKE ELEMENTS ==='); log(panels.tickEls);

    // Inspect the "Personal Details" sidebar step: is it an anchor / clickable? Then try clicking it.
    const stepInfo = await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      const el = [].slice.call(document.querySelectorAll('a,span,div,li')).find((e) => vis(e) && e.childElementCount <= 3 && /^\d+\.\s*Personal Details/i.test((e.textContent || '').replace(/\s+/g, ' ').trim()));
      if (!el) return { found: false };
      const a = el.closest('a');
      return { found: true, tag: el.tagName, cls: (el.className || '').slice(0, 50), hasAnchor: !!a, anchorHref: a ? a.getAttribute('href') : null, clickableCursor: getComputedStyle(el).cursor, parentTag: el.parentElement ? el.parentElement.tagName : null, parentCls: el.parentElement ? (el.parentElement.className || '').slice(0, 40) : null };
    });
    log('=== "Personal Details" STEP ELEMENT ==='); log(stepInfo);
    // Try clicking it and see if URL changes.
    const beforeUrl = quote.url();
    await quote.evaluate(() => {
      function vis(e) { return e && e.offsetParent !== null; }
      const el = [].slice.call(document.querySelectorAll('a,span,div,li')).find((e) => vis(e) && e.childElementCount <= 3 && /^\d+\.\s*Personal Details/i.test((e.textContent || '').replace(/\s+/g, ' ').trim()));
      if (el) (el.closest('a') || el).click();
    });
    await quote.waitForTimeout(4000);
    log(`=== AFTER CLICKING STEP: ${beforeUrl} -> ${quote.url()} ===`);

    fs.writeFileSync(path.join(__dirname, 'probe-ure-nav-result.json'), JSON.stringify(out, null, 2));
    log('Result written.');
  } catch (e) { log(`ERROR: ${e.message}`); try { fs.writeFileSync(path.join(__dirname, 'probe-ure-nav-result.json'), JSON.stringify(out, null, 2)); } catch (_) {} }
  finally { await page.waitForTimeout(1500); await browser.close(); }
})();
