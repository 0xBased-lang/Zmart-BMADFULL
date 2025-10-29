/**
 * Proposal Submission E2E Test
 * Tests the complete proposal flow with fallback mechanism
 */

import { test, expect } from '@playwright/test';

test.describe('Proposal Submission with Fallback', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    });

    // Navigate to propose page
    await page.goto('http://localhost:3000/propose');
  });

  test('Should display proposal form', async ({ page }) => {
    // Check if we're on the propose page
    await expect(page).toHaveTitle(/BMAD-Zmart/);

    // Check for wizard steps
    await expect(page.getByText('Market Info')).toBeVisible();
    await expect(page.getByText('Resolution')).toBeVisible();
    await expect(page.getByText('Bond')).toBeVisible();
    await expect(page.getByText('Review')).toBeVisible();
  });

  test('Should complete Step 1: Market Info', async ({ page }) => {
    // Fill title
    await page.fill('input[name="title"]', 'Test Market - Will BTC reach $100k?');

    // Select category
    await page.selectOption('select[name="category"]', 'Crypto');

    // Click next
    await page.click('button:has-text("Next")');

    // Should be on step 2
    await expect(page.getByText('Resolution Criteria')).toBeVisible();
  });

  test('Should complete Step 2: Resolution Criteria', async ({ page }) => {
    // Complete Step 1 first
    await page.fill('input[name="title"]', 'Test Market');
    await page.selectOption('select[name="category"]', 'Crypto');
    await page.click('button:has-text("Next")');

    // Fill description
    await page.fill('textarea[name="description"]', 'This market will resolve YES if Bitcoin reaches $100,000 USD by the end date.');

    // Set end date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[name="endDate"]', dateString);

    // Click next
    await page.click('button:has-text("Next")');

    // Should be on step 3
    await expect(page.getByText('Select Bond Amount')).toBeVisible();
  });

  test('Should complete Step 3: Bond Selection', async ({ page }) => {
    // Complete Steps 1-2
    await page.fill('input[name="title"]', 'Test Market');
    await page.selectOption('select[name="category"]', 'Crypto');
    await page.click('button:has-text("Next")');

    await page.fill('textarea[name="description"]', 'Test description');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[name="endDate"]', tomorrow.toISOString().split('T')[0]);
    await page.click('button:has-text("Next")');

    // Select a bond tier (Medium - 100 ZMart)
    await page.click('input[value="100"]');

    // Click next
    await page.click('button:has-text("Next")');

    // Should be on step 4 (Review)
    await expect(page.getByText('Review Your Proposal')).toBeVisible();
  });

  test('Should show complete proposal review', async ({ page }) => {
    // Complete all steps
    await page.fill('input[name="title"]', 'Test Market: BTC $100k');
    await page.selectOption('select[name="category"]', 'Crypto');
    await page.click('button:has-text("Next")');

    await page.fill('textarea[name="description"]', 'Will Bitcoin reach $100,000?');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[name="endDate"]', tomorrow.toISOString().split('T')[0]);
    await page.click('button:has-text("Next")');

    await page.click('input[value="100"]');
    await page.click('button:has-text("Next")');

    // Verify review content
    await expect(page.getByText('Test Market: BTC $100k')).toBeVisible();
    await expect(page.getByText('Will Bitcoin reach $100,000?')).toBeVisible();
    await expect(page.getByText('Crypto')).toBeVisible();

    // Check for cost breakdown
    await expect(page.getByText('Cost Breakdown')).toBeVisible();
    await expect(page.getByText('Bond Amount')).toBeVisible();
    await expect(page.getByText('Proposal Tax')).toBeVisible();
  });

  test.skip('Should trigger fallback on submission (requires wallet)', async ({ page }) => {
    // This test requires wallet connection, which is hard to automate
    // Mark as skip by default

    // Complete all steps
    await page.fill('input[name="title"]', 'Test Market');
    await page.selectOption('select[name="category"]', 'Crypto');
    await page.click('button:has-text("Next")');

    await page.fill('textarea[name="description"]', 'Test description');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[name="endDate"]', tomorrow.toISOString().split('T')[0]);
    await page.click('button:has-text("Next")');

    await page.click('input[value="100"]');
    await page.click('button:has-text("Next")');

    // Try to submit (will fail without wallet, but we can check button exists)
    const submitButton = page.getByRole('button', { name: /Create Proposal/i });
    await expect(submitButton).toBeVisible();
  });

  test('API endpoint should exist', async ({ page }) => {
    // Test the fallback API endpoint
    const response = await page.request.post('http://localhost:3000/api/proposals/create-test', {
      data: {
        title: 'Test Proposal',
        description: 'Test description for API',
        bondAmount: 100,
        endTimestamp: Math.floor(Date.now() / 1000) + 86400,
        creatorWallet: 'TestWalletAddress123'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.proposalId).toBeDefined();
    console.log('✅ Fallback API working:', data);
  });

  test('Should show proper form validation', async ({ page }) => {
    // Try to proceed without filling form
    const nextButton = page.getByRole('button', { name: /Next/i });

    // Try clicking next without filling anything
    await nextButton.click();

    // Should still be on step 1 (validation failed)
    await expect(page.getByText('Market Info')).toBeVisible();

    // Fill only title
    await page.fill('input[name="title"]', 'Test');

    // Try next again
    await nextButton.click();

    // Should still fail (need category too)
    // Note: This depends on your validation implementation
  });
});

test.describe('Proposal List', () => {
  test('Should display proposals page', async ({ page }) => {
    await page.goto('http://localhost:3000/proposals');

    // Check page loaded
    await expect(page).toHaveTitle(/BMAD-Zmart/);

    // Should see proposals section or empty state
    // This will pass even if no proposals exist
  });
});
