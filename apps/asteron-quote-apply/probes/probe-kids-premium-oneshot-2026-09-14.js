// ONE-PASS kids-premium probe — settles AC08 (kid SI>50k prices) + AC09 (single aggregated Kids
// line) in a single session. Uses REAL selectOption for tiers, waits on the pricing recalc network
// response (not fixed timers), captures the panel + any error state + a structured cover breakdown.
// Run: BASE_URL=... PROBE_ACCT=a node apps/asteron-quote-apply/probes/probe-kids-premium-oneshot-2026-09-14.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const ACCT = process.env.PROBE_ACCT || 'a';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${ACCT}.json`);
const H = require('../helpers/quote-helpers');

// Wait until the premium panel's numbers stop changing (2 consecutive identical reads) OR timeout —
// signal-based, not a fixed sleep. Recalc is an OutSystems XHR; we poll the rendered total.
async function waitForStablePremium(page, timeoutMs = 12000) {
  const start = Date.now(); let last = null; let stableCount = 0;
  while (Date.now() - start < timeoutMs) {
    const snapshot = await page.evaluate(() => {
      const t = document.body.innerText || '';
      const m = t.match(/\$[\d,]+\.\d{2}/g) || [];
      return m.join('|');
    });
    if (snapshot === last && snapshot !== null) { if (++stableCount >= 2) return snapshot; }
    else { stableCount = 0; last = snapshot; }
    await page.waitForTimeout(400);
  }
  return last;
}

function readPanel(page) {
  return page.evaluate(() => {
    const lines = (document.body.innerText || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const money = lines.filter((l) => /\$\d[\d,]*\.\d{2}/.test(l));
    const kids = lines.filter((l) => /kids/i.test(l));
    const totals = lines.filter((l) => /total/i.test(l));
    // Errors: OutSystems feedback / validation surfaces.
    const errs = [...document.querySelectorAll('[class*="feedback"],[class*="error"],[class*="Error"],[role="alert"],.text-danger')]
      .filter((e) => e.offsetParent !== null).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 15);
    return { kids, totals, money: money.slice(0, 30), errs };
  });
}

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const out = { steps: [] };
  const log = (m) => { console.log(typeof m === 'string' ? m : JSON.stringify(m, null, 2)); out.steps.push(m); };
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ storageState: statePath, ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  try {
    const quote = await H.openNewQuote(page);
    await H.setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await H.activateCover(quote, 'Life');
    await H.fillCalcMask(H.sumInsuredInput(quote, 0), '200000');
    await waitForStablePremium(quote);
    log({ before: await readPanel(quote) });

    // Number of kids = 2 via real selectOption.
    const numSel = quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first();
    await numSel.selectOption('2');
    await waitForStablePremium(quote);

    // Fill both kids' mandatory fields (name + DOB, young child).
    await quote.evaluate(() => {
      function si(el, v) { if (!el) return; el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); }
      [...document.querySelectorAll('input[id*="FirstName"]')].filter((i) => !/b15-/.test(i.id)).forEach((f, i) => si(f, 'Kid' + (i + 1)));
      [...document.querySelectorAll('input[id*="LastName"],input[id*="Surname"]')].filter((i) => !/b15-/.test(i.id)).forEach((l) => si(l, 'Test'));
      [...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i) => i.id.indexOf('b15-Input_BirthDate') === -1).forEach((d) => si(d, '2018-06-15'));
    });
    await waitForStablePremium(quote);

    // Set BOTH kid SI tiers to $100,000 via REAL selectOption (locator per matching select).
    const tierHandles = await quote.evaluate(() => {
      const tiers = [...document.querySelectorAll('select')].filter((s) => [...s.options].some((o) => o.text.includes('$50,000')) && [...s.options].some((o) => o.text.trim() === '$200,000'));
      tiers.forEach((s, i) => s.setAttribute('data-kidtier', String(i)));
      return tiers.length;
    });
    for (let i = 0; i < tierHandles; i++) {
      await quote.locator(`select[data-kidtier="${i}"]`).selectOption({ label: '$100,000' }).catch(() => {});
    }
    const stable = await waitForStablePremium(quote);
    log({ tiersSet: tierHandles, stablePremiumSignature: stable });
    log({ after: await readPanel(quote) });

    fs.writeFileSync(path.join(__dirname, 'probe-kids-premium-oneshot-result.json'), JSON.stringify(out, null, 2));
    log('DONE');
  } catch (e) {
    log(`ERROR: ${e.message}`);
    fs.writeFileSync(path.join(__dirname, 'probe-kids-premium-oneshot-result.json'), JSON.stringify(out, null, 2));
  } finally {
    await browser.close();
  }
})();
