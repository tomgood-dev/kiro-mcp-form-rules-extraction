/**
 * Full flow: Login → Quote → Life Cover → Premium
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180_000);

function fail(step, reason, details = '') {
  const msg = [
    '',
    '╔══════════════════════════════════════════════════════════════╗',
    `║  STEP FAILED: ${step}`,
    '╠══════════════════════════════════════════════════════════════╣',
    `║  Reason: ${reason}`,
    details ? `║  Details: ${details}` : null,
    '╚══════════════════════════════════════════════════════════════╝',
    '',
  ].filter(Boolean).join('\n');
  throw new Error(msg);
}

test('Full flow: Login → Quote → Life Cover → Premium', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();
  const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
  const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

  if (!BASE_URL) fail('Environment', 'BASE_URL is not set');
  if (!LOGIN_EMAIL) fail('Environment', 'LOGIN_EMAIL is not set');
  if (!LOGIN_PASSWORD) fail('Environment', 'LOGIN_PASSWORD is not set');

  // Step 1: Login page
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(5000);

  if (page.url().includes('_error.html'))
    fail('Login Page', 'IP not whitelisted - got error page', page.url());

  const emailField = page.locator('input[type="text"]').first();
  if (!(await emailField.isVisible().catch(() => false)))
    fail('Login Page', 'Login form did not render within 5 seconds', page.url());

  // Step 2: Enter credentials
  await emailField.click();
  await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
  await page.locator('button:has-text("Log in")').click();

  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (!page.url().includes('CentralPortalsLogin')) break;
  }

  if (page.url().includes('CentralPortalsLogin'))
    fail('Login', 'Credentials rejected or login timed out (30s)', `Email: ${LOGIN_EMAIL}`);

  // Step 3: Quote list
  await page.goto(`${BASE_URL}/QuoteAndApply/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  if (page.url().includes('_error.html'))
    fail('Quote List', 'QuoteAndApply page blocked', page.url());

  // Step 4: New Quote
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

  if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(() => false)))
    fail('New Quote', 'Quote form did not render - Age field not visible', page.url());

  // Step 5: Personal details
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

  // Step 6: Activate Life cover
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const siField = page.locator('input[id*="SumInsured"]').first();
  if (!(await siField.isVisible().catch(() => false)))
    fail('Life Cover', 'Sum Insured field not visible after clicking Life button');

  // Step 7: Enter Sum Insured
  await siField.scrollIntoViewIfNeeded();
  await siField.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '200000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);

  const hasPremium = await page.evaluate(() => document.body.innerText.includes('$') && document.body.innerText.includes('Total'));
  if (!hasPremium)
    fail('Premium', 'No premium total appeared after entering $200,000 Sum Insured');
});
