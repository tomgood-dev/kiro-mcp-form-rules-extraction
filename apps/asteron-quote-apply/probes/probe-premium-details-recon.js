/**
 * Recon probe for "Premium Details in the Quote Screen" (ACB-2286) test generation.
 * Checks items not already confirmed in premium-and-bundling/page.md before writing the
 * spec, per TEST-GENERATION-PROCESS.md Step 3 (probe before asserting).
 *
 * 1. AC01/AC02: structure of the Premium panel + per-life "Details" section — is there a
 *    per-cover breakdown, a "Total Yearly Premium" per life, distinct from the all-lives total?
 * 2. AC06: Payment Frequency dropdown per life — confirm selector + that it's reachable
 *    from the Premium panel side (not just the per-policy card, already known from POL-13b).
 * 3. AC07: is there an expand/collapse control for the Premium section itself?
 * 4. AC08: is there an expand/collapse control for the per-life Details section?
 * 5. AC09: clicking a priced cover line in the Premium panel — does a tooltip appear
 *    showing monthly benefit or sum insured?
 * 6. AC10/AC11: with 2 policies (Personal + Business) on one life at different Payment
 *    Frequencies, what does the panel's top total label read? ("Total Annualised
 *    Premium (All Lives)" per the story's Business Rule, or something else?)
 * 7. AC12/AC13: after unifying frequency, does the label switch back to "Total XXXX
 *    Premiums (All Lives)"? After diverging again, does it flip back?
 * 8. AC14: is there a tooltip icon next to the "Total Annualised Premium (All Lives)"
 *    label, and what does it say when triggered?
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
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

function killStrayEdge() {
  try { execSync('taskkill /F /IM msedge.exe /T', { stdio: 'ignore' }); } catch (_) { /* none running */ }
}

