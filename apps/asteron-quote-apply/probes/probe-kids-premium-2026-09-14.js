// Probe: how does the premium panel render the KIDS premium line when kid SI > $50k?
// AC08 (a premium is calculated + displayed) + AC09 (ONE aggregated Kids line regardless of #kids).
// Run: BASE_URL=... PROBE_ACCT=a node apps/asteron-quote-apply/probes/probe-kids-premium-2026-09-14.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const ACCT = process.env.PROBE_ACCT || 'a';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${ACCT}.json`);
const H = require('../helpers/quote-helpers');

async function readPremiumPanel(page) {
  return page.evaluate(() => {
    // The premium/progress panel lists cover -> amount lines. Capture any line mentioning a $ value,
    // plus specifically any "Kids" line, plus the Total.
    const text = document.body.innerText || '';
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const moneyLines = lines.filter((l) => /\$?\d[\d,]*\.\d{2}/.test(l));
    const kidsLines = lines.filter((l) => /kids/i.test(l));
    const totalLines = lines.filter((l) => /total/i.test(l));
    return { kidsLines, totalLines, moneyLines: moneyLines.slice(0, 40) };
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
    await H.waitForSettle(quote, 1500);

    log('--- panel BEFORE kids ---');
    log(await readPremiumPanel(quote));

    // Set Number of kids = 2.
    await quote.evaluate(() => {
      const sel = [...document.querySelectorAll('select')].find((s) => { const o = [...s.options].map((x) => x.text.trim()); return o.includes('0') && o.includes('9'); });
      if (sel) { sel.value = '2'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await H.waitForSettle(quote, 2500);

    // Fill each kid's MANDATORY fields first (name + DOB) — the panel may not price a kid until its
    // required fields are complete (silent-mandatory-field rule from project-context).
    const kidsFilled = await quote.evaluate(() => {
      function si(el, v) { if (!el) return false; el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); return true; }
      const firsts = [...document.querySelectorAll('input[id*="FirstName"]')].filter((i) => !/b15-/.test(i.id));
      const lasts = [...document.querySelectorAll('input[id*="LastName"],input[id*="Surname"]')].filter((i) => !/b15-/.test(i.id));
      const dobs = [...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i) => i.id.indexOf('b15-Input_BirthDate') === -1);
      let n = 0;
      firsts.forEach((f, i) => { if (si(f, 'Kid' + (i + 1))) n++; });
      lasts.forEach((l) => si(l, 'Test'));
      dobs.forEach((d) => si(d, '2018-06-15')); // young child, ANB well under 21
      return { firsts: firsts.length, lasts: lasts.length, dobs: dobs.length, filledFirst: n };
    });
    log({ kidsFilled });
    await H.waitForSettle(quote, 2500);

    // Set BOTH kid SI tiers to $100,000 (> $50k) and SELF-VERIFY they landed.
    const setTiers = await quote.evaluate(() => {
      const tiers = [...document.querySelectorAll('select')].filter((s) => [...s.options].some((o) => o.text.includes('$50,000')) && [...s.options].some((o) => o.text.trim() === '$200,000'));
      let n = 0;
      tiers.forEach((s) => { const opt = [...s.options].find((o) => o.text.trim() === '$100,000'); if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); n++; } });
      const landed = tiers.map((s) => (s.options[s.selectedIndex] || {}).text || '');
      return { kidTierSelects: tiers.length, setTo100k: n, landedValues: landed };
    });
    log({ setTiers });
    await H.waitForSettle(quote, 4000); // give the pricing recalc time to settle

    log('--- panel AFTER 2 kids @ $100k ---');
    log(await readPremiumPanel(quote));

    fs.writeFileSync(path.join(__dirname, 'probe-kids-premium-result.json'), JSON.stringify(out, null, 2));
    log('DONE');
  } catch (e) {
    log(`ERROR: ${e.message}`);
    fs.writeFileSync(path.join(__dirname, 'probe-kids-premium-result.json'), JSON.stringify(out, null, 2));
  } finally {
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
