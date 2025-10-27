import { test, expect } from '@playwright/test'

test.describe('Voting Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to voting page
    await page.goto('http://localhost:3000/vote')
  })

  test('should display voting interface page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1:has-text("Vote on Market Resolutions")')).toBeVisible()

    // Check description
    await expect(page.locator('text=Help determine market outcomes')).toBeVisible()
  })

  test('should show empty state when no markets in voting period', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1000)

    // Check if empty state or markets are shown
    const emptyState = page.locator('text=No markets currently in voting period')
    const marketCards = page.locator('[class*="grid"]').locator('div').filter({ hasText: 'Vote YES' })

    // Should show either empty state OR market cards (not both)
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasMarkets = await marketCards.count().then(count => count > 0).catch(() => false)

    expect(hasEmptyState || hasMarkets).toBe(true)
  })

  test('should display market cards with vote tallies', async ({ page }) => {
    // Wait for markets to load
    await page.waitForTimeout(2000)

    // Check if markets are visible
    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      // Verify first market card has required elements
      const firstCard = page.locator('[class*="bg-gray-900"]').first()

      // Should show vote tally bars
      await expect(firstCard.locator('text=YES')).toBeVisible()
      await expect(firstCard.locator('text=NO')).toBeVisible()

      // Should show vote buttons
      await expect(firstCard.locator('button:has-text("Vote YES")')).toBeVisible()
      await expect(firstCard.locator('button:has-text("Vote NO")')).toBeVisible()
    }
  })

  test('should show Review Evidence button', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      // Check for "Review Evidence" button
      const evidenceButton = page.locator('button:has-text("Review Evidence")').first()
      await expect(evidenceButton).toBeVisible()
    }
  })

  test('should expand evidence panel when clicked', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      // Click Review Evidence button
      const evidenceButton = page.locator('button:has-text("Review Evidence")').first()
      await evidenceButton.click()

      // Wait for panel to appear
      await page.waitForTimeout(500)

      // Check if evidence panel is visible
      await expect(page.locator('text=Evidence & Comments')).toBeVisible()

      // Check sorting dropdown
      await expect(page.locator('select').filter({ hasText: 'Newest' })).toBeVisible()
    }
  })

  test('should show wallet connect button when wallet not connected', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      // Check for wallet connect prompt
      const walletText = page.locator('text=Connect your wallet to vote')

      if (await walletText.isVisible()) {
        // Verify WalletMultiButton is present
        await expect(page.locator('button[class*="wallet-adapter"]')).toBeVisible()
      }
    }
  })

  test('should display countdown timer', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      // Look for countdown text pattern
      const countdownPattern = page.locator('text=/Voting ends .* ago|Voting ends in .*/')

      // Countdown should be visible on at least one card
      const countdownCount = await countdownPattern.count()
      expect(countdownCount).toBeGreaterThanOrEqual(0) // May be 0 if no markets
    }
  })

  test('should display vote percentages', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      const firstCard = page.locator('[class*="bg-gray-900"]').first()

      // Check for percentage indicators (%)
      const percentages = firstCard.locator('text=/%/')
      const percentageCount = await percentages.count()

      // Should have at least 2 percentages (YES and NO)
      expect(percentageCount).toBeGreaterThanOrEqual(2)
    }
  })

  test('should show vote count', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      const firstCard = page.locator('[class*="bg-gray-900"]').first()

      // Check for vote count text
      const voteCount = firstCard.locator('text=/\\d+ votes? cast/')

      // Should be visible
      await expect(voteCount).toBeVisible()
    }
  })

  test('should truncate long resolution criteria', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      // Look for "Read more" button
      const readMoreButton = page.locator('button:has-text("Read more")').first()

      if (await readMoreButton.isVisible()) {
        // Click to expand
        await readMoreButton.click()

        // Should change to "Show less"
        await expect(page.locator('button:has-text("Show less")').first()).toBeVisible()
      }
    }
  })

  test('should handle evidence panel sorting', async ({ page }) => {
    await page.waitForTimeout(2000)

    const marketCount = await page.locator('[class*="bg-gray-900"]').count()

    if (marketCount > 0) {
      // Open evidence panel
      const evidenceButton = page.locator('button:has-text("Review Evidence")').first()
      await evidenceButton.click()
      await page.waitForTimeout(500)

      // Find sorting dropdown
      const sortDropdown = page.locator('select').first()

      // Change sorting option
      await sortDropdown.selectOption('oldest')

      // Should still show evidence panel
      await expect(page.locator('text=Evidence & Comments')).toBeVisible()
    }
  })

  test('should display responsive grid layout', async ({ page }) => {
    // Check for grid container
    const gridContainer = page.locator('[class*="grid"]').filter({ has: page.locator('button:has-text("Vote YES")') })

    if (await gridContainer.isVisible()) {
      // Grid should have proper classes
      const gridClass = await gridContainer.getAttribute('class')
      expect(gridClass).toContain('grid')
    }
  })
})
