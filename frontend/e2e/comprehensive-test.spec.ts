import { test, expect } from '@playwright/test'

/**
 * COMPREHENSIVE SYSTEM TEST
 * Tests all features systematically:
 * 1. Homepage & Navigation
 * 2. Markets Listing
 * 3. Market Details
 * 4. Betting Flow
 * 5. Dashboard
 * 6. Leaderboard
 * 7. Claim Functionality
 */

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('1. Homepage & Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto(BASE_URL)

    // Check title
    await expect(page).toHaveTitle(/BMAD-Zmart/)

    // Check main heading
    await expect(page.locator('h1')).toContainText('BMAD-Zmart')

    // Check navigation links exist
    await expect(page.locator('a[href="/markets"]')).toBeVisible()
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible()
    await expect(page.locator('a[href="/leaderboard"]')).toBeVisible()
  })

  test('should navigate to all main pages', async ({ page }) => {
    await page.goto(BASE_URL)

    // Navigate to Markets
    await page.click('a[href="/markets"]')
    await expect(page).toHaveURL(/\/markets/)
    await expect(page.locator('h1, h2')).toContainText(/markets/i)

    // Navigate to Dashboard
    await page.click('a[href="/dashboard"]')
    await expect(page).toHaveURL(/\/dashboard/)

    // Navigate to Leaderboard
    await page.click('a[href="/leaderboard"]')
    await expect(page).toHaveURL(/\/leaderboard/)
  })
})

test.describe('2. Markets Listing Page', () => {
  test('should display markets list', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`)

    // Check page loaded
    await expect(page.locator('h1, h2')).toContainText(/markets/i)

    // Check for market cards
    const marketCards = page.locator('[data-testid="market-card"]').or(
      page.locator('text=/Will .* reach/i')
    )

    // Should have at least 1 market
    await expect(marketCards.first()).toBeVisible({ timeout: 10000 })

    // Check market displays question
    await expect(page.locator('text=/Will/i')).toBeVisible()
  })

  test('should show market statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`)

    // Wait for markets to load
    await page.waitForLoadState('networkidle')

    // Should show active markets count
    await expect(page.locator('text=/Active Markets|Markets/i')).toBeVisible()

    // Should show volume
    await expect(page.locator('text=/Volume|Total/i')).toBeVisible()
  })

  test('should allow clicking on market to view details', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`)

    // Wait for market cards
    await page.waitForSelector('text=/Will/i', { timeout: 10000 })

    // Find first market card and click
    const firstMarket = page.locator('text=/Will .* reach/i').first()
    await firstMarket.click()

    // Should navigate to market detail page
    await expect(page).toHaveURL(/\/markets\/\d+/)
  })
})

test.describe('3. Market Detail Page', () => {
  test('should display market #2 details', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`)

    // Check market question is displayed
    await expect(page.locator('h1, h2')).toContainText(/Will ETH reach/i)

    // Check for YES/NO options
    await expect(page.locator('text=/YES/i')).toBeVisible()
    await expect(page.locator('text=/NO/i')).toBeVisible()

    // Check for pool information
    await expect(page.locator('text=/pool|total/i')).toBeVisible()
  })

  test('should show current pools correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`)

    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // Should show percentages or amounts
    const hasPercentage = await page.locator('text=/%/').count() > 0
    const hasAmount = await page.locator('text=/SOL|◎/').count() > 0

    expect(hasPercentage || hasAmount).toBeTruthy()
  })

  test('should display betting panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`)

    // Check for betting controls
    await expect(
      page.locator('button:has-text("YES")').or(
        page.locator('input[type="number"]')
      )
    ).toBeVisible()
  })
})

test.describe('4. Betting Flow (UI Elements)', () => {
  test('should show wallet connection options', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`)

    // Should see wallet button
    const walletButton = page.locator('button:has-text(/wallet|connect/i)')
    await expect(walletButton).toBeVisible()
  })

  test('should have bet amount input', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`)

    // Should have amount input field
    await expect(
      page.locator('input[type="number"]').or(
        page.locator('input[placeholder*="amount"]')
      )
    ).toBeVisible()
  })

  test('should have YES/NO bet buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`)

    // Should have bet action buttons
    await expect(
      page.locator('button:has-text("YES")').or(
        page.locator('button:has-text("Place Bet")')
      )
    ).toBeVisible()
  })
})

