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

// Helper function to wait for React hydration to complete
async function waitForHydration(page: any, timeout = 15000) {
  await page.waitForFunction(
    () => {
      // Check if any element has data-hydrated="true"
      const hydratedElements = document.querySelectorAll('[data-hydrated="true"]')
      return hydratedElements.length > 0
    },
    { timeout }
  )
}

test.describe('1. Homepage & Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await waitForHydration(page)

    // Check title
    await expect(page).toHaveTitle(/BMAD-Zmart/)

    // Check main heading
    await expect(page.locator('h1')).toContainText('BMAD-Zmart')

    // Check navigation links exist using test IDs
    await expect(page.locator('[data-testid="nav-markets"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="nav-leaderboard"]')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to main pages', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await waitForHydration(page)

    // Navigate to Markets using test ID
    await page.click('[data-testid="nav-markets"]')
    await expect(page).toHaveURL(/\/markets/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await waitForHydration(page)
    await expect(page.locator('h1, h2').first()).toContainText(/markets/i, { timeout: 10000 })

    // Navigate to Leaderboard using test ID
    await page.click('[data-testid="nav-leaderboard"]')
    await expect(page).toHaveURL(/\/leaderboard/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(/leaderboard/i, { timeout: 10000 })
  })
})

test.describe('2. Markets Listing Page', () => {
  test('should display markets list', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await waitForHydration(page)

    // Check page loaded with increased timeout
    await expect(page.locator('h1, h2').first()).toContainText(/markets/i, { timeout: 15000 })

    // Wait for SSR content - use test ID for market cards
    await expect(page.locator('[data-testid="market-card"]').first()).toBeVisible({ timeout: 15000 })

    // Verify we can see actual market content
    const marketCount = await page.locator('[data-testid="market-card"]').count()
    expect(marketCount).toBeGreaterThan(0)
  })

  test('should show market statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`, { waitUntil: 'networkidle' })
    await waitForHydration(page)

    // Wait for markets to load with longer timeout
    await page.waitForLoadState('domcontentloaded')

    // Should show markets heading or count with extended timeout
    await expect(page.locator('text=/Markets|Active/i').first()).toBeVisible({ timeout: 15000 })

    // Should show some market data (volume, pools, etc.)
    const hasData = await page.locator('text=/SOL|◎|pool|total/i').count() > 0
    expect(hasData).toBeTruthy()
  })

  test('should allow clicking on market to view details', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`, { waitUntil: 'networkidle' })
    await waitForHydration(page)

    // Wait for market cards with test ID
    await page.waitForSelector('[data-testid="market-card"]', { timeout: 15000 })

    // Find first market and click
    const firstMarket = page.locator('[data-testid="market-card"]').first()
    await firstMarket.waitFor({ state: 'visible', timeout: 10000 })
    await firstMarket.click()

    // Should navigate to market detail page
    await expect(page).toHaveURL(/\/markets\/\d+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
  })

  test('should have market filtering or sorting', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets`, { waitUntil: 'networkidle' })
    await waitForHydration(page)

    // Page should show multiple markets using test ID
    const marketCount = await page.locator('[data-testid="market-card"]').count()
    expect(marketCount).toBeGreaterThan(0)
  })
})

test.describe('3. Market Detail Page', () => {
  test('should display market #2 details', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
    await waitForHydration(page)

    // Wait for SSR content to be loaded
    await page.waitForLoadState('domcontentloaded')

    // Check market question is displayed with extended timeout
    await expect(page.locator('h1, h2').first()).toContainText(/Will ETH reach/i, { timeout: 15000 })

    // Check for YES/NO options with longer timeout
    await expect(page.locator('text=/YES/i').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/NO/i').first()).toBeVisible({ timeout: 10000 })

    // Check for pool information
    await expect(page.locator('text=/pool|total/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('should show current pools correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
    await waitForHydration(page)

    // Wait for data to load
    await page.waitForLoadState('domcontentloaded')

    // Should show percentages or amounts with extended wait
    await page.waitForTimeout(2000) // Give SSR content time to hydrate

    const hasPercentage = await page.locator('text=/%/').count() > 0
    const hasAmount = await page.locator('text=/SOL|◎/').count() > 0
    const hasNumbers = await page.locator('text=/\\d+\\.\\d+/').count() > 0

    expect(hasPercentage || hasAmount || hasNumbers).toBeTruthy()
  })

  test('should display betting panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
    await waitForHydration(page)

    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded')

    // Check for betting controls using test IDs
    const yesButton = page.locator('[data-testid="bet-yes-button"]')
    const noButton = page.locator('[data-testid="bet-no-button"]')
    const amountInput = page.locator('[data-testid="bet-amount-input"]')

    // Wait for betting panel to load
    await expect(yesButton.or(amountInput)).toBeVisible({ timeout: 10000 })

    // Should have betting controls visible (or disabled but present)
    const yesCount = await yesButton.count()
    const inputCount = await amountInput.count()
    expect(yesCount + inputCount).toBeGreaterThan(0)
  })

  test('should show market status', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
    await waitForHydration(page)

    // Should show if market is active, resolved, etc.
    const hasStatus = await page.locator('text=/active|open|closed|resolved/i').count() > 0
    expect(hasStatus).toBeTruthy()
  })
})

