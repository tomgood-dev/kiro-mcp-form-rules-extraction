/**
 * DIAGNOSTIC — Single test, sequential steps.
 * Fails at the first broken step with the step name in the error.
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(120_000);

test('Full flow: Login → Quote List → New Quote → Fill Form', async ({ page }) => {
  const BASE_URL = process.env.BASE_URL;
  const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
  const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

  // STEP 1
  expect(BASE_URL, 'STEP 1 FAIL: BASE_URL not set').toBeTruthy();
  expect(LOGIN_EMAIL, 'STEP 1 FAIL: LOGIN_EMAIL not set').toBeTruthy();
  expect(LOGIN_PASSWORD, 'STEP 1 FAIL: LOGIN_PASSWORD not set').toBeTruthy();

  // STEP 2
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);
  expect(page.url().includes('_error.html'), 'STEP 2 FAIL: Got error page (IP not whitelisted)').toBe(false);

  // STEP 3
  const emailField = page.locator('input[type="text"]').first();
  const formVisible = await emailField.isVisible().catch(() => false);
  expect(formVisible, 'STEP 3 FAIL: Login form did not render').toBe(true);

  // STEP 4
  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(10000);
  const postLoginUrl = page.url();
  const loginFailed = postLoginUrl.includes('CentralPortalsLogin') || postLoginUrl.includes('NewLogin');
  expect(loginFailed, 'STEP 4 FAIL: Login did not succeed (still on login page)').toBe(false);

  // STEP 5
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  expect(page.url().includes('_error.html'), 'STEP 5 FAIL: /QuoteAndApply/ got error page').toBe(false);

  // STEP 6
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
  const ageVisible = await ageField.isVisible().catch(() => false);
  expect(ageVisible, 'STEP 6 FAIL: Quote form did not render (Age field not visible)').toBe(true);

  // STEP 7 — Set personal details and activate a cover
  await ageField.click();
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

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const siField = page.locator('input[id*="SumInsured"]').first();
  const siVisible = await siField.isVisible().catch(() => false);
  expect(siVisible, 'STEP 7 FAIL: Life cover Sum Insured field not visible after activation').toBe(true);
});
