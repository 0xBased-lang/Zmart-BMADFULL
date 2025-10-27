/**
 * Diagnostic Test - Check what's actually rendering
 */
import { test, expect } from '@playwright/test';

test.describe('Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/propose');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('capture page content', async ({ page }) => {
    // Wait a bit more for JS to execute
    await page.waitForTimeout(3000);

    // Get all text content
    const bodyText = await page.locator('body').textContent();
    console.log('=== PAGE TEXT CONTENT ===');
    console.log(bodyText);

    // Get all h1 elements
    const h1Elements = await page.locator('h1').all();
    console.log('=== H1 ELEMENTS ===');
    for (const h1 of h1Elements) {
      const text = await h1.textContent();
      console.log(`H1: ${text}`);
    }

    // Get all input elements
    const inputs = await page.locator('input').all();
    console.log('=== INPUT ELEMENTS ===');
    for (let i = 0; i < Math.min(inputs.length, 10); i++) {
      const id = await inputs[i].getAttribute('id');
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`Input ${i}: id=${id}, type=${type}, placeholder=${placeholder}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/diagnostic-screenshot.png', fullPage: true });

    // This should pass if we got this far
    expect(bodyText).toContain('BMAD-Zmart');
  });
});
