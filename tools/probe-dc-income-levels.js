/**
 * FOCUSED PROBE: IP formula at multiple income levels + Workability cap investigation
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

    // Setup base: age 35, Male, AA, Employed
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 30 }); await page.keyboard.press('Tab'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('.button-group-item')].find(b => b.innerText.trim() === 'Male'); if (btn) btn.click(); });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1'); // AA
    await page.waitForTimeout(2000);
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first().selectOption({ label: 'Employed' });
    await page.waitForTimeout(3000);

    // Wait for income field to appear
    await page.locator('input[id*="AnnualIncome"], input[id*="MaskedInput"]').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => console.log('WARNING: income field not visible after 10s'));

    async function enterIncome(digits) {
      // The label says for="b15-Input_AnnualIncome" but the actual input might have a different rendered ID
      // Try multiple selectors
      let field = page.locator('input#b15-Input_AnnualIncome').first();
      let visible = await field.isVisible().catch(() => false);
      if (!visible) {
        field = page.locator('input[id*="AnnualIncome"]').first();
        visible = await field.isVisible().catch(() => false);
      }
      if (!visible) {
        field = page.locator('input[id*="MaskedInput"]').first();
        visible = await field.isVisible().catch(() => false);
      }
      if (!visible) {
        console.log('  WARNING: Income field not found/visible');
        return;
      }
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await page.waitForTimeout(200);
      for (let x = 0; x < 12; x++) await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      for (const d of digits) { await page.keyboard.press(d); await page.waitForTimeout(40); }
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2000);
    }

    async function removeAllCovers() {
      await page.evaluate(() => { [...document.querySelectorAll('a')].filter(a => a.innerText.trim() === 'Remove').forEach(l => l.click()); });
      await page.waitForTimeout(3000);
    }

    async function activateCover(name) {
      await page.evaluate((n) => { const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === n || b.innerText.trim().split('\n')[0] === n); if (btn) btn.click(); }, name);
      await page.waitForTimeout(3000);
    }

    async function getAutoDefault() {
      const field = page.locator('input[id*="Input_SumInsured"]').first();
      await field.scrollIntoViewIfNeeded(); await field.click();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(3000);
      return await field.inputValue();
    }

    async function getCapError() {
      const errors = await page.evaluate(() => {
        return [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')]
          .filter(n => n.innerText && n.getBoundingClientRect().width > 0)
          .map(n => n.innerText.trim());
      });
      return errors.find(e => e.includes('maximum')) || 'NONE';
    }

    // ═══════════════════════════════════════
    // IP at multiple income levels
    // ═══════════════════════════════════════
    console.log('=== INCOME PROTECTION - MULTI-INCOME TEST ===');
    const ipTests = [
      { income: '100000', expected: '6,250', desc: '$100k → 75% / 12 = $6,250' },
      { income: '150000', expected: '9,375', desc: '$150k → 75% / 12 = $9,375' },
      { income: '200000', expected: '12,500', desc: '$200k → 75% / 12 = $12,500' },
      { income: '320000', expected: '20,000', desc: '$320k → 75% / 12 = $20,000' },
      { income: '400000', expected: '23,333', desc: '$400k → tier 1+2' },
      { income: '560000', expected: '30,000', desc: '$560k → tier 1+2 (cap)' },
      { income: '700000', expected: '30,000', desc: '$700k → hard cap $30k' },
    ];

    for (const t of ipTests) {
      await removeAllCovers();
      await enterIncome(t.income);
      await activateCover('Income Protection');
      const val = await getAutoDefault();
      const match = val.replace(/,/g, '') === t.expected.replace(/,/g, '') ? '✓' : '✗';
      console.log(`  ${match} Income $${t.income}: IP default = "${val}" (expected ${t.expected}) [${t.desc}]`);
    }

    // ═══════════════════════════════════════
    // M&L at multiple income levels
    // ═══════════════════════════════════════
    console.log('\n=== MORTGAGE & LIVING - MULTI-INCOME TEST ===');
    const mlTests = [
      { income: '100000', expected: '3,750', desc: '$100k → 45% / 12 = $3,750' },
      { income: '150000', expected: '5,625', desc: '$150k → 45% / 12 = $5,625' },
      { income: '200000', expected: '7,500', desc: '$200k → 45% / 12 = $7,500' },
    ];

    for (const t of mlTests) {
      await removeAllCovers();
      await enterIncome(t.income);
      await activateCover('Mortgage & Living');
      const val = await getAutoDefault();
      const match = val.replace(/,/g, '') === t.expected.replace(/,/g, '') ? '✓' : '✗';
      console.log(`  ${match} Income $${t.income}: M&L default = "${val}" (expected ${t.expected}) [${t.desc}]`);
    }

    // ═══════════════════════════════════════
    // Workability at multiple income levels (looking for $10k cap)
    // ═══════════════════════════════════════
    console.log('\n=== WORKABILITY - MULTI-INCOME TEST ===');
    const workTests = [
      { income: '100000', expected: '6,250', desc: '$100k → min($10k, 75%/12=$6,250) = $6,250' },
      { income: '150000', expected: '9,375', desc: '$150k → min($10k, $9,375) = $9,375' },
      { income: '160000', expected: '10,000', desc: '$160k → min($10k, $10,000) = $10,000' },
      { income: '200000', expected: '10,000', desc: '$200k → min($10k, $12,500) = $10,000 (cap)' },
      { income: '300000', expected: '10,000', desc: '$300k → min($10k, $18,750) = $10,000 (cap)' },
    ];

    for (const t of workTests) {
      await removeAllCovers();
      await enterIncome(t.income);
      await activateCover('Workability');
      const val = await getAutoDefault();
      const match = val.replace(/,/g, '') === t.expected.replace(/,/g, '') ? '✓' : '✗';
      console.log(`  ${match} Income $${t.income}: Work default = "${val}" (expected ${t.expected}) [${t.desc}]`);
    }

  } catch (err) {
    console.error('FATAL ERROR: ' + err.message);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
