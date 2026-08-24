/**
 * Probe: M&L variants (Agreed Value, Monthly Mortgage) and IP Loss of Earnings
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  if (!LOGIN_EMAIL) throw new Error('Set ASTERON_LOGIN_EMAIL env var before running this probe.');
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;
  if (!LOGIN_PASSWORD) throw new Error('Set ASTERON_LOGIN_PASSWORD env var before running this probe.');

  try {
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 20 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 20 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }

    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => { window.open = url => resolve(url); const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote'); if (link) link.click(); setTimeout(() => resolve(null), 3000); }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Setup: 35, Male, AA, Employed, $150k
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 30 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await page.waitForTimeout(2000);
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);

    // Enter income
    let incomeField = page.locator('input[id*="Input_AnnualIncome"]').first();
    let visible = await incomeField.isVisible().catch(() => false);
    if (!visible) incomeField = page.locator('input[id*="MaskedInput"]').first();
    await incomeField.scrollIntoViewIfNeeded(); await incomeField.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    for (let x = 0; x < 15; x++) await page.keyboard.press('Backspace');
    for (const d of '150000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
    await page.keyboard.press('Tab'); await page.waitForTimeout(2000);

    // ═══════════════════════════════════════
    // TEST 1: M&L with Agreed Value Plus (default) — confirm $5,625
    // ═══════════════════════════════════════
    console.log('=== M&L AGREED VALUE PLUS (default) ===');
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Mortgage & Living'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    // Check current Offset Benefit dropdown value
    const offsetDropdown = page.locator('select[id*="MLCOffsetBenefit"]').first();
    const offsetVal = await offsetDropdown.inputValue().catch(() => 'NOT FOUND');
    console.log('  Offset Benefit current: ' + offsetVal);

    // Focus+blur SI to get auto-default
    const siField = page.locator('input[id*="Input_SumInsured"]').first();
    await siField.scrollIntoViewIfNeeded(); await siField.click();
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    console.log('  Auto-default (Agreed Value Plus): "' + await siField.inputValue() + '"');

    // ═══════════════════════════════════════
    // TEST 2: Switch to Agreed Value — check if cap changes
    // ═══════════════════════════════════════
    console.log('\n=== M&L AGREED VALUE ===');
    await offsetDropdown.selectOption({ label: 'Agreed Value' });
    await page.waitForTimeout(3000);

    // Re-focus+blur SI
    await siField.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    console.log('  Auto-default (Agreed Value): "' + await siField.inputValue() + '"');

    // Try exceeding to see the cap error
    await siField.click();
    for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
    for (const d of '20000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    const avErrors = await page.evaluate(() => {
      return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
        .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
        .map(n => n.innerText.trim());
    });
    const avCapError = avErrors.find(e => e.includes('maximum') && e.includes('Mortgage'));
    console.log('  Cap error at $20k (Agreed Value): ' + (avCapError || 'NONE'));

    // ═══════════════════════════════════════
    // TEST 3: Switch Cover Type to Monthly Mortgage
    // ═══════════════════════════════════════
    console.log('\n=== M&L MONTHLY MORTGAGE COVER TYPE ===');
    const coverTypeDropdown = page.locator('select[id*="Dropdown3"]').first();
    const ctOptions = await coverTypeDropdown.evaluate(el => [...el.options].map(o => o.text));
    console.log('  Cover Type options: ' + ctOptions.join(', '));

    await coverTypeDropdown.selectOption({ label: 'Monthly Mortgage' });
    await page.waitForTimeout(3000);

    // Re-focus+blur SI
    await siField.click();
    await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    console.log('  Auto-default (Monthly Mortgage): "' + await siField.inputValue() + '"');

    // Try exceeding
    await siField.click();
    for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
    for (const d of '20000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
    await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
    const mmErrors = await page.evaluate(() => {
      return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
        .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
        .map(n => n.innerText.trim());
    });
    const mmCapError = mmErrors.find(e => e.includes('maximum') && e.includes('Mortgage'));
    console.log('  Cap error at $20k (Monthly Mortgage): ' + (mmCapError || 'NONE'));

    // Remove M&L
    await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
    await page.waitForTimeout(3000);

    // ═══════════════════════════════════════
    // TEST 4: IP Loss of Earnings (vs default Loss of Earnings Plus)
    // ═══════════════════════════════════════
    console.log('\n=== IP LOSS OF EARNINGS vs PLUS ===');
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Income Protection'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    // Find the IP policy type dropdown
    const ipPolicyDropdowns = await page.evaluate(() => {
      return [...document.querySelectorAll('select')].filter(s => {
        const opts = [...s.options].map(o => o.text);
        return opts.some(o => o.includes('Loss'));
      }).map(s => ({ id: s.id.substring(0, 60), options: [...s.options].map(o => o.text), selected: s.options[s.selectedIndex]?.text }));
    });
    console.log('  IP Policy Type dropdowns: ' + JSON.stringify(ipPolicyDropdowns));

    if (ipPolicyDropdowns.length > 0) {
      // Check default (should be Loss of Earnings Plus)
      const ipSI = page.locator('input[id*="Input_SumInsured"]').first();
      await ipSI.scrollIntoViewIfNeeded(); await ipSI.click();
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
      console.log('  Auto-default (Loss of Earnings Plus): "' + await ipSI.inputValue() + '"');

      // Switch to Loss of Earnings
      const ipPolicyDd = page.locator('select[id*="' + ipPolicyDropdowns[0].id.split('-').pop() + '"]').first();
      // Try selecting by label
      await page.evaluate(() => {
        const sel = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.text.includes('Loss')));
        if (sel) { sel.value = sel.options[0].value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await page.waitForTimeout(3000);

      // Re-check
      await ipSI.click();
      await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.keyboard.press('Tab'); await page.waitForTimeout(3000);
      console.log('  Auto-default (Loss of Earnings): "' + await ipSI.inputValue() + '"');
    }

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
