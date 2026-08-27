/**
 * Clean check of Example 1 (2.5% Flexi Rate): the user story says both the IC/RC
 * pick list AND the per-cover Cover Commission category should default to UPFRONT
 * on first open. Distinguishes "Select All" from the individual "Life Cover" row
 * by nearby label text (same technique as probe-commission-category.js), since a
 * naive option-set fingerprint can't tell them apart - both look like
 * "Please Select" + category names.
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

    const flexiSel = page.locator('select[id*="FlexiRate"]').first();
    await flexiSel.selectOption({ label: '2.5%' });
    await waitSettle(2000);

    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    await waitSettle(1500);

    const data = await page.evaluate(() => {
      function nearestLabelText(el) {
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
        disabled: s.disabled,
        options: [...s.options].map(o => o.text),
        selected: s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : null,
      }));
    });
    console.log('--- All labeled selects, Flexi Rate = 2.5%, Upfront agency default ---');
    console.log(JSON.stringify(data, null, 2));

    await page.screenshot({ path: 'apps/asteron-quote-apply/docs/business-rules/quote-screen/adviser-use-commission/evidence/example1-2.5pct-full-modal.png', fullPage: true });
    console.log('\nScreenshot saved.');

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
