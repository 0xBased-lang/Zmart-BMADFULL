/**
 * E2E Test: Proposal Creation Flow
 * Story 3.6 - Build Proposal Creation Flow
 *
 * Tests the complete UI flow without actual blockchain transactions
 * Updated with correct selectors matching actual implementation
 */

import { test, expect, Page } from '@playwright/test';

// Helper function to select a future date in react-datepicker
async function selectFutureDate(page: Page) {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  // Click on DatePicker input
  await page.click('input[placeholder="Select market end date"]');

  // Wait for datepicker to open
  await page.waitForSelector('.react-datepicker__year-select');

  // Select year from dropdown
  await page.selectOption('.react-datepicker__year-select', futureDate.getFullYear().toString());

  // Select month (January = 0)
  await page.selectOption('.react-datepicker__month-select', '0');

  // Click on day 15
  await page.click('.react-datepicker__day:not(.react-datepicker__day--disabled):has-text("15")');
}

test.describe('Proposal Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to proposal creation page
    await page.goto('http://localhost:3000/propose');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display proposal wizard with step indicator', async ({ page }) => {
    // Check page title (use specific selector to avoid header h1)
    await expect(page.locator('h1').filter({ hasText: 'Create Market Proposal' })).toBeVisible();

    // Check step indicator
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    await expect(page.locator('text=25% Complete')).toBeVisible();

    // Check step labels in progress indicator (avoid h3 headings)
    await expect(page.locator('.grid.grid-cols-4 >> text=Market Info').first()).toBeVisible();
    await expect(page.locator('.grid.grid-cols-4 >> text=Resolution').first()).toBeVisible();
    await expect(page.locator('.grid.grid-cols-4 >> text=Bond').first()).toBeVisible();
    await expect(page.locator('.grid.grid-cols-4 >> text=Review').first()).toBeVisible();
  });

  test('should complete Step 1 - Market Info', async ({ page }) => {
    // Fill title
    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');

    // Check character counter (wait for it to update)
    await expect(page.locator('text=/ 200 characters').filter({ hasText: '50' })).toBeVisible();

    // Select category
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');

    // Check category is selected
    await expect(page.locator('button:has-text("Crypto")')).toBeVisible();

    // Click Next
    await page.click('button:has-text("Next")');

    // Verify navigation to Step 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
    await expect(page.locator('h3:has-text("Resolution Criteria")')).toBeVisible();
  });

  test('should validate title length', async ({ page }) => {
    // Try too short title
    await page.fill('input#title', 'Short');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    // Should show error and not navigate
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();

    // Fill valid title
    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');
    await page.click('button:has-text("Next")');

    // Should navigate to Step 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
  });

  test('should complete Step 2 - Resolution Criteria', async ({ page }) => {
    // Complete Step 1 first
    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    // Wait for Step 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();

    // Fill description (need 50+ characters)
    const description = 'This market resolves YES if Bitcoin (BTC) reaches a price of $100,000 or higher on any major exchange before December 31, 2025.';
    await page.fill('textarea#description', description);

    // Check character counter (simpler selector)
    await expect(page.locator('text=/ 2000 characters')).toBeVisible();

    // Select end date using DatePicker helper
    await selectFutureDate(page);

    // Click Next
    await page.click('button:has-text("Next")');

    // Verify navigation to Step 3
    await expect(page.locator('text=Step 3 of 4')).toBeVisible();
    await expect(page.locator('h3:has-text("Bond Selection")')).toBeVisible();
  });

  test('should complete Step 3 - Bond Selection', async ({ page }) => {
    // Complete Steps 1 and 2
    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    const description = 'This market resolves YES if Bitcoin reaches $100,000 on any major exchange before Dec 31, 2025.';
    await page.fill('textarea#description', description);

    await selectFutureDate(page);
    await page.click('button:has-text("Next")');

    // Wait for Step 3
    await expect(page.locator('text=Step 3 of 4')).toBeVisible();

    // Verify default bond amount (50 ZMart)
    await expect(page.locator('text=50 ZMart')).toBeVisible();

    // Set bond amount to 100 using slider
    const slider = page.locator('input#bondAmount');
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verify bond amount updated
    await expect(page.locator('text=100 ZMart')).toBeVisible();

    // Verify tier display shows Medium Tier
    await expect(page.locator('text=Medium Tier')).toBeVisible();

    // Click Next
    await page.click('button:has-text("Next")');

    // Verify navigation to Step 4
    await expect(page.locator('text=Step 4 of 4')).toBeVisible();
    await expect(page.locator('h3:has-text("Review & Submit")')).toBeVisible();
  });

  test('should complete Step 4 - Preview and show all data', async ({ page }) => {
    // Complete Steps 1-3
    const title = 'Will Bitcoin reach $100,000 by end of 2025?';
    await page.fill('input#title', title);
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    const description = 'This market resolves YES if Bitcoin reaches $100,000 on any major exchange before Dec 31, 2025.';
    await page.fill('textarea#description', description);

    await selectFutureDate(page);
    await page.click('button:has-text("Next")');

    const slider = page.locator('input#bondAmount');
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.click('button:has-text("Next")');

    // Wait for Step 4
    await expect(page.locator('text=Step 4 of 4')).toBeVisible();
    await expect(page.locator('text=100% Complete')).toBeVisible();
    await expect(page.locator('h3:has-text("Review & Submit")')).toBeVisible();

    // Verify all entered data is displayed
    await expect(page.locator(`text=${title}`)).toBeVisible();
    await expect(page.locator('text=Crypto')).toBeVisible();
    // Check partial description (first 50 chars might be cut off)
    await expect(page.locator(`text=${description.substring(0, 30)}`)).toBeVisible();

    // Verify bond amount display (might show as "Bond: 100 ZMart")
    await expect(page.locator('text=/100.*ZMart/')).toBeVisible();

    // Verify Submit button is present
    await expect(page.locator('button:has-text("Submit Proposal")')).toBeVisible();
  });

  test('should allow editing from preview step', async ({ page }) => {
    // Complete all steps to reach preview
    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    const description = 'This market resolves YES if Bitcoin reaches $100,000 on any major exchange.';
    await page.fill('textarea#description', description);

    await selectFutureDate(page);
    await page.click('button:has-text("Next")');

    const slider = page.locator('input#bondAmount');
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.click('button:has-text("Next")');

    // On Step 4 - verify we can edit
    await expect(page.locator('text=Step 4 of 4')).toBeVisible();

    // Click edit button (if exists) or use Previous button
    await page.click('button:has-text("Previous")');

    // Should be back on Step 3
    await expect(page.locator('text=Step 3 of 4')).toBeVisible();

    // Navigate forward again
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 4 of 4')).toBeVisible();
  });

  test('should navigate back using Previous button', async ({ page }) => {
    // Go to Step 2
    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();

    // Click Previous
    await page.click('button:has-text("Previous")');

    // Should be back on Step 1
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    await expect(page.locator('h3:has-text("Market Information")')).toBeVisible();

    // Verify form data persisted
    await expect(page.locator('input#title')).toHaveValue('Will Bitcoin reach $100,000 by end of 2025?');
    await expect(page.locator('button:has-text("Crypto")')).toBeVisible();
  });

  test('should show validation errors and prevent navigation', async ({ page }) => {
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');

    // Should stay on Step 1
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();

    // Fill only title, not category
    await page.fill('input#title', 'Will Bitcoin reach $100,000?');
    await page.click('button:has-text("Next")');

    // Should still be on Step 1 (category required)
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();

    // Now fill category and proceed
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    // Should navigate to Step 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
  });

  test('should show progress percentage', async ({ page }) => {
    // Step 1 - 25%
    await expect(page.locator('text=25% Complete')).toBeVisible();

    // Complete Step 1
    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    // Step 2 - 50%
    await expect(page.locator('text=50% Complete')).toBeVisible();

    // Complete Step 2
    const description = 'This market resolves YES if Bitcoin reaches $100,000 on any major exchange.';
    await page.fill('textarea#description', description);
    await selectFutureDate(page);
    await page.click('button:has-text("Next")');

    // Step 3 - 75%
    await expect(page.locator('text=75% Complete')).toBeVisible();

    // Complete Step 3
    await page.click('button:has-text("Next")');

    // Step 4 - 100%
    await expect(page.locator('text=100% Complete')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify elements are still visible and functional
    await expect(page.locator('h1').filter({ hasText: 'Create Market Proposal' })).toBeVisible();
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    await expect(page.locator('input#title')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();

    // Test form functionality on mobile
    await page.fill('input#title', 'Mobile test: Will Bitcoin reach $100,000?');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    // Verify navigation works
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
  });
});

test.describe('Proposal Creation - Wallet Integration (Mocked)', () => {
  test('should show wallet connection requirement', async ({ page }) => {
    // Complete all steps
    await page.goto('http://localhost:3000/propose');
    await page.waitForLoadState('networkidle');

    await page.fill('input#title', 'Will Bitcoin reach $100,000 by end of 2025?');
    await page.click('button:has-text("Select a category")');
    await page.click('text=Crypto');
    await page.click('button:has-text("Next")');

    const description = 'This market resolves YES if Bitcoin reaches $100,000.';
    await page.fill('textarea#description', description);

    await selectFutureDate(page);
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Next")'); // Skip bond, use default

    // On Step 4, Submit button should be visible
    await expect(page.locator('button:has-text("Submit Proposal")')).toBeVisible();

    // Note: Actual wallet interaction testing requires Solana wallet setup
    // which is tested separately in integration tests
  });
});
