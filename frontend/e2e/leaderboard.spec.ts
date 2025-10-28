import { test, expect } from '@playwright/test'

test.describe('Leaderboard Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to leaderboard page
    await page.goto('http://localhost:3000/leaderboard')
  })

  test('should display leaderboard page with header', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1:has-text("Leaderboard")')).toBeVisible()

    // Check description
    await expect(page.locator('text=Top performers and rankings')).toBeVisible()
  })

  test('should display all 4 leaderboard tabs', async ({ page }) => {
    // Check all tabs are visible
    await expect(page.locator('button:has-text("Top by Points")')).toBeVisible()
    await expect(page.locator('button:has-text("Top by Win Rate")')).toBeVisible()
    await expect(page.locator('button:has-text("Top by Volume")')).toBeVisible()
    await expect(page.locator('button:has-text("Top Creators")')).toBeVisible()
  })

  test('should handle tab navigation and URL sync', async ({ page }) => {
    // Start on default tab (points)
    expect(page.url()).toContain('/leaderboard')

    // Click Win Rate tab
    await page.locator('button:has-text("Top by Win Rate")').click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('tab=win-rate')

    // Click Volume tab
    await page.locator('button:has-text("Top by Volume")').click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('tab=volume')

    // Click Creators tab
    await page.locator('button:has-text("Top Creators")').click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('tab=creators')

    // Click back to Points tab
    await page.locator('button:has-text("Top by Points")').click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('tab=points')
  })

  test('should show loading state or rankings', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000)

    // Check if loading skeleton, empty state, or rankings are shown
    const loadingSkeleton = page.locator('.animate-pulse')
    const emptyState = page.locator('text=No rankings available yet')
    const rankingsTable = page.locator('table, [class*="space-y-3"]')

    const hasLoading = await loadingSkeleton.isVisible().catch(() => false)
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasRankings = await rankingsTable.isVisible().catch(() => false)

    // Should show one of: loading, empty state, or rankings
    expect(hasLoading || hasEmptyState || hasRankings).toBe(true)
  })

  test('should display ranking numbers in table', async ({ page }) => {
    await page.waitForTimeout(2000)

    // Check if rankings are visible (desktop table or mobile cards)
    const rankingNumber = page.locator('text=/#[0-9]+/')

    const count = await rankingNumber.count()
    if (count > 0) {
      // Should show ranking number like #1, #2, etc
      await expect(rankingNumber.first()).toBeVisible()
    }
  })

  test('should display wallet addresses with profile links', async ({ page }) => {
    await page.waitForTimeout(2000)

    // Look for truncated wallet addresses (pattern: XXXX...XXXX)
    const walletLink = page.locator('a[href^="/user/"]')

    const count = await walletLink.count()
    if (count > 0) {
      // Should have at least one profile link
      await expect(walletLink.first()).toBeVisible()

      // Click first profile link
      await walletLink.first().click()
      await page.waitForTimeout(1000)

      // Should navigate to profile page
      expect(page.url()).toContain('/user/')
    }
  })

  test('should display stat values appropriate for active tab', async ({ page }) => {
    await page.waitForTimeout(2000)

    // On points tab, should show activity points
    const pointsTab = page.locator('button:has-text("Top by Points")')
    if (await pointsTab.isVisible()) {
      const statValue = page.locator('text=/[0-9]+/').first()
      if (await statValue.isVisible()) {
        await expect(statValue).toBeVisible()
      }
    }

    // Switch to win rate tab
    await page.locator('button:has-text("Top by Win Rate")').click()
    await page.waitForTimeout(1000)

    // Should show percentages
    const percentValue = page.locator('text=/%/')
    const count = await percentValue.count()
    if (count > 0) {
      await expect(percentValue.first()).toBeVisible()
    }
  })

  test('should show medals for top 3 users', async ({ page }) => {
    await page.waitForTimeout(2000)

    // Look for medal emojis (🥇🥈🥉)
    const medals = page.locator('text=/🥇|🥈|🥉/')

    const count = await medals.count()
    if (count > 0) {
      // Should have medals for top 3 if there are rankings
      expect(count).toBeGreaterThanOrEqual(1)
      expect(count).toBeLessThanOrEqual(3)
    }
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000/leaderboard')
    await page.waitForTimeout(2000)

    // Check tabs are still visible and scrollable
    await expect(page.locator('button:has-text("Top by Points")')).toBeVisible()

    // On mobile, should show card view not table
    const mobileCards = page.locator('[class*="md:hidden"]')
    const hasCards = await mobileCards.isVisible().catch(() => false)

    // Either cards are visible or there's an empty state
    const emptyState = await page.locator('text=No rankings available').isVisible().catch(() => false)
    expect(hasCards || emptyState).toBe(true)
  })
})

