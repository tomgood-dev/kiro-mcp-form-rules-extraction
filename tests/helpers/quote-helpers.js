// Shared interaction helpers for the Quote screen ("Illustration" step) test suite.
//
// These encode every interaction gotcha discovered during manual exploration —
// see output/confluence-pages/business-rules/technical-automation-appendix/page.md
// for the narrative version. Reuse these instead of hand-rolling interactions in
// spec files; the fragile parts (calc-mask fields, occupation search, the
// disability-cover commitment trap) are easy to get subtly wrong.

/**
 * Opens a brand-new Quote screen and returns the Page it's on.
 * Assumes `page` is already authenticated (via storageState).
 *
 * "New Quote" uses a JS handler that calls window.open(). In headless mode
 * this may or may not create a popup. We patch window.open to capture the
 * target URL, then navigate to it directly.
 */
async function openNewQuote(page) {
  await page.goto('/QuoteAndApply/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000); // Give the SPA time to fully render the quote list

  // Strategy: patch window.open to capture the URL, click New Quote, then navigate
  const quoteUrl = await page.evaluate(() => {
    return new Promise((resolve) => {
      window.open = function(url) { resolve(url); };
      const link = [...document.querySelectorAll('a')].find(a => a.innerText.trim() === 'New Quote');
      if (link) link.click();
      // Fallback if window.open isn't called within 3s
      setTimeout(() => resolve(null), 3000);
    });
  });

  if (quoteUrl) {
    // Navigate to the captured URL
    await page.goto(quoteUrl, { waitUntil: 'domcontentloaded' });
  } else {
    // Fallback: navigate directly to a new blank quote
    await page.goto('/QuoteAndApply/Quote?QuoteId=&ShowApplyNow=false&IsClone=false&LastModifiedDate=1900-01-01&ApplicationId=', { waitUntil: 'domcontentloaded' });
  }

  // Wait for the quote form to actually render
  await page.waitForTimeout(3000);
  await page.locator('input[id*="Input_AgeNextBirthday"], input[id*="Input_FirstName"]').first()
    .waitFor({ state: 'visible', timeout: 30000 });
  await waitForSettle(page);
  return page;
}

/** Waits for the OutSystems "Loading" indicator to clear, plus a short settle buffer. */
async function waitForSettle(page, ms = 400) {
  await page.locator('text=Loading').first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

/**
 * Fills the minimum Personal Details fields needed to price a Lump Sum cover
 * (age, gender, occupation) and optionally Employment Status / Annual Income
 * for Disability cover scenarios.
 *
 * @param {import('@playwright/test').Page} page - the Quote tab
 * @param {object} opts
 * @param {number} [opts.age=35]
 * @param {'Male'|'Female'} [opts.gender='Male']
 * @param {string} [opts.occupationSearch='Civil Engineer']
 * @param {string} [opts.occupationOptionStartsWith='Civil Engineer - qualified']
 * @param {string} [opts.employmentStatus] - 'Employed' | 'Self-Employed' | 'Employed by own company' | 'Other'
 * @param {string|number} [opts.income] - Annual income, digits only, e.g. 150000
 */
async function setMinimumPersonalDetails(page, opts = {}) {
  const {
    age = 35,
    gender = 'Male',
    occupationCode = '1', // '1'=AA by default (safe for all covers)
    employmentStatus,
    income,
  } = opts;

  // Age — use type action pattern (clear + type + tab) for OutSystems reactive binding
  const ageInput = page.locator('input[id*="Input_AgeNextBirthday"]').first();
  await ageInput.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.keyboard.type(String(age), { delay: 40 });
  await page.keyboard.press('Tab');
  await waitForSettle(page);

  // Gender — button group (not a radio input). Use scrollIntoView + click via evaluate.
  await page.evaluate((g) => {
    const btn = [...document.querySelectorAll('.button-group-item, .button-group-selected-item')]
      .find(b => b.innerText.trim() === g);
    if (btn && !btn.className.includes('selected')) {
      btn.scrollIntoView({ block: 'center' });
      btn.click();
    }
  }, gender);
  await waitForSettle(page);

  // Occupation Code — native <select> dropdown
  const occDropdown = page.locator('select[id*="OccupationCode_Dropdown"]').first();
  await occDropdown.selectOption(occupationCode);
  await waitForSettle(page);

  if (employmentStatus) {
    await page.locator('select[id*="EmploymentStatus_Dropdown"]').first()
      .selectOption({ label: employmentStatus });
    await waitForSettle(page);
  }
  if (income !== undefined) {
    await fillCalcMask(page.locator('input[id*="MaskedInput"]').first(), String(income));
    await waitForSettle(page);
  }
}

/** Opens the Occupation type-ahead, types a search string, and clicks the first matching option. */
async function setOccupation(page, searchText, optionStartsWith) {
  await page.getByRole('combobox', { name: 'Select an option' }).click();
  const searchInput = page.locator('.vscomp-search-input');
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill(searchText);
  const option = page.locator('.vscomp-option').filter({ hasText: optionStartsWith }).first();
  await option.waitFor({ state: 'visible' });
  await option.click();
}

/**
 * Correctly enters a value into an OutSystems calc-mask field (Sum Insured,
 * Monthly Benefit, Annual Income). A plain `.fill()` corrupts these fields.
 * @param {import('@playwright/test').Locator} locator
 * @param {string} value - digits only, e.g. "200000"
 */
async function fillCalcMask(locator, value) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
  await locator.page().waitForTimeout(200);
  for (let i = 0; i < 12; i++) {
    await locator.page().keyboard.press('Backspace');
    await locator.page().waitForTimeout(50);
  }
  await locator.page().waitForTimeout(200);
  for (const digit of String(value).replace(/[^0-9]/g, '')) {
    await locator.page().keyboard.press(digit);
    await locator.page().waitForTimeout(60);
  }
  await locator.page().waitForTimeout(200);
  await locator.page().keyboard.press('Tab');
  await waitForSettle(locator.page());
}

/**
 * "Commits" a Disability cover's benefit field without typing a value, so its
 * income-percentage auto-default takes effect. Merely activating the cover's
 * toggle button is NOT enough — see DC-01/DC-02 in the business rules.
 * @param {import('@playwright/test').Locator} locator
 */
async function commitWithoutTyping(locator) {
  await locator.click();
  await locator.page().keyboard.press('Tab');
}

/**
 * Activates a top-level cover by its exact button text (Life, TPD, Trauma,
 * Cancer, Acd. Death, Needlestick, Specific Injury, Mortgage & Living, Income
 * Protection, Workability, Business Expenses, Business Disability, Farmers
 * Disability). Standard Playwright .click() can miss the activating XHR for
 * some of these, so this drives a real `.click()` via evaluate on the button
 * whose visible text starts with the given label.
 */
async function activateCover(page, buttonLabel) {
  await page.evaluate((label) => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.innerText.trim().split('\n')[0] === label
    );
    if (!btn) throw new Error(`Cover button not found: "${label}"`);
    if (btn.disabled) throw new Error(`Cover button is disabled: "${label}"`);
    btn.click();
  }, buttonLabel);
  await waitForSettle(page);
}

