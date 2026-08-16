/**
 * Network Diagnostic — Multiple strategies to surface the IP address
 * regardless of what the test reporter shows/hides.
 */

const { test, expect } = require('@playwright/test');

test.setTimeout(30_000);

test('DIAGNOSTIC: Get outbound IP', async ({ page }) => {
  await page.goto('https://api.ipify.org');
  const ip = await page.locator('body').innerText();
  
  // Strategy 1: Set page title to the IP (shows in screenshots)
  await page.evaluate((ipAddr) => { document.title = 'IP: ' + ipAddr; }, ip);
  
  // Strategy 2: Make the page content huge and obvious
  await page.evaluate((ipAddr) => {
    document.body.innerHTML = '<h1 style="font-size:80px;color:red;text-align:center;margin-top:100px;">OUTBOUND IP: ' + ipAddr + '</h1>';
  }, ip);

  // Strategy 3: Take a screenshot (if the reporter shows attachments)
  await page.screenshot({ path: 'diagnostic-ip-result.png', fullPage: true });

  // Strategy 4: Fail with a specific error format
  // Using test.info().annotations to try to surface it
  test.info().annotations.push({ type: 'IP_ADDRESS', description: ip });

  // Now fail so the screenshot is captured by the reporter
  expect('IP_RESULT:' + ip).toBe('CHECK_ERROR_DETAILS_OR_SCREENSHOT');
});

test('DIAGNOSTIC: Check outsystems-dev connectivity', async ({ page }) => {
  let result = '';
  
  try {
    const response = await page.goto('https://outsystems-dev.asteronlife.co.nz/CentralPortalsLogin/NewLoginRLANZ', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    result = 'REACHABLE_STATUS_' + (response?.status() || 'null');
  } catch (e) {
    result = 'UNREACHABLE_' + e.message.substring(0, 80).replace(/[^a-zA-Z0-9_.]/g, '_');
  }

  // Make it visible on page for screenshot
  await page.evaluate((r) => {
    document.body.innerHTML = '<h1 style="font-size:60px;color:red;text-align:center;margin-top:100px;">' + r + '</h1>';
  }, result).catch(() => {});

  await page.screenshot({ path: 'diagnostic-connectivity-result.png', fullPage: true }).catch(() => {});

  test.info().annotations.push({ type: 'CONNECTIVITY', description: result });

  expect('CONNECTIVITY:' + result).toBe('CHECK_ERROR_DETAILS_OR_SCREENSHOT');
});