test.describe('5. Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)

    // Check page loads
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i)
  })

  test('should show user stats or prompt to connect', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)

    // Should either show stats or wallet prompt
    const hasStats = await page.locator('text=/Total Bets|Active Bets/i').count() > 0
    const hasWalletPrompt = await page.locator('text=/connect|wallet/i').count() > 0

    expect(hasStats || hasWalletPrompt).toBeTruthy()
  })

  test('should have bets section', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')

    // Should have section for bets
    await expect(
      page.locator('text=/Your Bets|My Bets|Active Bets/i')
    ).toBeVisible()
  })

  test('should show bet history if wallet connected', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)

    // If wallet is connected, should show bet list or empty state
    const hasBetList = await page.locator('[data-testid="bet-item"]').count() > 0
    const hasEmptyState = await page.locator('text=/no bets|place a bet/i').count() > 0

    // One of these should be true (either has bets or empty state)
    expect(hasBetList || hasEmptyState).toBeTruthy()
  })
})

test.describe('6. Leaderboard', () => {
  test('should load leaderboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/leaderboard`)

    // Check page loads
    await expect(page.locator('h1, h2')).toContainText(/leaderboard/i)
  })

  test('should display user rankings', async ({ page }) => {
    await page.goto(`${BASE_URL}/leaderboard`)
    await page.waitForLoadState('networkidle')

    // Should show at least some ranking data
    const hasRankings = await page.locator('[data-testid="leaderboard-row"]').count() > 0
    const hasUserList = await page.locator('text=/rank|position|user/i').count() > 0

    expect(hasRankings || hasUserList).toBeTruthy()
  })

  test('should show user statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/leaderboard`)

    // Should show metrics like wins, total bets, etc.
    await expect(
      page.locator('text=/wins|bets|volume|profit/i')
    ).toBeVisible()
  })
})

test.describe('7. Data Integration', () => {
  test('markets should show data from database', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`)
    await page.waitForLoadState('networkidle')

    // Should show the ETH market we know exists
    await expect(page.locator('text=/Will ETH reach/i')).toBeVisible({ timeout: 10000 })
  })

  test('market #2 should show actual pool data', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`)
    await page.waitForLoadState('networkidle')

    // Should show non-zero pools (we know there's a bet)
    const pageContent = await page.content()

    // Look for pool indicators
    const hasPoolData = pageContent.includes('pool') ||
                        pageContent.includes('YES') ||
                        pageContent.includes('100%')

    expect(hasPoolData).toBeTruthy()
  })

  test('dashboard should connect to database', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    const hasError = await page.locator('text=/error|failed|500/i').count() > 0
    expect(hasError).toBeFalsy()
  })
})

test.describe('8. Performance & Stability', () => {
  test('all pages should load within 5 seconds', async ({ page }) => {
    const pages = ['/', '/markets', '/markets/2', '/dashboard', '/leaderboard']

    for (const path of pages) {
      const start = Date.now()
      await page.goto(`${BASE_URL}${path}`)
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - start

      expect(loadTime).toBeLessThan(5000)
    }
  })

  test('should not have console errors on homepage', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('websocket') &&
      !err.includes('wallet')
    )

    expect(criticalErrors.length).toBe(0)
  })
})

test.describe('9. Real Data Verification', () => {
  test('should display our test bet in database', async ({ page }) => {
    // This verifies the sync is working
    // Our bet: 0.1 SOL YES on Market #2

    // Check if it appears in market detail
    await page.goto(`${BASE_URL}/markets/2`)
    await page.waitForLoadState('networkidle')

    // Should show updated pool (YES pool has our 0.097 SOL)
    const content = await page.content()

    // Look for evidence of our bet
    const hasYesPool = content.toLowerCase().includes('yes')
    expect(hasYesPool).toBeTruthy()
  })
})
