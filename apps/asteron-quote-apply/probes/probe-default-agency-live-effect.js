/**
 * Before testing AC12/AC13 (which require Spread 20 as the agency default, not the
 * currently-live Upfront), check whether merely SELECTING a different value in the
 * Default-for-Agency dropdown - without clicking Update - already cascades a live
 * recompute of Select IC/RC / Select All, or whether that only happens once Update
 * is actually clicked (persisting the change).
 *
 * If it recomputes live without Update, AC12/AC13 can be tested with zero shared-state
 * risk. If not, testing them for real would require clicking Update (mutating the
 * agency-wide default) and clicking it again afterward to restore Upfront - a real
 * decision to flag before doing it.
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

  function dumpState() {
    return page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const defaultAgency = sels.find(s => {
        const o = [...s.options].map(x => x.text);
        return o.length === 3 && o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20');
      });
      const icRc = sels.find(s => {
        const o = [...s.options].map(x => x.text);
        return o.length >= 2 && o[0] === 'Please Select' && o.slice(1).every(x => /^IC-\d+%, RC-\d+%$/.test(x));
      });
      const selectAll = sels.find(s => {
        const o = [...s.options].map(x => x.text);
        return o[0] === 'Please Select' && o.slice(1).some(x => ['Upfront', 'Level 30', 'Spread 20'].includes(x));
      });
      return {
        defaultAgency: defaultAgency ? { id: defaultAgency.id, selected: defaultAgency.options[defaultAgency.selectedIndex].text } : null,
        icRc: icRc ? { options: [...icRc.options].map(o => o.text), selected: icRc.options[icRc.selectedIndex].text } : null,
        selectAll: selectAll ? { options: [...selectAll.options].map(o => o.text), selected: selectAll.options[selectAll.selectedIndex].text } : null,
      };
    });
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

    // Set Flexi Rate to 2.5% (a "no Spread20 option" rate per AC12)
    const flexiSel = page.locator('select[id*="FlexiRate"]').first();
    await flexiSel.selectOption({ label: '2.5%' });
    await waitSettle(2000);

    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find(e => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    await waitSettle(1500);

    console.log('--- STATE BEFORE touching Default-for-Agency dropdown (should be Upfront, live default) ---');
    console.log(JSON.stringify(await dumpState(), null, 2));

    // Now SELECT Spread 20 in the Default-for-Agency dropdown WITHOUT clicking Update
    const defaultAgencyId = await page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const match = sels.find(s => {
        const o = [...s.options].map(x => x.text);
        return o.length === 3 && o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20');
      });
      return match ? match.id : null;
    });
    await page.locator('#' + defaultAgencyId).selectOption({ label: 'Spread 20' });
    await page.waitForTimeout(1500);

    console.log('\n--- STATE AFTER selecting Spread 20 in Default-for-Agency dropdown (Update NOT clicked) ---');
    console.log(JSON.stringify(await dumpState(), null, 2));

    // Revert (never click Update)
    await page.locator('#' + defaultAgencyId).selectOption({ label: 'Upfront' });
    await page.waitForTimeout(1000);
    console.log('\nReverted Default-for-Agency back to Upfront (Update never clicked in this probe).');

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
