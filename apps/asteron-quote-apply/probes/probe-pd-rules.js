/**
 * Headless probe: test PD-14 (TPD at age 15) and PD-31 (Acc Death at age 71)
 * to determine actual live behavior.
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  if (!LOGIN_EMAIL) throw new Error('Set ASTERON_LOGIN_EMAIL env var before running this probe.');
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;
  if (!LOGIN_PASSWORD) throw new Error('Set ASTERON_LOGIN_PASSWORD env var before running this probe.');

  try {
    // LOGIN
    console.log('[1] Logging in...');
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const emailField = page.locator('input[type="text"]').first();
    await emailField.click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();

    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      if (!page.url().includes('CentralPortalsLogin')) break;
    }
    if (page.url().includes('CentralPortalsLogin')) throw new Error('Login failed');
    console.log('[1] Logged in. URL: ' + page.url());

    // OPEN NEW QUOTE
    console.log('[2] Opening new quote...');
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const quoteUrl = await page.evaluate(() => {
      return new Promise(resolve => {
        window.open = url => resolve(url);
        const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
        if (link) link.click();
        setTimeout(() => resolve(null), 3000);
      });
    });
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    console.log('[2] Quote form loaded. URL: ' + page.url());

    // SET AGE 15, MALE, OCC AA
    console.log('[3] Setting age 15, Male, OCC AA...');
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('15', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male');
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
    });
    await page.waitForTimeout(2000);

    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);

    // === TEST PD-14: TPD at age 15 ===
    console.log('\n=== PD-14: TPD at age 15 ===');
    const siCountBefore = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    console.log('  SI fields before TPD click: ' + siCountBefore);

    // Check if TPD button exists and its state
    const tpdButtonState = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'TPD');
      if (!btn) return { exists: false };
      return {
        exists: true,
        disabled: btn.disabled,
        ariaDisabled: btn.getAttribute('aria-disabled'),
        classList: btn.className,
        innerText: btn.innerText.trim().substring(0, 50)
      };
    });
    console.log('  TPD button state: ' + JSON.stringify(tpdButtonState));

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'TPD');
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    const siCountAfter = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    console.log('  SI fields after TPD click: ' + siCountAfter);

    // Check for errors
    const errorsAfterTPD = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]')];
      return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
    });
    console.log('  Errors after TPD click: ' + JSON.stringify(errorsAfterTPD));

    if (siCountAfter > siCountBefore) {
      console.log('  RESULT: TPD DID activate (new SI field appeared)');
      // Enter SI and check error
      const tpdSI = page.locator('input[id*="SumInsured"]').nth(siCountAfter - 1);
      await tpdSI.scrollIntoViewIfNeeded();
      await tpdSI.click();
      await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (const d of '100000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);

      const errorsAfterSI = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]')];
        return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
      });
      console.log('  Errors after entering SI: ' + JSON.stringify(errorsAfterSI));
    } else {
      console.log('  RESULT: TPD click was a NO-OP');
    }

    // Clean up for next test
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove');
      links.forEach(l => l.click());
    });
    await page.waitForTimeout(3000);

    // === TEST PD-31: Accidental Death at age 71 ===
    console.log('\n=== PD-31: Accidental Death at age 71 ===');
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('71', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);

    // Check if Acc Death button exists and its state
    const acdButtonState = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Accidental Death');
      if (!btn) return { exists: false };
      return {
        exists: true,
        disabled: btn.disabled,
        ariaDisabled: btn.getAttribute('aria-disabled'),
        classList: btn.className,
        innerText: btn.innerText.trim().substring(0, 50)
      };
    });
    console.log('  Acc Death button state: ' + JSON.stringify(acdButtonState));

    const siCountBefore2 = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    console.log('  SI fields before Acc Death click: ' + siCountBefore2);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Accidental Death');
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    const siCountAfter2 = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    console.log('  SI fields after Acc Death click: ' + siCountAfter2);

    const errorsAfterAcd = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]')];
      return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
    });
    console.log('  Errors after Acc Death click: ' + JSON.stringify(errorsAfterAcd));

    if (siCountAfter2 > siCountBefore2) {
      console.log('  RESULT: Acc Death DID activate (new SI field appeared)');
      // Enter SI to trigger error
      const acdSI = page.locator('input[id*="SumInsured"]').first();
      await acdSI.scrollIntoViewIfNeeded();
      await acdSI.click();
      await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (const d of '100000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);

      const errorsAfterSI2 = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]')];
        return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
      });
      console.log('  Errors after entering SI: ' + JSON.stringify(errorsAfterSI2));
    } else {
      console.log('  RESULT: Acc Death click was a NO-OP');
    }

    // === Also test at age 70 (should work) for comparison ===
    console.log('\n=== CONTROL: Accidental Death at age 70 (should activate) ===');
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove');
      links.forEach(l => l.click());
    });
    await page.waitForTimeout(2000);

    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('70', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);

    const siCountBefore3 = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Accidental Death');
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);
    const siCountAfter3 = await page.evaluate(() => document.querySelectorAll('input[id*="SumInsured"]').length);
    console.log('  SI fields before: ' + siCountBefore3 + ', after: ' + siCountAfter3);
    console.log('  RESULT: ' + (siCountAfter3 > siCountBefore3 ? 'Acc Death activated at age 70 (expected)' : 'Acc Death DID NOT activate at age 70 (unexpected!)'));

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    // Sign out
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
