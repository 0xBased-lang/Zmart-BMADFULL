import { test, expect } from '@playwright/test';

test.describe('Frontend Diagnostic - Comprehensive Debug', () => {
  test('Homepage diagnostic - What is rendering and what errors exist', async ({ page }) => {
    // Capture all console messages
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      } else {
        consoleLogs.push(text);
      }
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Capture failed requests
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('\n🔍 FRONTEND DIAGNOSTIC STARTING...\n');
    console.log('================================================');

    // Navigate to homepage
    console.log('📍 Navigating to https://frontend-one-indol-57.vercel.app');
    await page.goto('https://frontend-one-indol-57.vercel.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded');

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: '/tmp/homepage-diagnostic.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: /tmp/homepage-diagnostic.png');

    // Check what's visible
    console.log('\n📊 VISIBILITY ANALYSIS:');
    console.log('================================================');

    // Header
    const headerVisible = await page.locator('header').isVisible().catch(() => false);
    console.log(`Header: ${headerVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

    // Logo
    const logoVisible = await page.locator('[data-testid="logo"]').isVisible().catch(() => false);
    console.log(`Logo: ${logoVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

    // Connect Wallet Button
    const walletButtonVisible = await page.locator('[data-testid="connect-wallet"]').isVisible().catch(() => false);
    console.log(`Connect Wallet Button: ${walletButtonVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

    // Markets section
    const marketsVisible = await page.locator('text=Markets').first().isVisible().catch(() => false);
    console.log(`Markets Section: ${marketsVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

    // Market cards
    const marketCards = await page.locator('[data-testid="market-card"]').count();
    console.log(`Market Cards: ${marketCards > 0 ? `✅ ${marketCards} VISIBLE` : '❌ NONE VISIBLE'}`);

    // Check for loading states
    const loadingVisible = await page.locator('text=Loading').first().isVisible().catch(() => false);
    console.log(`Loading State: ${loadingVisible ? '⚠️ STILL LOADING' : '✅ NOT LOADING'}`);

    // Check for error states
    const errorVisible = await page.locator('text=Error').first().isVisible().catch(() => false);
    console.log(`Error State: ${errorVisible ? '❌ ERROR VISIBLE' : '✅ NO ERROR'}`);

    // Get page title
    const title = await page.title();
    console.log(`Page Title: "${title}"`);

    // Check DOM structure
    console.log('\n🏗️ DOM STRUCTURE:');
    console.log('================================================');

    const bodyContent = await page.locator('body').innerHTML();
    const hasContent = bodyContent.length > 1000;
    console.log(`Body HTML Length: ${bodyContent.length} characters ${hasContent ? '✅' : '⚠️ Very short'}`);

    // Count main elements
    const divCount = await page.locator('div').count();
    const buttonCount = await page.locator('button').count();
    const linkCount = await page.locator('a').count();
    console.log(`Divs: ${divCount}, Buttons: ${buttonCount}, Links: ${linkCount}`);

    // Check for Solana/Web3 providers
    console.log('\n⚡ WEB3 INTEGRATION:');
    console.log('================================================');

    const hasWindow = await page.evaluate(() => typeof window !== 'undefined');
    console.log(`Window object: ${hasWindow ? '✅' : '❌'}`);

    const hasSolana = await page.evaluate(() => {
      return typeof (window as any).solana !== 'undefined';
    });
    console.log(`Solana wallet: ${hasSolana ? '✅ Detected' : '❌ Not detected (expected without wallet)'}`);

    // Check for Supabase
    const hasSupabase = await page.evaluate(() => {
      return typeof (window as any).supabase !== 'undefined';
    });
    console.log(`Supabase client: ${hasSupabase ? '✅ Available' : '⚠️ Not in window object'}`);

    // Console output summary
    console.log('\n📝 CONSOLE OUTPUT:');
    console.log('================================================');
    console.log(`Console Logs: ${consoleLogs.length}`);
    console.log(`Console Warnings: ${consoleWarnings.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Page Errors: ${pageErrors.length}`);
    console.log(`Failed Requests: ${failedRequests.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:');
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️ CONSOLE WARNINGS:');
      consoleWarnings.slice(0, 5).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn}`);
      });
    }

    if (pageErrors.length > 0) {
      console.log('\n🔴 PAGE ERRORS:');
      pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    if (failedRequests.length > 0) {
      console.log('\n🌐 FAILED REQUESTS:');
      failedRequests.slice(0, 10).forEach((req, i) => {
        console.log(`  ${i + 1}. ${req}`);
      });
    }

    // Check API calls
    console.log('\n🔌 API ANALYSIS:');
    console.log('================================================');

    const apiCalls: string[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('supabase')) {
        apiCalls.push(`${response.status()} ${response.request().method()} ${url}`);
      }
    });

    // Wait a bit more for API calls
    await page.waitForTimeout(2000);

    if (apiCalls.length > 0) {
      console.log('API Calls detected:');
      apiCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call}`);
      });
    } else {
      console.log('⚠️ No API calls detected');
    }

    // Final analysis
    console.log('\n🎯 DIAGNOSIS:');
    console.log('================================================');

    let issues = [];
    if (!headerVisible) issues.push('Header not visible');
    if (!walletButtonVisible) issues.push('Wallet button not visible');
    if (marketCards === 0) issues.push('No market cards visible');
    if (consoleErrors.length > 0) issues.push(`${consoleErrors.length} console errors`);
    if (pageErrors.length > 0) issues.push(`${pageErrors.length} page errors`);
    if (failedRequests.length > 0) issues.push(`${failedRequests.length} failed requests`);

    if (issues.length > 0) {
      console.log('❌ ISSUES FOUND:');
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    } else {
      console.log('✅ No major issues detected!');
    }

    console.log('\n================================================');
    console.log('🔍 DIAGNOSTIC COMPLETE');
    console.log('================================================\n');

    // Don't fail the test - we just want diagnostics
    expect(true).toBe(true);
  });
});
