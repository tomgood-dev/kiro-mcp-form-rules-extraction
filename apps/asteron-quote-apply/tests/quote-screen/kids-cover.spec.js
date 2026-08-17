// Verifies: output/confluence-pages/business-rules/quote-screen/kids-cover-and-multi-life/page.md
const { test, expect } = require('@playwright/test');
const { openNewQuote, setMinimumPersonalDetails, clickApply, expectErrorContaining, waitForSettle } = require('../../helpers/quote-helpers');

let quote;

test.beforeEach(async ({ page }) => {
  quote = await openNewQuote(page);
  await setMinimumPersonalDetails(quote);
});

test('KID-01: Number of Kids offers exactly 0–9', async () => {
  const options = await quote.getByRole('combobox', { name: 'Number of Kids' }).locator('option').allInnerTexts();
  expect(options).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
});

test('KID-05: each kid row requires a Date of birth', async () => {
  await quote.getByRole('combobox', { name: 'Number of Kids' }).selectOption('1');
  await waitForSettle(quote);
  await clickApply(quote);
  await expectErrorContaining(quote, 'Required field');
});

test('KID-07: Kid Sum Insured tier list runs $50,000 (Free) to $200,000 in $10,000 steps', async () => {
  await quote.getByRole('combobox', { name: 'Number of Kids' }).selectOption('1');
  await waitForSettle(quote);

  const tierDropdown = quote.locator('select').filter({ has: quote.locator('option', { hasText: '$50,000 (Free)' }) }).first();
  const options = await tierDropdown.locator('option').allInnerTexts();
  expect(options[0]).toBe('$50,000 (Free)');
  expect(options.at(-1)).toBe('$200,000');
  expect(options).toHaveLength(16);
});
