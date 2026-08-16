/**
 * Network Diagnostic — Forces the IP and connectivity info into FAILURE messages
 * so they're visible in any test reporter (even ones that hide console.log).
 * 
 * These tests INTENTIONALLY FAIL with the diagnostic info in the error message.
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(30_000);

test('DIAGNOSTIC: Report outbound IP (will fail with IP in error message)', async ({ page }) => {
  await page.goto('https://api.ipify.org');
  const ip = await page.locator('body').innerText();
  
  // Force a failure that contains the IP in the error message
  expect(ip, `OUTBOUND_IP=${ip}`).toBe('INTENTIONAL_FAIL_TO_SHOW_IP');
});

test('DIAGNOSTIC: Report connectivity to outsystems-dev (will fail with result in error message)', async ({ page }) => {
  let result = '';
  
  try {
    const response = await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    const status = response?.status() || 'no response';
    const url = page.url();
    result = `REACHABLE=YES | STATUS=${status} | URL=${url}`;
  } catch (e) {
    result = `REACHABLE=NO | ERROR=${e.message.substring(0, 150)}`;
  }

  // Force a failure that contains the connectivity result
  expect(result, result).toBe('INTENTIONAL_FAIL_TO_SHOW_RESULT');
});
