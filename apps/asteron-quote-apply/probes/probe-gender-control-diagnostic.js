/**
 * Diagnostic: comm-cat-v2.spec.js timed out (15min) apparently stuck with Age filled
 * but Gender never selected. Screenshot showed circular radio-style Gender/Smoking
 * controls, different from the rectangular .button-group-item divs every probe this
 * session has used. Dump the actual DOM to see what changed, if anything.
 */
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const BASE_URL = 'https://outsystems-dev.asteronlife.co.nz';
  const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
  const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

  try {
    console.log('=== GENDER CONTROL DIAGNOSTIC — ' + new Date().toISOString() + ' ===');
    await page.goto(BASE_URL + '/CentralPortalsLogin/NewLoginRLANZ', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    if (page.url().includes('_error.html')) { console.log('NETWORK BLOCKED - error page at login.'); await browser.close(); return; }
    await page.locator('input[type="text"]').first().click();
    await page.keyboard.type(LOGIN_EMAIL, { delay: 30 });
    await page.locator('input[type="password"]').first().click();
    await page.keyboard.type(LOGIN_PASSWORD, { delay: 30 });
    await page.locator('button:has-text("Log in")').click();
    for (let i = 0; i < 30; i++) { await page.waitForTimeout(1000); if (!page.url().includes('CentralPortalsLogin')) break; }
    console.log('Post-login URL: ' + page.url());

    await page.goto(BASE_URL + '/QuoteAndApply/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const quoteUrl = await page.evaluate(() => new Promise(resolve => {
      window.open = url => resolve(url);
      const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      setTimeout(() => resolve(null), 3000);
    }));
    if (quoteUrl) await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
    else await page.goto(BASE_URL + '/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    console.log('Quote URL: ' + page.url());

    // Dump ALL elements near "Gender" text, plus any .button-group-item, plus any radio inputs
    const dump = await page.evaluate(() => {
      const genderHeading = [...document.querySelectorAll('*')].find(el => el.children.length === 0 && el.innerText && el.innerText.trim() === 'Gender');
      const genderContainer = genderHeading ? genderHeading.closest('div')?.parentElement : null;
      const buttonGroupItems = [...document.querySelectorAll('.button-group-item')].map(el => ({ text: el.innerText.trim(), className: el.className }));
      const radioInputs = [...document.querySelectorAll('input[type="radio"]')].map(el => ({ id: el.id, name: el.name, value: el.value, checked: el.checked }));
      const genderAreaHtml = genderContainer ? genderContainer.outerHTML.substring(0, 1500) : 'NOT FOUND';
      return {
        buttonGroupItemCount: buttonGroupItems.length,
        buttonGroupItems: buttonGroupItems,
        radioInputCount: radioInputs.length,
        radioInputs: radioInputs,
        genderAreaHtml: genderAreaHtml,
      };
    });
    console.log('\n--- DOM DUMP ---');
    console.log(JSON.stringify(dump, null, 2));

    await page.screenshot({ path: 'apps/asteron-quote-apply/docs/business-rules/quote-screen/adviser-use-commission/evidence/gender-control-diagnostic.png', fullPage: true });
    console.log('\nScreenshot saved.');

  } catch (err) {
    console.error('ERROR: ' + err.message);
    console.error(err.stack);
  } finally {
    await page.locator('button:has-text("Sign out")').click().catch(() => {});
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
