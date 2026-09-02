/**
 * Follow-up recon probe #2 for "Premium Details in the Quote Screen" (ACB-2286).
 * Probe #1 (probe-premium-details-recon.js) found:
 *   - A likely bundling-discount discrepancy: Life+TPD (2 covers, both >=$100k) showed
 *     "12.5% (3 covers or more)" instead of the documented "15% (2 covers)" (PREM-19/20).
 *     This probe re-confirms it on a clean, fresh quote (second independent reading).
 *   - AC09's click-target was wrong (clicked the Lump Sum Covers "Life" button, not a
 *     Premium-panel cover line, which added an unwanted 2nd Life cover). Retrying with a
 *     click scoped to the "Life Cover A" text inside the Premium panel.
 *   - AC07/AC08: need the accordion DOM structure for the Premium panel itself and any
 *     per-life "Details" sub-section, not just a flat class dump.
 *   - AC14: need the raw HTML near "Total Annualised Premium (All Lives)" for its tooltip icon.
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

    // === 1. Re-confirm bundling discount: Life $200k + TPD $200k (fresh quote) ===
    console.log('\n=== 1. Bundling discount re-check: Life $200k + TPD $200k ===');
    await activateCover(page, 'Life');
    await fillCalcMask(sumInsuredInput(page, 0), '200000');
    await waitForSettle(page, 1500);
    console.log('After Life only:', await getBundlingDiscount(page));
    await activateCover(page, 'TPD');
    await fillCalcMask(sumInsuredInput(page, 1), '200000');
    await waitForSettle(page, 1500);
    console.log('After Life+TPD:', await getBundlingDiscount(page));

    // === 2. AC09: click "Life Cover A" text specifically inside the Premium panel ===
    console.log('\n=== 2. AC09: click "Life Cover A" inside Premium panel ===');
    const beforeClickHtml = await page.evaluate(() => {
      const idx = document.body.innerText.indexOf('Premium');
      // Find the premium panel root: walk up from the "Total Yearly Premium" text node's container
      const candidates = [...document.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.innerText && el.innerText.trim() === 'Life Cover A');
      return candidates.map((el, i) => ({
        i, tag: el.tagName, cls: el.className?.toString().slice(0, 80),
        parentOuterHTML: el.parentElement ? el.parentElement.outerHTML.slice(0, 400) : null,
      }));
    });
    console.log('Candidates for "Life Cover A" text:', JSON.stringify(beforeClickHtml, null, 2));

    // Click the LAST one (most likely the summary panel copy, since form cards usually show
    // "Life Cover A" as a card heading earlier in DOM order, summary panel later)
    if (beforeClickHtml.length > 0) {
      const clickIdx = beforeClickHtml.length - 1;
      await page.evaluate((idx) => {
        const candidates = [...document.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.innerText && el.innerText.trim() === 'Life Cover A');
        candidates[idx].click();
      }, clickIdx);
      await page.waitForTimeout(1200);
      const afterClick = await page.evaluate(() => {
        // look for any tooltip/popover-like element now visible
        const tooltips = [...document.querySelectorAll('[class*="tooltip"], [class*="popover"], [role="tooltip"]')]
          .filter((el) => el.getBoundingClientRect().width > 0)
          .map((el) => ({ cls: el.className.toString().slice(0, 80), text: el.innerText.slice(0, 200) }));
        return { lumpSumCoversCountNow: document.body.innerText.match(/Lump Sum Covers\n(\d+)/)?.[1], tooltips };
      });
      console.log('After click result:', JSON.stringify(afterClick, null, 2));
    }

    // === 3. AC07/AC08: Premium panel accordion structure (targeted) ===
    console.log('\n=== 3. Premium panel accordion structure ===');
    const premiumAccordion = await page.evaluate(() => {
      // find the element whose innerText starts with "Premium\nTotal"
      const all = [...document.querySelectorAll('div')];
      const root = all.find((el) => el.className.toString().includes('osui-accordion') && el.innerText.trim().startsWith('Premium'));
      if (!root) return { found: false };
      return {
        found: true,
        rootClass: root.className.toString(),
        rootOuterHTMLStart: root.outerHTML.slice(0, 600),
        childAccordionItems: [...root.querySelectorAll('[class*="accordion-item"]')].map((c) => ({
          cls: c.className.toString().slice(0, 100),
          textStart: c.innerText.slice(0, 60).replace(/\n/g, ' | '),
        })),
        titleElements: [...root.querySelectorAll('[class*="title"]')].map((c) => ({
          cls: c.className.toString().slice(0, 100),
          text: c.innerText.slice(0, 60).replace(/\n/g, ' | '),
        })),
      };
    });
    console.log(JSON.stringify(premiumAccordion, null, 2));

    // Try clicking the Premium accordion's own title/header to see if it collapses
    const clickedTitle = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div')];
      const root = all.find((el) => el.className.toString().includes('osui-accordion') && el.innerText.trim().startsWith('Premium'));
      if (!root) return false;
      const title = root.querySelector('[class*="title"]');
      if (!title) return false;
      title.click();
      return true;
    });
    await page.waitForTimeout(1000);
    console.log('Clicked Premium panel title element:', clickedTitle);
    const afterTitleClick = await page.evaluate(() => {
      const all = [...document.querySelectorAll('div')];
      const root = all.find((el) => el.className.toString().includes('osui-accordion') && el.innerText.trim().startsWith('Premium'));
      return root ? { visibleTextLength: root.innerText.length, classAfter: root.className.toString() } : null;
    });
    console.log('Premium panel state after title click:', JSON.stringify(afterTitleClick));

    // === 4. AC14: raw HTML near "Total Yearly Premium" / any "Annualised" text, tooltip icons ===
    console.log('\n=== 4. Looking for any "Annualised" text or tooltip icons near premium totals ===');
    const annualisedCheck = await page.evaluate(() => ({
      hasAnnualisedText: document.body.innerText.includes('Annualised'),
      tooltipIconsNearTotal: (() => {
        const totalEl = [...document.querySelectorAll('*')].find((el) => el.children.length === 0 && el.innerText && el.innerText.trim().startsWith('Total Monthly Premium'));
        if (!totalEl) return null;
        const container = totalEl.closest('div');
        return container ? [...container.parentElement.querySelectorAll('svg, i, [class*="tooltip"], [class*="info"]')].map((i) => ({ tag: i.tagName, cls: i.className.toString().slice(0, 60) })) : null;
      })(),
    }));
    console.log(JSON.stringify(annualisedCheck, null, 2));

    console.log('\n[probe complete]');
  } catch (err) {
    console.error('[probe error]', err);
  } finally {
    await browser.close();
  }
})();
