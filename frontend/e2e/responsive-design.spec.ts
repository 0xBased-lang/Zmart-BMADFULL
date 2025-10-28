/**
 * Responsive Design E2E Tests
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Tests responsive design across viewports:
 * 1. Mobile viewport (375px) - all pages render correctly
 * 2. Tablet viewport (768px) - layouts adapt properly
 * 3. Desktop viewport (1280px) - full features accessible
 * 4. Touch interactions on mobile (hamburger menu, buttons)
 * 5. Orientation changes (portrait/landscape)
 */

import { test, expect, devices } from '@playwright/test';
import { mockPhantomWallet, connectWalletInUI, TEST_WALLETS } from './fixtures/wallet-mock';

test.describe('Responsive Design Tests', () => {
  /**
   * AC #6.1: Mobile viewport (375px) - all pages render correctly
   */
  test.describe('Mobile Portrait (375px)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test.beforeEach(async ({ page }) => {
      await mockPhantomWallet(page, TEST_WALLETS.USER1);
    });

    test('should render homepage correctly on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify hamburger menu is visible on mobile
      const hamburgerMenu = page.locator('[data-testid="mobile-menu-button"], button[aria-label="Menu"], .hamburger-menu');
      await expect(hamburgerMenu).toBeVisible();

      // Verify markets are stacked (not grid)
      const marketCards = page.locator('[data-testid="market-card"], .market-card');

      if (await marketCards.count() > 0) {
        // Markets should be in single column layout
        const firstCard = marketCards.first();
        const secondCard = marketCards.nth(1);

        if (await secondCard.isVisible()) {
          const firstBox = await firstCard.boundingBox();
          const secondBox = await secondCard.boundingBox();

          // Second card should be below first (not side by side)
          if (firstBox && secondBox) {
            expect(secondBox.y).toBeGreaterThan(firstBox.y);
          }
        }
      }
    });

    test('should render market detail page correctly on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const marketCards = page.locator('[data-testid="market-card"], .market-card');

      if (await marketCards.count() > 0) {
        await marketCards.first().click();
        await page.waitForURL(/\/markets\/.*/);

        // Verify betting interface is responsive
        await expect(page.locator('[data-testid="betting-interface"], .betting-interface')).toBeVisible();

        // Verify buttons are large enough for touch (44px minimum)
        const betButtons = page.locator('button:has-text("YES"), button:has-text("NO")');
        const buttonBox = await betButtons.first().boundingBox();

        if (buttonBox) {
          expect(buttonBox.height).toBeGreaterThanOrEqual(44);
          expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should open hamburger menu and navigate on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click hamburger menu
      const hamburgerMenu = page.locator('[data-testid="mobile-menu-button"], button[aria-label="Menu"], .hamburger-menu');
      await hamburgerMenu.click();

      // Wait for menu drawer to open
      await page.waitForSelector('[data-testid="mobile-menu"], [role="dialog"], .mobile-nav-drawer', {
        timeout: 5000,
      });

      // Verify navigation links are visible
      const menuDrawer = page.locator('[data-testid="mobile-menu"], [role="dialog"], .mobile-nav-drawer');
      await expect(menuDrawer).toBeVisible();

      // Verify navigation links
      await expect(menuDrawer.locator('a:has-text("Markets"), a:has-text("Home")')).toBeVisible();
      await expect(menuDrawer.locator('a:has-text("Dashboard"), a:has-text("My Bets")')).toBeVisible();
    });

    test('should have touch-friendly button sizes on mobile', async ({ page }) => {
      await page.goto('/');
      await connectWalletInUI(page);

      const marketCards = page.locator('[data-testid="market-card"], .market-card');

      if (await marketCards.count() > 0) {
        await marketCards.first().click();
        await page.waitForURL(/\/markets\/.*/);

        // Check all interactive buttons meet 44px touch target size
        const allButtons = page.locator('button:visible');
        const buttonCount = await allButtons.count();

        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = allButtons.nth(i);
          const box = await button.boundingBox();

          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  /**
   * AC #6.2: Tablet viewport (768px) - layouts adapt properly
   */
  test.describe('Tablet (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test.beforeEach(async ({ page }) => {
      await mockPhantomWallet(page, TEST_WALLETS.USER1);
    });

    test('should render homepage with 2-column grid on tablet', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const marketCards = page.locator('[data-testid="market-card"], .market-card');

      if (await marketCards.count() >= 2) {
        // On tablet, markets should be in 2-column grid
        const firstCard = marketCards.first();
        const secondCard = marketCards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        // Second card should be beside first (roughly same Y position)
        if (firstBox && secondBox) {
          const yDiff = Math.abs(secondBox.y - firstBox.y);
          expect(yDiff).toBeLessThan(50); // Allow some variance
        }
      }
    });

    test('should show tablet navigation on tablet viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tablet should show either hamburger or condensed desktop nav
      // Depends on implementation - verify navigation is accessible
      const hamburgerMenu = page.locator('[data-testid="mobile-menu-button"], button[aria-label="Menu"]');
      const desktopNav = page.locator('[data-testid="desktop-nav"], nav:not([data-testid="mobile-menu"])');

      const hasHamburger = await hamburgerMenu.isVisible();
      const hasDesktopNav = await desktopNav.isVisible();

      // One of them should be visible
      expect(hasHamburger || hasDesktopNav).toBe(true);
    });
  });

  /**
   * AC #6.3: Desktop viewport (1280px) - full features accessible
   */
  test.describe('Desktop (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test.beforeEach(async ({ page }) => {
      await mockPhantomWallet(page, TEST_WALLETS.USER1);
    });

    test('should render homepage with 3-column grid on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const marketCards = page.locator('[data-testid="market-card"], .market-card');

      if (await marketCards.count() >= 3) {
        // On desktop, markets should be in 3-column grid
        const firstCard = marketCards.first();
        const secondCard = marketCards.nth(1);
        const thirdCard = marketCards.nth(2);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        const thirdBox = await thirdCard.boundingBox();

        // All three should be roughly in same row
        if (firstBox && secondBox && thirdBox) {
          const yDiff1 = Math.abs(secondBox.y - firstBox.y);
          const yDiff2 = Math.abs(thirdBox.y - firstBox.y);

          expect(yDiff1).toBeLessThan(50);
          expect(yDiff2).toBeLessThan(50);
        }
      }
    });

    test('should show full desktop navigation on desktop viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Desktop should show full navigation (not hamburger)
      const hamburgerMenu = page.locator('[data-testid="mobile-menu-button"], button[aria-label="Menu"]');
      const desktopNav = page.locator('[data-testid="desktop-nav"], nav:not([data-testid="mobile-menu"])');

      // Hamburger should not be visible
      await expect(hamburgerMenu).not.toBeVisible();

      // Desktop nav should be visible
      await expect(desktopNav).toBeVisible();

      // Verify navigation links
      await expect(desktopNav.locator('a:has-text("Markets"), a:has-text("Home")')).toBeVisible();
      await expect(desktopNav.locator('a:has-text("Dashboard"), a:has-text("My Bets")')).toBeVisible();
    });

    test('should show all features on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify all major UI elements are visible
      await expect(page.locator('[data-testid="header"], header')).toBeVisible();
      await expect(page.locator('[data-testid="market-list"], .market-list')).toBeVisible();

      const marketCards = page.locator('[data-testid="market-card"], .market-card');

      if (await marketCards.count() > 0) {
        // Verify market cards show all information (not truncated)
        const firstCard = marketCards.first();
        await expect(firstCard.locator('[data-testid="market-title"]')).toBeVisible();
        await expect(firstCard.locator('[data-testid="market-description"]')).toBeVisible();
        await expect(firstCard.locator('[data-testid="yes-odds"], [data-testid="no-odds"]')).toBeVisible();
      }
    });
  });

  /**
   * AC #6.5: Orientation changes (portrait/landscape)
   */
  test.describe('Orientation Changes', () => {
    test('should adapt to orientation change from portrait to landscape', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await mockPhantomWallet(page, TEST_WALLETS.USER1);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify portrait layout
      const hamburgerMenu = page.locator('[data-testid="mobile-menu-button"], button[aria-label="Menu"]');
      await expect(hamburgerMenu).toBeVisible();

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      // Verify layout adapts
      // Hamburger should still be visible (still mobile width)
      await expect(hamburgerMenu).toBeVisible();

      // Content should be visible and not overflow
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();

      if (bodyBox) {
        expect(bodyBox.width).toBeLessThanOrEqual(667);
      }
    });
  });

  /**
   * Cross-viewport consistency test
   */
  test.describe('Cross-Viewport Consistency', () => {
    test('should maintain functionality across all viewports', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1280, height: 720, name: 'Desktop' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await mockPhantomWallet(page, TEST_WALLETS.USER1);

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify core functionality works on all viewports
        // 1. Homepage loads
        await expect(page.locator('[data-testid="market-list"], .market-list, body')).toBeVisible();

        // 2. Markets are visible
        const marketCards = page.locator('[data-testid="market-card"], .market-card');

        if (await marketCards.count() > 0) {
          await expect(marketCards.first()).toBeVisible();

          // 3. Can navigate to market detail
          await marketCards.first().click();
          await page.waitForURL(/\/markets\/.*/);

          await expect(page.locator('[data-testid="market-detail-title"], h1')).toBeVisible();
        }

        console.log(`✓ ${viewport.name} viewport test passed`);
      }
    });
  });
});
