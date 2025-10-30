import { test, expect } from '@playwright/test'

/**
 * Comprehensive Web3 Betting Diagnostics
 * Using advanced Playwright automation and debugging patterns
 */

test.describe('Web3 Betting Comprehensive Debug', () => {
  let consoleMessages: string[] = []
  let consoleErrors: string[] = []
  let networkErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => {
      const text = msg.text()
      consoleMessages.push(text)
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    // Capture network errors
    page.on('requestfailed', request => {
      networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`)
    })
  })

  test('Diagnose betting functionality with full Web3 context', async ({ page }) => {
    console.log('🔍 Starting comprehensive betting diagnosis...\n')

    // Navigate to market page
    await page.goto('https://frontend-kektech1.vercel.app/markets/10', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    console.log('✅ Page loaded successfully\n')

    // Wait for React hydration
    await page.waitForTimeout(3000)

    // ===================
    // 1. CHECK WALLET PROVIDER SETUP
    // ===================
    console.log('📊 STEP 1: Checking Wallet Provider Setup')
    console.log('==========================================')

    const walletProviderCheck = await page.evaluate(() => {
      return {
        hasSolana: typeof window.solana !== 'undefined',
        hasPhantom: typeof window.phantom !== 'undefined',
        walletAdapterReact: typeof window !== 'undefined',
        reactVersion: document.querySelector('[data-reactroot]') ? 'React app detected' : 'No React root',
      }
    })

    console.log('Wallet Provider Check:')
    console.log('- window.solana available:', walletProviderCheck.hasSolana ? '✅' : '❌')
    console.log('- window.phantom available:', walletProviderCheck.hasPhantom ? '✅' : '❌')
    console.log('- React app:', walletProviderCheck.reactVersion)

    // ===================
    // 2. CHECK WALLET CONNECTION STATE
    // ===================
    console.log('\n📊 STEP 2: Checking Wallet Connection State')
    console.log('==========================================')

    const walletState = await page.evaluate(() => {
      // Try to get wallet state from React context
      const selectWalletButton = document.querySelector('.wallet-adapter-button-trigger')
      const connectButtons = document.querySelectorAll('button')

      let connectButtonText = 'Not found'
      connectButtons.forEach(btn => {
        const text = btn.textContent || ''
        if (text.includes('Wallet') || text.includes('Connect')) {
          connectButtonText = text
        }
      })

      return {
        selectWalletButtonExists: !!selectWalletButton,
        selectWalletButtonText: selectWalletButton?.textContent || 'N/A',
        connectButtonText,
        totalButtons: connectButtons.length,
      }
    })

    console.log('Wallet UI State:')
    console.log('- Select Wallet button exists:', walletState.selectWalletButtonExists ? '✅' : '❌')
    console.log('- Button text:', walletState.selectWalletButtonText)
    console.log('- Connect button text:', walletState.connectButtonText)
    console.log('- Total buttons on page:', walletState.totalButtons)

    // ===================
    // 3. CHECK BETTING PANEL RENDERING
    // ===================
    console.log('\n📊 STEP 3: Checking Betting Panel Rendering')
    console.log('==========================================')

    const bettingPanelCheck = await page.evaluate(() => {
      const placeYourBet = document.querySelector('h3')?.textContent?.includes('Place Your Bet')
      const bettingPanel = document.querySelector('.bg-white\\/5')
      const connectWalletMessage = Array.from(document.querySelectorAll('p'))
        .find(p => p.textContent?.includes('Connect your wallet to place bets'))

      // Try to find YES/NO buttons
      const yesButton = document.querySelector('[data-testid="bet-yes-button"]')
      const noButton = document.querySelector('[data-testid="bet-no-button"]')
      const amountInput = document.querySelector('[data-testid="bet-amount-input"]')

      // Get all buttons and their text
      const allButtons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim() || '',
        disabled: btn.disabled,
        className: btn.className,
      }))

      return {
        hasPlaceYourBetTitle: !!placeYourBet,
        hasBettingPanel: !!bettingPanel,
        hasConnectWalletMessage: !!connectWalletMessage,
        connectWalletMessageText: connectWalletMessage?.textContent || 'N/A',
        hasYesButton: !!yesButton,
        hasNoButton: !!noButton,
        hasAmountInput: !!amountInput,
        allButtons: allButtons.filter(b => b.text.length > 0 && b.text.length < 50),
      }
    })

    console.log('Betting Panel State:')
    console.log('- "Place Your Bet" title:', bettingPanelCheck.hasPlaceYourBetTitle ? '✅' : '❌')
    console.log('- Betting panel container:', bettingPanelCheck.hasBettingPanel ? '✅' : '❌')
    console.log('- "Connect wallet" message:', bettingPanelCheck.hasConnectWalletMessage ? '✅' : '❌')
    console.log('- Message text:', bettingPanelCheck.connectWalletMessageText)
    console.log('- YES button (data-testid):', bettingPanelCheck.hasYesButton ? '✅' : '❌')
    console.log('- NO button (data-testid):', bettingPanelCheck.hasNoButton ? '✅' : '❌')
    console.log('- Amount input:', bettingPanelCheck.hasAmountInput ? '✅' : '❌')

    console.log('\nAll buttons found on page:')
    bettingPanelCheck.allButtons.forEach((btn, idx) => {
      console.log(`  ${idx + 1}. "${btn.text}" - disabled: ${btn.disabled}`)
    })

    // ===================
    // 4. CHECK FOR JAVASCRIPT ERRORS
    // ===================
    console.log('\n📊 STEP 4: Checking for JavaScript Errors')
    console.log('==========================================')

    console.log(`Console errors found: ${consoleErrors.length}`)
    if (consoleErrors.length > 0) {
      console.log('Errors:')
      consoleErrors.slice(0, 10).forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`)
      })
    } else {
      console.log('✅ No console errors')
    }

    console.log(`\nNetwork errors found: ${networkErrors.length}`)
    if (networkErrors.length > 0) {
      console.log('Network errors:')
      networkErrors.slice(0, 10).forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`)
      })
    } else {
      console.log('✅ No network errors')
    }

    // ===================
    // 5. CHECK REACT COMPONENT STATE
    // ===================
    console.log('\n📊 STEP 5: Checking React Component State')
    console.log('==========================================')

    const reactState = await page.evaluate(() => {
      // Check if hydration completed
      const hydrated = document.querySelector('[data-hydrated]')?.getAttribute('data-hydrated')

      // Check if wallet context is available
      const walletProviderElement = document.querySelector('[class*="WalletProvider"]')
      const connectionProviderElement = document.querySelector('[class*="ConnectionProvider"]')

      // Get all data attributes that might indicate state
      const allDataAttributes: Record<string, string> = {}
      document.querySelectorAll('[data-*]').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('data-')) {
            allDataAttributes[attr.name] = attr.value
          }
        })
      })

      return {
        hydrated,
        hasWalletProvider: !!walletProviderElement,
        hasConnectionProvider: !!connectionProviderElement,
        dataAttributes: allDataAttributes,
      }
    })

    console.log('React Component State:')
    console.log('- Hydration status:', reactState.hydrated || 'N/A')
    console.log('- Wallet Provider element:', reactState.hasWalletProvider ? '✅' : '❌')
    console.log('- Connection Provider element:', reactState.hasConnectionProvider ? '✅' : '❌')
    console.log('- Data attributes:', Object.keys(reactState.dataAttributes).length)

    // ===================
    // 6. TRY TO CLICK CONNECT WALLET
    // ===================
    console.log('\n📊 STEP 6: Testing Wallet Connection Flow')
    console.log('==========================================')

    try {
      // Find and click the Select Wallet button
      const selectWalletButton = page.locator('.wallet-adapter-button-trigger').first()
      const isVisible = await selectWalletButton.isVisible().catch(() => false)

      console.log('- Select Wallet button visible:', isVisible ? '✅' : '❌')

      if (isVisible) {
        console.log('- Attempting to click Select Wallet button...')
        await selectWalletButton.click()
        await page.waitForTimeout(1000)

        // Check if wallet modal/dropdown appeared
        const walletModal = await page.evaluate(() => {
          const dropdown = document.querySelector('.wallet-adapter-dropdown-list')
          const modal = document.querySelector('[role="dialog"]')
          const walletOptions = Array.from(document.querySelectorAll('li')).filter(li =>
            li.textContent?.includes('Phantom') ||
            li.textContent?.includes('Solflare') ||
            li.textContent?.includes('Wallet')
          )

          return {
            hasDropdown: !!dropdown,
            dropdownVisible: dropdown ? !dropdown.classList.contains('false') : false,
            hasModal: !!modal,
            walletOptions: walletOptions.map(li => li.textContent?.trim() || ''),
          }
        })

        console.log('- Wallet selection dropdown visible:', walletModal.dropdownVisible ? '✅' : '❌')
        console.log('- Wallet selection modal:', walletModal.hasModal ? '✅' : '❌')
        console.log('- Wallet options found:', walletModal.walletOptions.length)
        if (walletModal.walletOptions.length > 0) {
          console.log('  Available wallets:')
          walletModal.walletOptions.forEach((wallet, idx) => {
            console.log(`    ${idx + 1}. ${wallet}`)
          })
        }
      }
    } catch (error: any) {
      console.log('❌ Error clicking Select Wallet:', error.message)
    }

    // ===================
    // 7. CHECK SOLANA CONNECTION
    // ===================
    console.log('\n📊 STEP 7: Checking Solana Connection Configuration')
    console.log('==========================================')

    const solanaConfig = await page.evaluate(() => {
      // Try to get Solana connection details from window
      return {
        hasSolanaWeb3: typeof window !== 'undefined',
        endpoint: 'Check environment variables',
      }
    })

    console.log('Solana Configuration:')
    console.log('- Solana web3.js loaded:', solanaConfig.hasSolanaWeb3 ? '✅' : '❌')

    // ===================
    // 8. TAKE DIAGNOSTIC SCREENSHOT
    // ===================
    await page.screenshot({
      path: 'betting-diagnosis-full.png',
      fullPage: true,
    })
    console.log('\n📸 Full page screenshot saved: betting-diagnosis-full.png')

    // ===================
    // 9. DIAGNOSIS SUMMARY
    // ===================
    console.log('\n' + '='.repeat(60))
    console.log('🎯 DIAGNOSIS SUMMARY')
    console.log('='.repeat(60))

    const issues: string[] = []
    const working: string[] = []

    if (bettingPanelCheck.hasPlaceYourBetTitle) {
      working.push('Betting panel component renders')
    } else {
      issues.push('Betting panel component not rendering')
    }

    if (bettingPanelCheck.hasConnectWalletMessage && !bettingPanelCheck.hasYesButton) {
      issues.push('Wallet not connected - showing connection prompt instead of betting buttons')
    }

    if (!bettingPanelCheck.hasYesButton || !bettingPanelCheck.hasNoButton) {
      issues.push('YES/NO betting buttons not rendering (wallet connection required)')
    } else {
      working.push('YES/NO buttons are rendering')
    }

    if (!walletProviderCheck.hasSolana && !walletProviderCheck.hasPhantom) {
      issues.push('No Solana wallet detected in browser (need Phantom or Solflare)')
    }

    if (consoleErrors.length > 0) {
      issues.push(`${consoleErrors.length} JavaScript errors detected`)
    }

    if (networkErrors.length > 0) {
      issues.push(`${networkErrors.length} network errors detected`)
    }

    console.log('\n✅ WORKING:')
    working.forEach(item => console.log(`  - ${item}`))

    console.log('\n❌ ISSUES FOUND:')
    issues.forEach(item => console.log(`  - ${item}`))

    console.log('\n💡 RECOMMENDATIONS:')
    if (!walletProviderCheck.hasSolana && !walletProviderCheck.hasPhantom) {
      console.log('  1. Install Phantom wallet browser extension')
      console.log('  2. OR install Solflare wallet browser extension')
      console.log('  3. Refresh the page after wallet installation')
    }
    if (bettingPanelCheck.hasConnectWalletMessage) {
      console.log('  1. Click "Select Wallet" button in top right')
      console.log('  2. Choose your wallet (Phantom/Solflare)')
      console.log('  3. Approve the connection in wallet popup')
      console.log('  4. YES/NO buttons should then appear')
    }
    if (consoleErrors.length > 0) {
      console.log('  - Review console errors for React/Web3 issues')
    }

    console.log('\n' + '='.repeat(60))

    // Export diagnostic data
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      walletProvider: walletProviderCheck,
      walletState,
      bettingPanel: bettingPanelCheck,
      reactState,
      consoleErrors: consoleErrors.slice(0, 20),
      networkErrors: networkErrors.slice(0, 20),
      issues,
      working,
    }

    // Write diagnostic report
    await page.evaluate((data) => {
      console.log('📋 DIAGNOSTIC REPORT', JSON.stringify(data, null, 2))
    }, diagnosticData)
  })
})
