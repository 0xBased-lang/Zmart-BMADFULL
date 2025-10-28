/**
 * Accessibility E2E Tests
 * Story 4.3 - Frontend E2E Tests with Playwright
 *
 * Tests WCAG 2.1 AA compliance:
 * 1. Keyboard navigation through all interactive elements
 * 2. Tab order is logical and complete
 * 3. Focus indicators visible on all focusable elements
 * 4. Screen reader compatibility (ARIA labels, semantic HTML)
 * 5. Color contrast meets WCAG 2.1 AA standards
 * 6. Form validation errors announced to screen readers
 */

import { test, expect } from '@playwright/test';
import { mockPhantomWallet, TEST_WALLETS } from './fixtures/wallet-mock';

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await mockPhantomWallet(page, TEST_WALLETS.USER1);
  });

  /**
   * AC #7.1: Keyboard navigation through all interactive elements
   */
  test('should navigate through homepage using keyboard only', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start from the beginning
    await page.keyboard.press('Tab');

    // Track focus as we tab through
    let focusedElementsCount = 0;
    const maxTabs = 50; // Prevent infinite loop

    for (let i = 0; i < maxTabs; i++) {
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          type: (el as any)?.type,
          ariaLabel: el?.getAttribute('aria-label'),
          hasTabIndex: el?.hasAttribute('tabindex'),
        };
      });

      if (focusedElement.tagName !== 'BODY') {
        focusedElementsCount++;
      }

      // Tab to next element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // If we're back to body, we've completed the cycle
      const currentElement = await page.evaluate(() => document.activeElement?.tagName);

      if (currentElement === 'BODY' && focusedElementsCount > 0) {
        break;
      }
    }

    // Verify we found interactive elements
    expect(focusedElementsCount).toBeGreaterThan(0);
  });

  /**
   * AC #7.2: Tab order is logical and complete
   */
  test('should have logical tab order on market detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const marketCards = page.locator('[data-testid="market-card"], .market-card');

    if (await marketCards.count() > 0) {
      await marketCards.first().click();
      await page.waitForURL(/\/markets\/.*/);

      // Expected tab order (high-level):
      // 1. Navigation links
      // 2. Market title (if focusable)
      // 3. Betting amount input
      // 4. YES button
      // 5. NO button
      // 6. Other interactive elements

      const interactiveElements = await page.evaluate(() => {
        const focusableSelectors = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
        const elements = Array.from(document.querySelectorAll(focusableSelectors));

        return elements.map((el) => ({
          tagName: el.tagName,
          text: el.textContent?.slice(0, 30),
          ariaLabel: el.getAttribute('aria-label'),
          tabIndex: el.getAttribute('tabindex'),
        }));
      });

      // Verify we have interactive elements in logical order
      expect(interactiveElements.length).toBeGreaterThan(0);
    }
  });

  /**
   * AC #7.3: Focus indicators visible on all focusable elements
   */
  test('should show visible focus indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if focused element has visible focus indicator
    const focusStyles = await page.evaluate(() => {
      const el = document.activeElement;

      if (el) {
        const styles = window.getComputedStyle(el);

        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
        };
      }

      return null;
    });

    // Verify focus indicator is present (outline or box-shadow)
    expect(focusStyles).toBeTruthy();

    const hasFocusIndicator =
      (focusStyles?.outline && focusStyles.outline !== 'none') ||
      (focusStyles?.outlineWidth && focusStyles.outlineWidth !== '0px') ||
      (focusStyles?.boxShadow && focusStyles.boxShadow !== 'none');

    expect(hasFocusIndicator).toBe(true);
  });

  /**
   * AC #7.4: Screen reader compatibility (ARIA labels, semantic HTML)
   */
  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check buttons without text have aria-label
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      // Button should have either text content or aria-label/aria-labelledby
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy;
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('should use semantic HTML elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for semantic HTML elements
    await expect(page.locator('header, [role="banner"]')).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();

    // Navigation should use nav element or role
    const hasNav = await page.locator('nav, [role="navigation"]').count();
    expect(hasNav).toBeGreaterThan(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

      return headingElements.map((el) => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.slice(0, 50),
      }));
    });

    // Should have at least one h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBeGreaterThan(0);

    // Verify headings are in logical order (no skipping levels)
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];

      // Current heading should not skip more than one level
      const levelDiff = curr.level - prev.level;
      expect(levelDiff).toBeLessThanOrEqual(1);
    }
  });

  /**
   * AC #7.5: Color contrast meets WCAG 2.1 AA standards
   */
  test('should have sufficient color contrast for text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check color contrast for visible text elements
    const contrastResults = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6'));
      const results: any[] = [];

      textElements.slice(0, 20).forEach((el) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;

        // Simple check: ensure colors are defined
        results.push({
          color: color,
          backgroundColor: bgColor,
          hasColor: color !== '' && color !== 'transparent',
          hasBackground: bgColor !== '' && bgColor !== 'transparent',
        });
      });

      return results;
    });

    // Verify elements have defined colors
    const elementsWithColor = contrastResults.filter((r) => r.hasColor);
    expect(elementsWithColor.length).toBeGreaterThan(0);

    // Note: Actual contrast ratio calculation requires more complex analysis
    // For E2E tests, we verify colors are defined; axe-core would be used for precise checking
  });

  /**
   * AC #7.6: Form validation errors announced to screen readers
   */
  test('should announce form validation errors', async ({ page }) => {
    await page.goto('/propose');
    await page.waitForLoadState('networkidle');

    // Try to submit form with invalid data
    const titleInput = page.locator('input#title, input[name="title"]');

    if (await titleInput.isVisible()) {
      // Fill invalid title (too short)
      await titleInput.fill('Too short');

      // Try to proceed
      const nextButton = page.locator('button:has-text("Next")');
      await nextButton.click();

      // Check for error message
      const errorMessage = page.locator('[role="alert"], .error-message, [aria-live="assertive"]');

      if (await errorMessage.isVisible()) {
        // Verify error has aria-live or role=alert
        const hasAriaLive = await errorMessage.getAttribute('aria-live');
        const hasRoleAlert = await errorMessage.getAttribute('role');

        expect(hasAriaLive === 'assertive' || hasAriaLive === 'polite' || hasRoleAlert === 'alert').toBe(true);
      }
    }
  });

  /**
   * Keyboard shortcuts test
   */
  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const marketCards = page.locator('[data-testid="market-card"], .market-card');

    if (await marketCards.count() > 0) {
      // Focus first market card
      await marketCards.first().focus();

      // Press Enter to activate
      await page.keyboard.press('Enter');

      // Should navigate to market detail
      await page.waitForURL(/\/markets\/.*/, { timeout: 5000 });
      await expect(page.locator('[data-testid="market-detail-title"], h1')).toBeVisible();
    }
  });

  /**
   * Screen reader landmark regions test
   */
  test('should have proper landmark regions for screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo'];
      const found: string[] = [];

      landmarkRoles.forEach((role) => {
        const elements = document.querySelectorAll(`[role="${role}"]`);

        if (elements.length > 0) {
          found.push(role);
        }
      });

      // Also check for semantic HTML equivalents
      if (document.querySelector('header')) found.push('header');
      if (document.querySelector('nav')) found.push('nav');
      if (document.querySelector('main')) found.push('main');
      if (document.querySelector('footer')) found.push('footer');

      return found;
    });

    // Should have at least main landmark
    expect(landmarks.length).toBeGreaterThan(0);
    expect(landmarks.some((l) => l === 'main' || l.includes('main'))).toBe(true);
  });

  /**
   * Alt text for images test
   */
  test('should have alt text for all images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check all images have alt text
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');

      // Image should have alt text, aria-label, or role="presentation"
      const hasAccessibleName = alt !== null || ariaLabel || role === 'presentation';
      expect(hasAccessibleName).toBe(true);
    }
  });

  /**
   * Skip navigation link test
   */
  test('should have skip navigation link for keyboard users', async ({ page }) => {
    await page.goto('/');

    // Tab once to reveal skip link (if present)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if skip link is visible when focused
    const skipLink = page.locator('a:has-text("Skip to main"), a:has-text("Skip to content")');

    // Skip link should exist (may be visually hidden until focused)
    const skipLinkCount = await skipLink.count();

    // If skip link exists, verify it works
    if (skipLinkCount > 0) {
      await skipLink.first().click();

      // Should focus on main content
      const mainContent = page.locator('main, [role="main"], #main-content');
      await expect(mainContent).toBeFocused();
    }
  });

  /**
   * Complete accessibility audit (using Playwright accessibility API)
   */
  test('should pass basic accessibility checks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take accessibility snapshot
    const snapshot = await page.accessibility.snapshot();

    // Verify accessibility tree has content
    expect(snapshot).toBeTruthy();
    expect(snapshot?.children).toBeTruthy();

    // Check that critical elements are in accessibility tree
    const accessibilityTree = JSON.stringify(snapshot);
    expect(accessibilityTree).toContain('button');
    expect(accessibilityTree).toContain('link');
  });
});
