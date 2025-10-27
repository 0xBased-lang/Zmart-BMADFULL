/**
 * Capture browser console errors
 */
import { test } from '@playwright/test';

test('capture console errors', async ({ page }) => {
  // Collect console messages
  const messages: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    const text = `${msg.type()}: ${msg.text()}`;
    messages.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('❌ BROWSER ERROR:', text);
    } else if (msg.type() === 'warning') {
      console.log('⚠️  BROWSER WARNING:', text);
    }
  });

  page.on('pageerror', err => {
    const errorText = err.message;
    errors.push(errorText);
    console.log('🚨 PAGE ERROR:', errorText);
    console.log('Stack:', err.stack);
  });

  console.log('🔍 Navigating to http://localhost:3000/propose');
  await page.goto('http://localhost:3000/propose');

  // Wait a bit for all errors to show up
  await page.waitForTimeout(5000);

  console.log('\n=== SUMMARY ===');
  console.log(`Total messages: ${messages.length}`);
  console.log(`Total errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/console-debug-screenshot.png', fullPage: true });
});