async function loginWithRetry(email, password) {
  const BACKOFF_MS = [0, 30_000, 60_000];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const wait = BACKOFF_MS[attempt - 1];
    if (wait > 0) {
      console.log(`[login] waiting ${wait / 1000}s for any held session to release before attempt ${attempt}...`);
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
  throw new Error('[login] failed after 3 attempts — session likely still held.');
}

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const { browser, page } = await loginWithRetry(email, password);

  try {
    await openNewQuote(page);
    await setMinimumPersonalDetails(page, { age: 35, gender: 'Male', occupationCode: '1' });

    // === 1. AC01: activate one cover, dump full Premium-panel DOM text ===
    console.log('\n=== 1. AC01: Premium panel structure after 1 cover (Life) ===');
    await activateCover(page, 'Life');
    await fillCalcMask(sumInsuredInput(page, 0), '200000');
    await waitForSettle(page, 1500);
    const panelDump1 = await page.evaluate(() => {
      const idx = document.body.innerText.indexOf('Premium');
      return document.body.innerText.slice(idx, idx + 1200);
    });
    console.log(panelDump1);

    // === 2. AC02: add a second cover (TPD), re-dump for per-cover breakdown + bundling ===
    console.log('\n=== 2. AC02: Premium panel after 2nd cover (TPD) ===');
    await activateCover(page, 'TPD');
    await fillCalcMask(sumInsuredInput(page, 1), '200000');
    await waitForSettle(page, 1500);
    const panelDump2 = await page.evaluate(() => {
      const idx = document.body.innerText.indexOf('Premium');
      return document.body.innerText.slice(idx, idx + 1500);
    });
    console.log(panelDump2);
    console.log('Total Yearly Premium reading:', await getTotalYearlyPremium(page));

    // === 3. AC07/AC08: look for expand/collapse controls near "Premium" / "Details" ===
    console.log('\n=== 3. AC07/AC08: expand/collapse controls ===');
    const collapseControls = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('[class*="collapse"], [class*="accordion"], [class*="chevron"], [class*="expand"], svg, i[class*="icon"]')];
      return candidates
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .slice(0, 40)
        .map((el) => ({
          tag: el.tagName,
          cls: el.className && el.className.toString ? el.className.toString().slice(0, 80) : '',
          nearbyText: (el.closest('div')?.innerText || '').slice(0, 60).replace(/\n/g, ' | '),
        }));
    });
    console.log(JSON.stringify(collapseControls, null, 2));

    // === 4. AC09: click on the "Life" cover line item inside the Premium panel ===
    console.log('\n=== 4. AC09: clicking a cover line in the Premium panel ===');
    const clickResult = await page.evaluate(() => {
      const idx = document.body.innerText.indexOf('Premium');
      // find a clickable element whose text is exactly "Life" within the right-hand panel area
      const candidates = [...document.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.innerText && el.innerText.trim() === 'Life');
      return candidates.map((el) => ({
        tag: el.tagName,
        cls: el.className && el.className.toString ? el.className.toString().slice(0, 80) : '',
        rect: el.getBoundingClientRect ? { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y) } : null,
      }));
    });
    console.log('Candidates with text exactly "Life":', JSON.stringify(clickResult, null, 2));
    // Try clicking the last one (most likely to be in the summary panel, not the form)
    if (clickResult.length > 0) {
      await page.evaluate(() => {
        const candidates = [...document.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.innerText && el.innerText.trim() === 'Life');
        const last = candidates[candidates.length - 1];
        if (last) last.click();
      });
      await page.waitForTimeout(1000);
      const afterClickDump = await page.evaluate(() => document.body.innerText.slice(0, 2000));
      console.log('Body text after click (first 2000 chars):');
      console.log(afterClickDump);
    }

    // === 5. AC06: Payment Frequency dropdown(s) present, count + options ===
    console.log('\n=== 5. AC06: Payment Frequency dropdown(s) ===');
    const freqDropdowns = await page.evaluate(() => {
      return [...document.querySelectorAll('select[id*="PaymentFrequencyDropdown"]')].map((s) => ({
        id: s.id,
        options: [...s.options].map((o) => o.text.trim()),
        selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.trim() : null,
      }));
    });
    console.log(JSON.stringify(freqDropdowns, null, 2));

    // === 6. AC10/AC11: add a Business policy (2nd policy, same life), set different frequencies ===
    console.log('\n=== 6. AC10/AC11: adding a Business policy + differing frequencies ===');
    await clickButtonByLabel(page, 'Business', 'Business policy button').catch((e) => console.log('  Business button click failed:', e.message));
    await waitForSettle(page, 1500);
    const freqDropdownsAfterBusiness = await page.evaluate(() => {
      return [...document.querySelectorAll('select[id*="PaymentFrequencyDropdown"]')].map((s) => ({
        id: s.id,
        selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.trim() : null,
      }));
    });
    console.log('Frequency dropdowns after adding Business policy:', JSON.stringify(freqDropdownsAfterBusiness, null, 2));

    // Need a priced cover on the Business policy too for its own premium to count.
    // Dump the Premium panel's TOP total label text before touching frequency.
    const topLabelBefore = await page.evaluate(() => {
      const idx = document.body.innerText.indexOf('Total');
      return document.body.innerText.slice(idx, idx + 80);
    });
    console.log('Top total label BEFORE frequency change:', JSON.stringify(topLabelBefore));

    if (freqDropdownsAfterBusiness.length >= 2) {
      const secondId = freqDropdownsAfterBusiness[1].id;
      await page.locator(`[id="${secondId}"]`).selectOption({ label: 'Yearly' });
      await waitForSettle(page, 1500);
      const topLabelAfter = await page.evaluate(() => {
        const idx = document.body.innerText.indexOf('Total');
        return document.body.innerText.slice(idx, idx + 80);
      });
      console.log('Top total label AFTER diverging frequency (2nd policy -> Yearly):', JSON.stringify(topLabelAfter));

      // === 7. AC14: tooltip near "Total Annualised" label ===
      console.log('\n=== 7. AC14: tooltip icon near Total Annualised label ===');
      const tooltipIcons = await page.evaluate(() => {
        const idx = document.body.innerText.indexOf('Total Annualised');
        if (idx === -1) return { found: false };
        // find tooltip-like icons (svg/i) near any element containing this text
        const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.innerText && e.innerText.trim().startsWith('Total Annualised'));
        if (!el) return { found: true, textFound: true, elFound: false };
        const parent = el.closest('div');
        const icons = parent ? [...parent.querySelectorAll('svg, i, [class*="tooltip"], [class*="info"]')].map((i) => ({ tag: i.tagName, cls: i.className.toString().slice(0, 60), title: i.getAttribute('title') || i.getAttribute('aria-label') })) : [];
        return { found: true, textFound: true, elFound: true, parentText: parent ? parent.innerText.slice(0, 200) : null, icons };
      });
      console.log(JSON.stringify(tooltipIcons, null, 2));

      // Unify frequency back (AC12)
      await page.locator(`[id="${secondId}"]`).selectOption({ label: 'Monthly' });
      await waitForSettle(page, 1500);
      const topLabelUnified = await page.evaluate(() => {
        const idx = document.body.innerText.indexOf('Total');
        return document.body.innerText.slice(idx, idx + 80);
      });
      console.log('Top total label AFTER re-unifying frequency (AC12):', JSON.stringify(topLabelUnified));
    } else {
      console.log('Only 1 frequency dropdown found — Business policy may need its own priced cover first.');
    }

    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
