import { test, expect } from '@playwright/test'

test.describe('Debug Betting Panel Rendering', () => {
  test('Check what is actually rendering on the page', async ({ page }) => {
    console.log('🔍 Navigating to market page...')

    await page.goto('https://frontend-kektech1.vercel.app/markets/1', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    console.log('✅ Page loaded')

    // Wait for hydration
    await page.waitForTimeout(3000)

    // Check if page is hydrated
    const isHydrated = await page.evaluate(() => {
      const root = document.querySelector('[data-hydrated]')
      return root ? root.getAttribute('data-hydrated') : 'not-found'
    })
    console.log('📊 Hydration status:', isHydrated)

    // Get all text content on the page
    const allText = await page.evaluate(() => document.body.innerText)
    console.log('\n📄 Page text content (first 500 chars):')
    console.log(allText.substring(0, 500))
    console.log('...')

    // Check for specific elements
    console.log('\n🔍 Checking for key elements:')

    const hasPlaceYourBet = await page.getByText('Place Your Bet').count()
    console.log('- "Place Your Bet" count:', hasPlaceYourBet)

    const hasBettingPanel = await page.locator('[class*="BettingPanel"]').count()
    console.log('- BettingPanel component count:', hasBettingPanel)

    const hasBgWhite = await page.locator('.bg-white\\/5').count()
    console.log('- Elements with .bg-white/5 class:', hasBgWhite)

    // Check for market status
    const marketStatus = await page.evaluate(() => {
      const statusElement = document.querySelector('[class*="active"]')
      return statusElement ? statusElement.textContent : 'not-found'
    })
    console.log('- Market status indicator:', marketStatus)

    // Check if connect wallet button exists (not connected)
    const connectButton = await page.getByText('Connect Wallet').count()
    console.log('- "Connect Wallet" button count:', connectButton)

    // Check if bet buttons exist (connected)
    const yesButton = await page.getByTestId('bet-yes-button').count()
    const noButton = await page.getByTestId('bet-no-button').count()
    console.log('- YES button count:', yesButton)
    console.log('- NO button count:', noButton)

    // Check for desktop layout
    const desktopLayout = await page.locator('.md\\:grid-cols-2').count()
    console.log('- Desktop 2-column layout count:', desktopLayout)

    // Check for mobile tabs
    const mobileTabs = await page.getByText('Bet').count()
    console.log('- Mobile "Bet" tab count:', mobileTabs)

    // Take screenshot for visual inspection
    await page.screenshot({
      path: 'betting-panel-debug.png',
      fullPage: true
    })
    console.log('\n📸 Screenshot saved: betting-panel-debug.png')

    // Get HTML of the main container
    const mainHTML = await page.evaluate(() => {
      const main = document.querySelector('.container')
      return main ? main.innerHTML.substring(0, 1000) : 'container not found'
    })
    console.log('\n📋 Main container HTML (first 1000 chars):')
    console.log(mainHTML)
    console.log('...')
  })
})
