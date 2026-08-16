/**
 * Network Diagnostic Test — Run this in the OutSystems Test Suite to find
 * the outbound IP address and confirm connectivity to outsystems-dev.
 * 
 * Run: npx playwright test network-diagnostic.spec.js --headed
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(30_000);

test('Diagnostic: What IP does this Playwright instance connect from?', async ({ page }) => {
  // Method A: Navigate to a "what's my IP" service
  await page.goto('https://api.ipify.org');
  const ip = await page.locator('body').innerText();
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  OUTBOUND IP ADDRESS:', ip);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  expect(ip).toBeTruthy();
});

test('Diagnostic: Can this instance reach outsystems-dev.asteronlife.co.nz?', async ({ page }) => {
  let reachable = false;
  let finalUrl = '';
  let errorMsg = '';

  try {
    const response = await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    finalUrl = page.url();
    reachable = response !== null && response.status() < 500;
  } catch (e) {
    errorMsg = e.message.substring(0, 200);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  TARGET: outsystems-dev.asteronlife.co.nz');
  console.log('  REACHABLE:', reachable);
  console.log('  FINAL URL:', finalUrl || 'N/A');
  if (errorMsg) console.log('  ERROR:', errorMsg);
  console.log('═══════════════════════════════════════════════');
  console.log('');

  // This test intentionally passes either way — it's diagnostic only
  expect(true).toBe(true);
});
