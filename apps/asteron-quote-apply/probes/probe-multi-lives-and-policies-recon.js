/**
 * Recon probe for "Multi Lives and Policies" (ACB-4394) test generation.
 * Per TEST-GENERATION-PROCESS.md Step 3 (probe before asserting). Combined into as few
 * fresh quotes as possible per the session-load rule and the "prefer few combined probes"
 * learning (2026-09-01). Reuses helpers — does not rebuild interactions.
 *
 * Unknowns being resolved (maps to MLP internal IDs in the generation log):
 *  A. MLP-01/27: exact "+Life" / "Add life" button label + how the life-tab list renders
 *     + how "control moves to the newly added life" is observable (active-tab signal).
 *  B. MLP-03/04/26: message when clicking +Life without min details (MLP-03) vs with an
 *     existing cover ERROR (MLP-26) — are these two distinct messages? Exact text + modal shape.
 *  C. MLP-06/07/08: "X" on a life tab -> confirmation modal text + Cancel/Delete buttons.
 *  D. MLP-14/15/28: "+ Personal Policy" / "+ Business Policy" button labels + field sets in
 *     the new policy tab (Business should lack Premium Freeze + Kids Cover, and expose
 *     Business Disability / Farmers Disability / Business Expenses).
 *  E. MLP-16/29: "X" on a policy tab -> policy removed; errored policy tabs highlight class.
 *  F. MLP-05/17: per-life + per-policy + all-lives premium panel structure.
 *  G. MLP-18: life-tab / policy-tab navigation selectors.
 *  H. MLP-09: min-premium (<$240) multi-life error text.
 *  I. MLP-10/11/12/19/20/21: is the Client Summary reachable via Apply, and what controls
 *     ("Proceed to Application" vs "Start Application") appear per life? (reachability probe)
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  clickApply,
  getVisibleErrors,
  getTotalYearlyPremium,
  isOnClientSummary,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel, buttonByLabelExists } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

/** Dumps every button label + every tab-like element currently on the page (for label discovery). */
async function dumpControls(page, label) {
  const info = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
      .filter((b) => b.offsetParent !== null)
      .map((b) => (b.innerText || '').trim().split('\n')[0])
      .filter((t) => t.length && t.length < 40);
    // Tab-ish elements: things that look like life/policy tabs
    const tabs = [...document.querySelectorAll('[class*="tab" i], [role="tab"], li, a')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => (el.innerText || '').trim().split('\n')[0])
      .filter((t) => /^(Life|Personal|Business)\s*\d*/i.test(t))
      .slice(0, 30);
    return { buttons: [...new Set(buttons)], tabs: [...new Set(tabs)] };
  });
  console.log(`  [${label}] buttons: ${JSON.stringify(info.buttons)}`);
  console.log(`  [${label}] life/policy tabs: ${JSON.stringify(info.tabs)}`);
  return info;
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: 'https://outsystems-dev.asteronlife.co.nz' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    // ============ QUOTE 1: baseline controls, +Life labels, add-life w/o min details ============
    console.log('\n=== QUOTE 1: baseline control labels on a fresh quote (no details) ===');
    let quote = await openNewQuote(page);
    await dumpControls(quote, 'fresh-quote');
    // Probe A/B (MLP-01/03): which add-life label exists?
    console.log('  "Add life" button exists: ' + await buttonByLabelExists(quote, 'Add life'));
    console.log('  "+Life" button exists: ' + await buttonByLabelExists(quote, '+Life'));
    console.log('  "Life" button exists: ' + await buttonByLabelExists(quote, 'Life'));
    // Probe D (MLP-14/15): policy add buttons
    console.log('  "+ Personal Policy" exists: ' + await buttonByLabelExists(quote, '+ Personal Policy'));
    console.log('  "+ Business Policy" exists: ' + await buttonByLabelExists(quote, '+ Business Policy'));
    console.log('  "Personal" exists: ' + await buttonByLabelExists(quote, 'Personal'));
    console.log('  "Business" exists: ' + await buttonByLabelExists(quote, 'Business'));

    // MLP-03: click add-life with NO min details -> capture the message/modal
    console.log('\n=== MLP-03: add life with NO minimum details ===');
    const addLabel = (await buttonByLabelExists(quote, 'Add life')) ? 'Add life' : '+Life';
    console.log('  Using add-life label: ' + addLabel);
    try { await clickButtonByLabel(quote, addLabel, 'Add life'); } catch (e) { console.log('  click threw: ' + e.message); }
    await waitForSettle(quote, 1500);
    const mlp03 = await quote.evaluate(() => {
      const modalText = document.body.innerText;
      const hasReq = modalText.includes('Please enter the minimum requirements for a quote before proceeding to another life');
      // dump any dialog/modal buttons
      const dialogBtns = [...document.querySelectorAll('[role="dialog"] button, .modal button, [class*="popup" i] button, [class*="modal" i] button')]
        .filter((b) => b.offsetParent !== null).map((b) => b.innerText.trim());
      return { hasMinReqMessage: hasReq, dialogButtons: [...new Set(dialogBtns)], errors: null };
    });
    console.log('  MLP-03 min-requirements message present: ' + mlp03.hasMinReqMessage);
    console.log('  MLP-03 dialog buttons: ' + JSON.stringify(mlp03.dialogButtons));
    console.log('  MLP-03 visible errors: ' + JSON.stringify(await getVisibleErrors(quote)));

    // ============ QUOTE 2: min details + Life 1 priced, then add Life 2 (MLP-04/27) ============
    console.log('\n=== QUOTE 2: min details + priced Life 1, then add Life 2 ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    const perLifePremium1 = await getTotalYearlyPremium(quote);
    console.log('  Life 1 total yearly premium: ' + perLifePremium1);
    await dumpControls(quote, 'life1-priced');
    // MLP-04/27: add life 2
    await clickButtonByLabel(quote, addLabel, 'Add life');
    await waitForSettle(quote, 1500);
    const afterAddLife = await quote.evaluate(() => {
      const text = document.body.innerText;
      // Which life tab looks "active"? find elements with Life N and an active/selected class
      const tabEls = [...document.querySelectorAll('*')].filter((el) => {
        const t = (el.innerText || '').trim();
        return /^Life\s*\d+$/.test(t) && el.children.length <= 2;
      }).map((el) => ({ text: el.innerText.trim(), cls: el.className, active: /active|selected|current/i.test(el.className) }));
      return { hasLife2: text.includes('Life 2'), tabEls: tabEls.slice(0, 10) };
    });
    console.log('  MLP-27 hasLife2: ' + afterAddLife.hasLife2);
    console.log('  MLP-27 life tab elements (looking for active signal): ' + JSON.stringify(afterAddLife.tabEls));

    // MLP-06/07/08: is there an "X"/close on the life tab -> delete modal?
    console.log('\n=== MLP-06: click X on a life tab -> confirmation modal ===');
    const lifeTabClose = await quote.evaluate(() => {
      // Look for a close/X control within a Life tab
      const candidates = [...document.querySelectorAll('a,button,i,span,[class*="close" i],[class*="delete" i],[class*="remove" i]')]
        .filter((el) => el.offsetParent !== null)
        .filter((el) => {
          const t = (el.innerText || el.getAttribute('aria-label') || el.className || '').toLowerCase();
          return t.includes('close') || t.includes('delete') || t.includes('remove') || (el.innerText || '').trim() === '×' || (el.innerText || '').trim() === 'X';
        })
        .map((el) => ({ tag: el.tagName, cls: (el.className||'').toString().slice(0,60), aria: el.getAttribute('aria-label'), text: (el.innerText||'').trim().slice(0,10) }));
      return candidates.slice(0, 15);
    });
    console.log('  MLP-06 candidate close/delete controls: ' + JSON.stringify(lifeTabClose, null, 2));

    // ============ QUOTE 3: policy add buttons + business field set (MLP-14/15/28) ============
    console.log('\n=== QUOTE 3: policy add buttons + business policy field set ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await dumpControls(quote, 'q3-fresh');
    // Try adding a Business policy (label discovered above)
    const bizLabel = (await buttonByLabelExists(quote, '+ Business Policy')) ? '+ Business Policy'
      : (await buttonByLabelExists(quote, 'Business')) ? 'Business' : null;
    console.log('  Business policy add label: ' + bizLabel);
    if (bizLabel) {
      await clickButtonByLabel(quote, bizLabel, 'Business policy button');
      await waitForSettle(quote, 1500);
      const bizCovers = {};
      for (const c of ['Life', 'TPD', 'Trauma', 'Specific Injury', 'Cancer', 'Acd. Death', 'Needlestick',
                       'Business Disability', 'Farmers Disability', 'Business Expenses',
                       'Mortgage & Living', 'Income Protection', 'Workability']) {
        bizCovers[c] = await buttonByLabelExists(quote, c);
      }
      console.log('  MLP-15 business policy covers present: ' + JSON.stringify(bizCovers, null, 2));
      const bizFields = await quote.evaluate(() => ({
        premiumFreeze: !!document.querySelector('input[id*="Checkbox_PremiumFreeze"]'),
        inflation: !!document.querySelector('input[id*="Checkbox_InflationAdjustmentBenefit"]'),
        kidsCover: [...document.querySelectorAll('select')].some((s) => { const o=[...s.options].map(x=>x.text.trim()); return o.length===10 && o[0]==='0' && o[9]==='9'; }),
      }));
      console.log('  MLP-15 business policy fields (expect premiumFreeze=false, kidsCover=false): ' + JSON.stringify(bizFields));
      // policy tabs present?
      await dumpControls(quote, 'q3-with-business');
      // MLP-16: policy tab close control
      const policyClose = await quote.evaluate(() => {
        const els = [...document.querySelectorAll('a,button,i,span')].filter((el)=>el.offsetParent!==null)
          .filter((el)=>{const t=(el.innerText||el.getAttribute('aria-label')||'').trim(); return t==='×'||t==='X'||/close|remove|delete/i.test(el.getAttribute('aria-label')||'');})
          .map((el)=>({tag:el.tagName, aria:el.getAttribute('aria-label'), text:(el.innerText||'').trim().slice(0,6), cls:(el.className||'').toString().slice(0,50)}));
        return els.slice(0,12);
      });
      console.log('  MLP-16 policy-tab close candidates: ' + JSON.stringify(policyClose));
    }

    // ============ QUOTE 4: min-premium multi-life error (MLP-09) + Apply/Client Summary reachability (MLP-10/19) ============
    console.log('\n=== QUOTE 4: min premium error (tiny SI) + Apply reachability ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '1000'); // deliberately tiny -> premium < $240
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    console.log('  MLP-09 errors after Apply with tiny SI: ' + JSON.stringify(await getVisibleErrors(quote)));
    const hasMinPrem = await quote.evaluate(() => document.body.innerText.includes('The minimum premium is $240.00 per year per Life insured'));
    console.log('  MLP-09 exact "$240.00 per year per Life insured" message present: ' + hasMinPrem);

    // Now a valid multi-cover quote and try to reach Client Summary
    console.log('\n=== QUOTE 5: valid quote -> Apply -> Client Summary reachability (MLP-10/11/19) ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    const onSummary = await isOnClientSummary(quote);
    console.log('  MLP-10 reached Client Summary (isOnClientSummary): ' + onSummary);
    const summaryDump = await quote.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasProceedToApplication: text.includes('Proceed to Application'),
        hasStartApplication: text.includes('Start Application'),
        hasContinueApplication: text.includes('Continue Application'),
        hasFirstName: /First Name/i.test(text),
        hasMiddleName: /Middle Name/i.test(text),
        hasLastName: /Last Name|Surname/i.test(text),
        snippet: text.slice(0, 800),
      };
    });
    console.log('  MLP-10/11/19 Client Summary dump: ' + JSON.stringify(summaryDump, null, 2));
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