/** True if a cover button with this exact label exists at all (present vs. removed from DOM). */
async function coverButtonExists(page, buttonLabel) {
  return page.evaluate((label) => {
    return [...document.querySelectorAll('button')].some(
      (b) => b.innerText.trim().split('\n')[0] === label
    );
  }, buttonLabel);
}

/** Removes an active cover card by clicking the "Remove" link nearest its heading text. */
async function removeCoverCard(page, cardHeadingStartsWith) {
  await page.evaluate((headingText) => {
    const removeLinks = [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove');
    const link = removeLinks.find((l) => l.closest('div')?.parentElement?.innerText?.split('\n')[0].startsWith(headingText));
    if (!link) throw new Error(`No "Remove" link found near heading starting with: "${headingText}"`);
    link.click();
  }, cardHeadingStartsWith);
  await waitForSettle(page);
}

/** Removes every currently-active cover card on the page (bulk cleanup between scenarios in one test). */
async function removeAllCoverCards(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll('a')].filter((a) => a.innerText.trim() === 'Remove').forEach((a) => a.click());
  });
  await waitForSettle(page);
}

/** Returns the array of currently-visible validation error strings. */
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

/** Clicks the footer Apply button. */
async function clickApply(page) {
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await waitForSettle(page);
}

/** Reads the current "Total Yearly Premium" figure as a number (e.g. 254.16), or null if not present. */
async function getTotalYearlyPremium(page) {
  const text = await page.evaluate(() => {
    const idx = document.body.innerText.indexOf('Total Yearly Premium');
    if (idx === -1) return null;
    return document.body.innerText.slice(idx, idx + 40);
  });
  if (!text) return null;
  const m = text.match(/\$([\d,.]+)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

/** Reads the current Bundling Discount label text (e.g. "None", "15% (2 covers)"). */
async function getBundlingDiscount(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const idx = text.indexOf('Bundling Discounts');
    if (idx === -1) return null;
    const chunk = text.slice(idx, idx + 60);
    const line = chunk.split('\n')[1];
    return line ? line.trim() : null;
  });
}

/** True if the screen has silently navigated from "Illustration" to the Client-summary step. */
async function isOnClientSummary(page) {
  return page.evaluate(() => document.body.innerText.includes('Client summary'));
}

/** Returns the Nth (0-based) Sum Insured / Monthly Benefit calc-mask input currently on the page. */
function sumInsuredInput(page, index = 0) {
  return page.locator('input[id*="SumInsured"]').nth(index);
}

module.exports = {
  openNewQuote,
  waitForSettle,
  setMinimumPersonalDetails,
  setOccupation,
  fillCalcMask,
  commitWithoutTyping,
  activateCover,
  coverButtonExists,
  removeCoverCard,
  removeAllCoverCards,
  getVisibleErrors,
  expectErrorContaining,
  clickApply,
  getTotalYearlyPremium,
  getBundlingDiscount,
  isOnClientSummary,
  sumInsuredInput,
};
