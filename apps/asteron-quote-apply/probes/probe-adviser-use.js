/**
 * Probe: explore the "Adviser Use" screen (commission category / FlexiRate / IC-RC)
 * referenced in docs/user-stories/User Story- Select Default Commission Category.md
 *
 * Goal: get a priced quote (Life cover with Sum Insured), open Adviser Use, and dump
 * every dropdown/button/label so we know real selectors before writing tests.
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

  try {
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    console.log('Logged in. URL: ' + page.url());

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
    console.log('On quote form. URL: ' + page.url());

    // Minimum personal details: age 35, Male, OCC AA
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male');
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
    });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => {
      const el = document.querySelector('select[id*="OccupationCode_Dropdown"]');
      return el && !el.disabled;
    }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);
    console.log('Personal details set (age 35, Male, OCC AA).');

    // Activate Life cover
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
      if (!btn) throw new Error('Life cover button not found');
      btn.click();
    });
    await page.waitForTimeout(2000);
    console.log('Life cover activated.');

    // Enter Sum Insured
    const siInput = page.locator('input[id*="SumInsured"]').first();
    await siInput.scrollIntoViewIfNeeded();
    await siInput.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
    for (const digit of '500000') { await page.keyboard.press(digit); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('Sum Insured 500000 entered.');

    // Dump Total Yearly Premium to confirm quote is priced
    const premiumText = await page.evaluate(() => {
      const idx = document.body.innerText.indexOf('Total Yearly Premium');
      return idx === -1 ? null : document.body.innerText.slice(idx, idx + 40);
    });
    console.log('Premium text: ' + premiumText);

    // Find Flexi Rate dropdown (POL-04)
    const flexiRate = await page.evaluate(() => {
      const selects = [...document.querySelectorAll('select')];
      const match = selects.find(s => (s.id || '').toLowerCase().includes('flexi') || (s.name || '').toLowerCase().includes('flexi'));
      if (!match) return null;
      return {
        id: match.id,
        options: [...match.options].map(o => o.text),
      };
    });
    console.log('\nFlexi Rate dropdown: ' + JSON.stringify(flexiRate, null, 2));

    // Find "Adviser Use" button/link
    const adviserUseEl = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('button, a')].filter(el => el.innerText && el.innerText.trim().includes('Adviser Use'));
      return candidates.map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        id: el.id,
        className: el.className.substring(0, 80),
        disabled: el.disabled || false,
      }));
    });
    console.log('\n"Adviser Use" elements found: ' + JSON.stringify(adviserUseEl, null, 2));

    if (adviserUseEl.length > 0) {
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('button, a')].find(el => el.innerText && el.innerText.trim().includes('Adviser Use'));
        if (el) el.click();
      });
      await page.waitForTimeout(2000);
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      console.log('\nClicked Adviser Use. URL: ' + page.url());

      // Dump all dropdowns visible now
      const dropdowns = await page.evaluate(() => {
        return [...document.querySelectorAll('select')].map(s => ({
          id: s.id,
          name: s.name,
          disabled: s.disabled,
          options: [...s.options].map(o => o.text),
          selected: s.value,
        }));
      });
      console.log('\nAll <select> dropdowns after opening Adviser Use:');
      console.log(JSON.stringify(dropdowns, null, 2));

      // Dump all buttons visible now (for Update button, etc.)
      const buttons = await page.evaluate(() => {
        return [...document.querySelectorAll('button')].map(b => ({
          text: b.innerText.trim().replace(/\n/g, ' | '),
          id: b.id,
          className: b.className.substring(0, 60),
          disabled: b.disabled,
        })).filter(b => b.text);
      });
      console.log('\nAll buttons after opening Adviser Use:');
      console.log(JSON.stringify(buttons, null, 2));

      // Dump text content mentioning "Default for Agency" / "Commission"
      const commissionText = await page.evaluate(() => {
        const body = document.body.innerText;
        const idx = body.indexOf('Default for Agency');
        const idx2 = body.toLowerCase().indexOf('commission');
        return {
          defaultForAgencySnippet: idx === -1 ? null : body.slice(idx, idx + 200),
          firstCommissionMention: idx2 === -1 ? null : body.slice(Math.max(0, idx2 - 50), idx2 + 200),
        };
      });
      console.log('\nCommission-related text:');
      console.log(JSON.stringify(commissionText, null, 2));

      // Full screenshot for visual reference
      await page.screenshot({ path: 'tools/adviser-use-screenshot.png', fullPage: true });
      console.log('\nScreenshot saved to tools/adviser-use-screenshot.png');
    } else {
      console.log('\nNo "Adviser Use" element found — dumping full body text for investigation:');
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log(bodyText.substring(0, 3000));
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
