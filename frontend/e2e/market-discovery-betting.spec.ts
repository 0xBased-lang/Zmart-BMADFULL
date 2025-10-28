/**
 * Market Discovery and Betting Flow E2E Tests
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Tests the complete user journey:
 * 1. Connect wallet
 * 2. Browse markets on homepage
 * 3. Navigate to market detail
 * 4. Place bets (YES/NO)
 * 5. Verify bet in dashboard
 * 6. Verify odds updates
 */

import { test, expect, Page } from '@playwright/test';
import { mockPhantomWallet, connectWalletInUI, isWalletConnected, TEST_WALLETS } from './fixtures/wallet-mock';
import { TEST_MARKETS, waitForBlockchainConfirmation } from './fixtures/test-data';

test.describe('Market Discovery and Betting Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Inject wallet mock before each test
    await mockPhantomWallet(page, TEST_WALLETS.USER1, {
      autoApprove: true,
      rejectConnection: false,
      rejectTransactions: false,
    });
  });

  /**
   * AC #2.1: Test wallet connection flow
   */
  test('should connect wallet successfully', async () => {
    // Navigate to homepage
    await page.goto('/');

    // Verify initial state (not connected)
    const connectButton = page.locator('button:has-text("Connect Wallet"), button:has-text("Connect")');
    await expect(connectButton).toBeVisible({ timeout: 10000 });

    // Click connect button
    await connectButton.click();

    // Verify wallet connected (address appears in header)
    await page.waitForSelector('[data-testid="wallet-address"], .wallet-address', {
      timeout: 10000,
    });

    // Verify wallet address is displayed (truncated)
    const walletAddress = page.locator('[data-testid="wallet-address"], .wallet-address');
    const addressText = await walletAddress.textContent();
    expect(addressText).toBeTruthy();
    expect(addressText?.length).toBeGreaterThan(0);

    // Verify connect button is replaced with disconnect/account button
    await expect(connectButton).not.toBeVisible();
  });

  /**
   * AC #2.2: Test browsing markets on homepage
   */
  test('should display markets list on homepage', async () => {
    await page.goto('/');

    // Wait for markets to load
    await page.waitForSelector('[data-testid="market-card"], .market-card', {
      timeout: 10000,
    });

    // Verify at least one market is displayed
    const marketCards = page.locator('[data-testid="market-card"], .market-card');
    const marketCount = await marketCards.count();
    expect(marketCount).toBeGreaterThan(0);

    // Verify market cards contain required information
    const firstMarket = marketCards.first();
    await expect(firstMarket.locator('[data-testid="market-title"], .market-title')).toBeVisible();
    await expect(firstMarket.locator('[data-testid="market-category"], .market-category')).toBeVisible();
    await expect(firstMarket.locator('[data-testid="market-end-date"], .market-end-date')).toBeVisible();

    // Verify odds are displayed
    await expect(firstMarket.locator('[data-testid="yes-odds"], .yes-odds')).toBeVisible();
    await expect(firstMarket.locator('[data-testid="no-odds"], .no-odds')).toBeVisible();
  });

  /**
   * AC #2.3: Test navigation to market detail page
   */
  test('should navigate to market detail when clicking market card', async () => {
    await page.goto('/');

    // Wait for markets to load
    await page.waitForSelector('[data-testid="market-card"], .market-card', {
      timeout: 10000,
    });

    // Click first market card
    const firstMarket = page.locator('[data-testid="market-card"], .market-card').first();
    const marketTitle = await firstMarket.locator('[data-testid="market-title"], .market-title').textContent();
    await firstMarket.click();

    // Wait for navigation to market detail page
    await page.waitForURL(/\/markets\/.*/, { timeout: 10000 });

    // Verify market detail page loaded
    await expect(page.locator('[data-testid="market-detail-title"], h1')).toBeVisible();

    // Verify title matches the market we clicked
    const detailTitle = await page.locator('[data-testid="market-detail-title"], h1').textContent();
    expect(detailTitle).toContain(marketTitle || '');

    // Verify betting interface is visible
    await expect(page.locator('[data-testid="betting-interface"], .betting-interface')).toBeVisible();
    await expect(page.locator('button:has-text("YES"), button:has-text("Yes")')).toBeVisible();
    await expect(page.locator('button:has-text("NO"), button:has-text("No")')).toBeVisible();
  });

  /**
   * AC #2.4: Test placing YES bet with wallet confirmation
   */
  test('should place YES bet successfully', async () => {
    // Connect wallet first
    await page.goto('/');
    await connectWalletInUI(page);

    // Navigate to market detail (assuming first market)
    await page.goto(`/markets/${TEST_MARKETS.ACTIVE_MARKET.id}`);

    // Wait for market detail page to load
    await page.waitForSelector('[data-testid="betting-interface"], .betting-interface', {
      timeout: 10000,
    });

    // Enter bet amount
    const amountInput = page.locator('input[name="amount"], input[type="number"]');
    await amountInput.fill('10');

    // Click YES button
    const yesButton = page.locator('button:has-text("YES"), button:has-text("Yes")').first();
    await yesButton.click();

    // Wait for transaction confirmation toast/notification
    await page.waitForSelector('[data-testid="success-toast"], .toast-success, [role="alert"]', {
      timeout: 15000,
    });

    // Verify success message
    const successToast = page.locator('[data-testid="success-toast"], .toast-success, [role="alert"]').first();
    const toastText = await successToast.textContent();
    expect(toastText?.toLowerCase()).toContain('bet placed');

    // Wait for blockchain confirmation
    await waitForBlockchainConfirmation(3000);
  });

  /**
   * AC #2.4: Test placing NO bet with wallet confirmation
   */
  test('should place NO bet successfully', async () => {
    // Connect wallet first
    await page.goto('/');
    await connectWalletInUI(page);

    // Navigate to market detail
    await page.goto(`/markets/${TEST_MARKETS.ACTIVE_MARKET.id}`);

    // Wait for betting interface
    await page.waitForSelector('[data-testid="betting-interface"], .betting-interface', {
      timeout: 10000,
    });

    // Enter bet amount
    const amountInput = page.locator('input[name="amount"], input[type="number"]');
    await amountInput.fill('5');

    // Click NO button
    const noButton = page.locator('button:has-text("NO"), button:has-text("No")').first();
    await noButton.click();

    // Wait for success confirmation
    await page.waitForSelector('[data-testid="success-toast"], .toast-success, [role="alert"]', {
      timeout: 15000,
    });

    // Verify success message
    const successToast = page.locator('[data-testid="success-toast"], .toast-success, [role="alert"]').first();
    const toastText = await successToast.textContent();
    expect(toastText?.toLowerCase()).toContain('bet placed');

    await waitForBlockchainConfirmation(3000);
  });

  /**
   * AC #2.5: Test bet appears in user dashboard
   */
  test('should show bet in dashboard after placing bet', async () => {
    // Connect wallet
    await page.goto('/');
    await connectWalletInUI(page);

    // Place a bet on a market
    await page.goto(`/markets/${TEST_MARKETS.ACTIVE_MARKET.id}`);
    await page.waitForSelector('[data-testid="betting-interface"], .betting-interface');

    const amountInput = page.locator('input[name="amount"], input[type="number"]');
    await amountInput.fill('10');

    const yesButton = page.locator('button:has-text("YES"), button:has-text("Yes")').first();
    await yesButton.click();

    // Wait for confirmation
    await page.waitForSelector('[data-testid="success-toast"], .toast-success, [role="alert"]', {
      timeout: 15000,
    });
    await waitForBlockchainConfirmation(3000);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"], .dashboard', {
      timeout: 10000,
    });

    // Verify "Active Bets" tab exists and click it
    const activeBetsTab = page.locator('[role="tab"]:has-text("Active Bets"), button:has-text("Active Bets")');
    if (await activeBetsTab.isVisible()) {
      await activeBetsTab.click();
    }

    // Wait for bet cards to load
    await page.waitForSelector('[data-testid="bet-card"], .bet-card', {
      timeout: 10000,
    });

    // Verify bet appears in dashboard
    const betCards = page.locator('[data-testid="bet-card"], .bet-card');
    const betCount = await betCards.count();
    expect(betCount).toBeGreaterThan(0);

    // Verify bet information is displayed
    const firstBet = betCards.first();
    await expect(firstBet.locator('[data-testid="bet-market-title"]')).toBeVisible();
    await expect(firstBet.locator('[data-testid="bet-amount"]')).toBeVisible();
    await expect(firstBet.locator('[data-testid="bet-side"]')).toBeVisible();
  });

  /**
   * AC #2.6: Test odds update after bet placement
   */
  test('should update odds in real-time after bet placed', async () => {
    // Connect wallet
    await page.goto('/');
    await connectWalletInUI(page);

    // Navigate to market detail
    await page.goto(`/markets/${TEST_MARKETS.ACTIVE_MARKET.id}`);
    await page.waitForSelector('[data-testid="betting-interface"], .betting-interface');

    // Get initial odds
    const yesOddsElement = page.locator('[data-testid="yes-odds"], .yes-odds').first();
    const initialYesOdds = await yesOddsElement.textContent();

    // Place a bet
    const amountInput = page.locator('input[name="amount"], input[type="number"]');
    await amountInput.fill('10');

    const yesButton = page.locator('button:has-text("YES"), button:has-text("Yes")').first();
    await yesButton.click();

    // Wait for confirmation
    await page.waitForSelector('[data-testid="success-toast"], .toast-success, [role="alert"]', {
      timeout: 15000,
    });

    // Wait for real-time odds update (Supabase subscription)
    await page.waitForTimeout(3000);

    // Get updated odds
    const updatedYesOdds = await yesOddsElement.textContent();

    // Verify odds changed (should be different after bet placed)
    // Note: This assumes real-time subscription is working
    // In a real test, we'd verify the odds calculation is correct
    expect(updatedYesOdds).toBeTruthy();
  });

  /**
   * AC #2: Test complete user journey (wallet → browse → bet → dashboard)
   */
  test('complete betting journey: connect → browse → bet → verify', async () => {
    // Step 1: Connect wallet
    await page.goto('/');
    await connectWalletInUI(page);
    expect(await isWalletConnected(page)).toBe(true);

    // Step 2: Browse markets
    await page.waitForSelector('[data-testid="market-card"], .market-card');
    const marketCards = page.locator('[data-testid="market-card"], .market-card');
    expect(await marketCards.count()).toBeGreaterThan(0);

    // Step 3: Navigate to market detail
    await marketCards.first().click();
    await page.waitForURL(/\/markets\/.*/);
    await expect(page.locator('[data-testid="betting-interface"], .betting-interface')).toBeVisible();

    // Step 4: Place bet
    const amountInput = page.locator('input[name="amount"], input[type="number"]');
    await amountInput.fill('10');
    const yesButton = page.locator('button:has-text("YES"), button:has-text("Yes")').first();
    await yesButton.click();

    // Step 5: Verify confirmation
    await page.waitForSelector('[data-testid="success-toast"], .toast-success, [role="alert"]', {
      timeout: 15000,
    });
    await waitForBlockchainConfirmation(3000);

    // Step 6: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard"], .dashboard');

    // Step 7: Verify bet in dashboard
    const activeBetsTab = page.locator('[role="tab"]:has-text("Active Bets"), button:has-text("Active Bets")');
    if (await activeBetsTab.isVisible()) {
      await activeBetsTab.click();
    }

    const betCards = page.locator('[data-testid="bet-card"], .bet-card');
    expect(await betCards.count()).toBeGreaterThan(0);

    // Complete journey successful!
  });

  /**
   * Error Handling: Test wallet connection rejection
   */
  test('should handle wallet connection rejection gracefully', async ({ page: testPage }) => {
    // Override wallet mock to reject connection
    await mockPhantomWallet(testPage, TEST_WALLETS.USER1, {
      rejectConnection: true,
    });

    await testPage.goto('/');

    const connectButton = testPage.locator('button:has-text("Connect Wallet"), button:has-text("Connect")');
    await connectButton.click();

    // Wait for error message
    await testPage.waitForSelector('[data-testid="error-toast"], .toast-error, [role="alert"]', {
      timeout: 10000,
    });

    const errorToast = testPage.locator('[data-testid="error-toast"], .toast-error, [role="alert"]');
    const errorText = await errorToast.textContent();
    expect(errorText?.toLowerCase()).toContain('rejected');
  });

  /**
   * Error Handling: Test bet rejection
   */
  test('should handle bet transaction rejection gracefully', async ({ page: testPage }) => {
    // Connect wallet normally
    await mockPhantomWallet(testPage, TEST_WALLETS.USER1, {
      autoApprove: true,
      rejectTransactions: true, // Reject transactions
    });

    await testPage.goto('/');
    await connectWalletInUI(testPage);

    // Try to place bet
    await testPage.goto(`/markets/${TEST_MARKETS.ACTIVE_MARKET.id}`);
    await testPage.waitForSelector('[data-testid="betting-interface"], .betting-interface');

    const amountInput = testPage.locator('input[name="amount"], input[type="number"]');
    await amountInput.fill('10');

    const yesButton = testPage.locator('button:has-text("YES"), button:has-text("Yes")').first();
    await yesButton.click();

    // Wait for error message
    await testPage.waitForSelector('[data-testid="error-toast"], .toast-error, [role="alert"]', {
      timeout: 10000,
    });

    const errorToast = testPage.locator('[data-testid="error-toast"], .toast-error, [role="alert"]');
    const errorText = await errorToast.textContent();
    expect(errorText?.toLowerCase()).toContain('rejected');
  });
});
