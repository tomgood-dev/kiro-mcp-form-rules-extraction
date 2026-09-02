/**
 * One-shot probe to pin down PREM-26's exact M&L bundling-discount threshold, currently
 * documented as "$500-$1,000/mo, not narrowed further". Life ($200k, already qualifying)
 * + M&L at 3 candidate monthly benefits ($500, $999, $1000) to find the exact cutover.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const { execSync } = require('child_process');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  waitForSettle,
  getBundlingDiscount,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

function killStrayEdge() {
  try { execSync('taskkill /F /IM msedge.exe /T', { stdio: 'ignore' }); } catch (_) {}
}

async function loginWithRetry(email, password) {
  const BACKOFF_MS = [0, 30_000, 60_000];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const wait = BACKOFF_MS[attempt - 1];
    if (wait > 0) { console.log(`[login] waiting ${wait / 1000}s before attempt ${attempt}...`); await new Promise((r) => setTimeout(r, wait)); }
    killStrayEdge();
    await new Promise((r) => setTimeout(r, 2000));
    const browser = await chromium.launch({ channel: 'msedge' });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: 'https://outsystems-dev.asteronlife.co.nz' });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    try {
      await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const form = page.locator('form.login-form');
      await form.locator('input[type="text"]').first().fill(email);
      await form.locator('input[type="password"]').first().fill(password);
      await form.locator('button[type="submit"]').first().click();
      await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 45000 });
      console.log(`[login] OK on attempt ${attempt}`);
      return { browser, page };
    } catch (e) {
      console.log(`[login] attempt ${attempt} failed: ${e.message}`);
      await browser.close().catch(() => {});
    }
  }
  throw new Error('[login] failed after 3 attempts.');
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const { browser, page } = await loginWithRetry(email, password);
  try {
    const quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1', employmentStatus: 'Employed', income: '100000' });
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1500);
    console.log('After Life only:', await getBundlingDiscount(quote));

    await activateCover(quote, 'Mortgage & Living');
    await waitForSettle(quote, 1000);

    for (const benefit of ['500', '999', '1000']) {
      await fillCalcMask(sumInsuredInput(quote, 1), benefit);
      await waitForSettle(quote, 1500);
      console.log(`After Life + M&L $${benefit}/mo:`, await getBundlingDiscount(quote));
    }
    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
