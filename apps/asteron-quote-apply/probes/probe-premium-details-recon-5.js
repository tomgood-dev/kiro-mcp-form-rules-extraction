/**
 * Follow-up recon probe #5 for "Premium Details in the Quote Screen" (ACB-2286).
 * Probe #4 found only 1 "Life" button after adding a Business policy - need to see the
 * actual Policies accordion structure to find the Business policy's own cover buttons
 * (they may be scoped under a "Business 1" sub-container with their own button set, or
 * OutSystems may render them with different visible text/structure than the Personal
 * policy's buttons).
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
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

function killStrayEdge() {
  try { execSync('taskkill /F /IM msedge.exe /T', { stdio: 'ignore' }); } catch (_) { /* none running */ }
}

async function loginWithRetry(email, password) {
  const BACKOFF_MS = [0, 30_000, 60_000];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const wait = BACKOFF_MS[attempt - 1];
    if (wait > 0) {
      console.log(`[login] waiting ${wait / 1000}s before attempt ${attempt}...`);
      await new Promise((r) => setTimeout(r, wait));
    }
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
    await openNewQuote(page);
    await setMinimumPersonalDetails(page, { age: 35, gender: 'Male', occupationCode: '1' });
    await activateCover(page, 'Life');
    await fillCalcMask(sumInsuredInput(page, 0), '200000');
    await waitForSettle(page, 1500);

    console.log('\n=== Policies accordion structure BEFORE adding Business ===');
    const before = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div')];
      const root = all.find((el) => el.className.toString().includes('osui-accordion') && el.innerText.trim().startsWith('Policies'));
      return root ? root.innerText.slice(0, 500) : 'NOT FOUND';
    });
    console.log(before);

    await clickButtonByLabel(page, 'Business', 'Business policy button').catch((e) => console.log('  Business click failed:', e.message));
    await waitForSettle(page, 2500);

    console.log('\n=== Policies accordion structure AFTER adding Business ===');
    const after = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div')];
      const root = all.find((el) => el.className.toString().includes('osui-accordion') && el.innerText.trim().startsWith('Policies'));
      return root ? root.innerText.slice(0, 1200) : 'NOT FOUND';
    });
    console.log(after);

    console.log('\n=== All buttons on page with text containing "Life" ===');
    const lifeBtns = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.innerText.includes('Life')).map((b) => ({ text: b.innerText.trim(), id: b.id, disabled: b.disabled })));
    console.log(JSON.stringify(lifeBtns, null, 2));

    console.log('\n=== All SumInsured inputs ===');
    const siInputs = await page.evaluate(() => [...document.querySelectorAll('input[id*="SumInsured"]')].map((i) => i.id));
    console.log(JSON.stringify(siInputs, null, 2));

    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
