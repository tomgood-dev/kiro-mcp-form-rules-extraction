/** Follow-up: check state at 0.5s, 1s, 2s, 4s after Apply on a valid config, in case a
 * transient success indicator (toast) appears and fades before the 8s check used previously. */
const { chromium } = require('@playwright/test');
const path = require('path');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, waitForSettle } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

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

    // Watch for any network requests/responses fired by the Apply click.
    const requests = [];
    quote.on('request', (req) => { if (req.method() === 'POST') requests.push({ url: req.url(), t: Date.now() }); });

    console.log('Clicking Apply...');
    const clickTime = Date.now();
    await quote.getByRole('button', { name: 'Apply', exact: true }).click();

    for (const delay of [500, 1000, 2000, 4000]) {
      await quote.waitForTimeout(delay - (Date.now() - clickTime > delay ? delay : 0));
      const snapshot = await quote.evaluate(() => ({
        url: location.href,
        bodyTextSnippet: document.body.innerText.slice(0, 300),
        toastLike: [...document.querySelectorAll('[class*="toast"],[class*="Toast"],[class*="notif"],[class*="snackbar"],[class*="success"]')].map((e) => e.innerText?.trim()).filter(Boolean),
      }));
      console.log(`  @${Date.now() - clickTime}ms: ${JSON.stringify(snapshot)}`);
    }

    console.log('POST requests observed after Apply click: ' + JSON.stringify(requests.map((r) => r.url)));
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
