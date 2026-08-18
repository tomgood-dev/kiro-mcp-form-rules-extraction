/**
 * Intentional fail — tests the formatted error output.
 * Environment variables: BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD
 */

const { test } = require('@playwright/test');

test.setTimeout(60_000);

function fail(step, reason, details = '') {
  const msg = [
    '',
    '╔══════════════════════════════════════════════════════════════╗',
    `║  STEP FAILED: ${step}`,
    '╠══════════════════════════════════════════════════════════════╣',
    `║  Reason: ${reason}`,
    details ? `║  Details: ${details}` : null,
    '╚══════════════════════════════════════════════════════════════╝',
    '',
  ].filter(Boolean).join('\n');
  throw new Error(msg);
}

test('Intentional fail - testing error format', async ({ page }) => {
  const BASE_URL = (process.env.BASE_URL || '').trim();

  await page.goto(`${BASE_URL}/QuoteAndApply/`, {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(3000);

  fail('Business Rule PD-28', 'Expected $50,000 cap error but got no error', 'Age=15, Sum Insured=$999,999, Cover=Life');
});
