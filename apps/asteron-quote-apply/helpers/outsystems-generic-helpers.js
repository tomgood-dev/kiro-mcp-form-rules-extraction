// Generic OutSystems interaction primitives - NOT specific to the Quote & Apply
// screen, or even to this app. These encode interaction gotchas that recur on any
// OutSystems Reactive Web screen (calc-mask fields, buttons that miss a plain
// .click() because they trigger a server round-trip, the vscomp type-ahead widget,
// window.open()-based navigation links). If you're building test helpers for a
// different screen (e.g. Apply Flow) or a different OutSystems app entirely, start
// here rather than re-deriving these from scratch - quote-helpers.js builds the
// Quote-screen-specific layer on top of exactly these primitives.
//
// Local-Playwright-run tests only (see README "Key Files") - Test-Console-uploaded
// .spec.js files can't require() an external file and must copy the relevant
// snippet inline instead. Keep this file the canonical, battle-tested source to
// copy from, so inline copies don't quietly drift apart from each other.

/** Waits for the OutSystems "Loading" indicator to clear, plus a short settle buffer. */
async function waitForSettle(page, ms = 400) {
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

/**
 * Correctly enters a value into an OutSystems calc-mask field (Sum Insured,
 * Monthly Benefit, Annual Income, or any other masked numeric input). A plain
 * `.fill()` corrupts these fields - use this instead.
 * @param {import('@playwright/test').Locator} locator
 * @param {string} value - digits only, e.g. "200000"
 * @param {import('@playwright/test').Page} [page] - optional explicit page ref (avoids stale locator.page())
 */
async function fillCalcMask(locator, value, page) {
  const p = page || locator.page();
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
  await p.waitForTimeout(200);
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Backspace');
    await p.waitForTimeout(50);
  }
  await p.waitForTimeout(200);
  for (const digit of String(value).replace(/[^0-9]/g, '')) {
    await p.keyboard.press(digit);
    await p.waitForTimeout(60);
  }
  await p.waitForTimeout(200);
  await p.keyboard.press('Tab');
  await p.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await p.waitForTimeout(2000);
}

/**
 * "Commits" a field's auto-default without typing a value, by focusing then
 * blurring it. Useful wherever an OutSystems field auto-populates a value on blur
 * that you want to accept as-is rather than override.
 * @param {import('@playwright/test').Locator} locator
 */
async function commitWithoutTyping(locator) {
  await locator.click();
  await locator.page().keyboard.press('Tab');
}

/** Returns the array of currently-visible validation error strings on the page. */
async function getVisibleErrors(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[class*="error"], [class*="Error"], [class*="background-error"]')];
    const texts = nodes
      .filter((n) => n.innerText && n.innerText.trim() && n.getBoundingClientRect().width > 0)
      .map((n) => n.innerText.trim());
    return [...new Set(texts)].filter((t) => t !== 'Remove');
  });
}

/** Convenience: asserts at least one visible error contains the given substring. */
async function expectErrorContaining(page, substring) {
  const errors = await getVisibleErrors(page);
  const found = errors.some((e) => e.includes(substring));
  if (!found) {
    throw new Error(`Expected an error containing "${substring}", got: ${JSON.stringify(errors, null, 2)}`);
  }
}

/**
 * Clicks a button matched by its exact visible label, or the first line of a
 * multi-line button (e.g. a cover button with a secondary line of text inside it),
 * via `evaluate()` rather than a standard Playwright `.click()` - OutSystems buttons
 * that trigger a server round-trip (XHR) are frequently missed by a plain `.click()`.
 * @param {import('@playwright/test').Page} page
 * @param {string} label - exact text of the button (or its first line)
 * @param {string} [kind='Button'] - noun used in the thrown error message, e.g. 'Cover button'
 */
async function clickButtonByLabel(page, label, kind = 'Button') {
  await page.evaluate(({ label, kind }) => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.innerText.trim() === label || b.innerText.trim().split('\n')[0] === label
    );
    if (!btn) throw new Error(`${kind} not found: "${label}"`);
    if (btn.disabled) throw new Error(`${kind} is disabled: "${label}"`);
    btn.click();
  }, { label, kind });
  await waitForSettle(page);
}

/** True if a button with this exact label (or first line) exists at all in the DOM. */
async function buttonByLabelExists(page, label) {
  return page.evaluate((l) => {
    return [...document.querySelectorAll('button')].some(
      (b) => b.innerText.trim() === l || b.innerText.trim().split('\n')[0] === l
    );
  }, label);
}

/**
 * Clicks a link matched by its exact visible text, capturing the URL if the link's
 * handler calls `window.open()` (a common OutSystems pattern for links that should
 * open a "new" logical page/record) instead of a normal href navigation.
 * @param {import('@playwright/test').Page} page
 * @param {string} linkText - exact visible text of the link
 * @param {number} [timeoutMs=3000] - how long to wait for window.open() before giving up
 * @returns {Promise<string|null>} the captured URL, or null if window.open() wasn't called in time
 */
async function captureWindowOpenFromLink(page, linkText, timeoutMs = 3000) {
  return page.evaluate(({ linkText, timeoutMs }) => {
    return new Promise((resolve) => {
      window.open = (url) => resolve(url);
      const link = [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === linkText);
      if (link) link.click();
      setTimeout(() => resolve(null), timeoutMs);
    });
  }, { linkText, timeoutMs });
}

/**
 * Opens an OutSystems type-ahead / searchable-select combobox (the `vscomp` widget
 * pattern used for e.g. Occupation search, and likely reused elsewhere in the app),
 * types a search string, and clicks the first matching option.
 * @param {import('@playwright/test').Page} page
 * @param {string} comboboxAccessibleName - accessible name of the combobox trigger, e.g. 'Select an option'
 * @param {string} searchText
 * @param {string} optionStartsWith
 */
async function selectFromTypeahead(page, comboboxAccessibleName, searchText, optionStartsWith) {
  await page.getByRole('combobox', { name: comboboxAccessibleName }).click();
  const searchInput = page.locator('.vscomp-search-input');
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill(searchText);
  const option = page.locator('.vscomp-option').filter({ hasText: optionStartsWith }).first();
  await option.waitFor({ state: 'visible' });
  await option.click();
}

module.exports = {
  waitForSettle,
  fillCalcMask,
  commitWithoutTyping,
  getVisibleErrors,
  expectErrorContaining,
  clickButtonByLabel,
  buttonByLabelExists,
  captureWindowOpenFromLink,
  selectFromTypeahead,
};
