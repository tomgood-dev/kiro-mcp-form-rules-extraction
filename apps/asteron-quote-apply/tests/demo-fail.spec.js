/**
 * DEMO: Intentionally failing business rule (fake rule for demonstration)
 * This test demonstrates what a failed business rule check looks like.
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

test('DEMO FAIL - Fake Rule XYZ-99: Life Cover should cap at $10,000 (wrong on purpose)', async ({ page }) => {
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
  if (page.url().includes('CentralPortalsLogin')) {
      const pageText = await page.evaluate(() => document.body.innerText.substring(0, 150).replace(/\n/g, ' '));
      fail('Login', 'Credentials rejected or timed out', `Email: ${LOGIN_EMAIL}. Page shows: ${pageText}`);
    }

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

  // SET AGE 35, Male, Occupation AA
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

  // ACTIVATE LIFE, ENTER $200,000
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Life');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const siField = page.locator('input[id*="SumInsured"]').first();
  await siField.scrollIntoViewIfNeeded();
  await siField.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '200000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);

  // FAKE RULE: Check for a $10,000 cap error that DOESN'T EXIST
  // This is a made-up rule — the real app has no $10,000 cap for adults
  const errors = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
  });

  const hasFakeCapError = errors.some(e => e.includes('10,000'));
  if (!hasFakeCapError) {
    fail(
      'Rule XYZ-99: Life Cover $10,000 Cap (FAKE RULE)',
      'Expected $10,000 cap error but the app does not enforce this rule',
      `This rule does not exist - it is a demo of what a failed test looks like. Actual errors: ${errors.join(' | ').substring(0, 150) || 'None'}`
    );
  }
});

