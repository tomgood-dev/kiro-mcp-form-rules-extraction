/**
 * Evidence capture for 2 confirmed discrepancies vs. the "Select Default Commission
 * Category" user story (ACB-13175), for the Discrepancy Evidence Records in
 * docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/page.md.
 *
 * Finding 1: Update button already enabled on first Adviser Use open (before any change).
 * Finding 2: Select IC/RC default at 7.5% Flexi Rate does not match user story Example 2.
 *
 * Run twice across separate sessions to confirm reproducibility (this is run #2 -
 * run #1 was apps/asteron-quote-apply/probes/probe-commission-category.js, 2026-08-20).
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;
  const EVIDENCE_DIR = 'apps/asteron-quote-apply/docs/confluence-pages/business-rules/quote-screen/adviser-use-commission/evidence';
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  async function waitSettle(ms) {
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(ms || 500);
  }

  async function openAdviserUse() {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    await waitSettle(1500);
  }

  try {
    console.log('=== EVIDENCE CAPTURE RUN — ' + new Date().toISOString() + ' ===');
    console.log('BASE_URL: ' + BASE_URL);
    console.log('Account: ' + LOGIN_EMAIL);

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
    console.log('Quote URL: ' + page.url());

    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find(x => x.innerText.trim() === 'Male'); if (b) { b.scrollIntoView({block:'center'}); b.click(); } });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);
    console.log('Persona: Age 35, Male, OCC AA (value=1)');

    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    const siInput = page.locator('input[id*="SumInsured"]').first();
    await siInput.scrollIntoViewIfNeeded(); await siInput.click(); await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
    for (const d of '500000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await waitSettle(2000);
    const premium = await page.evaluate(() => {
      const idx = document.body.innerText.indexOf('Total Yearly Premium');
      return idx === -1 ? null : document.body.innerText.slice(idx, idx + 40);
    });
    console.log('Cover: Life, Sum Insured $500,000. Priced: ' + premium);

    // ─── FINDING 1: Update button state on first open, Flexi Rate = N/A ───
    await openAdviserUse();
    await page.waitForTimeout(500);

    const updateBtn = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Update');
      return b ? { disabled: b.disabled, className: b.className, outerHTML: b.outerHTML.substring(0, 300) } : null;
    });
    console.log('\n--- FINDING 1: Update button state on first open (no changes made yet) ---');
    console.log(JSON.stringify(updateBtn, null, 2));

    await page.screenshot({ path: EVIDENCE_DIR + '/finding-01-update-button-enabled-on-open.png' });
    console.log('Screenshot saved: ' + EVIDENCE_DIR + '/finding-01-update-button-enabled-on-open.png');

    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Close'); if (b) b.click(); });
    await waitSettle(1000);

    // ─── FINDING 2: Select IC/RC default at Flexi Rate = 7.5% ───
    const flexiSel = page.locator('select[id*="FlexiRate"]').first();
    await flexiSel.selectOption({ label: '7.5%' });
    await waitSettle(2000);
    await openAdviserUse();
    await page.waitForTimeout(500);

    const icRc75 = await page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const match = sels.find(s => {
        const opts = [...s.options].map(o => o.text);
        return opts.length >= 2 && opts[0] === 'Please Select' && opts.slice(1).every(o => /^IC-\d+%, RC-\d+%$/.test(o));
      });
      if (!match) return null;
      return {
        id: match.id,
        options: [...match.options].map(o => o.text),
        selectedIndex: match.selectedIndex,
        selectedText: match.options[match.selectedIndex] ? match.options[match.selectedIndex].text : null,
      };
    });
    console.log('\n--- FINDING 2: Select IC/RC at Flexi Rate = 7.5% ---');
    console.log(JSON.stringify(icRc75, null, 2));

    await page.screenshot({ path: EVIDENCE_DIR + '/finding-02-7.5pct-icrc-default-mismatch.png', fullPage: true });
    console.log('Screenshot saved: ' + EVIDENCE_DIR + '/finding-02-7.5pct-icrc-default-mismatch.png');

    fs.writeFileSync(EVIDENCE_DIR + '/raw-probe-output-run2.json', JSON.stringify({
      capturedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      account: LOGIN_EMAIL,
      persona: 'Age 35, Male, OCC AA, Life cover $500,000',
      finding1_updateButton: updateBtn,
      finding2_icRcAt7_5pct: icRc75,
    }, null, 2));
    console.log('\nRaw JSON evidence saved: ' + EVIDENCE_DIR + '/raw-probe-output-run2.json');

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
