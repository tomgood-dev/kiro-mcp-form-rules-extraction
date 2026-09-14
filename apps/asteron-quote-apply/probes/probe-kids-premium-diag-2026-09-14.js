// Kids-premium DIAGNOSTIC — error-swept. After EVERY interaction it captures any on-screen error
// (field validation, toast, banner, role=alert, red text) + the premium, so we can tell whether the
// $0.00 is caused by a field error (bad input) or is real app behaviour. Single session, signal waits.
// Run: BASE_URL=... PROBE_ACCT=a node apps/asteron-quote-apply/probes/probe-kids-premium-diag-2026-09-14.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const ACCT = process.env.PROBE_ACCT || 'a';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${ACCT}.json`);
const H = require('../helpers/quote-helpers');

// The mandatory error sweep — read EVERY plausible on-screen message surface.
function sweep(page, stepLabel) {
  return page.evaluate((label) => {
    function vis(e) { return e && e.offsetParent !== null; }
    const errSel = '[class*="feedback"],[class*="Feedback"],[class*="error"],[class*="Error"],[role="alert"],.text-danger,[class*="validation"],[class*="Validation"],[class*="toast"],[class*="Toast"],[class*="snackbar"]';
    const errors = [...document.querySelectorAll(errSel)].filter(vis)
      .map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim())
      .filter((t) => t && t.toLowerCase() !== 'remove' && !/^(male female|yes no)$/i.test(t));
    // dedupe
    const uniq = [...new Set(errors)].slice(0, 20);
    const totalM = (document.body.innerText || '').match(/Total Yearly Premium[\s\S]{0,40}?(\$[\d,]+\.\d{2})/i);
    return { step: label, errors: uniq, hasErrors: uniq.length > 0, yearly: totalM ? totalM[1] : null };
  }, stepLabel);
}
async function stableSig(page, ms = 10000) {
  const start = Date.now(); let last = null, s = 0;
  while (Date.now() - start < ms) { const sig = await page.evaluate(() => ((document.body.innerText || '').match(/\$[\d,]+\.\d{2}/g) || []).join('|')); if (sig === last) { if (++s >= 2) return sig; } else { s = 0; last = sig; } await page.waitForTimeout(400); }
  return last;
}

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const out = { sweeps: [] };
  const log = (m) => { console.log(JSON.stringify(m)); out.sweeps.push(m); };
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ storageState: statePath, ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  try {
    const quote = await H.openNewQuote(page);
    await H.setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await H.activateCover(quote, 'Life');
    await H.fillCalcMask(H.sumInsuredInput(quote, 0), '200000');
    await stableSig(quote);
    log(await sweep(quote, 'after Life $200k'));

    // number of kids = 2
    const numSel = quote.locator('select').filter({ has: quote.locator('option', { hasText: /^0$/ }) }).filter({ has: quote.locator('option', { hasText: /^9$/ }) }).first();
    await numSel.selectOption('2');
    await stableSig(quote);
    log(await sweep(quote, 'after Number of kids = 2'));

    // fill kid names
    await quote.evaluate(() => { function si(e, v){ if(!e)return; e.focus(); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); e.blur(); }
      [...document.querySelectorAll('input[id*="FirstName"]')].filter((i)=>!/b15-/.test(i.id)).forEach((f,i)=>si(f,'Kid'+(i+1)));
      [...document.querySelectorAll('input[id*="LastName"],input[id*="Surname"]')].filter((i)=>!/b15-/.test(i.id)).forEach((l)=>si(l,'Test')); });
    await stableSig(quote);
    log(await sweep(quote, 'after kid names'));

    // NOTE (learned this session): setting a kid SI tier RE-RENDERS the kids repeating list and wipes
    // previously-entered per-kid DOBs. So set SI FIRST, then fill DOBs, then verify none empty.
    // set kid SI tiers to $100k via REAL selectOption
    const nTiers = await quote.evaluate(() => { const t=[...document.querySelectorAll('select')].filter((s)=>[...s.options].some((o)=>o.text.includes('$50,000'))&&[...s.options].some((o)=>o.text.trim()==='$200,000')); t.forEach((s,i)=>s.setAttribute('data-kt',String(i))); return t.length; });
    for (let i=0;i<nTiers;i++){ await quote.locator(`select[data-kt="${i}"]`).selectOption({ label: '$100,000' }).catch(()=>{}); }
    await stableSig(quote);
    log(await sweep(quote, 'after kid SI = $100,000 (before DOBs)'));

    // NOW fill every kid DOB (post-re-render) with per-field landing retry, then verify none empty.
    let allDobFilled = false;
    for (let pass = 0; pass < 3 && !allDobFilled; pass++) {
      const ids = await quote.evaluate(() => [...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i)=>i.id.indexOf('b15-Input_BirthDate')===-1).map((i)=>i.id));
      for (const id of ids) { await quote.locator(`[id="${id}"]`).fill('2018-06-15').catch(()=>{}); await quote.waitForTimeout(200); }
      await stableSig(quote);
      allDobFilled = await quote.evaluate(() => [...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i)=>i.id.indexOf('b15-Input_BirthDate')===-1).every((i)=>i.value==='2018-06-15'));
    }
    const finalDobs = await quote.evaluate(() => [...document.querySelectorAll('input[type="date"][id*="Input_BirthDate"]')].filter((i)=>i.id.indexOf('b15-Input_BirthDate')===-1).map((i)=>i.value));
    log(Object.assign(await sweep(quote, 'after all kid DOBs filled post-SI'), { allDobFilled, finalDobs }));

    // Find the remaining empty required field (premium still == life-only + one 'Required field!').
    const remaining = await quote.evaluate(() => {
      function vis(e){return e&&e.offsetParent!==null;}
      const emptyReq = [...document.querySelectorAll('input,select')].filter(vis).filter((e)=>{
        const empty = e.tagName==='SELECT' ? /please select|^select|^$/i.test(((e.options[e.selectedIndex]||{}).text||'').trim()) : !(e.value&&e.value.trim());
        const req = e.required || e.getAttribute('aria-required')==='true';
        return empty && req;
      }).map((e)=>({ id:e.id, tag:e.tagName, type:e.type||'' }));
      // Also list ALL kid-row fields for context
      const kidRow = [...document.querySelectorAll('input,select')].filter(vis).filter((e)=>/l2-\d+_\d+-/.test(e.id||'')).map((e)=>({ id:e.id.replace(/^.*(l2-\d+_\d+-.*)$/,'$1'), val:(e.tagName==='SELECT'?((e.options[e.selectedIndex]||{}).text||''):e.value) }));
      return { emptyRequired: emptyReq, kidRow };
    });
    log({ step: 'remaining empty-required + kid-row snapshot', remaining });

    fs.writeFileSync(path.join(__dirname, 'probe-kids-premium-diag-result.json'), JSON.stringify(out, null, 2));
    console.log('DONE');
  } catch (e) { console.log('ERROR: ' + e.message); fs.writeFileSync(path.join(__dirname, 'probe-kids-premium-diag-result.json'), JSON.stringify(out, null, 2)); }
  finally { await browser.close(); }
})();
