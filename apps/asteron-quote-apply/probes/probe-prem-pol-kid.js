/**
 * EXHAUSTIVE PROBE: Premium/Bundling, Policy Structure, Kids Cover
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

    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => { window.open = url => resolve(url); const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote'); if (link) link.click(); setTimeout(() => resolve(null), 3000); }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    console.log('Quote loaded.\n');

    // HELPERS
    async function enterCalcMask(selector, digits) {
      const field = page.locator(selector).first();
      await field.scrollIntoViewIfNeeded(); await field.click(); await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (const d of digits) { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    async function activateCover(name) {
      await page.evaluate((n) => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === n || b.innerText.trim().split('\n')[0] === n); if (btn) btn.click(); }, name);
      await page.waitForTimeout(3000);
    }

    async function removeAllCovers() {
      await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
      await page.waitForTimeout(3000);
    }

    async function getErrors() {
      return await page.evaluate(() => {
        return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
          .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
          .map(n => n.innerText.trim());
      });
    }

    async function getBundlingDiscount() {
      return await page.evaluate(() => {
        const text = document.body.innerText;
        const idx = text.indexOf('Bundling Discounts');
        if (idx === -1) return null;
        const chunk = text.slice(idx, idx + 80);
        const lines = chunk.split('\n');
        return lines[1] ? lines[1].trim() : null;
      });
    }

    async function getPremiumText() {
      return await page.evaluate(() => {
        const text = document.body.innerText;
        // Find premium section
        const idx = text.indexOf('Total');
        if (idx === -1) return null;
        return text.slice(idx, idx + 200).replace(/\n/g, ' | ');
      });
    }

    // SETUP: age 35, Male, AA, Employed, $150k income
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

    // Enter income - try multiple selectors
    let incomeField = page.locator('input[id*="Input_AnnualIncome"]').first();
    let incomeVisible = await incomeField.isVisible().catch(() => false);
    if (!incomeVisible) {
      incomeField = page.locator('input[id="b15-b4-MaskedInput"]').first();
      incomeVisible = await incomeField.isVisible().catch(() => false);
    }
    if (!incomeVisible) {
      // Try the approach that worked: any masked input in the PD section
      incomeField = page.locator('input[id*="MaskedInput"]').first();
      incomeVisible = await incomeField.isVisible().catch(() => false);
    }
    if (incomeVisible) {
      await incomeField.scrollIntoViewIfNeeded(); await incomeField.click(); await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '150000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab'); await page.waitForTimeout(2000);
      console.log('Income entered: $150,000');
    } else {
      console.log('WARNING: Income field not found — DC tests may not work');
    }

    // ═══════════════════════════════════════════════════
    // SECTION 1: PREMIUM & BUNDLING
    // ═══════════════════════════════════════════════════
    console.log('══════════════════════════════════════');
    console.log('SECTION 1: PREMIUM & BUNDLING');
    console.log('══════════════════════════════════════');

    // --- PREM-16/17/18: Payment Frequency Conversion ---
    console.log('\n=== PAYMENT FREQUENCY CONVERSION ===');
    await activateCover('Life');
    await enterCalcMask('input[id*="Input_SumInsured"]', '500000');

    // Get premium at Monthly (default)
    const freqDropdown = page.locator('select[id*="PaymentFrequencyDropdown"]').first();
    await freqDropdown.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const currentFreq = await freqDropdown.inputValue();
    console.log('Default frequency: ' + currentFreq);

    // Read the premium amount
    const getPremiumAmount = async () => {
      return await page.evaluate(() => {
        const spans = [...document.querySelectorAll('span, div')];
        const premEl = spans.find(s => {
          const t = s.innerText.trim();
          return t.startsWith('$') && t.includes('.') && !t.includes('Sum') && s.getBoundingClientRect().width > 0 && t.length < 15;
        });
        // Look for the total premium value near "Total" text
        const text = document.body.innerText;
        const totalIdx = text.indexOf('Total');
        if (totalIdx === -1) return null;
        const chunk = text.slice(totalIdx, totalIdx + 100);
        const match = chunk.match(/\$[\d,]+\.\d{2}/);
        return match ? match[0] : null;
      });
    };

    // Test each frequency
    const frequencies = ['Monthly', 'Fortnightly', 'Quarterly', 'Half Yearly', 'Yearly'];
    const premiums = {};

    for (const freq of frequencies) {
      await freqDropdown.selectOption({ label: freq });
      await page.waitForTimeout(2000);
      const premium = await getPremiumAmount();
      premiums[freq] = premium;
      console.log('  ' + freq + ': ' + (premium || 'NOT FOUND'));
    }

    // Verify fortnightly formula: Yearly / 26
    if (premiums['Yearly'] && premiums['Fortnightly']) {
      const yearly = parseFloat(premiums['Yearly'].replace(/[$,]/g, ''));
      const fortnightly = parseFloat(premiums['Fortnightly'].replace(/[$,]/g, ''));
      const expected = Math.round(yearly / 26 * 100) / 100;
      console.log('  Fortnightly check: Yearly(' + yearly + ') / 26 = ' + expected + ', actual = ' + fortnightly + ' → ' + (Math.abs(expected - fortnightly) < 0.02 ? '✓' : '✗'));
    }

    // Verify monthly formula: Yearly / 12
    if (premiums['Yearly'] && premiums['Monthly']) {
      const yearly = parseFloat(premiums['Yearly'].replace(/[$,]/g, ''));
      const monthly = parseFloat(premiums['Monthly'].replace(/[$,]/g, ''));
      const expected = Math.round(yearly / 12 * 100) / 100;
      console.log('  Monthly check: Yearly(' + yearly + ') / 12 = ' + expected + ', actual = ' + monthly + ' → ' + (Math.abs(expected - monthly) < 0.02 ? '✓' : '✗'));
    }

    // Reset to Monthly
    await freqDropdown.selectOption({ label: 'Monthly' });
    await page.waitForTimeout(1000);

    // --- PREM-22 to PREM-25: Bundling thresholds ---
    console.log('\n=== BUNDLING THRESHOLDS ===');

    // 1 cover (Life $500k) — should be "None"
    let discount = await getBundlingDiscount();
    console.log('  1 cover (Life $500k): discount = "' + discount + '"');

    // Add TPD $99,999 — should still be "None" (below $100k threshold)
    await activateCover('TPD');
    await enterCalcMask('input[id*="Input_SumInsured"]:nth-of-type(1)', '99999');
    // Need to target 2nd SI field
    const siFields = page.locator('input[id*="Input_SumInsured"]');
    const siCount = await siFields.count();
    if (siCount >= 2) {
      const tpdField = siFields.nth(1);
      await tpdField.scrollIntoViewIfNeeded(); await tpdField.click(); await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '99999') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    discount = await getBundlingDiscount();
    console.log('  2 covers (Life $500k + TPD $99,999): discount = "' + discount + '" (expected None — TPD below $100k)');

    // Raise TPD to $100,000 — should become 15%
    if (siCount >= 2) {
      const tpdField = siFields.nth(1);
      await tpdField.scrollIntoViewIfNeeded(); await tpdField.click(); await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '100000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    discount = await getBundlingDiscount();
    console.log('  2 covers (Life $500k + TPD $100,000): discount = "' + discount + '" (expected 15%)');

    // Add Trauma $24,999 — should stay 15% (below $25k)
    await activateCover('Trauma');
    const siCount2 = await siFields.count();
    if (siCount2 >= 3) {
      const traumaField = siFields.nth(2);
      await traumaField.scrollIntoViewIfNeeded(); await traumaField.click(); await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '24999') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    discount = await getBundlingDiscount();
    console.log('  3 covers (Life + TPD + Trauma $24,999): discount = "' + discount + '" (expected 15% — Trauma below $25k)');

    // Raise Trauma to $25,000 — should become 20%
    if (siCount2 >= 3) {
      const traumaField = siFields.nth(2);
      await traumaField.scrollIntoViewIfNeeded(); await traumaField.click(); await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      for (const d of '25000') { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    discount = await getBundlingDiscount();
    console.log('  3 covers (Life + TPD + Trauma $25,000): discount = "' + discount + '" (expected 20%)');

    await removeAllCovers();

    // ═══════════════════════════════════════════════════
    // SECTION 2: POLICY STRUCTURE
    // ═══════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════');
    console.log('SECTION 2: POLICY STRUCTURE');
    console.log('══════════════════════════════════════');

    // --- POL-05: Inflation Adj + Premium Freeze mutual exclusion ---
    console.log('\n=== POL-05: INFLATION ADJ vs PREMIUM FREEZE ===');
    const inflChk = page.locator('input#b23-b1-Checkbox_InflationAdjustmentBenefit');
    const freezeChk = page.locator('input#b23-b1-Checkbox_PremiumFreeze');

    const inflBefore = await inflChk.isChecked();
    const freezeBefore = await freezeChk.isChecked();
    console.log('  Initial: Inflation=' + inflBefore + ', Freeze=' + freezeBefore);

    // Check Premium Freeze
    if (!freezeBefore) {
      await freezeChk.scrollIntoViewIfNeeded();
      await freezeChk.click();
      await page.waitForTimeout(2000);
    }
    const inflAfterFreeze = await inflChk.isChecked();
    const freezeAfterFreeze = await freezeChk.isChecked();
    console.log('  After checking Freeze: Inflation=' + inflAfterFreeze + ', Freeze=' + freezeAfterFreeze);
    console.log('  POL-05: ' + (!inflAfterFreeze && freezeAfterFreeze ? '✓ Inflation silently unchecked' : '✗ Expected Inflation to uncheck'));

    // Reset: check Inflation back
    await inflChk.scrollIntoViewIfNeeded();
    await inflChk.click();
    await page.waitForTimeout(2000);
    const inflFinal = await inflChk.isChecked();
    const freezeFinal = await freezeChk.isChecked();
    console.log('  After re-checking Inflation: Inflation=' + inflFinal + ', Freeze=' + freezeFinal);
    console.log('  Reverse: ' + (inflFinal && !freezeFinal ? '✓ Freeze silently unchecked' : '✗ Expected Freeze to uncheck'));

    // --- POL-06: Personal/Business creates new policy ---
    console.log('\n=== POL-06: POLICY CREATION ===');
    // Count current policies
    const policiesBefore = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')].filter(l => {
        const t = l.innerText.trim();
        return t.match(/^(Personal|Business)\s+\d+$/);
      });
      return links.map(l => l.innerText.trim());
    });
    console.log('  Policies before: ' + JSON.stringify(policiesBefore));

    // Click Business
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button, a')].find(b => b.innerText.trim() === 'Business' && !b.innerText.includes('Business 1'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(3000);

    const policiesAfter = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a, button')].filter(l => {
        const t = l.innerText.trim();
        return t.match(/^(Personal|Business)\s+\d+$/);
      });
      return links.map(l => l.innerText.trim());
    });
    console.log('  Policies after clicking Business: ' + JSON.stringify(policiesAfter));
    console.log('  POL-06: ' + (policiesAfter.length > policiesBefore.length ? '✓ New policy created' : '✗ No new policy'));

    // Check covers on Business policy
    const bizCovers = await page.evaluate(() => {
      return [...document.querySelectorAll('button')].filter(b => b.className.includes('cover-button'))
        .map(b => b.innerText.trim().split('\n')[0]);
    });
    console.log('  Business covers: ' + bizCovers.join(', '));

    // --- POL-12: Add Life blocking ---
    console.log('\n=== POL-12: ADD LIFE BLOCKING ===');
    // Switch back to Personal 1
    await page.evaluate(() => {
      const link = [...document.querySelectorAll('a, button')].find(l => l.innerText.trim() === 'Personal 1');
      if (link) link.click();
    });
    await page.waitForTimeout(2000);

    // Add a Life cover but don't complete it properly
    await activateCover('Life');
    // Don't enter SI — try Add Life
    const addLifeResult = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button, a')].find(b => b.innerText.trim() === 'Add life');
      if (btn) { btn.click(); return true; }
      return false;
    });
    await page.waitForTimeout(3000);

    // Check for modal
    const modal = await page.evaluate(() => {
      const modalText = document.querySelector('[class*="modal"], [class*="Modal"], [role="dialog"]');
      return modalText ? modalText.innerText.trim().substring(0, 200) : null;
    });
    console.log('  Add Life clicked (with incomplete Life cover): modal = ' + (modal ? '"' + modal + '"' : 'NONE'));

    // Dismiss modal if present
    if (modal) {
      await page.evaluate(() => {
        const okBtn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'OK');
        if (okBtn) okBtn.click();
      });
      await page.waitForTimeout(2000);
    }

    // ═══════════════════════════════════════════════════
    // SECTION 3: KIDS COVER
    // ═══════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════');
    console.log('SECTION 3: KIDS COVER');
    console.log('══════════════════════════════════════');

    // Remove covers, add proper Life cover first
    await removeAllCovers();
    await activateCover('Life');
    await enterCalcMask('input[id*="Input_SumInsured"]', '200000');

    // --- KID-01: Number of Kids dropdown ---
    console.log('\n=== KID-01: KIDS DROPDOWN ===');
    const kidsDropdown = page.locator('select[id*="b23-b14-Dropdown1"], select[id*="Dropdown1"]').last();
    const kidsVisible = await kidsDropdown.isVisible().catch(() => false);
    console.log('  Kids dropdown visible: ' + kidsVisible);

    if (kidsVisible) {
      const kidsOptions = await kidsDropdown.evaluate(el => [...el.options].map(o => o.text));
      console.log('  Options: ' + kidsOptions.join(', '));

      // Set to 1 kid
      await kidsDropdown.selectOption('1');
      await page.waitForTimeout(3000);

      // Check what appeared
      const kidFields = await page.evaluate(() => {
        const text = document.body.innerText;
        const kidIdx = text.indexOf('Kid 1');
        if (kidIdx === -1) return 'Kid 1 section NOT found';
        return text.slice(kidIdx, kidIdx + 200).replace(/\n/g, ' | ');
      });
      console.log('  After setting 1 kid: ' + kidFields.substring(0, 150));

      // --- KID-06/07: Sum Insured tier dropdown ---
      const kidSIDropdown = await page.evaluate(() => {
        const selects = [...document.querySelectorAll('select')].filter(s => {
          const opts = [...s.options].map(o => o.text);
          return opts.some(o => o.includes('50,000') || o.includes('Free'));
        });
        if (selects.length === 0) return null;
        return [...selects[0].options].map(o => o.text);
      });
      console.log('  Kid SI options: ' + (kidSIDropdown ? kidSIDropdown.join(', ') : 'NOT FOUND'));

      // --- KID-05: DOB field ---
      const kidDOB = await page.evaluate(() => {
        const inputs = [...document.querySelectorAll('input[type="date"]')];
        // Find DOB inputs that appeared after the kid section
        return inputs.filter(i => i.getBoundingClientRect().width > 0).map(i => ({
          id: i.id.substring(0, 50),
          min: i.min,
          max: i.max,
          value: i.value
        }));
      });
      console.log('  DOB fields: ' + JSON.stringify(kidDOB));

      // --- KID-08: Kids without companion cover ---
      console.log('\n=== KID-08: KIDS WITHOUT COMPANION ===');
      await removeAllCovers();
      // Kids are still set to 1 — try Apply
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      await page.waitForTimeout(3000);
      const kidErrors = await getErrors();
      const hasKidDependency = kidErrors.some(e => e.includes('Personal Insurance Cover') || e.includes('at least one'));
      console.log('  Kids without cover — Apply errors: ' + kidErrors.filter(e => e.includes('Kids') || e.includes('Personal Insurance') || e.includes('cover')).join(' | '));
      console.log('  KID-08: ' + (hasKidDependency ? '✓ Dependency error' : '✗ No dependency error'));

      // Reset kids to 0
      await kidsDropdown.selectOption('0');
      await page.waitForTimeout(2000);
    }

    // ═══════════════════════════════════════════════════
    // SECTION 4: NEEDLESTICK FRESH-STATE (clean confirmation)
    // ═══════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════');
    console.log('SECTION 4: NEEDLESTICK FRESH-STATE');
    console.log('══════════════════════════════════════');

    await removeAllCovers();

    // Test Needlestick at each OCC from a FRESH state (no prior OCC changes)
    // We need to track selects to detect activation
    for (const occ of [{ val: '4', name: 'B' }, { val: '1', name: 'AA' }]) {
      await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption(occ.val);
      await page.waitForTimeout(3000);

      const before = await page.evaluate(() => document.querySelectorAll('select').length);
      await activateCover('Needlestick');
      const after = await page.evaluate(() => document.querySelectorAll('select').length);

      const activated = after > before;
      console.log('  OCC=' + occ.name + ': selects before=' + before + ' after=' + after + ' → ' + (activated ? 'ACTIVATED' : 'NO-OP'));

      if (activated) {
        // Remove the cover for clean next test
        await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n══════════════════════════════════════');
    console.log('PROBING COMPLETE');
    console.log('══════════════════════════════════════');

  } catch (err) {
    console.error('FATAL ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
