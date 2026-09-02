/**
 * Precise third probe for "Multi Lives and Policies" (ACB-4394). Fixes the flaws in recon-2:
 *  - recon-2's captureModal matched the Occupation `.vscomp` typeahead ("Select...") as a false
 *    "modal". This version scopes to a REAL OutSystems dialog only and ignores vscomp widgets.
 *  - recon-2 clicked the tab's label SPAN instead of the actual close icon
 *    (`i.fa.fa-times`). This version clicks the fa-times icon directly.
 *  - Inspects the actual policy-tab DOM (Personal 1 / Business 1) to find how to close it.
 *  - Captures a screenshot of the post-Apply screen as retained evidence that Apply does not
 *    navigate to Client Summary (the documented Apply-completion issue), so MLP-10/11/12/19/
 *    20/21 can be classified genuinely-blocked with evidence rather than a guess.
 *
 * Evidence retained under:
 *   apps/asteron-quote-apply/docs/business-rules/quote-screen/kids-cover-and-multi-life/
 *     evidence/01-probe-multi-lives-recon-3/
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  clickApply,
  getVisibleErrors,
  isOnClientSummary,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

const EVIDENCE_DIR = path.join(__dirname, '..', 'docs', 'business-rules', 'quote-screen',
  'kids-cover-and-multi-life', 'evidence', '01-probe-multi-lives-recon-3');

/** Captures a REAL OutSystems dialog only (excludes the vscomp typeahead false-positive). */
async function captureRealModal(page) {
  return page.evaluate(() => {
    const modals = [...document.querySelectorAll('[role="dialog"], .osui-dialog, [class*="Dialog" i]')]
      .filter((m) => m.offsetParent !== null)
      .filter((m) => !(m.className || '').toString().toLowerCase().includes('vscomp'));
    // also scan for a visible element literally containing the two known message strings
    const bodyText = document.body.innerText;
    const known = [
      'Please enter the minimum requirements for a quote before proceeding to another life',
      'Please correct the errors before proceeding to another life',
      'Are you sure you want to delete this life',
    ].filter((s) => bodyText.includes(s));
    if (!modals.length) return { found: false, knownMessagesInBody: known };
    const m = modals[0];
    const buttons = [...m.querySelectorAll('button')].filter((b) => b.offsetParent !== null).map((b) => b.innerText.trim());
    return { found: true, text: (m.innerText || '').trim().slice(0, 400), buttons: [...new Set(buttons)], knownMessagesInBody: known };
  });
}

/** Clicks the fa-times close icon inside a tab button whose label starts with tabText. */
async function clickTabCloseIcon(page, tabText) {
  return page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button.osui-tabs__header-item, .osui-tabs__header-item')]
      .find((el) => (el.innerText || '').trim().startsWith(t));
    if (!btn) return 'no tab button for ' + t;
    const icon = btn.querySelector('i.fa-times, i[class*="fa-times"], i.icon');
    if (!icon) return 'no fa-times icon in tab ' + t;
    icon.click();
    return 'clicked fa-times in ' + t;
  }, tabText);
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

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

    // ===== QUOTE 1: MLP-04 + MLP-06/08 life-tab close (fa-times) + confirm modal =====
    console.log('\n=== MLP-06/08: life tab fa-times close -> confirmation modal ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 800);
    await clickButtonByLabel(quote, 'Add life', 'Add life');
    await waitForSettle(quote, 1200);
    console.log('  Life 2 present: ' + await quote.evaluate(() => document.body.innerText.includes('Life 2')));
    // Click the fa-times on Life 2 tab
    console.log('  close-click: ' + await clickTabCloseIcon(quote, 'Life 2'));
    await waitForSettle(quote, 1200);
    console.log('  MLP-06 modal after life X: ' + JSON.stringify(await captureRealModal(quote)));
    await quote.screenshot({ path: path.join(EVIDENCE_DIR, 'mlp06-delete-life-modal.png'), fullPage: false }).catch(() => {});

    // ===== QUOTE 2: MLP-16 policy-tab structure + close =====
    console.log('\n=== MLP-16: policy tab DOM + close ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await clickButtonByLabel(quote, 'Business', 'Business policy');
    await waitForSettle(quote, 1500);
    // Dump how the policy tabs (Personal 1 / Business 1) are structured
    const policyTabDom = await quote.evaluate(() => {
      const candidates = [...document.querySelectorAll('*')].filter((el) => {
        const t = (el.innerText || '').trim();
        return (t === 'Personal 1' || t === 'Business 1') && el.children.length <= 3;
      }).map((el) => ({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 90), html: el.outerHTML.slice(0, 300) }));
      return candidates.slice(0, 6);
    });
    console.log('  MLP-16 policy tab DOM: ' + JSON.stringify(policyTabDom, null, 2));
    // Try close icon on Business 1
    console.log('  policy close-click: ' + await clickTabCloseIcon(quote, 'Business 1'));
    await waitForSettle(quote, 1200);
    console.log('  MLP-16 Business 1 gone: ' + await quote.evaluate(() => !document.body.innerText.includes('Business 1')));
    console.log('  MLP-16 modal (if any): ' + JSON.stringify(await captureRealModal(quote)));

    // ===== QUOTE 3: MLP-03 (no details) exact modal =====
    console.log('\n=== MLP-03: Add life, no details -> exact modal ===');
    quote = await openNewQuote(page);
    await clickButtonByLabel(quote, 'Add life', 'Add life').catch((e) => console.log('  note: ' + e.message));
    await waitForSettle(quote, 1500);
    console.log('  MLP-03 modal: ' + JSON.stringify(await captureRealModal(quote)));

    // ===== QUOTE 4: MLP-26 cover-with-error -> Add life modal =====
    console.log('\n=== MLP-26: cover with error, Add life -> exact modal ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life'); // no Sum Insured -> error state
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Add life', 'Add life').catch((e) => console.log('  note: ' + e.message));
    await waitForSettle(quote, 1500);
    console.log('  MLP-26 modal: ' + JSON.stringify(await captureRealModal(quote)));

    // ===== QUOTE 5: MLP-10 Apply non-navigation evidence (screenshot) =====
    console.log('\n=== MLP-10/19: Apply reachability (screenshot evidence) ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    await waitForSettle(quote, 3000);
    const onSummary = await isOnClientSummary(quote);
    console.log('  MLP-10 isOnClientSummary: ' + onSummary);
    console.log('  MLP-10 errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    console.log('  MLP-10 still on Illustration: ' + await quote.evaluate(() => document.body.innerText.includes('Illustration')));
    await quote.screenshot({ path: path.join(EVIDENCE_DIR, 'mlp10-apply-no-navigation.png'), fullPage: false }).catch(() => {});
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
