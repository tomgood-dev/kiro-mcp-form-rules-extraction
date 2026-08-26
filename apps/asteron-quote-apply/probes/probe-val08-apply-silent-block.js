/**
 * Follow-up probe: VAL-08/09/10's "fully valid" config produced zero visible errors
 * (via getVisibleErrors' [class*="error"] selector) yet did not navigate to client
 * summary. This does a broader search for ANY validation surface the standard selector
 * might be missing (role=alert, aria-live, aria-invalid fields, red/highlighted borders)
 * plus a screenshot, to determine whether this is a real silent block or a detection gap.
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
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'https://outsystems-dev.asteronlife.co.nz', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { employmentStatus: 'Employed' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote);

    console.log('Clicking Apply...');
    await quote.getByRole('button', { name: 'Apply', exact: true }).click();
    // Poll for up to 8s in case navigation/error is just slow to appear.
    await quote.waitForTimeout(8000);

    const diag = await quote.evaluate(() => {
      const alerts = [...document.querySelectorAll('[role="alert"], [aria-live]')].map((e) => e.innerText?.trim()).filter(Boolean);
      const invalidFields = [...document.querySelectorAll('[aria-invalid="true"]')].map((e) => ({ id: e.id, tag: e.tagName }));
      const redElements = [...document.querySelectorAll('*')]
        .filter((e) => {
          const s = window.getComputedStyle(e);
          const color = s.color + s.borderColor;
          return /rgb\(2[0-9][0-9], ?[0-4]?[0-9], ?[0-4]?[0-9]\)/.test(color) && e.innerText && e.innerText.trim().length < 200;
        })
        .map((e) => e.innerText.trim())
        .filter((t, i, arr) => t && arr.indexOf(t) === i)
        .slice(0, 20);
      const applyBtn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Apply');
      const hasIllustrationHeading = document.body.innerText.includes('Illustration');
      const modals = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],[class*="modal"],[class*="popup"],[class*="overlay"]')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 50 && r.height > 50 ? el.innerText?.trim().slice(0, 300) : null;
        })
        .filter(Boolean);
      return {
        url: location.href,
        alerts,
        invalidFields,
        redElements,
        applyButtonPresent: !!applyBtn,
        applyButtonDisabled: applyBtn ? applyBtn.disabled : null,
        hasIllustrationHeading,
        modals,
      };
    });
    console.log('Diagnostic: ' + JSON.stringify(diag, null, 2));

    const shotPath = path.join(__dirname, '..', 'test-runs', '_investigation-screenshots', 'val08-apply-result.png');
    fs.mkdirSync(path.dirname(shotPath), { recursive: true });
    await quote.screenshot({ path: shotPath, fullPage: true });
    console.log('Screenshot: ' + shotPath);
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
