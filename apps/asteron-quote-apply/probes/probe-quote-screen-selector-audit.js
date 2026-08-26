/**
 * Investigates the real DOM shape behind 3 quote-screen/*.spec.js failures whose
 * root cause isn't already resolved by existing business-rules docs:
 *   - kids-cover.spec.js: "Number of Kids" combobox returns an empty options array
 *   - premium-and-bundling.spec.js: getByRole('combobox', {name:'Payment frequency'})
 *     times out
 *   - validation-and-navigation.spec.js VAL-11/VAL-08-10: Apply-flow errors.length was 0
 *     when a blocking error was expected
 * One fresh quote per checkpoint, well under the 4-5 sustained-session cap.
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  if (!LOGIN_EMAIL) throw new Error('Set ASTERON_LOGIN_EMAIL env var.');
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;
  if (!LOGIN_PASSWORD) throw new Error('Set ASTERON_LOGIN_PASSWORD env var.');

  async function waitSettle(ms) {
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(ms || 500);
  }

  async function openFreshQuote() {
    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise((resolve) => {
      window.open = (url) => resolve(url);
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    }));
    let url = quoteUrl;
    if (url && url.indexOf('http') !== 0) url = BASE_URL + (url.indexOf('/') === 0 ? '' : '/') + url;
    if (url) await page.goto(url, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
  }

  try {
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    console.log('Login OK');

    // === CHECKPOINT 1: Kids Cover / Number of Kids, on a totally fresh quote ===
    await openFreshQuote();
    console.log('\n=== CHECKPOINT 1: fresh quote, looking for Kids Cover / Number of Kids ===');
    const kidsInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const idx = bodyText.indexOf('Kids Cover');
      const selects = [...document.querySelectorAll('select')].map((s) => ({
        id: s.id,
        ariaLabel: s.getAttribute('aria-label'),
        name: s.name,
        optionCount: s.options.length,
        firstFewOptions: [...s.options].slice(0, 3).map((o) => o.text),
        visible: s.getBoundingClientRect().width > 0,
      }));
      return {
        kidsCoverSectionFound: idx !== -1,
        kidsCoverContext: idx !== -1 ? bodyText.slice(idx, idx + 200) : null,
        allSelects: selects,
      };
    });
    console.log(JSON.stringify(kidsInfo, null, 2));

    // === CHECKPOINT 2: Payment Frequency selector shape (needs a priced quote) ===
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click(); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 }); await page.keyboard.press('Tab'); await waitSettle(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male'); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } });
    await waitSettle(2000);
    await page.waitForFunction(() => { const el = document.querySelector('select[id*="OccupationCode_Dropdown"]'); return el && !el.disabled; }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await waitSettle(1500);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Life'); if (btn) btn.click(); });
    await waitSettle(1500);
    const siInput = page.locator('input[id*="SumInsured"]').first();
    await siInput.scrollIntoViewIfNeeded(); await siInput.click(); await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
    for (const d of '500000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await waitSettle(2000);

    console.log('\n=== CHECKPOINT 2: priced quote, looking for Payment Frequency control ===');
    const freqInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const idx = bodyText.indexOf('Payment frequency');
      const selects = [...document.querySelectorAll('select')].map((s) => ({
        id: s.id, ariaLabel: s.getAttribute('aria-label'),
        optionCount: s.options.length,
        options: [...s.options].map((o) => o.text),
      })).filter((s) => s.options.some((o) => /monthly|fortnight|quarter/i.test(o)));
      // also check for a non-select "pill" widget near the premium
      const pillCandidates = [...document.querySelectorAll('[class*="frequency" i], [class*="pill" i], [role="button"]')]
        .map((e) => ({ tag: e.tagName, class: e.className, text: e.innerText?.trim().slice(0, 40) }))
        .filter((e) => e.text && /month|fortnight|quarter|year/i.test(e.text));
      return {
        labelTextFound: idx !== -1,
        labelContext: idx !== -1 ? bodyText.slice(idx, idx + 150) : null,
        matchingSelects: selects,
        pillCandidates: pillCandidates.slice(0, 10),
      };
    });
    console.log(JSON.stringify(freqInfo, null, 2));

    // === CHECKPOINT 3: Apply with Employment Status still "Select one" ===
    console.log('\n=== CHECKPOINT 3: click Apply with Employment Status unset, check errors ===');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await waitSettle(2000);
    const applyInfo = await page.evaluate(() => {
      const errNodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
      const errors = errNodes.filter((n) => n.innerText && n.innerText.trim() && n.getBoundingClientRect().width > 0).map((n) => n.innerText.trim());
      return {
        url: window.location.href,
        stillShowsIllustration: document.body.innerText.includes('Illustration'),
        errors: [...new Set(errors)],
        bodySnippet: document.body.innerText.slice(0, 300),
      };
    });
    console.log(JSON.stringify(applyInfo, null, 2));

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
