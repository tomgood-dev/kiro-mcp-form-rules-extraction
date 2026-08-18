/**
 * Matches the exact pattern of ip-smoke.spec.js that shows screenshots.
 */

const { test } = require('@playwright/test');

test('Screenshot test - matches ip-smoke pattern', async ({ page }) => {
    await page.goto(
        'https://outsystems-dev.asteronlife.co.nz/QuoteAndApply/'
    );

    await page.waitForLoadState('networkidle');

    // Deliberately fail so screenshot: 'only-on-failure' kicks in.
    throw new Error('Page loaded - capturing screenshot');
});
