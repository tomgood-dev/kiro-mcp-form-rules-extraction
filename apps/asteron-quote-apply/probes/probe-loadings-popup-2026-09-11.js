// Probe: map the Loadings pop-up DOM — per-mille inputs (scoped by cover row), the OK/apply
// button, and the post-OK "Loadings have been applied" confirmation. Feeds enter-loadings-v1
// AC04/AC07/AC08 encoding. Run:
//   BASE_URL=... PROBE_ACCT=a node apps/asteron-quote-apply/probes/probe-loadings-popup-2026-09-11.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://outsystems-qa.asteronlife.co.nz';
const ACCT = process.env.PROBE_ACCT || 'a';
const statePath = path.join(__dirname, '..', '.auth', `state-qa-${ACCT}.json`);
const H = require('../helpers/quote-helpers');

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const out = { steps: [] };
  const log = (m) => { console.log(typeof m === 'string' ? m : JSON.stringify(m)); out.steps.push(m); };
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ storageState: statePath, ignoreHTTPSErrors: true, baseURL: BASE_URL });
  const page = await ctx.newPage();
  try {
    const quote = await H.openNewQuote(page);
    await H.setMinimumPersonalDetails(quote, { age: 40, gender: 'Male', occupationCode: '1' });
    await H.activateCover(quote, 'Life');
    await H.fillCalcMask(H.sumInsuredInput(quote, 0), '200000');
    await H.waitForSettle(quote, 1500);
    // Open Loadings.
    await quote.evaluate(() => { const el = [...document.querySelectorAll('button,a,div,span')].find((b) => (b.innerText || '').trim() === 'Loadings'); if (el) el.click(); });
    await H.waitForSettle(quote, 2500);

    // 1. Map every input inside the Loadings modal, with its scoping context (nearest row label + cover).
    const inputs = await quote.evaluate(() => {
      function labelFor(el) {
        // Walk up to a row container, find the leftmost text (cover name) + any label text.
        let n = el, ctx = [];
        for (let d = 0; d < 6 && n; d++) {
          const row = n.closest ? n.closest('tr,[class*="row"],[class*="Row"],li') : null;
          if (row) { const t = (row.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60); if (t) return t; }
          n = n.parentElement;
        }
        return '';
      }
      // Only inputs that are inside a modal/popup layer (not the quote screen behind it).
      const modal = [...document.querySelectorAll('[class*="modal"],[class*="Modal"],[class*="popup"],[class*="Popup"],[role="dialog"]')].filter((m) => m.offsetParent !== null);
      const scope = modal.length ? modal[modal.length - 1] : document.body;
      return [...scope.querySelectorAll('input')].map((i) => ({
        id: i.id, type: i.type, disabled: i.disabled, value: i.value,
        placeholder: i.placeholder, row: labelFor(i),
      }));
    });
    log({ modalInputs: inputs });

    // 2. Map every button/link inside the modal (looking for OK, Cancel, X).
    const btns = await quote.evaluate(() => {
      const modal = [...document.querySelectorAll('[class*="modal"],[class*="Modal"],[class*="popup"],[class*="Popup"],[role="dialog"]')].filter((m) => m.offsetParent !== null);
      const scope = modal.length ? modal[modal.length - 1] : document.body;
      return [...scope.querySelectorAll('button,a')].filter((b) => b.offsetParent !== null).map((b) => ({
        text: (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30), cls: String(b.className).slice(0, 60), id: b.id,
      }));
    });
    log({ modalButtons: btns });

    // 3. AC07: enter > $20.00 in the Life per-mille field, capture the error message.
    const pmSel = '[id="b25-b16-Input_PerMille"]';
    async function readErrors() {
      return quote.evaluate(() => {
        const t = document.body.innerText || '';
        const m = t.match(/[^\n]*maximum per mille[^\n]*/i);
        return { matched: m ? m[0].trim() : '', hasMax: /maximum per mille/i.test(t) };
      });
    }
    // Use native fill (Playwright) — real reactive input, not raw .value.
    await quote.locator(pmSel).fill('25');
    await quote.locator(pmSel).blur().catch(() => {});
    await H.waitForSettle(quote, 1500);
    const over = await readErrors();
    log({ ac07_over20_value: '25', ac07_error: over });

    // 4. AC07 boundary: exactly 20.00 should be accepted (no max error).
    await quote.locator(pmSel).fill('20');
    await quote.locator(pmSel).blur().catch(() => {});
    await H.waitForSettle(quote, 1500);
    const atBoundary = await readErrors();
    log({ ac07_at20_value: '20', ac07_boundary_error: atBoundary });

    // 5. AC04/AC08: click OK, capture redirect + "Loadings have been applied" confirmation.
    await quote.getByRole('button', { name: 'OK', exact: true }).click({ timeout: 8000 }).catch((e) => log(`OK click err: ${e.message}`));
    await H.waitForSettle(quote, 2500);
    const afterOk = await quote.evaluate(() => {
      const t = document.body.innerText || '';
      return {
        loadingsApplied: /loadings have been applied/i.test(t),
        appliedLine: (t.match(/[^\n]*loadings have been applied[^\n]*/i) || [''])[0].trim(),
        backOnQuote: !![...document.querySelectorAll('input')].find((i) => /Input_SumInsured|SumAssured/i.test(i.id || '')),
      };
    });
    log({ ac04_ac08_after_ok: afterOk });

    fs.writeFileSync(path.join(__dirname, 'probe-loadings-result.json'), JSON.stringify(out, null, 2));
    log('DONE — result written');
  } catch (e) {
    log(`ERROR: ${e.message}`);
    fs.writeFileSync(path.join(__dirname, 'probe-loadings-result.json'), JSON.stringify(out, null, 2));
  } finally {
    await page.waitForTimeout(1500);
    await browser.close();
  }
})();
