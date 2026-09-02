/**
 * Step 6 self-verification probe for the 4 unexpected failures in the first live run of
 * multi-lives-and-policies-v1.spec.js (2026-09-02T16-13-49). Determines whether each is a
 * test-technique artifact (fix the test) or a real behaviour/discrepancy (keep the assertion,
 * document). Uses minimal, direct reads — the "verify before writing up" discipline.
 *
 *  MLP-05 / MLP-17: the spec counted occurrences of the literal "Total Yearly Premium" in
 *    body.innerText and expected >= 2 with 2 lives. Got 1. Dump how per-life totals are ACTUALLY
 *    labelled in the right panel with 2 priced lives (the label text may differ, or the panel may
 *    show one grand total + per-life sub-figures under a different heading).
 *  MLP-13: building 10 lives timed out on a click at 15s. Check (a) how many lives were actually
 *    created before the timeout, and (b) whether "Add life" becomes disabled at 10 — i.e. is the
 *    limit real and just slow, or is the interaction wrong?
 *  MLP-29: an errored policy tab was expected to get background-color: var(--color-error-light).
 *    Re-check: after activating Life with blank SI on Personal 1 and adding a Business policy, does
 *    Personal 1 actually carry the error-light style? Dump the actual style attribute.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const {
  openNewQuote,
  setMinimumPersonalDetails,
  activateCover,
  fillCalcMask,
  sumInsuredInput,
  getTotalYearlyPremium,
  waitForSettle,
} = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));
const { clickButtonByLabel } = require(path.join(__dirname, '..', 'helpers', 'outsystems-generic-helpers'));

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

    // ===== MLP-05 / MLP-17: how are per-life totals labelled with 2 priced lives? =====
    console.log('\n=== MLP-05/17: right-panel premium labels with 2 priced lives ===');
    let quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '200000');
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Add life', 'Add life');
    await waitForSettle(quote, 1500);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life');
    await fillCalcMask(sumInsuredInput(quote, 0), '300000');
    await waitForSettle(quote, 1500);
    const panelDump = await quote.evaluate(() => {
      const text = document.body.innerText;
      return {
        totalYearlyPremiumCount: (text.match(/Total Yearly Premium/g) || []).length,
        yearlyPremiumCount: (text.match(/Yearly Premium/g) || []).length,
        totalPremiumCount: (text.match(/Total Premium/g) || []).length,
        // find lines mentioning premium totals
        premiumLines: text.split('\n').filter((l) => /premium|total/i.test(l)).slice(0, 25),
      };
    });
    console.log('  "Total Yearly Premium" count: ' + panelDump.totalYearlyPremiumCount);
    console.log('  "Yearly Premium" count: ' + panelDump.yearlyPremiumCount);
    console.log('  "Total Premium" count: ' + panelDump.totalPremiumCount);
    console.log('  premium/total lines: ' + JSON.stringify(panelDump.premiumLines, null, 2));

    // ===== MLP-29: errored policy tab style =====
    console.log('\n=== MLP-29: errored policy tab style (Life active, SI blank, add Business) ===');
    quote = await openNewQuote(page);
    await setMinimumPersonalDetails(quote);
    await activateCover(quote, 'Life'); // SI blank -> intended error state
    await waitForSettle(quote, 1000);
    await clickButtonByLabel(quote, 'Business', 'Business policy');
    await waitForSettle(quote, 1500);
    const policyStyles = await quote.evaluate(() => {
      return [...document.querySelectorAll('div')]
        .filter((d) => {
          const label = (d.querySelector(':scope > a > span.white-space-nowrap')?.innerText || '').trim();
          return /^(Personal|Business)\s*\d+$/.test(label);
        })
        .map((d) => ({
          label: (d.querySelector(':scope > a > span.white-space-nowrap').innerText || '').trim(),
          style: d.getAttribute('style') || '',
          computedBg: getComputedStyle(d).backgroundColor,
        }));
    });
    console.log('  policy tab styles: ' + JSON.stringify(policyStyles, null, 2));
    const anyErr = await quote.evaluate(() => document.body.innerText.match(/error|required|complete/gi) || []);
    console.log('  error-ish words in body: ' + JSON.stringify([...new Set(anyErr)]));

    // ===== MLP-13: how many lives before add-life disables? (bounded, fast) =====
    console.log('\n=== MLP-13: build lives, watch Add life disabled state (bounded to 4 for speed) ===');
    quote = await openNewQuote(page);
    for (let i = 1; i <= 4; i++) {
      await setMinimumPersonalDetails(quote);
      await activateCover(quote, 'Life');
      await fillCalcMask(sumInsuredInput(quote, 0), '200000');
      await waitForSettle(quote, 800);
      const state = await quote.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').trim().split('\n')[0] === 'Add life');
        const lifeLabels = new Set([...document.querySelectorAll('button.osui-tabs__header-item')].map((b) => (b.innerText || '').trim()).filter((t) => /^Life\s*\d+$/.test(t)));
        return { addLifeExists: !!btn, addLifeDisabled: btn ? btn.disabled : null, lifeCount: lifeLabels.size };
      });
      console.log(`  after life ${i}: ${JSON.stringify(state)}`);
      if (state.addLifeDisabled) { console.log('  Add life disabled — limit reached at ' + state.lifeCount); break; }
      // click add life; wrap in try to see if THIS is where it hangs
      const t0 = Date.now();
      try {
        await clickButtonByLabel(quote, 'Add life', 'Add life');
      } catch (e) {
        console.log('  Add life click FAILED at life ' + i + ': ' + e.message);
        break;
      }
      console.log('  add-life click took ' + (Date.now() - t0) + 'ms');
      await waitForSettle(quote, 1200);
    }
  } catch (err) {
    console.error('FATAL: ' + err.message + '\n' + err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
