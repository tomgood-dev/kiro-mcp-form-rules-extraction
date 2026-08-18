/**
 * Full flow test with screenshot-triggering assertions.
 * All assertions use a timeout-based pattern so failures show inline screenshots.
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180_000);

// Helper: fails with a descriptive timeout that triggers an inline screenshot
async function assertOrScreenshot(page, condition, message) {
  if (!condition) {
    await page.locator(`text=${message}`).click({ timeout: 3000 });
  }
}

test('Full flow: Login → Quote → Life Cover → Premium', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();
  const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
  const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

  if (!BASE_URL || !LOGIN_EMAIL || !LOGIN_PASSWORD) {
    await page.locator('text=ENV VARS MISSING: BASE_URL, LOGIN_EMAIL, or LOGIN_PASSWORD not set').click({ timeout: 1000 });
  }

  // LOGIN
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(5000);

  await assertOrScreenshot(page, !page.url().includes('_error.html'), 'FAILED: Login page blocked by IP whitelist');

  const emailField = page.locator('input[type="text"]').first();
  await assertOrScreenshot(page, await emailField.isVisible().catch(() => false), 'FAILED: Login form did not render');

  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();

  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes('CentralPortalsLogin')) break;
  }
  await assertOrScreenshot(page, !page.url().includes('CentralPortalsLogin'), 'FAILED: Login did not succeed after 30s');

  // QUOTE LIST
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await assertOrScreenshot(page, !page.url().includes('_error.html'), 'FAILED: QuoteAndApply page blocked');

  // NEW QUOTE
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

  await assertOrScreenshot(page, await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(() => false), 'FAILED: Quote form did not render');

  // PERSONAL DETAILS
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

  // ACTIVATE LIFE COVER
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const siField = page.locator('input[id*="SumInsured"]').first();
  await assertOrScreenshot(page, await siField.isVisible().catch(() => false), 'FAILED: Life cover Sum Insured field not visible');

  // ENTER SUM INSURED
  await siField.scrollIntoViewIfNeeded();
  await siField.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '200000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);

  const hasPremium = await page.evaluate(() => document.body.innerText.includes('$') && document.body.innerText.includes('Total'));
  await assertOrScreenshot(page, hasPremium, 'FAILED: No premium appeared after entering Sum Insured');
});
