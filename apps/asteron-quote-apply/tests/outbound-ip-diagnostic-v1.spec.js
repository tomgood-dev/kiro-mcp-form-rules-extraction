/**
 * IP Diagnostic — Reports the outbound IP address of this Playwright instance.
 * Intentionally fails with the IP in the error message.
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(30_000);

test('DIAGNOSTIC: What is my outbound IP?', async ({ page }) => {
  await page.goto('https://api.ipify.org');
  const ip = await page.locator('body').innerText();
  expect(ip).toBe('INTENTIONAL_FAIL_TO_SHOW_IP: ' + ip);
});
