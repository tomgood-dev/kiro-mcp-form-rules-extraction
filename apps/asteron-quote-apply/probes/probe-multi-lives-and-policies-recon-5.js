/**
 * Consolidating probe (5th/last) for "Multi Lives and Policies" (ACB-4394). Two precise attempts:
 *  1. MLP-06: recon-4 showed life-tab buttons are rendered in TWO copies — a disabled set and an
 *     enabled (disabled:false) set. Clicking the disabled copy's icon did nothing. Here we click
 *     the fa-times on the ENABLED Life 1 tab button, then capture the delete-confirmation modal.
 *  2. MLP-26: min-premium error did not trigger the "correct the errors" add-life block. Try a
 *     genuine per-cover validation error instead: activate Life with an OVER-CAP Sum Insured
 *     (e.g. $60,000,000) which the app rejects with a cover-level error, then click Add life.
 *     Also try: leave SI blank and click Add life WITHOUT an Apply first (fresh error state).
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
  getVisibleErrors,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

const EVIDENCE_DIR = path.join(__dirname, '..', 'docs', 'business-rules', 'quote-screen',
  'kids-cover-and-multi-life', 'evidence', '03-probe-multi-lives-recon-5');

async function captureRealModal(page) {
  return page.evaluate(() => {
    const modals = [...document.querySelectorAll('[role="dialog"], .osui-dialog, [class*="Dialog" i]')]
      .filter((m) => m.offsetParent !== null)
      .filter((m) => !(m.className || '').toString().toLowerCase().includes('vscomp'));
    const bodyText = document.body.innerText;
    const known = [
      'Please enter the minimum requirement for a quote before proceeding to another life',
      'Please correct the errors before proceeding to another life',
      'Are you sure you want to delete this life',
    ].filter((s) => bodyText.includes(s));
    if (!modals.length) return { found: false, knownMessagesInBody: known };
    const m = modals[0];
    const buttons = [...m.querySelectorAll('button')].filter((b) => b.offsetParent !== null).map((b) => b.innerText.trim());
    return { found: true, text: (m.innerText || '').trim().slice(0, 400), buttons: [...new Set(buttons)], knownMessagesInBody: known };
  });
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

    // ===== MLP-06: click fa-times on the ENABLED Life 1 tab copy =====
    console.log('\n=== MLP-06: click fa-times on ENABLED Life 1 tab -> confirm modal ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 800);
    await clickButtonByLabel(quote, 'Add life', 'Add life');
    await waitForSettle(quote, 1200);
    const clickRes = await quote.evaluate(() => {
      // pick the ENABLED Life 1 tab button (recon-4: there is a disabled copy and an enabled copy)
      const btns = [...document.querySelectorAll('button.osui-tabs__header-item')].filter((b) => (b.innerText || '').trim().startsWith('Life 1'));
      const enabled = btns.find((b) => !b.disabled) || btns[0];
      if (!enabled) return 'no Life 1 tab';
      const icon = enabled.querySelector('i.fa-times, i[class*="fa-times"]');
      if (!icon) return 'no icon';
      icon.click();
      return 'clicked enabled Life 1 fa-times (disabled=' + enabled.disabled + ')';
    });
    console.log('  ' + clickRes);
    await waitForSettle(quote, 1200);
    console.log('  MLP-06 modal: ' + JSON.stringify(await captureRealModal(quote)));
    await quote.screenshot({ path: path.join(EVIDENCE_DIR, 'mlp06-delete-life-confirm.png') }).catch(() => {});

    // ===== MLP-26 attempt A: over-cap SI cover error, then Add life =====
    console.log('\n=== MLP-26-A: over-cap Life SI cover error, then Add life ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '60000000'); // $60M — over the Life cap
    await waitForSettle(quote, 1500);
    console.log('  MLP-26-A errors after over-cap SI: ' + JSON.stringify(await getVisibleErrors(quote)));
    await clickButtonByLabel(quote, 'Add life', 'Add life').catch((e) => console.log('  note: ' + e.message));
    await waitForSettle(quote, 1500);
    console.log('  MLP-26-A modal: ' + JSON.stringify(await captureRealModal(quote)));

    // ===== MLP-26 attempt B: cover active, SI blank, Add life directly (no Apply) =====
    console.log('\n=== MLP-26-B: Life active + SI blank, Add life directly ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life'); // SI blank
    await waitForSettle(quote, 800);
    console.log('  MLP-26-B errors before Add life: ' + JSON.stringify(await getVisibleErrors(quote)));
    await clickButtonByLabel(quote, 'Add life', 'Add life').catch((e) => console.log('  note: ' + e.message));
    await waitForSettle(quote, 1500);
    console.log('  MLP-26-B modal: ' + JSON.stringify(await captureRealModal(quote)));
    await quote.screenshot({ path: path.join(EVIDENCE_DIR, 'mlp26-b-modal.png') }).catch(() => {});
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