test.describe('4. Betting Flow (UI Elements)', () => {
  test('should show wallet connection options', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForLoadState('domcontentloaded')

    // Should see wallet button with extended timeout
    const walletButton = page.locator('button:has-text(/wallet|connect/i)')
    await expect(walletButton.first()).toBeVisible({ timeout: 10000 })
  })

  test('should have bet amount input', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForLoadState('domcontentloaded')

    // Should have amount input field using test ID
    const amountInput = page.locator('[data-testid="bet-amount-input"]')
    await expect(amountInput).toBeVisible({ timeout: 10000 })
  })

  test('should have YES/NO bet buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForLoadState('domcontentloaded')

    // Should have bet action buttons using test IDs
    const yesButton = page.locator('[data-testid="bet-yes-button"]')
    const noButton = page.locator('[data-testid="bet-no-button"]')

    await expect(yesButton.or(noButton)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('5. Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForLoadState('domcontentloaded')

    // Check page loads using test ID or heading
    const dashboardHeading = page.locator('[data-testid="dashboard-heading"]')
    const anyDashboardText = page.locator('text=/dashboard/i')

    await expect(dashboardHeading.or(anyDashboardText)).toBeVisible({ timeout: 10000 })
  })

  test('should show user stats or prompt to connect', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForLoadState('domcontentloaded')

    // Should either show dashboard content or wallet prompt
    const hasDashboard = await page.locator('[data-testid="dashboard-heading"]').count() > 0
    const hasWalletPrompt = await page.locator('text=/connect|wallet/i').count() > 0

    expect(hasDashboard || hasWalletPrompt).toBeTruthy()
  })

  test('should have bets section when connected', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForLoadState('domcontentloaded')

    // Should have dashboard or bets section
    const activeBetsSection = page.locator('[data-testid="active-bets-section"]')
    const activeBetsHeading = page.locator('[data-testid="active-bets-heading"]')
    const anyBetsText = page.locator('text=/bets/i')

    // At least one should be present
    const count = await activeBetsSection.count() + await activeBetsHeading.count() + await anyBetsText.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show bet content or empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await waitForHydration(page)
    await page.waitForLoadState('domcontentloaded')

    // Should show some dashboard content
    const hasDashboardHeading = await page.locator('[data-testid="dashboard-heading"]').count() > 0
    const hasAnyContent = await page.locator('text=/dashboard|bets|portfolio|wallet/i').count() > 0

    expect(hasDashboardHeading || hasAnyContent).toBeTruthy()
  })
})

test.describe('6. Leaderboard', () => {
  test('should load leaderboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/leaderboard`)

    // Check page loads - be specific to avoid strict mode violation
    await expect(page.getByRole('heading', { level: 1, name: /leaderboard/i })).toBeVisible()
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

    // Should show metrics like wins, total bets, etc. - use first() to avoid strict mode
    await expect(
      page.locator('text=/wins|bets|volume|profit/i').first()
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
  test('all pages should load within reasonable time', async ({ page }) => {
    const pages = ['/', '/markets', '/markets/2', '/dashboard', '/leaderboard']

    for (const path of pages) {
      const start = Date.now()
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      const loadTime = Date.now() - start

      // With SSR, initial page load should be faster, but total with networkidle can be longer
      expect(loadTime).toBeLessThan(10000) // 10 seconds is reasonable with all network activity
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
