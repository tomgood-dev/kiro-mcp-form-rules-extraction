/**
 * Sequential tests sharing one browser page.
 * Requires: --workers=1 (or Playwright config workers:1)
 * 
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 * 
 * @playwright-config: { "workers": 1 }
 */

const { test, expect, chromium } = require('@playwright/test');

test.setTimeout(120_000);

// Shared state across tests (works when workers=1 and serial mode)
let browser;
let page;

test.beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage({ ignoreHTTPSErrors: true });
});

test.afterAll(async () => {
  await browser.close();
});

test.describe.configure({ mode: 'serial' });

test.describe('Asteron Quote & Apply', () => {

  test('01 - Environment variables are set', async () => {
    expect(process.env.BASE_URL).toBeTruthy();
    expect(process.env.LOGIN_EMAIL).toBeTruthy();
    expect(process.env.LOGIN_PASSWORD).toBeTruthy();
  });

  test('02 - Login page loads (no error page)', async () => {
    await page.goto(`${process.env.BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);
    expect(page.url().includes('_error.html')).toBe(false);
  });

  test('03 - Login form renders', async () => {
    const visible = await page.locator('input[type="text"]').first().isVisible().catch(() => false);
    expect(visible).toBe(true);
  });

  test('04 - Login succeeds', async () => {
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(process.env.LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(process.env.LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    await page.waitForTimeout(10000);
    expect(page.url().includes('CentralPortalsLogin')).toBe(false);
  });

  test('05 - Quote & Apply list loads', async () => {
    await page.goto(`${process.env.BASE_URL}/QuoteAndApply/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    expect(page.url().includes('_error.html')).toBe(false);
  });

  test('06 - New Quote form opens', async () => {
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
      await page.goto(`${process.env.BASE_URL}/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(5000);
    const visible = await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(() => false);
    expect(visible).toBe(true);
  });

  test('07 - Personal details set (Age 35, Male, Occ AA)', async () => {
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

    const ageValue = await page.locator('input[id*="Input_AgeNextBirthday"]').first().inputValue();
    expect(ageValue).toBe('35');
  });

  test('08 - Life cover activates with Sum Insured field', async () => {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);
    const visible = await page.locator('input[id*="SumInsured"]').first().isVisible().catch(() => false);
    expect(visible).toBe(true);
  });

  test('09 - Sum Insured $200k triggers premium calculation', async () => {
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
    const hasPremium = await page.evaluate(() => document.body.innerText.includes('$') && document.body.innerText.includes('Total'));
    expect(hasPremium).toBe(true);
  });

  test('10 - RULE PD-28: Age < 17 caps Life at $50,000', async () => {
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('15', { delay: 40 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

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

    const errors = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
      return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
    });
    const hasCapError = errors.some(e => e.includes('50,000') || e.includes('under Age Next Birthday 17'));
    expect(hasCapError).toBe(true);
  });
});
