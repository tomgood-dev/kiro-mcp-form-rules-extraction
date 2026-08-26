// Logs in once and saves the authenticated session so every test file/test can
// skip the login flow and jump straight to creating a fresh quote.
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

module.exports = async function globalSetup() {
  const email = process.env.ASTERON_LOGIN_EMAIL;
  const password = process.env.ASTERON_LOGIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ASTERON_LOGIN_EMAIL and ASTERON_LOGIN_PASSWORD (see .env.example) before running tests.');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ');
  const form = page.locator('form.login-form');
  await form.locator('input[type="text"]').first().fill(email);
  await form.locator('input[type="password"]').first().fill(password);
  await form.locator('button[type="submit"]').first().click();

  await page.waitForURL('**/AdviserCentral_Uplift/**', { timeout: 60_000 }).catch(async () => {
    if (page.url().includes('NewLoginRLANZ')) {
      const errorText = await page.locator('form.login-form + div').innerText().catch(() => '');
      throw new Error(`Login failed — still on login page. Message: "${errorText.trim()}"`);
    }
  });

  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  const filename = process.env.AUTH_STATE_FILENAME || 'state.json';
  await page.context().storageState({ path: path.join(authDir, filename) });

  await browser.close();
};
