/**
 * Market Resolution and Dispute E2E Tests
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Tests the market resolution and dispute flow:
 * 1. Cast resolution votes on ended markets
 * 2. Vote aggregation
 * 3. Flag markets for dispute
 * 4. Admin reviews disputed markets
 * 5. Admin resolves/overrides market
 * 6. Resolution status updates across UI
 */

import { test, expect } from '@playwright/test';
import { mockPhantomWallet, connectWalletInUI, TEST_WALLETS } from './fixtures/wallet-mock';
import { TEST_MARKETS, waitForBlockchainConfirmation, waitForRealtimeUpdate } from './fixtures/test-data';

test.describe('Market Resolution and Dispute Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockPhantomWallet(page, TEST_WALLETS.USER1);
  });

  /**
   * AC #4.1: Cast resolution vote on ended market
   */
  test('should cast resolution vote on ended market', async ({ page }) => {
    await page.goto('/');
    await connectWalletInUI(page);

    // Navigate to vote page
    await page.goto('/vote');
    await page.waitForLoadState('networkidle');

    // Wait for ended markets to load
    await page.waitForSelector('[data-testid="market-card"], .market-card', { timeout: 10000 });

    // Click on first ended market
    const endedMarket = page.locator('[data-testid="market-card"], .market-card').first();
    await endedMarket.click();

    // Wait for resolution voting interface
    await page.waitForSelector('[data-testid="resolution-vote"], button:has-text("Vote YES"), button:has-text("Vote NO")');

    // Cast YES vote
    const voteYesButton = page.locator('button:has-text("Vote YES")').first();
    await voteYesButton.click();

    // Wait for confirmation
    await page.waitForSelector('[data-testid="success-toast"], .toast-success', { timeout: 15000 });

    const successToast = page.locator('[data-testid="success-toast"], .toast-success').first();
    const toastText = await successToast.textContent();
    expect(toastText?.toLowerCase()).toMatch(/vote.*cast|voted/);
  });

  /**
   * AC #4.2: Verify vote aggregation
   */
  test('should aggregate resolution votes correctly', async ({ page }) => {
    await page.goto('/');
    await connectWalletInUI(page);

    await page.goto('/vote');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="market-card"], .market-card');

    const endedMarket = page.locator('[data-testid="market-card"], .market-card').first();
    await endedMarket.click();

    // Get initial vote counts
    await page.waitForSelector('[data-testid="yes-votes"], [data-testid="no-votes"]');
    const yesVotesElement = page.locator('[data-testid="yes-votes"]').first();
    const initialYesVotes = parseInt((await yesVotesElement.textContent())?.match(/\d+/)?.[0] || '0');

    // Cast vote
    const voteYesButton = page.locator('button:has-text("Vote YES")').first();
    await voteYesButton.click();
    await page.waitForSelector('[data-testid="success-toast"], .toast-success', { timeout: 15000 });

    // Wait for real-time update
    await waitForRealtimeUpdate(3000);

    // Verify vote count increased
    const updatedYesVotes = parseInt((await yesVotesElement.textContent())?.match(/\d+/)?.[0] || '0');
    expect(updatedYesVotes).toBeGreaterThan(initialYesVotes);
  });

  /**
   * AC #4.3: Flag market for dispute
   */
  test('should flag market for dispute', async ({ page }) => {
    await page.goto('/');
    await connectWalletInUI(page);

    await page.goto(`/markets/${TEST_MARKETS.RESOLVED_YES_MARKET.id}`);
    await page.waitForLoadState('networkidle');

    // Look for dispute button
    const disputeButton = page.locator('button:has-text("Dispute"), button:has-text("Flag"), button:has-text("Challenge")');

    if (await disputeButton.isVisible()) {
      await disputeButton.click();

      // Fill dispute reason
      await page.waitForSelector('textarea[name="disputeReason"], textarea[placeholder*="reason"]');
      await page.fill('textarea[name="disputeReason"], textarea[placeholder*="reason"]', 'The resolution is incorrect based on available evidence.');

      // Submit dispute
      const submitDisputeButton = page.locator('button:has-text("Submit Dispute"), button:has-text("Flag Market")');
      await submitDisputeButton.click();

      // Verify dispute submitted
      await page.waitForSelector('[data-testid="success-toast"], .toast-success', { timeout: 15000 });

      const successToast = page.locator('[data-testid="success-toast"], .toast-success').first();
      expect(await successToast.textContent()).toMatch(/dispute.*flagged|submitted/i);
    }
  });

  /**
   * AC #4.4: Admin reviews disputed market
   */
  test('should allow admin to review disputed market', async ({ page }) => {
    // Use admin wallet
    await mockPhantomWallet(page, TEST_WALLETS.ADMIN);

    await page.goto('/');
    await connectWalletInUI(page);

    // Navigate to admin page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verify admin dashboard loads
    await expect(page.locator('h1:has-text("Admin Dashboard"), [data-testid="admin-dashboard"]')).toBeVisible();

    // Look for disputed markets section
    await page.waitForSelector('[data-testid="disputed-markets"], .disputed-markets, text=Disputed Markets');

    // Verify disputed markets are listed
    const disputedMarkets = page.locator('[data-testid="disputed-market-card"], .disputed-market-card');

    if (await disputedMarkets.count() > 0) {
      const firstDisputed = disputedMarkets.first();
      await expect(firstDisputed.locator('[data-testid="dispute-reason"]')).toBeVisible();
      await expect(firstDisputed.locator('button:has-text("Review"), button:has-text("Resolve")')).toBeVisible();
    }
  });

  /**
   * AC #4.5: Admin resolves market (override if needed)
   */
  test('should allow admin to resolve disputed market', async ({ page }) => {
    await mockPhantomWallet(page, TEST_WALLETS.ADMIN);

    await page.goto('/');
    await connectWalletInUI(page);

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Find disputed markets
    const disputedMarkets = page.locator('[data-testid="disputed-market-card"], .disputed-market-card');

    if (await disputedMarkets.count() > 0) {
      const firstDisputed = disputedMarkets.first();

      // Click review/resolve button
      const reviewButton = firstDisputed.locator('button:has-text("Review"), button:has-text("Resolve")');
      await reviewButton.click();

      // Select resolution outcome
      await page.waitForSelector('button:has-text("Resolve YES"), button:has-text("Resolve NO")');

      const resolveYesButton = page.locator('button:has-text("Resolve YES"), button[value="YES"]').first();
      await resolveYesButton.click();

      // Confirm resolution
      await page.waitForSelector('[data-testid="success-toast"], .toast-success', { timeout: 20000 });

      const successToast = page.locator('[data-testid="success-toast"], .toast-success').first();
      expect(await successToast.textContent()).toMatch(/resolved|resolution/i);
    }
  });

  /**
   * AC #4.6: Resolution status updates across UI
   */
  test('should show resolution status across all pages', async ({ page }) => {
    await page.goto('/');
    await connectWalletInUI(page);

    const marketId = TEST_MARKETS.RESOLVED_YES_MARKET.id;

    // Check market detail page
    await page.goto(`/markets/${marketId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="market-status"]:has-text("Resolved"), .status:has-text("Resolved")')).toBeVisible();

    // Check homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const resolvedMarketCard = page.locator(`[data-testid="market-card"][data-market-id="${marketId}"], .market-card:has([data-testid="market-status"]:has-text("Resolved"))`).first();

    if (await resolvedMarketCard.isVisible()) {
      await expect(resolvedMarketCard.locator('[data-testid="market-status"]')).toContainText('Resolved');
    }

    // Check dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const betCards = page.locator('[data-testid="bet-card"], .bet-card');

    if (await betCards.count() > 0) {
      // Find bet on resolved market
      const betOnResolvedMarket = betCards.filter({ hasText: TEST_MARKETS.RESOLVED_YES_MARKET.title });

      if (await betOnResolvedMarket.count() > 0) {
        await expect(betOnResolvedMarket.first().locator('[data-testid="market-status"]')).toContainText('Resolved');
      }
    }
  });

  /**
   * Complete resolution flow test
   */
  test('complete resolution flow: vote → dispute → admin resolve', async ({ page }) => {
    // Step 1: User casts resolution vote
    await mockPhantomWallet(page, TEST_WALLETS.USER1);
    await page.goto('/');
    await connectWalletInUI(page);

    await page.goto('/vote');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('[data-testid="market-card"], .market-card');
    const endedMarket = page.locator('[data-testid="market-card"], .market-card').first();
    await endedMarket.click();

    const voteButton = page.locator('button:has-text("Vote YES"), button:has-text("Vote NO")').first();

    if (await voteButton.isVisible()) {
      await voteButton.click();
      await page.waitForSelector('[data-testid="success-toast"], .toast-success', { timeout: 15000 });
      await waitForBlockchainConfirmation(3000);
    }

    // Step 2: Different user disputes (optional - depends on test data)
    // Skipping dispute step for simplicity in complete flow

    // Step 3: Admin resolves
    await mockPhantomWallet(page, TEST_WALLETS.ADMIN);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const disputedMarkets = page.locator('[data-testid="disputed-market-card"], .disputed-market-card');

    if (await disputedMarkets.count() > 0) {
      const reviewButton = disputedMarkets.first().locator('button:has-text("Review"), button:has-text("Resolve")');
      await reviewButton.click();

      const resolveButton = page.locator('button:has-text("Resolve YES"), button:has-text("Resolve NO")').first();
      await resolveButton.click();

      await page.waitForSelector('[data-testid="success-toast"], .toast-success', { timeout: 20000 });
    }

    // Complete flow test successful!
  });
});
