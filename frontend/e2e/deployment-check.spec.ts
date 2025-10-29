import { test, expect } from '@playwright/test';

/**
 * DEPLOYMENT CONFIGURATION CHECK
 *
 * This test validates that the Vercel deployment is properly configured
 * and identifies what configuration is missing.
 */

test.describe('Vercel Deployment Configuration Check', () => {

  test('should load the homepage', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Check if page loads
    await expect(page).toHaveTitle(/Zmart/i);

    console.log('✅ Homepage loaded successfully');
  });

  test('should check for environment variables', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/homepage-state.png',
      fullPage: true
    });

    // Log console errors
    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('✅ No console errors');
    }
  });

  test('should detect missing configuration', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Check for common error indicators
    const errorMessages = [
      'RPC endpoint not configured',
      'environment variable',
      'configuration missing',
      'NEXT_PUBLIC',
      'undefined',
      'not found'
    ];

    const pageContent = await page.content();
    const foundIssues: string[] = [];

    for (const errorMsg of errorMessages) {
      if (pageContent.toLowerCase().includes(errorMsg.toLowerCase())) {
        foundIssues.push(errorMsg);
      }
    }

    if (foundIssues.length > 0) {
      console.log('⚠️  Possible Configuration Issues Detected:');
      foundIssues.forEach(issue => console.log('  -', issue));
    } else {
      console.log('✅ No obvious configuration issues in page content');
    }
  });

  test('should check network connection status', async ({ page }) => {
    await page.goto('/');

    // Wait for any network indicator elements
    await page.waitForTimeout(2000);

    // Try to find network status indicator
    const networkStatus = await page.locator('[data-testid="network-status"]').textContent().catch(() => null);

    if (networkStatus) {
      console.log('📡 Network Status:', networkStatus);
    } else {
      console.log('ℹ️  Network status indicator not found (this is okay)');
    }

    // Check if we can see any Solana-related elements
    const walletButton = await page.locator('button:has-text("Connect")').first().isVisible().catch(() => false);

    if (walletButton) {
      console.log('✅ Wallet connect button found');
    } else {
      console.log('⚠️  Wallet connect button not visible');
    }
  });

  test('should capture deployment state', async ({ page }) => {
    // Go to homepage
    await page.goto('/');

    // Capture all console messages
    const consoleMessages: Array<{type: string, text: string}> = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/deployment-full-state.png',
      fullPage: true
    });

    // Log summary
    console.log('\n📊 DEPLOYMENT STATE SUMMARY:');
    console.log('================================');
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    console.log('Console Messages:', consoleMessages.length);

    // Group messages by type
    const messagesByType = consoleMessages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Message Types:', messagesByType);

    // Show errors and warnings
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:', errors.length);
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i+1}.`, err.text.slice(0, 100));
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:', warnings.length);
      warnings.slice(0, 3).forEach((warn, i) => {
        console.log(`  ${i+1}.`, warn.text.slice(0, 100));
      });
    }

    console.log('================================\n');
  });
});
