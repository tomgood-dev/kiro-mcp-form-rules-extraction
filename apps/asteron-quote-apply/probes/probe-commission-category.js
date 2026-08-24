/**
 * Probe #2: Commission Category / Adviser Use modal — nail down label-to-select
 * mapping, Update button enable/disable behavior, confirmation message text,
 * and the multi-IC/RC Flexi Rate scenario (7.5%) before writing the real test.
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

  async function waitSettle(ms) {
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(ms || 500);
  }

  async function dumpLabeledSelects(tag) {
    const data = await page.evaluate(() => {
      function nearestLabelText(el) {
        // Walk up to a reasonable container and grab the text just before this select,
        // by looking at the previous sibling chain and parent's first text-bearing child.
        let node = el;
        for (let depth = 0; depth < 4 && node; depth++) {
          let sib = node.previousElementSibling;
          while (sib) {
            const t = (sib.innerText || '').trim();
            if (t) return t.split('\n')[0].slice(0, 60);
            sib = sib.previousElementSibling;
          }
          node = node.parentElement;
        }
        return null;
      }
      return [...document.querySelectorAll('select')].map(s => ({
        id: s.id,
        label: nearestLabelText(s),
        options: [...s.options].map(o => o.text),
        selected: s.selectedIndex,
        disabled: s.disabled,
      }));
    });
    console.log('\n--- Labeled selects (' + tag + ') ---');
    console.log(JSON.stringify(data, null, 2));
  }

  async function openAdviserUse() {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    await waitSettle(1500);
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
    console.log('Quote priced (Life $500,000).');

    // --- SCENARIO A: Flexi Rate = N/A (default), open Adviser Use, dump labeled selects ---
    await openAdviserUse();
    await dumpLabeledSelects('Flexi Rate = N/A');
    await page.screenshot({ path: 'tools/commission-scenario-a-top.png' });
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tools/commission-scenario-a-scrolled.png' });

    // Try clicking Default for Agency dropdown and changing it, see if Update enables
    const updateBtnBefore = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Update');
      return b ? { disabled: b.disabled, className: b.className } : null;
    });
    console.log('\nUpdate button state BEFORE any change: ' + JSON.stringify(updateBtnBefore));

    // Change Default for Agency select (the one with exactly Upfront/Level 30/Spread 20, no "Please Select")
    const changed = await page.evaluate(() => {
      const sel = [...document.querySelectorAll('select')].find(s => {
        const opts = [...s.options].map(o => o.text);
        return opts.length === 3 && opts.includes('Upfront') && opts.includes('Level 30') && opts.includes('Spread 20') && !opts.includes('Please Select');
      });
      if (!sel) return null;
      sel.value = [...sel.options].find(o => o.text === 'Spread 20').value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      return sel.id;
    });
    console.log('\nChanged Default-for-Agency select id=' + changed + ' to Spread 20');
    await page.waitForTimeout(1000);

    const updateBtnAfter = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Update');
      return b ? { disabled: b.disabled, className: b.className } : null;
    });
    console.log('Update button state AFTER change: ' + JSON.stringify(updateBtnAfter));

    // Change it BACK to Upfront (avoid mutating shared agency state) instead of clicking Update
    await page.evaluate((selId) => {
      const sel = document.getElementById(selId);
      if (sel) {
        sel.value = [...sel.options].find(o => o.text === 'Upfront').value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sel.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, changed);
    await page.waitForTimeout(1000);
    console.log('Reverted Default-for-Agency select back to Upfront (did not click Update — avoiding shared-state mutation).');

    // Close modal
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Close'); if (b) b.click(); });
    await waitSettle(1000);

    // --- SCENARIO B: Flexi Rate = 7.5% (multi IC/RC option per user story Example 2), reopen Adviser Use ---
    const flexiSel = page.locator('select[id*="FlexiRate"]').first();
    await flexiSel.selectOption({ label: '7.5%' });
    await waitSettle(2000);
    console.log('\nFlexi Rate set to 7.5%.');

    await openAdviserUse();
    await dumpLabeledSelects('Flexi Rate = 7.5%');
    await page.screenshot({ path: 'tools/commission-scenario-b.png', fullPage: true });
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Close'); if (b) b.click(); });
    await waitSettle(1000);

    // --- SCENARIO C: Flexi Rate = 30% (should force Nil Commission per AC11) ---
    await flexiSel.selectOption({ label: '30.0%' });
    await waitSettle(2000);
    console.log('\nFlexi Rate set to 30%.');
    const bodyTextAfter30 = await page.evaluate(() => document.body.innerText);
    console.log('Body contains "Nil Comm"? ' + bodyTextAfter30.includes('Nil Comm'));
    const nilIdx = bodyTextAfter30.indexOf('Nil Comm');
    if (nilIdx !== -1) console.log('Snippet: ' + bodyTextAfter30.slice(Math.max(0, nilIdx - 60), nilIdx + 120));

    await openAdviserUse();
    await dumpLabeledSelects('Flexi Rate = 30%');
    await page.screenshot({ path: 'tools/commission-scenario-c.png', fullPage: true });

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
