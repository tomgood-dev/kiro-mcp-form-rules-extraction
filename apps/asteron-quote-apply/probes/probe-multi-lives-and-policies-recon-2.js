/**
 * Focused follow-up probe for "Multi Lives and Policies" (ACB-4394) — resolves the items the
 * first recon (probe-multi-lives-and-policies-recon.js) left ambiguous:
 *  1. MLP-03: exact modal TEXT when clicking "Add life" with no minimum details (first probe
 *     saw an "OK" button but the expected message string didn't match — capture verbatim).
 *  2. MLP-04: positive path — with min details entered, does "Add life" succeed (Life 2 added)?
 *  3. MLP-06/08: the per-life-tab "X" close control — locate it by DOM structure inside the
 *     active tab header, click it, capture the confirmation modal text + its buttons.
 *  4. MLP-16: the per-policy-tab "X" close control — same, for a policy tab.
 *  5. MLP-26: error-blocks-add-life — create a life with a cover that has an ERROR (cover
 *     activated but no Sum Insured), then click "Add life"; capture the exact modal message.
 *  6. MLP-10/19: Apply reachability — re-confirm whether Apply reaches Client Summary at all,
 *     with a longer settle, so MLP-10/11/12/19/20/21 can be classified correctly.
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
  isOnClientSummary,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

/** Captures any visible modal/dialog: its full text + button labels. */
async function captureModal(page) {
  return page.evaluate(() => {
    const modal = [...document.querySelectorAll('[role="dialog"], [class*="modal" i], [class*="popup" i], .osui-dialog')]
      .find((m) => m.offsetParent !== null && (m.innerText || '').trim().length);
    if (!modal) return { found: false };
    const buttons = [...modal.querySelectorAll('button')].filter((b) => b.offsetParent !== null).map((b) => b.innerText.trim());
    return { found: true, text: (modal.innerText || '').trim().slice(0, 400), buttons: [...new Set(buttons)] };
  });
}

