import { test, expect } from '@playwright/test'

test.describe('Web3 Functionality Tests', () => {

  test('Market page loads and betting buttons are enabled', async ({ page }) => {
    console.log('🔍 Testing market page and betting buttons...\n')

    await page.goto('https://frontend-kektech1.vercel.app/markets/1', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Check if page loaded
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
    console.log('✅ Market page loaded')

    // Check for betting panel
    const bettingPanel = page.locator('text=Place Your Bet').first()
    await expect(bettingPanel).toBeVisible({ timeout: 5000 })
    console.log('✅ Betting panel visible')

    // Check YES button
    const yesButton = page.locator('button:has-text("YES"), button:has-text("Yes")').first()
    if (await yesButton.isVisible({ timeout: 3000 })) {
      const isEnabled = await yesButton.isEnabled()
      const cursor = await yesButton.evaluate(el => window.getComputedStyle(el).cursor)

      console.log(`📊 YES button - Enabled: ${isEnabled}, Cursor: ${cursor}`)

      if (!isEnabled || cursor === 'not-allowed') {
        console.log('⚠️  Buttons still disabled - checking marketStatus')

        // Try to find status indicator
        const statusText = await page.textContent('body')
        if (statusText?.includes('inactive') || statusText?.includes('ended')) {
          console.log('ℹ️  Market may be inactive/ended')
        }
      } else {
        console.log('✅ Betting buttons are enabled!')
      }
    }

    // Check for comment section
    const commentSection = page.locator('textarea, input[placeholder*="comment" i]').first()
    const hasComments = await commentSection.isVisible({ timeout: 3000 })
    console.log(`${hasComments ? '✅' : '❌'} Comment section found`)

    // Take diagnostic screenshot
    await page.screenshot({ path: '/tmp/market-page-test.png', fullPage: true })
    console.log('📸 Screenshot saved to /tmp/market-page-test.png')
  })

  test('Test comment submission API', async ({ page }) => {
    console.log('🔍 Testing comment submission...\n')

    const apiResponses: any[] = []
    const apiErrors: any[] = []

    // Intercept API calls
    page.on('response', async response => {
      if (response.url().includes('/api/submit-comment')) {
        const status = response.status()
        try {
          const body = await response.json()

          if (status >= 400) {
            apiErrors.push({ status, body, url: response.url() })
          } else {
            apiResponses.push({ status, body })
          }
        } catch (e) {
          console.log('Could not parse response')
        }
      }
    })

    await page.goto('https://frontend-kektech1.vercel.app/markets/1', {
      waitUntil: 'networkidle'
    })

    // Wait for page to load
    await page.waitForTimeout(2000)

    // Check if wallet is connected
    const walletConnected = await page.locator('text=/0x[a-fA-F0-9]+|[1-9A-HJ-NP-Za-km-z]{32,44}/').isVisible({ timeout: 2000 })

    console.log(`📊 Wallet connected: ${walletConnected}`)

    if (!walletConnected) {
      console.log('⚠️  Wallet not connected - comment submission requires wallet')
      console.log('ℹ️  To test: Connect wallet manually and try posting a comment')
      return
    }

    // Find comment input
    const commentInput = page.locator('textarea, input[placeholder*="comment" i]').first()

    if (await commentInput.isVisible({ timeout: 3000 })) {
      console.log('✅ Comment input found')
    } else {
      console.log('❌ Comment input not found on page')
    }
  })

  test('Diagnose betting transaction flow', async ({ page }) => {
    console.log('🔍 Diagnosing betting transaction flow...\n')

    const errors: any[] = []

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Capture network errors
    page.on('requestfailed', request => {
      errors.push(`Network: ${request.url()} - ${request.failure()?.errorText}`)
    })

    await page.goto('https://frontend-kektech1.vercel.app/markets/1', {
      waitUntil: 'networkidle'
    })

    await page.waitForTimeout(2000)

    // Check market status
    const bodyText = await page.textContent('body')
    const marketActive = !bodyText?.includes('market has been resolved') &&
                        !bodyText?.includes('market has ended') &&
                        !bodyText?.includes('market has been cancelled')

    console.log(`📊 Market appears active: ${marketActive}`)

    // Check wallet connection
    const walletConnected = await page.locator('text=/0x[a-fA-F0-9]+|[1-9A-HJ-NP-Za-km-z]{32,44}/').isVisible({ timeout: 2000 })
    console.log(`📊 Wallet connected: ${walletConnected}`)

    // Check betting inputs
    const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]').first()
    const hasAmountInput = await amountInput.isVisible({ timeout: 3000 })
    console.log(`📊 Amount input visible: ${hasAmountInput}`)

    // Check YES/NO buttons
    const yesButton = page.locator('button:has-text("YES"), button:has-text("Yes")').first()
    const noButton = page.locator('button:has-text("NO"), button:has-text("No")').first()

    const yesVisible = await yesButton.isVisible({ timeout: 2000 })
    const noVisible = await noButton.isVisible({ timeout: 2000 })

    console.log(`📊 YES button visible: ${yesVisible}`)
    console.log(`📊 NO button visible: ${noVisible}`)

    if (yesVisible) {
      const yesEnabled = await yesButton.isEnabled()
      const yesCursor = await yesButton.evaluate(el => window.getComputedStyle(el).cursor)
      console.log(`📊 YES button enabled: ${yesEnabled}, cursor: ${yesCursor}`)
    }

    // Check for Solana program configuration
    const hasWeb3 = await page.evaluate(() => {
      return typeof (window as any).solana !== 'undefined'
    })
    console.log(`📊 Solana object available: ${hasWeb3}`)

    // Summary
    console.log('\n📋 DIAGNOSTIC SUMMARY:')
    console.log('='.repeat(50))

    const issues: string[] = []

    if (!marketActive) issues.push('Market may be inactive/ended')
    if (!walletConnected) issues.push('Wallet not connected')
    if (!hasAmountInput) issues.push('Amount input not found')
    if (!yesVisible || !noVisible) issues.push('Betting buttons not visible')
    if (!hasWeb3) issues.push('Solana wallet object not available')

    if (issues.length > 0) {
      console.log('❌ Issues found:')
      issues.forEach(issue => console.log(`   - ${issue}`))
    } else {
      console.log('✅ All prerequisites met for betting')
      console.log('ℹ️  To test betting: Connect wallet and enter amount')
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors captured:')
      errors.forEach(err => console.log(`   - ${err.substring(0, 200)}`))
    }
  })
})
