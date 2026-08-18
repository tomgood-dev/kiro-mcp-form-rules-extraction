/**
 * LSC-32 only: Specific Injury requires companion cover
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(180_000);

test('LSC-32: Specific Injury requires companion cover', async ({ page }) => {
  try {
    const BASE_URL = (process.env.BASE_URL || '').trim();
    const LOGIN_EMAIL = (process.env.LOGIN_EMAIL || '').trim();
    const LOGIN_PASSWORD = (process.env.LOGIN_PASSWORD || '').trim();

    if (!BASE_URL) throw new Error('FAILED: BASE_URL not set');
    if (!LOGIN_EMAIL) throw new Error('FAILED: LOGIN_EMAIL not set');
    if (!LOGIN_PASSWORD) throw new Error('FAILED: LOGIN_PASSWORD not set');

    // LOGIN
    await page.goto(`${BASE_URL}/CentralPortalsLogin/NewLoginRLANZ`, {
      waitUntil: 'domcontentloaded', timeout: 30000,
    });
    await page.waitForTimeout(5000);

    if (page.url().includes('_error.html'))
      throw new Error('FAILED [Login]: Error page. URL: ' + page.url());

    const emailField = page.locator('input[type="text"]').first();
    if (!(await emailField.isVisible().catch(() => false)))
      throw new Error('FAILED [Login]: Form not rendered. URL: ' + page.url());

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
      throw new Error('FAILED [Login]: Credentials rejected');

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
      throw new Error('FAILED [Quote]: Form not rendered. URL: ' + page.url());

    // SET PERSONAL DETAILS
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

    // ACTIVATE SPECIFIC INJURY
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().split('\n')[0] === 'Specific Injury');
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    // ENTER SUM INSURED $5,000
    const siField = page.locator('input[id*="SumInsured"]').first();
    if (!(await siField.isVisible().catch(() => false)))
      throw new Error('FAILED [LSC-32]: Sum Insured field not visible');

    await siField.scrollIntoViewIfNeeded();
    await siField.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    for (const d of '5000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.waitForTimeout(3000);

    // CLICK APPLY
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.waitForTimeout(3000);

    // CHECK FOR COMPANION COVER ERROR
    const errors = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
      return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
    });
    if (!errors.some(e => e.includes('Specific Injury Lump Sum requires')))
      throw new Error(`FAILED [Rule LSC-32]: Expected companion-cover error. Got: ${errors.join(' | ').substring(0, 200) || 'None'}`);

    // ═══ RULE LSC-19: Major Trauma 300% cap ═══

    // Remove Specific Injury
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

    // Enter Trauma SI = $20,000
    const traumaSI = page.locator('input[id*="SumInsured"]').first();
    if (!(await traumaSI.isVisible().catch(() => false)))
      throw new Error('FAILED [LSC-19]: Trauma Sum Insured not visible');

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

    // Enter Major Trauma SI = $60,001 (exceeds 300% of $20k)
    const majorSI = page.locator('input[id*="SumInsured"]').nth(1);
    if (!(await majorSI.isVisible().catch(() => false)))
      throw new Error('FAILED [LSC-19]: Major Trauma Sum Insured not visible');

    await majorSI.scrollIntoViewIfNeeded();
    await majorSI.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    for (const d of '60001') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Check for 300% cap error
    const errors2 = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
      return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
    });
    if (!errors2.some(e => e.includes('maximum Sum Insured for Major Trauma Benefit')))
      throw new Error(`FAILED [Rule LSC-19]: Expected 300% cap error. Got: ${errors2.join(' | ').substring(0, 200) || 'None'}`);

  } catch (error) {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    throw new Error(error.message);
  }

  await page.locator('button:has-text("Sign out")').click().catch(() => {});
  await page.waitForTimeout(2000);
});
