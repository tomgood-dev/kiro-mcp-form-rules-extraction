/**
 * Sequential flow with named steps.
 * Uses test.step() so each step is labeled in the report.
 * If the Test Suite doesn't show steps, the failure message includes the step name.
 * 
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(240_000);

test('Asteron Quote & Apply - Full Business Rules Validation', async ({ page }) => {
  const BASE_URL = process.env.BASE_URL;
  const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
  const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

  await test.step('01 - Verify environment variables', async () => {
    expect(BASE_URL, 'BASE_URL not set').toBeTruthy();
    expect(LOGIN_EMAIL, 'LOGIN_EMAIL not set').toBeTruthy();
    expect(LOGIN_PASSWORD, 'LOGIN_PASSWORD not set').toBeTruthy();
  });

  await test.step('02 - Navigate to login page', async () => {
    await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);
    expect(page.url().includes('_error.html'), 'Got error page - IP not whitelisted').toBe(false);
  });

  await test.step('03 - Login form renders', async () => {
    const emailField = page.locator('input[type="text"]').first();
    await emailField.waitFor({ state: 'visible', timeout: 15000 });
  });

  await test.step('04 - Enter credentials and login', async () => {
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    await page.waitForTimeout(10000);
    const url = page.url();
    expect(url.includes('CentralPortalsLogin'), 'Still on login page - credentials failed').toBe(false);
  });

  await test.step('05 - Navigate to Quote & Apply list', async () => {
    await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    expect(page.url().includes('_error.html'), 'QuoteAndApply got error page').toBe(false);
  });

  await test.step('06 - Open New Quote form', async () => {
    const quoteUrl = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.open = function(url) { resolve(url); };
        const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
        if (link) link.click();
        setTimeout(() => resolve(null), 3000);
      });
    });
    if (quoteUrl) {
      await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    } else {
      await page.goto(`${BASE_URL}/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(5000);
    const ageField = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageField.waitFor({ state: 'visible', timeout: 15000 });
  });

  await test.step('07 - Set personal details (Age 35, Male, Occupation AA)', async () => {
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.button-group-item')]
        .find(b => b.innerText.trim() === 'Male');
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
    });
    await page.waitForTimeout(2000);

    await page.waitForFunction(
      () => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled,
      { timeout: 10000 }
    ).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);
  });

  await test.step('08 - Activate Life cover', async () => {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);
    const siField = page.locator('input[id*="SumInsured"]').first();
    await siField.waitFor({ state: 'visible', timeout: 10000 });
  });

  await test.step('09 - Enter Sum Insured $200,000 and verify premium appears', async () => {
    const siField = page.locator('input[id*="SumInsured"]').first();
    await siField.scrollIntoViewIfNeeded();
    await siField.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    for (const d of '200000') {
      await page.keyboard.press(d);
      await page.waitForTimeout(60);
    }
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    const hasPremium = await page.evaluate(() => document.body.innerText.includes('Total'));
    expect(hasPremium, 'No premium total appeared after entering Sum Insured').toBe(true);
  });

  await test.step('10 - RULE PD-28: Life Cover $50k cap for Age < 17', async () => {
    // Change age to 15
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('15', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    // Enter oversized Sum Insured
    const siField = page.locator('input[id*="SumInsured"]').first();
    await siField.scrollIntoViewIfNeeded();
    await siField.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    for (const d of '999999') {
      await page.keyboard.press(d);
      await page.waitForTimeout(60);
    }
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    // Check for age-band error
    const errors = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
      return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
    });
    const hasCapError = errors.some(e => e.includes('50,000') || e.includes('under Age Next Birthday 17'));
    expect(hasCapError, `Expected $50k cap error, got: ${errors.join(' | ').substring(0, 200)}`).toBe(true);
  });
});
