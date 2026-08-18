/**
 * Business Rules Test — PD-28 (intentionally wrong threshold to test failure output)
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

test('Business Rule PD-28: Life Cover age-band cap', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();
  const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
  const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

  if (!BASE_URL) fail('Environment', 'BASE_URL is not set');
  if (!LOGIN_EMAIL) fail('Environment', 'LOGIN_EMAIL is not set');
  if (!LOGIN_PASSWORD) fail('Environment', 'LOGIN_PASSWORD is not set');

  // LOGIN
  await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(5000);

  if (page.url().includes('_error.html'))
    fail('Login Page', 'IP not whitelisted - got error page', page.url());

  const emailField = page.locator('input[type="text"]').first();
  if (!(await emailField.isVisible().catch(() => false)))
    fail('Login Page', 'Login form did not render', page.url());

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
    fail('Login', 'Credentials rejected or login timed out', `Email: ${LOGIN_EMAIL}`);

  // OPEN NEW QUOTE
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

  if (!(await page.locator('input[id*="Input_AgeNextBirthday"]').first().isVisible().catch(() => false)))
    fail('New Quote', 'Quote form did not render', page.url());

  // SET PERSONAL DETAILS: Age 15, Male, Occupation AA
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

  await page.waitForFunction(() => !document.querySelector('select[id*="OccupationCode_Dropdown"]')?.disabled, { timeout: 10000 }).catch(() => {});
  await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
  await page.waitForTimeout(2000);

  // ACTIVATE LIFE COVER
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  // ENTER SUM INSURED $999,999 (exceeds $50k cap for under-17)
  const siField = page.locator('input[id*="SumInsured"]').first();
  if (!(await siField.isVisible().catch(() => false)))
    fail('Life Cover', 'Sum Insured field not visible after activation');

  await siField.scrollIntoViewIfNeeded();
  await siField.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '999999') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);

  // CHECK FOR ERROR
  const errors = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
  });

  // INTENTIONALLY WRONG: checking for $100,000 cap instead of $50,000
  // This SHOULD fail to demonstrate the error output format
  const hasCapError = errors.some(e => e.includes('100,000'));
  if (!hasCapError) {
    fail(
      'Rule PD-28: Life Cover Age-Band Cap',
      'Expected $100,000 cap error but did not find it',
      `Errors found: ${errors.join(' | ').substring(0, 200)}`
    );
  }
});
