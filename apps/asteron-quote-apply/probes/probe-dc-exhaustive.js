/**
 * EXHAUSTIVE PROBE: Disability Covers + Income field
 * Tests: Income field location, DC formulas, DC occupation gating, DC exclusivity
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
    console.log('Logged in.');

    // NEW QUOTE
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => { window.open = url => resolve(url); const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote'); if (link) link.click(); setTimeout(() => resolve(null), 3000); }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    console.log('Quote form loaded.\n');

    // Setup: age 35, Male, OCC=AA, Employed, Income $150,000
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 30 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);

    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(2000);
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(2000);

    // ═══════════════════════════════════════
    // 1. FIND INCOME FIELD
    // ═══════════════════════════════════════
    console.log('=== INCOME FIELD ===');
    const allInputs = await page.evaluate(() => {
      return [...document.querySelectorAll('input')].map(i => ({
        id: i.id,
        type: i.type,
        placeholder: i.placeholder,
        value: i.value,
        visible: i.getBoundingClientRect().width > 0
      })).filter(i => i.visible && (i.id.toLowerCase().includes('income') || i.id.toLowerCase().includes('annual') || i.placeholder.toLowerCase().includes('income')));
    });
    console.log('Income-related inputs: ' + JSON.stringify(allInputs, null, 2));

    // Try broader search - look for calc-mask inputs that might be income
    const calcMaskInputs = await page.evaluate(() => {
      return [...document.querySelectorAll('input')].filter(i => {
        const rect = i.getBoundingClientRect();
        return rect.width > 0 && i.id && !i.id.includes('SumInsured') && !i.id.includes('AgeNext');
      }).map(i => ({ id: i.id.substring(0, 60), type: i.type, value: i.value }));
    });
    console.log('All visible inputs (non-SI, non-age): ' + JSON.stringify(calcMaskInputs, null, 2));

    // Enter income value using the first calc-mask style input we can find
    const incomeSelector = await page.evaluate(() => {
      // Look for labels that say "income" or "annual"
      const labels = [...document.querySelectorAll('label, span, div')].filter(el => {
        const t = (el.innerText || '').toLowerCase();
        return (t.includes('income') || t.includes('annual')) && el.getBoundingClientRect().width > 0;
      });
      return labels.map(l => ({ text: l.innerText.trim().substring(0, 50), tag: l.tagName, forAttr: l.getAttribute('for') }));
    });
    console.log('Labels containing "income"/"annual": ' + JSON.stringify(incomeSelector));

    // Try typing into what looks like the income field
    const incomeInput = page.locator('input[id*="Income"]').first();
    const incomeExists = await incomeInput.count();
    if (incomeExists > 0) {
      await incomeInput.scrollIntoViewIfNeeded();
      await incomeInput.click();
      await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '150000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);
      console.log('Income entered: $150,000');
    } else {
      console.log('Income field not found by id*="Income" - trying other patterns');
      // Try matching by nearby label
      const incomeByLabel = await page.evaluate(() => {
        const spans = [...document.querySelectorAll('span, label')];
        const incomeLabel = spans.find(s => s.innerText && s.innerText.includes('Pre-tax'));
        if (!incomeLabel) return null;
        const parent = incomeLabel.closest('.form-group, .OSBlockWidget, div[class*="row"]');
        if (!parent) return null;
        const input = parent.querySelector('input');
        return input ? input.id : null;
      });
      console.log('Income field by label proximity: ' + incomeByLabel);
      if (incomeByLabel) {
        const inp = page.locator('#' + incomeByLabel.replace(/\./g, '\\.'));
        await inp.scrollIntoViewIfNeeded();
        await inp.click();
        for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
        for (const d of '150000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
        await page.keyboard.press('Tab');
        await page.waitForTimeout(2000);
        console.log('Income entered via label-matched field');
      }
    }

    // ═══════════════════════════════════════
    // 2. DISABILITY COVER ACTIVATION: M&L formula (DC-15)
    // ═══════════════════════════════════════
    console.log('\n=== MORTGAGE & LIVING (DC-15) ===');
    // Activate M&L
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Mortgage & Living'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    // Check what appeared - look for new inputs/selects
    const mlFields = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input[id*="Benefit"], input[id*="Monthly"]')].filter(i => i.getBoundingClientRect().width > 0);
      return inputs.map(i => ({ id: i.id.substring(0, 60), value: i.value }));
    });
    console.log('M&L benefit fields: ' + JSON.stringify(mlFields));

    // Focus and blur the benefit field to trigger auto-default (DC-03)
    const mlBenefit = page.locator('input[id*="Benefit"], input[id*="Monthly"]').first();
    const mlBenefitExists = await mlBenefit.count();
    if (mlBenefitExists > 0) {
      await mlBenefit.scrollIntoViewIfNeeded();
      await mlBenefit.click();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);

      const mlValue = await mlBenefit.inputValue();
      console.log('M&L after focus+blur (auto-default): value="' + mlValue + '"');
      // Expected: 45% of $150,000 / 12 = $5,625
      if (mlValue.includes('5,625') || mlValue.includes('5625')) {
        console.log('  DC-15 CONFIRMED: 45% x $150k / 12 = $5,625');
      } else {
        console.log('  DC-15 CHECK: expected $5,625, got "' + mlValue + '"');
      }
    } else {
      // Maybe it's using SumInsured id
      const altFields = await page.evaluate(() => {
        return [...document.querySelectorAll('input')].filter(i => {
          const rect = i.getBoundingClientRect();
          return rect.width > 0 && i.id.includes('SumInsured');
        }).map(i => ({ id: i.id.substring(0, 60), value: i.value }));
      });
      console.log('Alternative SI fields: ' + JSON.stringify(altFields));
    }

    // ═══════════════════════════════════════
    // 3. INCOME PROTECTION formula (DC-21)
    // ═══════════════════════════════════════
    console.log('\n=== INCOME PROTECTION (DC-21) ===');
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Income Protection'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    // Find the IP benefit field (2nd instance)
    const allSIfields = await page.evaluate(() => {
      return [...document.querySelectorAll('input[id*="SumInsured"]')].filter(i => i.getBoundingClientRect().width > 0)
        .map(i => ({ id: i.id.substring(0, 60), value: i.value }));
    });
    console.log('All visible SI fields after IP activation: ' + JSON.stringify(allSIfields));

    // Focus+blur IP benefit field
    if (allSIfields.length >= 2) {
      const ipField = page.locator('input[id*="SumInsured"]').nth(1);
      await ipField.scrollIntoViewIfNeeded();
      await ipField.click();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
      const ipValue = await ipField.inputValue();
      console.log('IP after focus+blur (auto-default): value="' + ipValue + '"');
      // Expected at $150k: 75% of $150k / 12 = $9,375
      if (ipValue.includes('9,375') || ipValue.includes('9375')) {
        console.log('  DC-21 CONFIRMED: 75% x $150k / 12 = $9,375 (all tier 1)');
      } else {
        console.log('  DC-21 CHECK: expected $9,375, got "' + ipValue + '"');
      }
    }

    // ═══════════════════════════════════════
    // 4. WORKABILITY formula (DC-27) + exclusivity (DC-28)
    // ═══════════════════════════════════════
    console.log('\n=== WORKABILITY (DC-27, DC-28) ===');
    // Try activating Workability while M&L is active
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Workability'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    const errorsAfterWork = await page.evaluate(() => {
      return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
        .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
        .map(n => n.innerText.trim());
    });
    const hasExclusivity = errorsAfterWork.some(e => e.includes('not available to be taken in conjunction'));
    console.log('Workability + M&L exclusivity error: ' + hasExclusivity);
    console.log('Errors: ' + errorsAfterWork.filter(e => e.includes('Workability') || e.includes('conjunction')).join(' | '));

    // ═══════════════════════════════════════
    // 5. Remove M&L and IP, test Workability alone
    // ═══════════════════════════════════════
    console.log('\n=== WORKABILITY ALONE (DC-27) ===');
    await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
    await page.waitForTimeout(3000);

    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Workability'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    const workSIfields = await page.evaluate(() => {
      return [...document.querySelectorAll('input[id*="SumInsured"]')].filter(i => i.getBoundingClientRect().width > 0)
        .map(i => ({ id: i.id.substring(0, 60), value: i.value }));
    });
    if (workSIfields.length > 0) {
      const workField = page.locator('input[id*="SumInsured"]').first();
      await workField.scrollIntoViewIfNeeded();
      await workField.click();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
      const workValue = await workField.inputValue();
      console.log('Workability after focus+blur: value="' + workValue + '"');
      // Expected at $150k income: min($10k, 75% x $150k / 12) = min($10k, $9,375) = $9,375
      if (workValue.includes('9,375') || workValue.includes('9375')) {
        console.log('  DC-27 CONFIRMED: min($10k, 75% x $150k / 12) = $9,375');
      } else if (workValue.includes('10,000') || workValue.includes('10000')) {
        console.log('  DC-27 CHECK: Got $10,000 - cap applied (income must be >= $160k for cap)');
      } else {
        console.log('  DC-27 CHECK: expected $9,375, got "' + workValue + '"');
      }
    }

    // ═══════════════════════════════════════
    // 6. BUSINESS POLICY - Business Expenses and Farmers Disability
    // ═══════════════════════════════════════
    console.log('\n=== BUSINESS POLICY COVERS ===');
    // Create a Business policy
    const bizBtn = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button, a')].find(b => b.innerText.trim() === 'Business');
      if (btn) { btn.click(); return true; }
      return false;
    });
    await page.waitForTimeout(3000);
    console.log('Business policy created: ' + bizBtn);

    // Check what covers are available on Business
    const bizCovers = await page.evaluate(() => {
      return [...document.querySelectorAll('button')].filter(b => b.className.includes('cover-button'))
        .map(b => b.innerText.trim().split('\n')[0]);
    });
    console.log('Business policy covers: ' + bizCovers.join(', '));

    // ═══════════════════════════════════════
    // 7. MENTAL HEALTH CHECKBOX disabled at BP=2yr (DC-47)
    // ═══════════════════════════════════════
    console.log('\n=== MENTAL HEALTH CHECKBOX (DC-47) ===');
    // Go back to Personal, remove covers, activate M&L
    // Switch back to Personal policy
    const personalLink = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')].filter(l => l.innerText.trim().includes('Personal'));
      return links.length > 0;
    });
    if (personalLink) {
      await page.evaluate(() => {
        const link = [...document.querySelectorAll('a, button')].find(l => l.innerText.trim().includes('Personal 1'));
        if (link) link.click();
      });
      await page.waitForTimeout(2000);
    }

    await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
    await page.waitForTimeout(2000);

    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Mortgage & Living'); if (btn) btn.click(); });
    await page.waitForTimeout(3000);

    // Check Mental Health checkbox state at different Benefit Periods
    const bpDropdown = page.locator('select[id*="BenefitPeriod"], select[id*="Dropdown_WaitingPeriod"]').first();
    const bpExists = await bpDropdown.count();
    if (bpExists > 0) {
      // Get all selects visible in the cover area
      const coverSelects = await page.evaluate(() => {
        return [...document.querySelectorAll('select')].filter(s => s.getBoundingClientRect().width > 0)
          .map(s => ({ id: s.id.substring(0, 60), options: [...s.options].map(o => o.text).slice(0, 5), selectedText: s.options[s.selectedIndex]?.text }));
      });
      console.log('Visible selects after M&L activation: ' + JSON.stringify(coverSelects, null, 2));
    }

  } catch (err) {
    console.error('FATAL ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
