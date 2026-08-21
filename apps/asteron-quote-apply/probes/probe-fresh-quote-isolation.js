/**
 * Determines whether opening a FRESH quote (New Quote navigation) within the SAME
 * browser/login session is sufficient to reset the Adviser Use IC/RC carryover
 * state discovered via probe-clean-single-flexirate.js, or whether only a fully
 * fresh browser session (new login) resets it. This decides how comm-cat-v2.spec.js
 * must be structured within the Test Console's one-test()-per-file constraint.
 *
 * Quote 1: Flexi Rate 7.5%, open Adviser Use (expect IC-75%,RC-100% if isolated).
 * Then open a NEW quote (same session), Flexi Rate 12.5%, open Adviser Use
 * (expect "Please Select" if isolated; expect IC-75%,RC-100% carried over if not).
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL || 'hanno.coetzee+1123@resolutionlife.com.au';
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD || 'P@ssw0rd135';

  async function waitSettle(ms) {
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(ms || 500);
  }

  async function openNewQuote() {
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => {
      window.open = url => resolve(url);
      const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  async function priceMinimalLifeCover() {
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find(x => x.innerText.trim() === 'Male'); if (b) { b.scrollIntoView({block:'center'}); b.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    const siInput = page.locator('input[id*="SumInsured"]').first();
    await siInput.scrollIntoViewIfNeeded(); await siInput.click(); await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
    for (const d of '500000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await waitSettle(2000);
  }

  async function readIcRc(tag) {
    const data = await page.evaluate(() => {
      function nearestLabelText(el) {
        let node = el;
        for (let depth = 0; depth < 4 && node; depth++) {
          let sib = node.previousElementSibling;
          while (sib) { const t = (sib.innerText || '').trim(); if (t) return t.split('\n')[0].slice(0, 60); sib = sib.previousElementSibling; }
          node = node.parentElement;
        }
        return null;
      }
      return [...document.querySelectorAll('select')].map(s => ({
        label: nearestLabelText(s),
        options: [...s.options].map(o => o.text),
        selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : null,
      })).filter(s => (s.label || '').includes('Select IC/RC'));
    });
    console.log('[' + tag + '] Select IC/RC: ' + JSON.stringify(data));
    return data;
  }

  try {
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }

    // --- QUOTE 1: Flexi Rate 7.5% ---
    await openNewQuote();
    await priceMinimalLifeCover();
    await page.locator('select[id*="FlexiRate"]').first().selectOption({ label: '7.5%' });
    await waitSettle(2000);
    await page.evaluate(() => { const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use')); if (el) el.click(); });
    await waitSettle(1500);
    await readIcRc('Quote 1, Flexi Rate 7.5% (expect IC-75%, RC-100%)');
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Close'); if (b) b.click(); });
    await waitSettle(1000);

    // --- QUOTE 2 (fresh "New Quote", SAME browser/login session): Flexi Rate 12.5% ---
    await openNewQuote();
    await priceMinimalLifeCover();
    await page.locator('select[id*="FlexiRate"]').first().selectOption({ label: '12.5%' });
    await waitSettle(2000);
    await page.evaluate(() => { const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use')); if (el) el.click(); });
    await waitSettle(1500);
    await readIcRc('Quote 2 (fresh New Quote, same session), Flexi Rate 12.5% (expect "Please Select" if isolated, IC-75%RC-100% if carried over from Quote 1)');

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
