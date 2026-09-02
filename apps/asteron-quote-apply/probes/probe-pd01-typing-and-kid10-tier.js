/**
 * Diagnostic probe for 2 failures in the boundary-gap verification run (2026-09-02):
 * 1. PD-01/PD-02: typing 19/29 characters into First/Last Name via page.keyboard.type()
 *    resulted in only 2 characters landing in the field, regardless of intended length.
 *    Need to find out WHERE it breaks (re-render stealing focus after a couple of
 *    keystrokes? debounce eating input? wrong element?).
 * 2. KID-10: after selecting the Kid SI tier dropdown to "$60,000", getTotalYearlyPremium
 *    returned exactly 0 instead of an increased value - need to see what the page
 *    actually looks like after that selectOption call.
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
  getTotalYearlyPremium,
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
    await setMinimumPersonalDetails(quote);

    console.log('\n=== 1. First Name typing diagnostic ===');
    const firstName = quote.locator('input[id*="Input_FirstName"]').first();
    await firstName.click();
    await quote.keyboard.press('Control+a');
    await quote.keyboard.press('Delete');
    await quote.waitForTimeout(300);
    // Type character by character, checking the value after each one.
    const target = 'ABCDEFGHIJKLMNOPQRS'; // 19 chars
    for (let i = 0; i < target.length; i++) {
      await quote.keyboard.type(target[i], { delay: 40 });
      const val = await firstName.inputValue();
      console.log(`  after char ${i + 1} ('${target[i]}'): value="${val}" (len=${val.length}), focused=${await firstName.evaluate((el) => document.activeElement === el)}`);
    }

    console.log('\n=== 2. Kid SI tier dropdown diagnostic ===');
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1500);
    const premiumBefore = await getTotalYearlyPremium(quote);
    console.log('Premium before kids:', premiumBefore);

    const numberOfKids = quote.locator('select')
      .filter({ has: quote.locator('option', { hasText: /^0$/ }) })
      .filter({ has: quote.locator('option', { hasText: /^9$/ }) })
      .first();
    await numberOfKids.selectOption('1');
    await waitForSettle(quote, 1500);
    const premiumAtFree = await getTotalYearlyPremium(quote);
    console.log('Premium at $50,000 (Free) tier:', premiumAtFree);

    const tierDropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '$50,000 (Free)' }) }).first();
    const tierId = await tierDropdown.evaluate((el) => el.id);
    console.log('Tier dropdown id:', tierId);
    await tierDropdown.selectOption({ label: '$60,000' });
    await waitForSettle(quote, 1500);
    const selectedAfter = await tierDropdown.evaluate((el) => el.options[el.selectedIndex].text.trim());
    console.log('Tier dropdown selected value after selectOption:', selectedAfter);
    const bodyErrorsCheck = await quote.evaluate(() => document.body.innerText.slice(0, 100).includes('Please') || document.body.innerText.includes('error'));
    console.log('Any visible error text on page:', bodyErrorsCheck);
    const premiumAtNext = await getTotalYearlyPremium(quote);
    console.log('Premium at $60,000 tier:', premiumAtNext);
    const bodyDump = await quote.evaluate(() => {
      const idx = document.body.innerText.indexOf('Premium');
      return document.body.innerText.slice(idx, idx + 400);
    });
    console.log('Body dump from "Premium":', bodyDump);

    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
