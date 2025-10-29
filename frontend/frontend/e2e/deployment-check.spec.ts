import { test, expect } from '@playwright/test';

test.describe('Vercel Deployment Check', () => {

  test('homepage loads and captures state', async ({ page }) => {
    console.log('Testing Vercel Deployment...');

    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    await page.goto('/');
    console.log('Page navigation successful');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log('Page Title:', title);

    await page.screenshot({
      path: 'test-results/deployment-state.png',
      fullPage: true
    });
    console.log('Screenshot saved');

    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log('CONSOLE ANALYSIS:');
    console.log('Total messages:', consoleMessages.length);
    console.log('Errors:', errors.length);
    console.log('Warnings:', warnings.length);

    if (errors.length > 0) {
      console.log('ERRORS FOUND:');
      errors.slice(0, 10).forEach((err, i) => {
        const text = String(err.text);
        console.log(i+1 + '. ' + text.substring(0, 150));
      });
    }

    if (warnings.length > 0) {
      console.log('WARNINGS FOUND:');
      warnings.slice(0, 5).forEach((warn, i) => {
        const text = String(warn.text);
        console.log(i+1 + '. ' + text.substring(0, 150));
      });
    }

    console.log('Test Complete!');
  });
});
