/**
 * Follow-up verification for probe-update-save-confirm.js, which found two things
 * worth re-checking with a different, more careful script before writing up as
 * findings (per test-expansion-process.md "verify before writing up"):
 *
 *   1. No confirmation message text was seen in a body-text dump taken ~2s after
 *      clicking Update — but that could just be bad timing (a toast that shows/hides
 *      faster or slower than our single snapshot), not a real absence. This script
 *      polls repeatedly instead of taking one snapshot.
 *   2. A brand-new quote opened in the SAME login session right after clicking
 *      Update still showed the OLD default (Upfront, not the newly-saved Level 30).
 *      Alternative explanation to rule out: the agency default might be cached
 *      client-side for the lifetime of a login session, rather than genuinely not
 *      persisted server-side. This script checks again after a full sign-out/
 *      sign-in (a fresh session), which a client-side cache would not survive but
 *      a real server-side save would.
 *
 * Mutates the shared agency default; reverts to Upfront at the end.
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  if (!LOGIN_EMAIL) throw new Error('Set ASTERON_LOGIN_EMAIL env var before running this probe.');
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;
  if (!LOGIN_PASSWORD) throw new Error('Set ASTERON_LOGIN_PASSWORD env var before running this probe.');

  async function waitSettle(ms) {
    await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(ms || 500);
  }

  async function login() {
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    console.log('Login OK, ' + new Date().toISOString());
  }

  async function signOut() {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(3000);
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

  async function pricedQuote() {
    await openFreshQuote();
    const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
    await ageInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('35', { delay: 40 });
    await page.keyboard.press('Tab');
    await waitSettle(1500);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.button-group-item')].find((x) => x.innerText.trim() === 'Male');
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click(); }
    });
    await waitSettle(2000);
    await page.waitForFunction(() => {
      const el = document.querySelector('select[id*="OccupationCode_Dropdown"]');
      return el && !el.disabled;
    }, { timeout: 10000 }).catch(() => {});
    await page.locator('select[id*="OccupationCode_Dropdown"]').first().selectOption('1');
    await waitSettle(1500);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Life');
      if (btn) btn.click();
    });
    await waitSettle(1500);
    const siInput = page.locator('input[id*="SumInsured"]').first();
    await siInput.scrollIntoViewIfNeeded();
    await siInput.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Backspace'); await page.waitForTimeout(50); }
    for (const d of '500000') { await page.keyboard.press(d); await page.waitForTimeout(60); }
    await page.keyboard.press('Tab');
    await waitSettle(2000);
  }

  async function openAdviserUse() {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a')].find((e) => e.innerText && e.innerText.trim().includes('Adviser Use'));
      if (el) el.click();
    });
    await waitSettle(1500);
  }

  function findDefaultAgencySelectId() {
    return page.evaluate(() => {
      const sels = [...document.querySelectorAll('select')];
      const match = sels.find((s) => {
        const o = [...s.options].map((x) => x.text);
        return o.length === 3 && o.includes('Upfront') && o.includes('Level 30') && o.includes('Spread 20');
      });
      return match ? match.id : null;
    });
  }

  function currentDefaultAgencyValue(id) {
    return page.evaluate((selId) => {
      const s = document.getElementById(selId);
      return s ? s.options[s.selectedIndex].text : null;
    }, id);
  }

  function updateButtonDisabled() {
    return page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Update');
      return btn ? btn.disabled : null;
    });
  }

  function bodyContainsUpdatedText() {
    return page.evaluate(() => {
      const t = document.body.innerText;
      const idx = t.toLowerCase().indexOf('updated');
      if (idx === -1) return null;
      return t.slice(Math.max(0, idx - 60), idx + 60).replace(/\s+/g, ' ').trim();
    });
  }

  async function clickUpdateAndPoll(label) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim().split('\n')[0] === 'Update');
      if (btn) btn.click();
    });
    console.log(`\n--- polling after clicking Update (${label}) ---`);
    for (let t = 0; t <= 6000; t += 500) {
      const [msg, disabled] = await Promise.all([bodyContainsUpdatedText(), updateButtonDisabled()]);
      console.log(`t+${t}ms  updateDisabled=${disabled}  updatedTextFound=${msg ? JSON.stringify(msg) : 'null'}`);
      await page.waitForTimeout(500);
    }
  }

  async function setDefaultAgency(label) {
    const id = await findDefaultAgencySelectId();
    await page.locator('#' + id).selectOption({ label });
    await waitSettle(800);
  }

  try {
    await login();

    // === Session 1: set Level 30, poll for confirmation + button state ===
    await pricedQuote();
    await openAdviserUse();
    console.log('Quote A baseline default:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));
    await setDefaultAgency('Level 30');
    await clickUpdateAndPoll('setting Level 30');

    // Same-session fresh quote check (repeat of earlier probe, for consistency)
    await pricedQuote();
    await openAdviserUse();
    console.log('\nQuote B (same session) default after Update:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));

    // === Session 2: full sign-out/sign-in - does a FRESH SESSION see Level 30? ===
    await signOut();
    await login();
    await pricedQuote();
    await openAdviserUse();
    console.log('\nQuote C (fresh login/session) default:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));

    // Revert to Upfront, poll again
    await setDefaultAgency('Upfront');
    await clickUpdateAndPoll('reverting to Upfront');

    await pricedQuote();
    await openAdviserUse();
    console.log('\nQuote D (same session) default after revert:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));

    // === Session 3: final fresh-login confirmation that revert really persisted ===
    await signOut();
    await login();
    await pricedQuote();
    await openAdviserUse();
    console.log('\nQuote E (fresh login/session) default after revert:', await currentDefaultAgencyValue(await findDefaultAgencySelectId()));

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await signOut();
    await browser.close();
  }
})();
