/**
 * Premium & Bundling Business Rules — single sequential test.
 * Logs in once, validates PREM rules, reports which step fails.
 * 
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(180_000);

test('Premium & Bundling Rules (PREM-23/24)', async ({ page }) => {
  const BASE_URL = process.env.BASE_URL;
  const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
  const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(8000);
  if (page.url().includes('_error.html')) throw new Error('LOGIN: Page blocked (error page)');

  const emailField = page.locator('input[type="text"]').first();
  if (!(await emailField.isVisible().catch(() => false))) throw new Error('LOGIN: Form not rendered');
  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();

  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes('CentralPortalsLogin')) break;
  }
  if (page.url().includes('CentralPortalsLogin')) throw new Error('LOGIN: Failed (still on login page)');

  // ─── OPEN NEW QUOTE ──────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const quoteUrl = await page.evaluate(() => {
    return new Promise((resolve) => {
      window.open = function(url) { resolve(url); };
      const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    });
  });
  if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
  else await page.goto(`${BASE_URL}/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(() => false))) {
    throw new Error('QUOTE FORM: Did not render');
  }

  // ─── SET PERSONAL DETAILS (Age 35, Male, AA) ─────────────────────────────
  const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  await ageInput.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type('35', { delay: 40 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male');
    if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
  });
  await page.waitForTimeout(2000);

  await page.waitForFunction(() => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled, { timeout: 10000 }).catch(() => {});
  await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
  await page.waitForTimeout(2000);

  // ─── RULE PREM-23/24: Bundling requires $100k minimum per cover ──────────

  // Activate Life, set to $100,000
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const lifeSI = page.locator('input[id*="SumInsured"]').first();
  await lifeSI.scrollIntoViewIfNeeded();
  await lifeSI.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '100000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Activate TPD, set to $200,000
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'TPD');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const tpdSI = page.locator('input[id*="SumInsured"]').nth(1);
  await tpdSI.scrollIntoViewIfNeeded();
  await tpdSI.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '200000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Check bundling discount
  const discount = await page.evaluate(() => {
    const text = document.body.innerText;
    const idx = text.indexOf('Bundling Discounts');
    if (idx === -1) return null;
    const chunk = text.slice(idx, idx + 60);
    const line = chunk.split('\n')[1];
    return line ? line.trim() : null;
  });

  if (!discount || !discount.includes('15%')) {
    throw new Error(`PREM-23/24 FAILED: Expected bundling discount "15%". Got: "${discount}"`);
  }
});
