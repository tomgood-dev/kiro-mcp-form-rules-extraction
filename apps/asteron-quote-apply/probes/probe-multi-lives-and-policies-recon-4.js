/**
 * Final targeted probe for "Multi Lives and Policies" (ACB-4394) — closes the last two gaps from
 * recon-3:
 *  1. MLP-06/07/08: raise the "Are you sure you want to delete this life?" confirmation by clicking
 *     the fa-times X on a life tab. recon-3 clicked the ACTIVE (disabled) tab's icon and got no
 *     modal; here we click the X on the NON-active Life 1 tab (and dispatch a precise element
 *     click), then capture the modal + Cancel/Delete buttons.
 *  2. MLP-26/29: produce a GENUINE cover-error state first (activate Life, click Apply to surface
 *     the "Sum Insured is required"-type error), THEN click "Add life" and capture the
 *     "Please correct the errors before proceeding to another life" modal.
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
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

const EVIDENCE_DIR = path.join(__dirname, '..', 'docs', 'business-rules', 'quote-screen',
  'kids-cover-and-multi-life', 'evidence', '02-probe-multi-lives-recon-4');

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

    // ===== MLP-06/07/08: delete-life confirmation via X on NON-active tab =====
    console.log('\n=== MLP-06: click fa-times on the NON-active Life 1 tab -> confirm modal ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 800);
    await clickButtonByLabel(quote, 'Add life', 'Add life'); // now Life 2 is active, Life 1 is not
    await waitForSettle(quote, 1200);
    // Enumerate every fa-times icon inside life-tab buttons with their tab text + disabled state
    const lifeCloseIcons = await quote.evaluate(() => {
      return [...document.querySelectorAll('button.osui-tabs__header-item')].map((btn) => {
        const label = (btn.innerText || '').trim();
        const icon = btn.querySelector('i.fa-times, i[class*="fa-times"]');
        return { label, disabled: btn.disabled, hasIcon: !!icon };
      });
    });
    console.log('  life tab buttons: ' + JSON.stringify(lifeCloseIcons));
    // Click the fa-times on Life 1 (the non-active one)
    const clickRes = await quote.evaluate(() => {
      const btn = [...document.querySelectorAll('button.osui-tabs__header-item')].find((b) => (b.innerText || '').trim().startsWith('Life 1'));
      if (!btn) return 'no Life 1 tab';
      const icon = btn.querySelector('i.fa-times, i[class*="fa-times"]');
      if (!icon) return 'no icon on Life 1';
      icon.click();
      return 'clicked Life 1 fa-times (btn disabled=' + btn.disabled + ')';
    });
    console.log('  ' + clickRes);
    await waitForSettle(quote, 1200);
    console.log('  MLP-06 modal: ' + JSON.stringify(await captureRealModal(quote)));
    await quote.screenshot({ path: path.join(EVIDENCE_DIR, 'mlp06-delete-life-confirm.png') }).catch(() => {});

    // ===== MLP-26/29: genuine cover-error state, then Add life =====
    console.log('\n=== MLP-26: real cover error (Apply to surface it), then Add life ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life'); // no SI
    await waitForSettle(quote, 800);
    await clickApply(quote); // surface the "sum insured required" error
    await waitForSettle(quote, 1200);
    console.log('  MLP-26 errors after Apply (should show a cover error): ' + JSON.stringify(await getVisibleErrors(quote)));
    await clickButtonByLabel(quote, 'Add life', 'Add life').catch((e) => console.log('  note: ' + e.message));
    await waitForSettle(quote, 1500);
    console.log('  MLP-26 modal: ' + JSON.stringify(await captureRealModal(quote)));
    await quote.screenshot({ path: path.join(EVIDENCE_DIR, 'mlp26-correct-errors-modal.png') }).catch(() => {});
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
