/**
 * Probe: independent re-check of the Select IC/RC auto-select behavior at every Flexi
 * Rate documented as having exactly one valid Upfront option (N/A, 2.5%, 7.5%, 15%),
 * plus 12.5% as a control (multiple valid options, auto-select should NOT happen).
 * Deliberately does NOT use helpers/adviser-use-helpers.js's getIcRcSelectInfo — this is
 * a fresh, independent DOM read, per the "verify with a different, minimal script" rule
 * in .kiro/steering/test-expansion-process.md, to rule out a bug in the shared helper
 * itself producing the same wrong reading in both the spec file and this probe.
 * One fresh quote per Flexi Rate (avoids stateful-component carryover) - 5 quotes total,
 * at the documented ~4-5-per-session ceiling, so this stays its own script.
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { openNewQuote, setMinimumPersonalDetails, activateCover, fillCalcMask, sumInsuredInput, waitForSettle } = require(path.join(__dirname, '..', 'helpers', 'quote-helpers'));

const SCENARIOS = [
  { label: 'N/A (default, no change needed)', flexiRateLabel: null },
  { label: '2.5%', flexiRateLabel: '2.5%' },
  { label: '7.5%', flexiRateLabel: '7.5%' },
  { label: '15.0%', flexiRateLabel: '15.0%' },
  { label: '12.5% (control — multiple valid options)', flexiRateLabel: '12.5%' },
];

const screenshotDir = path.join(__dirname, '..', 'test-runs', '_investigation-screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

(async () => {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD env vars.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'https://outsystems-dev.asteronlife.co.nz', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const results = [];

  try {
    await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(email);
    await form.locator('input[type="password"]').first().fill(password);
    await form.locator('button[type="submit"]').first().click();
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 });
    console.log('[login] OK');

    for (const scenario of SCENARIOS) {
      console.log(`\n=== Flexi Rate ${scenario.label} ===`);
      const quote = await openNewQuote(page);
      await setMinimumPersonalDetails(quote, { age: 35, gender: 'Male', occupationCode: '1' });
      await activateCover(quote, 'Life');
      await fillCalcMask(sumInsuredInput(quote, 0), '500000');

      if (scenario.flexiRateLabel) {
        await quote.locator('select[id*="FlexiRate"]').first().selectOption({ label: scenario.flexiRateLabel });
        await waitForSettle(quote, 2000);
      }

      // Open Adviser Use via a fresh, independent evaluate (not the shared helper).
      await quote.evaluate(() => {
        const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use'));
        if (!el) throw new Error('Adviser Use control not found');
        el.click();
      });
      await waitForSettle(quote, 2000);

      // Independent read: find the IC/RC select by the same fingerprint, but as a
      // standalone evaluate call, and dump full raw HTML of its parent row too.
      const raw = await quote.evaluate(() => {
        const sels = [...document.querySelectorAll('select')];
        const icRc = sels.find((s) => {
          const opts = [...s.options].map((o) => o.text);
          return opts.length >= 2 && opts[0] === 'Please Select' && opts.slice(1).every((o) => /^IC-\d+%, RC-\d+%$/.test(o));
        });
        if (!icRc) return { found: false };
        return {
          found: true,
          id: icRc.id,
          disabled: icRc.disabled,
          options: [...icRc.options].map((o) => o.text),
          selectedIndex: icRc.selectedIndex,
          selectedText: icRc.options[icRc.selectedIndex] ? icRc.options[icRc.selectedIndex].text : null,
          parentRowHTML: icRc.closest('div') ? icRc.closest('div').outerHTML.slice(0, 500) : null,
        };
      });
      console.log('  IC/RC select (independent read): ' + JSON.stringify(raw, null, 2));
      results.push({ scenario: scenario.label, ...raw });

      const screenshotPath = path.join(screenshotDir, `ic-rc-${scenario.flexiRateLabel || 'NA'}.png`);
      await quote.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
      console.log('  Screenshot saved: ' + screenshotPath);

      await quote.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Close');
        if (b) b.click();
      });
      await waitForSettle(quote, 1000);
    }
  } catch (err) {
    console.error('FATAL: ' + err.message);
  } finally {
    console.log('\n=== SUMMARY ===');
    for (const r of results) {
      console.log(`${r.scenario}: found=${r.found}, selectedIndex=${r.selectedIndex}, selectedText=${JSON.stringify(r.selectedText)}`);
    }
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(1000);
    await browser.close();
  }
})();
