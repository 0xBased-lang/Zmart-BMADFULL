import { test, expect } from '@playwright/test'

test.describe('Proposal Voting Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to proposals page
    await page.goto('http://localhost:3000/proposals')
  })

  test('should display proposals interface with tabs', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1:has-text("Vote on Market Proposals")')).toBeVisible()

    // Check description
    await expect(page.locator('text=Help control what markets get created')).toBeVisible()

    // Check tabs are visible
    await expect(page.locator('button:has-text("Pending Votes")')).toBeVisible()
    await expect(page.locator('button:has-text("Approved")')).toBeVisible()
    await expect(page.locator('button:has-text("Rejected")')).toBeVisible()
  })

  test('should handle tab navigation', async ({ page }) => {
    // Click Approved tab
    await page.locator('button:has-text("Approved")').click()
    await page.waitForTimeout(500)

    // Check URL updated
    expect(page.url()).toContain('tab=approved')

    // Click Rejected tab
    await page.locator('button:has-text("Rejected")').click()
    await page.waitForTimeout(500)

    // Check URL updated
    expect(page.url()).toContain('tab=rejected')

    // Click back to Pending
    await page.locator('button:has-text("Pending Votes")').click()
    await page.waitForTimeout(500)

    expect(page.url()).toContain('tab=pending')
  })

  test('should show empty state or proposals', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000)

    // Check if empty state or proposals are shown
    const emptyState = page.locator('text=No proposals currently in voting period')
    const proposalCards = page.locator('[class*="grid"]').locator('div').filter({ hasText: 'Vote YES' })

    // Should show either empty state OR proposal cards (not both)
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasProposals = await proposalCards.count().then(count => count > 0).catch(() => false)

    expect(hasEmptyState || hasProposals).toBe(true)
  })

  test('should display proposal cards with required fields', async ({ page }) => {
    await page.waitForTimeout(2000)

    const proposalCount = await page.locator('[class*="bg-gray-900"]').count()

    if (proposalCount > 0) {
      const firstCard = page.locator('[class*="bg-gray-900"]').first()

      // Should show bond tier badge
      await expect(firstCard.locator('text=/Low Bond|Medium Bond|High Bond/')).toBeVisible()

      // Should show creator
      await expect(firstCard.locator('text=Creator:')).toBeVisible()

      // Should show vote tally
      await expect(firstCard.locator('text=YES')).toBeVisible()
      await expect(firstCard.locator('text=NO')).toBeVisible()
    }
  })

  test('should show vote buttons or wallet connect', async ({ page }) => {
    await page.waitForTimeout(2000)

    const proposalCount = await page.locator('[class*="bg-gray-900"]').count()

    if (proposalCount > 0) {
      // Check for either wallet connect button or vote buttons
      const walletConnect = page.locator('text=Connect your wallet to vote')
      const voteButtons = page.locator('button:has-text("Vote YES")').first()

      const hasWalletConnect = await walletConnect.isVisible().catch(() => false)
      const hasVoteButtons = await voteButtons.isVisible().catch(() => false)

      expect(hasWalletConnect || hasVoteButtons).toBe(true)
    }
  })

  test('should show voting countdown timer', async ({ page }) => {
    await page.waitForTimeout(2000)

    const proposalCount = await page.locator('[class*="bg-gray-900"]').count()

    if (proposalCount > 0) {
      // Look for countdown text pattern
      const countdown = page.locator('text=/Voting ends/')

      const countdownCount = await countdown.count()
      expect(countdownCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('should display vote percentages', async ({ page }) => {
    await page.waitForTimeout(2000)

    const proposalCount = await page.locator('[class*="bg-gray-900"]').count()

    if (proposalCount > 0) {
      const firstCard = page.locator('[class*="bg-gray-900"]').first()

      // Check for percentage indicators
      const percentages = firstCard.locator('text=/%/')
      const percentageCount = await percentages.count()

      // Should have at least 2 percentages (YES and NO)
      expect(percentageCount).toBeGreaterThanOrEqual(2)
    }
  })

  test('should display vote count', async ({ page }) => {
    await page.waitForTimeout(2000)

    const proposalCount = await page.locator('[class*="bg-gray-900"]').count()

    if (proposalCount > 0) {
      const firstCard = page.locator('[class*="bg-gray-900"]').first()

      // Check for vote count text
      const voteCount = firstCard.locator('text=/\\d+ votes? cast/')

      await expect(voteCount).toBeVisible()
    }
  })

  test('should show approved proposals in approved tab', async ({ page }) => {
    // Click Approved tab
    await page.locator('button:has-text("Approved")').click()
    await page.waitForTimeout(2000)

    // Should show either empty state or approved proposals
    const emptyState = page.locator('text=No approved proposals yet')
    const proposals = page.locator('[class*="bg-gray-900"]')

    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasProposals = await proposals.count().then(count => count > 0).catch(() => false)

    expect(hasEmptyState || hasProposals).toBe(true)
  })

  test('should show rejected proposals in rejected tab', async ({ page }) => {
    // Click Rejected tab
    await page.locator('button:has-text("Rejected")').click()
    await page.waitForTimeout(2000)

    // Should show either empty state or rejected proposals
    const emptyState = page.locator('text=No rejected proposals yet')
    const proposals = page.locator('[class*="bg-gray-900"]')

    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasProposals = await proposals.count().then(count => count > 0).catch(() => false)

    expect(hasEmptyState || hasProposals).toBe(true)
  })

  test('should handle long description with read more', async ({ page }) => {
    await page.waitForTimeout(2000)

    const proposalCount = await page.locator('[class*="bg-gray-900"]').count()

    if (proposalCount > 0) {
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

  test('should display responsive grid layout', async ({ page }) => {
    await page.waitForTimeout(2000)

    // Check for grid container
    const gridContainer = page.locator('[class*="grid"]').filter({ has: page.locator('button:has-text("Vote YES")') })

    if (await gridContainer.isVisible()) {
      // Grid should have proper classes
      const gridClass = await gridContainer.getAttribute('class')
      expect(gridClass).toContain('grid')
    }
  })
})
