/**
 * Lump Sum Cover Business Rules (LSC-32, LSC-19)
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

test('Lump Sum Cover Rules (LSC-32, LSC-19)', async ({ page }) => {
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

  // SET PERSONAL DETAILS (Age 35, Male, AA, Employed)
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

  await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
  await page.waitForTimeout(2000);

  // ═══ RULE LSC-32: Specific Injury requires companion cover ═══════════════
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Specific Injury');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const siField = page.locator('input[id*="SumInsured"]').first();
  if (!(await siField.isVisible().catch(() => false)))
    fail('Rule LSC-32', 'Specific Injury Sum Insured field not visible after activation');

  await siField.scrollIntoViewIfNeeded();
  await siField.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '5000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);

  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(3000);

  const errors1 = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
  });
  if (!errors1.some(e => e.includes('Specific Injury Lump Sum requires')))
    fail('Rule LSC-32: Companion Cover Required', 'Expected companion-cover error on Apply', `Errors found: ${errors1.join(' | ').substring(0, 200) || 'None'}`);

  // ═══ RULE LSC-19: Major Trauma 300% cap (TRC < $25k) ════════════════════
  // Remove Specific Injury first
  await page.evaluate(() => {
    [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click());
  });
  await page.waitForTimeout(3000);

  // Activate Trauma
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Trauma');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  // Fill Trauma SI = $20,000
  const traumaSI = page.locator('input[id*="SumInsured"]').first();
  if (!(await traumaSI.isVisible().catch(() => false)))
    fail('Rule LSC-19', 'Trauma Sum Insured field not visible');

  await traumaSI.scrollIntoViewIfNeeded();
  await traumaSI.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '20000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Activate Major Trauma
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Major Trauma');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  // Fill Major Trauma SI = $60,001 (exceeds 300% of $20k = $60k)
  const majorSI = page.locator('input[id*="SumInsured"]').nth(1);
  if (!(await majorSI.isVisible().catch(() => false)))
    fail('Rule LSC-19', 'Major Trauma Sum Insured field not visible');

  await majorSI.scrollIntoViewIfNeeded();
  await majorSI.click();
  await page.waitForTimeout(200);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  for (const d of '60001') { await page.keyboard.press(d); await page.waitForTimeout(60); }
  await page.keyboard.press('Tab');
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const errors2 = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
  });
  if (!errors2.some(e => e.includes('maximum Sum Insured for Major Trauma Benefit')))
    fail('Rule LSC-19: Major Trauma 300% Cap', 'Expected 300% cap error (TRC=$20k, Major=$60,001)', `Errors found: ${errors2.join(' | ').substring(0, 200) || 'None'}`);
});

