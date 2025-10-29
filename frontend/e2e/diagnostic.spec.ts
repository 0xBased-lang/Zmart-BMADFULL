import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test('diagnostic - check homepage loads', async ({ page }) => {
  console.log('Attempting to load:', BASE_URL)

  // Try to navigate with a longer timeout
  try {
    await page.goto(BASE_URL, { timeout: 60000 })
    console.log('Page loaded successfully')

    // Get page content
    const content = await page.content()
    console.log('Page content length:', content.length)
    console.log('Page title:', await page.title())

    // Check for any error messages
    const hasError = await page.locator('text=/error|500|build error/i').count()
    console.log('Has error:', hasError > 0)

    // Take screenshot
    await page.screenshot({ path: 'test-results/diagnostic-screenshot.png' })

    // Log page content (first 500 chars)
    console.log('Page HTML (first 500 chars):', content.substring(0, 500))
  } catch (error) {
    console.error('Failed to load page:', error)
    throw error
  }
})
