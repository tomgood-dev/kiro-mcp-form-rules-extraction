/**
 * Follow-up recon probe #3 for "Premium Details in the Quote Screen" (ACB-2286).
 * Remaining unknowns after probes #1/#2:
 *   - AC08: is there a nested expand/collapse control for the PER-LIFE "Details"
 *     sub-section inside the Premium panel (distinct from the whole-panel AC07 control)?
 *   - AC14: which specific tooltip-icon element triggers the "Total Annualised
 *     Premium (All Lives)" balloon (already confirmed present in the DOM by probe #2)?
 *   - AC04/AC05: after "Add life", does a "Life 2" block appear inside the SAME Premium
 *     accordion with its own cover breakdown, and (per AC04) is there a "Total Yearly
 *     Premium" line specifically for Life 2?
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

    // === 1. AC08: look for a nested collapse control specifically around "Life 1" ===
    console.log('\n=== 1. AC08: nested collapse control around "Life 1" inside Premium panel ===');
    const life1Structure = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div')];
      const premiumRoot = all.find((el) => el.className.toString().includes('osui-accordion') && el.innerText.trim().startsWith('Premium'));
      if (!premiumRoot) return { found: false };
      // find any element inside premiumRoot whose direct text is "Life 1"
      const life1El = [...premiumRoot.querySelectorAll('*')].find((el) => el.children.length === 0 && el.innerText.trim() === 'Life 1');
      if (!life1El) return { found: true, premiumRootOk: true, life1ElFound: false, fullText: premiumRoot.innerText.slice(0, 300) };
      // walk up a few levels looking for accordion/collapse-like classes or role=button
      let node = life1El, trail = [];
      for (let d = 0; d < 6 && node; d++) {
        trail.push({ tag: node.tagName, cls: node.className?.toString().slice(0, 100), role: node.getAttribute && node.getAttribute('role'), ariaExpanded: node.getAttribute && node.getAttribute('aria-expanded') });
        node = node.parentElement;
      }
      return { found: true, premiumRootOk: true, life1ElFound: true, trail };
    });
    console.log(JSON.stringify(life1Structure, null, 2));

    // === 2. AC14: fingerprint the tooltip ICON specifically tied to the annualised-premium balloon ===
    console.log('\n=== 2. AC14: tooltip icon tied to the "total premium...year" balloon ===');
    const annualisedIconInfo = await page.evaluate(() => {
      const balloon = [...document.querySelectorAll('.osui-tooltip__balloon-wrapper__balloon')].find((b) => b.innerText.includes('monthly premium x 12'));
      if (!balloon) return { found: false };
      const wrapper = balloon.closest('.osui-tooltip__balloon-wrapper') || balloon.parentElement;
      const trigger = wrapper ? wrapper.parentElement : null;
      return {
        found: true,
        wrapperClass: wrapper ? wrapper.className.toString() : null,
        triggerOuterHTML: trigger ? trigger.outerHTML.slice(0, 500) : null,
        triggerPrecedingSiblingText: trigger && trigger.previousElementSibling ? trigger.previousElementSibling.innerText.slice(0, 100) : null,
      };
    });
    console.log(JSON.stringify(annualisedIconInfo, null, 2));

    // === 3. AC04/AC05: Add a second life, check Premium panel for "Life 2" block ===
    console.log('\n=== 3. AC04/AC05: Add life -> Life 2 block in Premium panel ===');
    await clickButtonByLabel(page, 'Add life', 'Add life button').catch((e) => console.log('  Add life failed:', e.message));
    await waitForSettle(page, 2000);
    const life2Check = await page.evaluate(() => document.body.innerText.includes('Life 2'));
    console.log('Life 2 tab appeared:', life2Check);
    if (life2Check) {
      // Switch to Life 2 tab and set minimum details + a cover
      const life2TabClicked = await page.evaluate(() => {
        const tabs = [...document.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.innerText.trim() === 'Life 2');
        if (tabs.length === 0) return false;
        tabs[0].click();
        return true;
      });
      console.log('Clicked Life 2 tab:', life2TabClicked);
      await waitForSettle(page, 1500);
    }
    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