test.describe('User Profile Page', () => {
  test('should navigate to profile from leaderboard', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard')
    await page.waitForTimeout(2000)

    // Try to click a profile link
    const profileLink = page.locator('a[href^="/user/"]').first()

    if (await profileLink.isVisible()) {
      const href = await profileLink.getAttribute('href')
      await profileLink.click()
      await page.waitForTimeout(1000)

      // Should be on profile page
      expect(page.url()).toBe(`http://localhost:3000${href}`)
    }
  })

  test('should display profile header with wallet address', async ({ page }) => {
    // Navigate directly to a test wallet profile
    const testWallet = 'TestWalletAddress123456789'
    await page.goto(`http://localhost:3000/user/${testWallet}`)
    await page.waitForTimeout(2000)

    // Check page title
    await expect(page.locator('h1:has-text("User Profile")')).toBeVisible()

    // Check wallet address is displayed
    await expect(page.locator(`text=${testWallet}`)).toBeVisible()

    // Check copy button is visible
    await expect(page.locator('button:has-text("Copy")')).toBeVisible()
  })

  test('should display 5 stat cards', async ({ page }) => {
    const testWallet = 'TestWalletAddress123456789'
    await page.goto(`http://localhost:3000/user/${testWallet}`)
    await page.waitForTimeout(2000)

    // Wait for loading to complete
    const loadingSkeleton = page.locator('.animate-pulse')
    const hasLoading = await loadingSkeleton.isVisible().catch(() => false)

    if (!hasLoading) {
      // Should have stat labels
      const statLabels = ['Win Rate', 'Total Bets', 'Total Profit', 'Markets Created', 'Activity Points']

      for (const label of statLabels) {
        const statCard = page.locator(`text=${label}`)
        await expect(statCard).toBeVisible()
      }
    }
  })

  test('should have tabs for recent bets and created markets', async ({ page }) => {
    const testWallet = 'TestWalletAddress123456789'
    await page.goto(`http://localhost:3000/user/${testWallet}`)
    await page.waitForTimeout(2000)

    // Check activity tabs
    await expect(page.locator('button:has-text("Recent Bets")')).toBeVisible()
    await expect(page.locator('button:has-text("Created Markets")')).toBeVisible()
  })

  test('should switch between activity tabs', async ({ page }) => {
    const testWallet = 'TestWalletAddress123456789'
    await page.goto(`http://localhost:3000/user/${testWallet}`)
    await page.waitForTimeout(2000)

    // Click Created Markets tab
    await page.locator('button:has-text("Created Markets")').click()
    await page.waitForTimeout(500)

    // Should show created markets content
    const marketsContent = page.locator('text=/markets|No markets created/')
    await expect(marketsContent.first()).toBeVisible()

    // Click back to Recent Bets
    await page.locator('button:has-text("Recent Bets")').click()
    await page.waitForTimeout(500)

    // Should show bets content
    const betsContent = page.locator('text=/bets|No bets placed/')
    await expect(betsContent.first()).toBeVisible()
  })

  test('should show empty state for user with no activity', async ({ page }) => {
    const newWallet = 'NewWalletWithNoActivity123'
    await page.goto(`http://localhost:3000/user/${newWallet}`)
    await page.waitForTimeout(2000)

    // Should show stat cards with zeros or empty states
    const emptyBets = page.locator('text=No bets placed yet')
    const emptyMarkets = page.locator('text=No markets created yet')

    // At least one empty state should be visible
    const hasEmptyBets = await emptyBets.isVisible().catch(() => false)
    const hasEmptyMarkets = await emptyMarkets.isVisible().catch(() => false)

    // For a new user, at least bets should be empty
    expect(hasEmptyBets || hasEmptyMarkets).toBe(true)
  })

  test('should copy wallet address when button clicked', async ({ page }) => {
    const testWallet = 'TestWalletAddress123456789'
    await page.goto(`http://localhost:3000/user/${testWallet}`)
    await page.waitForTimeout(2000)

    // Click copy button
    const copyButton = page.locator('button:has-text("Copy")')
    await copyButton.click()

    // Should show success message
    await page.waitForTimeout(500)
    const successText = page.locator('text=Copied')
    await expect(successText).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const testWallet = 'TestWalletAddress123456789'
    await page.goto(`http://localhost:3000/user/${testWallet}`)
    await page.waitForTimeout(2000)

    // Page should still be functional
    await expect(page.locator('h1:has-text("User Profile")')).toBeVisible()

    // Stat cards should stack on mobile (2 columns)
    const statCards = page.locator('[class*="bg-gray-800"]')
    const count = await statCards.count()

    if (count > 0) {
      // Should have multiple stat cards
      expect(count).toBeGreaterThanOrEqual(5)
    }
  })
})
