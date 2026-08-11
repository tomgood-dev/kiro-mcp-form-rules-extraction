const { test, expect } = require('@playwright/test');
const { exploreForm } = require('./explore-form');

const OUT = (process.env.ASTERON_SCREENSHOT_DIR || './screenshots') + '/';
const LOGIN_EMAIL = process.env.ASTERON_LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.ASTERON_LOGIN_PASSWORD;

if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD (see .env.example)');
}

test.describe('AsteronConnect Login', () => {

  test('sign in and screenshot result', async ({ page }) => {
    test.setTimeout(1800000); // 30 minute ceiling for full form exploration
    page.setDefaultTimeout(60000);
    await page.goto(
      'https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ'
    );

    await page.waitForTimeout(3000);
    await page.screenshot({ path: OUT + '01-page-loaded.png', fullPage: true });

    const form = page.locator('form.login-form');
    await form.locator('input[type="text"]').first().fill(LOGIN_EMAIL);
    await form.locator('input[type="password"]').first().fill(LOGIN_PASSWORD);
    await page.screenshot({ path: OUT + '02-credentials-filled.png', fullPage: true });

    await form.locator('button[type="submit"]').first().click();

    // Wait until we land on the Dashboard after login (up to 60s for slow environments)
    await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60000 }).catch(async () => {
      if (page.url().includes('NewLoginRLANZ')) {
        const errorText = await page.locator('form.login-form + div').innerText().catch(() => '');
        throw new Error(`Login failed — still on login page. Message: "${errorText.trim()}"`);
      }
    });

    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.screenshot({ path: OUT + '03-post-login.png', fullPage: true });

    // Navigate to Quote & Apply
    await page.goto('https://outsystems-dev.asteronlife.co.nz/QuoteAndApply', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.locator('text=Loading').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: OUT + '04-quote-and-apply.png', fullPage: true });

    // Click New Quote and capture the new window it opens
    const [newWindow] = await Promise.all([
      page.context().waitForEvent('page'),
      page.getByText('New Quote').click(),
    ]);

    await newWindow.waitForLoadState('domcontentloaded');
    await newWindow.locator('text=Loading').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await newWindow.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await newWindow.screenshot({ path: OUT + '05-new-quote.png', fullPage: true });

    // Hand off to the form explorer — all documentation happens from here
    await exploreForm(newWindow);
  });

});
