/**
 * Lump Sum Cover Business Rules — single sequential test.
 * Logs in once, validates LSC rules, reports which step fails.
 * 
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(180_000);

test('Lump Sum Cover Rules (LSC-19, LSC-32)', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();
  const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
  const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

  if (!BASE_URL) throw new Error('BASE_URL env var is empty or not set');
  if (!LOGIN_EMAIL) throw new Error('LOGIN_EMAIL env var is empty or not set');
  if (!LOGIN_PASSWORD) throw new Error('LOGIN_PASSWORD env var is empty or not set');

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  const loginUrl = `${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`;
  try {
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    throw new Error(`GOTO FAILED: Could not reach ${loginUrl}. Error: ${e.message.substring(0, 150)}`);
  }
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

  // ─── SET PERSONAL DETAILS (Age 35, Male, AA, Employed) ───────────────────
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

  // ─── RULE LSC-32: Specific Injury requires companion cover ───────────────
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Specific Injury');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  const siField = page.locator('input[id*="SumInsured"]').first();
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
  if (!errors1.some(e => e.includes('Specific Injury Lump Sum requires'))) {
    throw new Error(`LSC-32 FAILED: Expected companion-cover error. Got: ${JSON.stringify(errors1).substring(0, 300)}`);
  }

  // ─── RULE LSC-19: Major Trauma 300% cap (TRC < $25k) ────────────────────
  // Remove Specific Injury first, then activate Trauma + Major Trauma
  await page.evaluate(() => {
    const links = [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove');
    links.forEach(l => l.click());
  });
  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Trauma');
    if (btn) btn.click();
  });
  await page.waitForTimeout(3000);

  // Fill Trauma SI = $20,000
  const traumaSI = page.locator('input[id*="SumInsured"]').first();
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
  if (!errors2.some(e => e.includes('maximum Sum Insured for Major Trauma Benefit'))) {
    throw new Error(`LSC-19 FAILED: Expected 300% cap error. Got: ${JSON.stringify(errors2).substring(0, 300)}`);
  }
});
