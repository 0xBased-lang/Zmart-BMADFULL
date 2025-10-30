import { test, expect } from '@playwright/test'

test.describe('Test Real Markets', () => {
  test('Market 10 - BTC prediction loads correctly', async ({ page, baseURL }) => {
    console.log('🔍 Testing Market 10 (BTC)...')
    console.log('📍 Using baseURL:', baseURL)

    await page.goto('/markets/10', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    console.log('✅ Page loaded')

    // Wait for hydration
    await page.waitForTimeout(2000)

    // Check market question
    const hasQuestion = await page.getByText('Will BTC reach $100k').count()
    console.log('- BTC question found:', hasQuestion > 0 ? '✅' : '❌')

    // Check for betting panel
    const hasBettingPanel = await page.getByText('Place Your Bet').count()
    console.log('- Betting panel found:', hasBettingPanel > 0 ? '✅' : '❌')

    // Check for YES/NO buttons
    const hasYesButton = await page.getByTestId('bet-yes-button').count()
    const hasNoButton = await page.getByTestId('bet-no-button').count()
    console.log('- YES button found:', hasYesButton > 0 ? '✅' : '❌')
    console.log('- NO button found:', hasNoButton > 0 ? '✅' : '❌')

    // Check buttons are enabled
    const yesButtonDisabled = await page.getByTestId('bet-yes-button').isDisabled()
    const noButtonDisabled = await page.getByTestId('bet-no-button').isDisabled()
    console.log('- YES button enabled:', !yesButtonDisabled ? '✅' : '❌')
    console.log('- NO button enabled:', !noButtonDisabled ? '✅' : '❌')

    // Check for amount input
    const hasAmountInput = await page.getByTestId('bet-amount-input').count()
    console.log('- Amount input found:', hasAmountInput > 0 ? '✅' : '❌')

    // Check for wallet connection prompt
    const hasConnectWallet = await page.getByText('Connect your wallet to place bets').count()
    const hasSelectWallet = await page.getByText('Select Wallet').count()
    console.log('- Wallet prompt found:', (hasConnectWallet > 0 || hasSelectWallet > 0) ? '✅' : '❌')

    // Check for comments section
    const hasCommentsSection = await page.getByText('Comments').count()
    console.log('- Comments section found:', hasCommentsSection > 0 ? '✅' : '❌')

    // Take screenshot
    await page.screenshot({
      path: 'market-10-real.png',
      fullPage: true
    })
    console.log('📸 Screenshot saved: market-10-real.png')

    // Assertions
    expect(hasQuestion).toBeGreaterThan(0)
    expect(hasBettingPanel).toBeGreaterThan(0)
    expect(hasYesButton).toBeGreaterThan(0)
    expect(hasNoButton).toBeGreaterThan(0)
  })

  test('Test commenting functionality on Market 10', async ({ page, baseURL }) => {
    console.log('🔍 Testing comments on Market 10...')
    console.log('📍 Using baseURL:', baseURL)

    await page.goto('/markets/10', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForTimeout(2000)

    // Check for comment input
    const commentTextarea = await page.locator('textarea[placeholder*="comment" i]').count()
    console.log('- Comment textarea found:', commentTextarea > 0 ? '✅' : '❌')

    // Check for submit button
    const submitButton = await page.getByRole('button', { name: /post|submit/i }).count()
    console.log('- Submit button found:', submitButton > 0 ? '✅' : '❌')

    // Try to type in comment box (won't submit without wallet)
    if (commentTextarea > 0) {
      await page.locator('textarea[placeholder*="comment" i]').first().fill('Test comment from Playwright')
      console.log('✅ Able to type in comment box')
    }

    expect(commentTextarea).toBeGreaterThan(0)
  })
})
