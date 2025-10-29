/**
 * Devnet Diagnostic Test
 * Comprehensive test to diagnose actual issues with the application
 */

import { test, expect } from '@playwright/test'

test.describe('Devnet Application Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      console.log(`[Browser ${type.toUpperCase()}]:`, text)
    })

    // Capture page errors
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]:', error.message)
    })

    // Capture failed requests
    page.on('requestfailed', request => {
      console.error('[REQUEST FAILED]:', request.url(), request.failure()?.errorText)
    })
  })

  test('Homepage loads and shows markets', async ({ page }) => {
    console.log('🧪 Test 1: Loading homepage...')

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({ path: '/tmp/homepage.png', fullPage: true })
    console.log('📸 Screenshot saved: /tmp/homepage.png')

    // Check if page loaded
    const title = await page.title()
    console.log('📄 Page title:', title)

    // Check for main heading
    const heading = await page.locator('h1').first().textContent()
    console.log('📝 Main heading:', heading)

    // Check if markets section exists
    const hasMarketsSection = await page.locator('[class*="market"]').count()
    console.log('🎯 Elements with "market" class:', hasMarketsSection)

    // Check for loading states
    const loadingElements = await page.locator('text=/loading/i').count()
    console.log('⏳ Loading elements:', loadingElements)

    // Check for error messages
    const errorElements = await page.locator('text=/error/i').count()
    console.log('❌ Error elements:', errorElements)

    // Try to find market cards
    const marketCards = await page.locator('[data-testid*="market"], [class*="MarketCard"], a[href*="/markets/"]').count()
    console.log('🃏 Potential market cards found:', marketCards)

    // Get all links
    const links = await page.locator('a[href]').all()
    console.log('🔗 Total links on page:', links.length)
    for (const link of links.slice(0, 10)) {
      const href = await link.getAttribute('href')
      const text = await link.textContent()
      console.log(`  - ${text?.trim()}: ${href}`)
    }

    // Check for "Connect Wallet" button
    const connectButton = await page.locator('button:has-text("Connect")').count()
    console.log('👛 Connect wallet buttons:', connectButton)

    expect(page.url()).toBe('http://localhost:3000/')
  })

  test('Check market detail page', async ({ page }) => {
    console.log('🧪 Test 2: Checking market detail page...')

    // Try to navigate to a specific market
    await page.goto('http://localhost:3000/markets/1')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: '/tmp/market-detail.png', fullPage: true })
    console.log('📸 Screenshot saved: /tmp/market-detail.png')

    // Check if market loaded or error shown
    const hasError = await page.locator('text=/error|not found/i').count()
    console.log('❌ Error on market page:', hasError)

    // Check for betting panel
    const hasBettingPanel = await page.locator('text=/place.*bet|betting/i').count()
    console.log('💰 Betting panel elements:', hasBettingPanel)

    // Check for market question
    const marketQuestion = await page.locator('h1, h2, [class*="question"]').first().textContent()
    console.log('❓ Market question:', marketQuestion)

    // Check for YES/NO buttons
    const yesNoButtons = await page.locator('button:has-text("YES"), button:has-text("NO")').count()
    console.log('✅❌ YES/NO buttons:', yesNoButtons)
  })

  test('Check proposals page', async ({ page }) => {
    console.log('🧪 Test 3: Checking proposals page...')

    await page.goto('http://localhost:3000/proposals')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: '/tmp/proposals.png', fullPage: true })
    console.log('📸 Screenshot saved: /tmp/proposals.png')

    // Check for proposals
    const proposalElements = await page.locator('[class*="proposal"], [data-testid*="proposal"]').count()
    console.log('📋 Proposal elements:', proposalElements)

    // Check for "No proposals" message
    const noProposals = await page.locator('text=/no proposals|empty/i').count()
    console.log('📭 No proposals message:', noProposals)

    // Check for vote buttons
    const voteButtons = await page.locator('button:has-text("Vote"), button:has-text("FOR"), button:has-text("AGAINST")').count()
    console.log('🗳️ Vote buttons:', voteButtons)
  })

  test('Check propose page (create proposal)', async ({ page }) => {
    console.log('🧪 Test 4: Checking propose page...')

    await page.goto('http://localhost:3000/propose')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: '/tmp/propose.png', fullPage: true })
    console.log('📸 Screenshot saved: /tmp/propose.png')

    // Check for form fields
    const titleInput = await page.locator('input[name="title"], input[placeholder*="title" i]').count()
    const descInput = await page.locator('textarea[name="description"], textarea[placeholder*="description" i]').count()
    console.log('📝 Title inputs:', titleInput)
    console.log('📝 Description inputs:', descInput)

    // Check for submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Create")').count()
    console.log('🚀 Submit buttons:', submitButton)
  })

  test('Simulate betting attempt (without wallet)', async ({ page }) => {
    console.log('🧪 Test 5: Simulating betting attempt...')

    await page.goto('http://localhost:3000/markets/1')
    await page.waitForLoadState('networkidle')

    // Try to find and click a bet button
    const yesButton = page.locator('button:has-text("YES")').first()
    const yesButtonExists = await yesButton.count()

    if (yesButtonExists > 0) {
      console.log('✅ YES button found, clicking...')
      await yesButton.click()
      await page.waitForTimeout(1000)

      // Check for connect wallet prompt
      const connectPrompt = await page.locator('text=/connect.*wallet/i').count()
      console.log('👛 Connect wallet prompt shown:', connectPrompt)
    } else {
      console.log('❌ NO YES button found')
    }

    await page.screenshot({ path: '/tmp/betting-attempt.png', fullPage: true })
    console.log('📸 Screenshot saved: /tmp/betting-attempt.png')
  })

  test('Check database data via API', async ({ page }) => {
    console.log('🧪 Test 6: Checking database via API...')

    // Check markets API
    const marketsResponse = await page.request.get('http://localhost:54321/rest/v1/markets?select=*&limit=5', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    })

    const markets = await marketsResponse.json()
    console.log('📊 Markets in database:', JSON.stringify(markets, null, 2))

    // Check proposals API
    const proposalsResponse = await page.request.get('http://localhost:54321/rest/v1/proposals?select=*&limit=5', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    })

    const proposals = await proposalsResponse.json()
    console.log('📋 Proposals in database:', JSON.stringify(proposals, null, 2))
  })
})