/** Finds the X/close control inside a tab header whose text starts with `tabText`. Returns a descriptor. */
async function findTabCloseControl(page, tabText) {
  return page.evaluate((t) => {
    // Find the active/any tab header element for this life/policy
    const header = [...document.querySelectorAll('.osui-tabs__header-item')]
      .find((el) => (el.innerText || '').trim().startsWith(t));
    if (!header) return { found: false, reason: 'no header' };
    // Look for a clickable close descendant (icon/anchor/span) inside it
    const closer = [...header.querySelectorAll('*')].find((el) => {
      const cls = (el.className || '').toString().toLowerCase();
      const txt = (el.innerText || '').trim();
      return cls.includes('close') || cls.includes('icon') || txt === '\u00d7' || txt === 'X'
        || (el.tagName === 'I') || cls.includes('cross');
    });
    return {
      found: !!closer,
      headerHtml: header.outerHTML.slice(0, 500),
      closerTag: closer ? closer.tagName : null,
      closerCls: closer ? (closer.className || '').toString().slice(0, 80) : null,
    };
  }, tabText);
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

    // ===== QUOTE 1: MLP-03 (add life, no details) modal text =====
    console.log('\n=== MLP-03: Add life with NO minimum details — modal text ===');
    let quote = await openNewQuote(page);
    await clickButtonByLabel(quote, 'Add life', 'Add life').catch((e) => console.log('  click note: ' + e.message));
    await waitForSettle(quote, 1500);
    console.log('  MLP-03 modal: ' + JSON.stringify(await captureModal(quote)));

    // ===== QUOTE 2: MLP-04 positive, then MLP-06/08 life-tab close =====
    console.log('\n=== MLP-04: Add life WITH min details (positive) ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Add life', 'Add life');
    await waitForSettle(quote, 1500);
    const life2Added = await quote.evaluate(() => document.body.innerText.includes('Life 2'));
    console.log('  MLP-04 Life 2 added with min details: ' + life2Added);

    console.log('\n=== MLP-06: locate + click X on a life tab -> confirmation modal ===');
    console.log('  Life 2 tab close control: ' + JSON.stringify(await findTabCloseControl(quote, 'Life 2')));
    // Try clicking the close control inside the Life 2 header
    const clickedLifeClose = await quote.evaluate(() => {
      const header = [...document.querySelectorAll('.osui-tabs__header-item')].find((el) => (el.innerText || '').trim().startsWith('Life 2'));
      if (!header) return 'no header';
      const closer = [...header.querySelectorAll('a, i, span, button, [class*="close" i], [class*="icon" i]')]
        .find((el) => el.offsetParent !== null && el !== header);
      if (!closer) return 'no closer';
      closer.click();
      return 'clicked: ' + closer.tagName + '.' + (closer.className || '').toString().slice(0, 60);
    });
    console.log('  MLP-06 life-close click result: ' + clickedLifeClose);
    await waitForSettle(quote, 1200);
    console.log('  MLP-06 modal after clicking life-tab X: ' + JSON.stringify(await captureModal(quote)));

    // ===== QUOTE 3: MLP-16 policy-tab close =====
    console.log('\n=== MLP-16: locate + click X on a policy tab ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await clickButtonByLabel(quote, 'Business', 'Business policy');
    await waitForSettle(quote, 1500);
    console.log('  Business 1 tab close control: ' + JSON.stringify(await findTabCloseControl(quote, 'Business 1')));
    const clickedPolicyClose = await quote.evaluate(() => {
      const header = [...document.querySelectorAll('.osui-tabs__header-item')].find((el) => (el.innerText || '').trim().startsWith('Business 1'));
      if (!header) return 'no header';
      const closer = [...header.querySelectorAll('a, i, span, button, [class*="close" i], [class*="icon" i]')]
        .find((el) => el.offsetParent !== null && el !== header);
      if (!closer) return 'no closer';
      closer.click();
      return 'clicked: ' + closer.tagName + '.' + (closer.className || '').toString().slice(0, 60);
    });
    console.log('  MLP-16 policy-close click result: ' + clickedPolicyClose);
    await waitForSettle(quote, 1200);
    const bizGone = await quote.evaluate(() => !document.body.innerText.includes('Business 1'));
    console.log('  MLP-16 Business 1 removed after click (or modal shown): ' + bizGone);
    console.log('  MLP-16 modal (if any): ' + JSON.stringify(await captureModal(quote)));

    // ===== QUOTE 4: MLP-26 error-blocks-add-life =====
    console.log('\n=== MLP-26: cover with an ERROR, then Add life -> error modal ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    // Deliberately leave Sum Insured empty -> the cover is in an error/incomplete state
    await waitForSettle(quote, 1000);
    console.log('  MLP-26 pre-add errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    await clickButtonByLabel(quote, 'Add life', 'Add life').catch((e) => console.log('  click note: ' + e.message));
    await waitForSettle(quote, 1500);
    console.log('  MLP-26 modal after Add life with cover error: ' + JSON.stringify(await captureModal(quote)));

    // ===== QUOTE 5: MLP-10/19 Apply reachability (longer settle) =====
    console.log('\n=== MLP-10/19: Apply -> Client Summary reachability ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '500000');
    await waitForSettle(quote, 1000);
    await clickApply(quote);
    await waitForSettle(quote, 3000);
    console.log('  MLP-10 isOnClientSummary: ' + await isOnClientSummary(quote));
    console.log('  MLP-10 errors: ' + JSON.stringify(await getVisibleErrors(quote)));
    const reach = await quote.evaluate(() => {
      const t = document.body.innerText;
      return {
        stillIllustration: t.includes('Illustration'),
        hasProceedToApplication: t.includes('Proceed to Application'),
        hasStartApplication: t.includes('Start Application'),
        url: location.href,
      };
    });
    console.log('  MLP-10 reachability detail: ' + JSON.stringify(reach));
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
