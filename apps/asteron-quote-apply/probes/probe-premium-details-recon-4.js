/**
 * Follow-up recon probe #4 for "Premium Details in the Quote Screen" (ACB-2286).
 * Fixes probe #3's overly-strict AC08 selector (required a childless leaf node with
 * EXACT text "Life 1" - too strict). Also reaches the actual diverging-payment-frequency
 * state (2 priced policies, different frequencies) needed to observe AC10-AC14 for real,
 * since probe #1 found the 2nd policy's frequency dropdown only appears once it has its
 * own priced cover.
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

    // === 1. AC08 relaxed check: any element (any descendant count) whose OWN trimmed
    // textContent (not innerText, to avoid picking up children's text) is "Life 1", inside Premium panel ===
    console.log('\n=== 1. AC08 relaxed: elements with textContent "Life 1" inside Premium panel ===');
    const relaxedCheck = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div')];
      const premiumRoot = all.find((el) => el.className.toString().includes('osui-accordion') && el.innerText.trim().startsWith('Premium'));
      if (!premiumRoot) return { found: false };
      const matches = [...premiumRoot.querySelectorAll('*')].filter((el) => {
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
        return own === 'Life 1';
      });
      return {
        found: true,
        matchCount: matches.length,
        matches: matches.map((el) => {
          let node = el, trail = [];
          for (let d = 0; d < 5 && node && node !== premiumRoot; d++) {
            trail.push({ tag: node.tagName, cls: node.className?.toString ? node.className.toString().slice(0, 90) : '', role: node.getAttribute && node.getAttribute('role'), ariaExpanded: node.getAttribute && node.getAttribute('aria-expanded') });
            node = node.parentElement;
          }
          return trail;
        }),
      };
    });
    console.log(JSON.stringify(relaxedCheck, null, 2));

    // === 2. Reach a real diverging-frequency state: add Business policy + price a cover on it ===
    console.log('\n=== 2. Adding Business policy + pricing a cover on it ===');
    await clickButtonByLabel(page, 'Business', 'Business policy button').catch((e) => console.log('  Business click failed:', e.message));
    await waitForSettle(page, 1500);
    // Activate Life on the Business policy too — need to find the 2nd "Life" button (policy-scoped)
    const lifeButtons = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Life').length);
    console.log('Number of "Life" buttons now:', lifeButtons);
    if (lifeButtons >= 2) {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Life');
        btns[1].click();
      });
      await waitForSettle(page, 1500);
      const siInputs = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
      console.log('SumInsured inputs now:', siInputs);
      if (siInputs >= 2) {
        await fillCalcMask(sumInsuredInput(page, 1), '200000');
        await waitForSettle(page, 1500);
      }
    }
    const freqDropdownsNow = await page.evaluate(() => [...document.querySelectorAll('select[id*="PaymentFrequencyDropdown"]')].map((s) => ({ id: s.id, selected: s.options[s.selectedIndex]?.text.trim() })));
    console.log('Frequency dropdowns now:', JSON.stringify(freqDropdownsNow, null, 2));

    if (freqDropdownsNow.length >= 2) {
      await page.locator(`[id="${freqDropdownsNow[1].id}"]`).selectOption({ label: 'Yearly' });
      await waitForSettle(page, 1500);
      const topLabelDiverged = await page.evaluate(() => {
        const idx = document.body.innerText.indexOf('Total');
        return document.body.innerText.slice(idx, idx + 60);
      });
      console.log('Top label after diverging (AC11):', JSON.stringify(topLabelDiverged));

      // AC14: find tooltip icon adjacent to the NOW-VISIBLE "Total Annualised" text
      const ac14Icon = await page.evaluate(() => {
        const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.innerText && e.innerText.trim().startsWith('Total Annualised'));
        if (!el) return { found: false };
        const row = el.closest('div');
        const icons = row ? [...row.parentElement.querySelectorAll('[class*="tooltip"], svg, i')].map((i) => ({ tag: i.tagName, cls: i.className.toString().slice(0, 80) })) : [];
        return { found: true, rowText: row ? row.innerText.slice(0, 100) : null, icons };
      });
      console.log('AC14 icon search:', JSON.stringify(ac14Icon, null, 2));

      // AC12: unify back to Monthly
      await page.locator(`[id="${freqDropdownsNow[1].id}"]`).selectOption({ label: 'Monthly' });
      await waitForSettle(page, 1500);
      const topLabelUnified = await page.evaluate(() => {
        const idx = document.body.innerText.indexOf('Total');
        return document.body.innerText.slice(idx, idx + 60);
      });
      console.log('Top label after re-unifying (AC12):', JSON.stringify(topLabelUnified));
    } else {
      console.log('Still only 1 frequency dropdown - Business policy cover pricing did not create a 2nd one.');
    }

    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
