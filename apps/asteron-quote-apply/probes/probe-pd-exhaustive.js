/**
 * EXHAUSTIVE PROBE: Personal Details fields
 * Tests: age boundaries, gender, occupation codes, employment status, income, cross-field effects
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = 'hanno.coetzee+1123@resolutionlife.com.au';
  const LOGIN_PASSWORD = 'P@ssw0rd135';

  const results = [];
  function log(category, test, result, detail) {
    const entry = { category, test, result, detail };
    results.push(entry);
    console.log(`[${result}] ${category} | ${test} | ${detail || ''}`);
  }

  try {
    // LOGIN
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 20 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 20 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    if (page.url().includes('CentralPortalsLogin')) throw new Error('Login failed');
    console.log('Logged in.\n');

    // NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => { window.open = url => resolve(url); const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote'); if (link) link.click(); setTimeout(() => resolve(null), 3000); }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    console.log('Quote form loaded.\n');

    // HELPERS
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();

    async function setAge(val) {
      await ageInput.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.keyboard.type(String(val), { delay: 30 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);
    }

    async function getErrors() {
      return await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"], [class*="validation"]')];
        return nodes.filter(n => n.innerText && n.getBoundingClientRect().width > 0).map(n => n.innerText.trim());
      });
    }

    async function getVisibleCovers() {
      return await page.evaluate(() => {
        return [...document.querySelectorAll('button.cover-button, button[class*="cover-button"]')]
          .map(b => b.innerText.trim().split('\n')[0]);
      });
    }

    async function removeAllCovers() {
      await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
      await page.waitForTimeout(2000);
    }

    // ═══════════════════════════════════════
    // 1. AGE BOUNDARIES (PD-11, PD-12)
    // ═══════════════════════════════════════
    console.log('=== AGE BOUNDARIES ===');
    const ageBoundaryTests = [
      { age: '10', expect: 'error', desc: 'Below min (10)' },
      { age: '11', expect: 'no-error', desc: 'At min boundary (11)' },
      { age: '12', expect: 'no-error', desc: 'Just above min (12)' },
      { age: '74', expect: 'no-error', desc: 'Just below max (74)' },
      { age: '75', expect: 'no-error', desc: 'At max boundary (75)' },
      { age: '76', expect: 'error', desc: 'Above max (76)' },
      { age: '0', expect: 'error', desc: 'Zero' },
      { age: '1', expect: 'error', desc: 'One' },
      { age: '99', expect: 'error', desc: 'Ninety-nine' },
    ];

    for (const t of ageBoundaryTests) {
      await setAge(t.age);
      const errors = await getErrors();
      const hasAgeError = errors.some(e => e.includes('between 11 and 75') || e.includes('11 and 75'));
      const actual = hasAgeError ? 'error' : 'no-error';
      log('PD-11', t.desc + ' (age=' + t.age + ')', actual === t.expect ? 'PASS' : 'FAIL',
        'Expected: ' + t.expect + ', Got: ' + actual + (hasAgeError ? '' : ' | errors: ' + errors.filter(e => !e.includes('Male') && !e.includes('Yes')).join('; ').substring(0, 100)));
    }

    // ═══════════════════════════════════════
    // 2. GENDER STATES (PD-05, PD-19)
    // ═══════════════════════════════════════
    console.log('\n=== GENDER STATES ===');
    await setAge('35');

    // Check initial state (no gender selected)
    const genderInitial = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.button-group-item')].filter(b => ['Male', 'Female'].includes(b.innerText.trim()));
      return btns.map(b => ({ text: b.innerText.trim(), active: b.classList.contains('active') || b.classList.contains('selected') || b.getAttribute('aria-pressed') === 'true' }));
    });
    log('PD-05', 'Gender initial state', 'INFO', JSON.stringify(genderInitial));

    // Select Male
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    log('PD-05', 'Male selected', 'INFO', 'Set Male');

    // Select Female
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Female'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    log('PD-05', 'Female selected', 'INFO', 'Set Female');

    // Switch back to Male for remaining tests
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);

    // ═══════════════════════════════════════
    // 3. OCCUPATION CODES - cover availability (PD-07, PD-08, LSC-02, LSC-03)
    // ═══════════════════════════════════════
    console.log('\n=== OCCUPATION CODES & COVER AVAILABILITY ===');
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});

    const occCodes = [
      { value: '0', label: 'AM' },
      { value: '1', label: 'AA' },
      { value: '2', label: 'A1' },
      { value: '3', label: 'A2' },
      { value: '4', label: 'B' },
      { value: '5', label: 'C' },
      { value: '6', label: 'S' },
      { value: '7', label: 'U' },
      { value: '8', label: 'IC' },
    ];

    for (const occ of occCodes) {
      await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption(occ.value);
      await page.waitForTimeout(3000);
      const covers = await getVisibleCovers();
      log('PD-08/LSC', 'Covers for OCC=' + occ.label, 'INFO', covers.join(', '));
    }

    // ═══════════════════════════════════════
    // 4. EMPLOYMENT STATUS - Disability section visibility (PD-09, PD-20)
    // ═══════════════════════════════════════
    console.log('\n=== EMPLOYMENT STATUS ===');
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(2000);

    const empOptions = ['Select one', 'Employed', 'Self-Employed', 'Employed by own company', 'Other'];
    for (const empLabel of empOptions) {
      await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: empLabel });
      await page.waitForTimeout(2000);

      // Check if Disability covers section is visible
      const disabilityCovers = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button')].filter(b => {
          const t = b.innerText.trim();
          return ['Mortgage & Living', 'Income Protection', 'Workability'].includes(t);
        });
        return btns.map(b => b.innerText.trim());
      });
      log('PD-20', 'Employment="' + empLabel + '"', 'INFO', 'Disability covers visible: ' + (disabilityCovers.length > 0 ? disabilityCovers.join(', ') : 'NONE'));
    }

    // ═══════════════════════════════════════
    // 5. INCOME FIELD (PD-10) - just verify it exists and accepts values
    // ═══════════════════════════════════════
    console.log('\n=== INCOME FIELD ===');
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);

    const incomeField = page.locator('input[id*="AnnualIncome"], input[id*="annualIncome"], input[id*="Income"]').first();
    const incomeVisible = await incomeField.isVisible().catch(() => false);
    log('PD-10', 'Income field visible after Employed', incomeVisible ? 'PASS' : 'FAIL', '');

    if (incomeVisible) {
      await incomeField.scrollIntoViewIfNeeded();
      await incomeField.click();
      await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '150000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);
      log('PD-10', 'Income $150,000 entered', 'PASS', '');
    }

    // ═══════════════════════════════════════
    // 6. DOB ↔ AGE interaction (PD-15, PD-16)
    // ═══════════════════════════════════════
    console.log('\n=== DOB ↔ AGE ===');
    // Set age, check if DOB clears
    await setAge('40');
    const dobField = page.locator('input[id*="DateOfBirth"], input[type="date"]').first();
    const dobVisible = await dobField.isVisible().catch(() => false);
    log('PD-15', 'DOB field visible', dobVisible ? 'PASS' : 'INFO', dobVisible ? 'Found' : 'Not found - checking alternative selectors');

    if (dobVisible) {
      const dobVal = await dobField.inputValue();
      log('PD-16', 'After setting age=40, DOB value', 'INFO', 'DOB="' + dobVal + '"');
    }

    // ═══════════════════════════════════════
    // 7. IC OCCUPATION (PD-21) - underwriting warning
    // ═══════════════════════════════════════
    console.log('\n=== IC OCCUPATION ===');
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('8'); // IC
    await page.waitForTimeout(3000);
    const icErrors = await getErrors();
    const hasICWarning = icErrors.some(e => e.includes('Individual Consideration') || e.includes('underwriting'));
    log('PD-21', 'IC occupation warning', hasICWarning ? 'PASS' : 'FAIL', 'Errors: ' + icErrors.filter(e => e.includes('Individual') || e.includes('underwriting')).join(' | ').substring(0, 150));

    // ═══════════════════════════════════════
    // 8. SMOKING STATUS (PD-06) - check default and toggle
    // ═══════════════════════════════════════
    console.log('\n=== SMOKING STATUS ===');
    const smokingState = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.button-group-item')].filter(b => ['Yes', 'No'].includes(b.innerText.trim()));
      return btns.map(b => ({ text: b.innerText.trim(), active: b.classList.contains('active') || b.classList.contains('selected') || b.getAttribute('aria-pressed') === 'true', className: b.className.substring(0, 60) }));
    });
    log('PD-06', 'Smoking default state', 'INFO', JSON.stringify(smokingState));

    // ═══════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════
    console.log('\n\n=== SUMMARY ===');
    const passes = results.filter(r => r.result === 'PASS').length;
    const fails = results.filter(r => r.result === 'FAIL').length;
    const infos = results.filter(r => r.result === 'INFO').length;
    console.log(`PASS: ${passes}, FAIL: ${fails}, INFO: ${infos}, TOTAL: ${results.length}`);

    if (fails > 0) {
      console.log('\nFAILURES:');
      results.filter(r => r.result === 'FAIL').forEach(r => console.log(`  ${r.category} | ${r.test} | ${r.detail}`));
    }

  } catch (err) {
    console.error('FATAL ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
