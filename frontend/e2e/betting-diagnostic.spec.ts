import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * BETTING DIAGNOSTIC TEST
 *
 * Purpose: Systematically diagnose betting functionality
 * Approach: Test each step, capture all errors, generate detailed report
 * Output: Comprehensive diagnostic report with exact failure point
 */

const BASE_URL = 'http://localhost:3000'
const DIAGNOSTIC_DIR = 'test-results/betting-diagnostic'

// Ensure diagnostic directory exists
if (!fs.existsSync(DIAGNOSTIC_DIR)) {
  fs.mkdirSync(DIAGNOSTIC_DIR, { recursive: true })
}

interface DiagnosticReport {
  timestamp: string
  testName: string
  status: 'PASS' | 'FAIL' | 'WARN'
  steps: StepResult[]
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

interface StepResult {
  number: number
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration: number
  error?: string
  screenshot?: string
  details?: any
}

class BettingDiagnostic {
  private report: DiagnosticReport
  private page: Page
  private stepNumber: number = 0

  constructor(page: Page, testName: string) {
    this.page = page
    this.report = {
      timestamp: new Date().toISOString(),
      testName,
      status: 'PASS',
      steps: [],
      errors: [],
      warnings: [],
      recommendations: []
    }

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text()
      console.log(`[Browser Console] ${msg.type()}: ${text}`)

      if (msg.type() === 'error') {
        this.report.errors.push(`Console Error: ${text}`)
      }
      if (msg.type() === 'warning') {
        this.report.warnings.push(`Console Warning: ${text}`)
      }
    })

    // Capture page errors
    page.on('pageerror', error => {
      const errorMsg = `Page Error: ${error.message}\n${error.stack}`
      console.error(`[Page Error]`, error)
      this.report.errors.push(errorMsg)
    })

    // Capture network errors
    page.on('requestfailed', request => {
      const failureMsg = `Network Failure: ${request.url()} - ${request.failure()?.errorText}`
      console.error(`[Network Failed]`, failureMsg)
      this.report.errors.push(failureMsg)
    })
  }

  async runStep(name: string, action: () => Promise<void>): Promise<boolean> {
    this.stepNumber++
    const stepStart = Date.now()
    const stepNum = this.stepNumber

    console.log(`\n▶ Step ${stepNum}: ${name}`)

    try {
      await action()

      const duration = Date.now() - stepStart
      this.report.steps.push({
        number: stepNum,
        name,
        status: 'PASS',
        duration
      })

      console.log(`✅ Step ${stepNum} PASSED (${duration}ms)`)
      return true

    } catch (error: any) {
      const duration = Date.now() - stepStart
      const errorMsg = error.message || String(error)

      // Take screenshot on failure
      const screenshotPath = `${DIAGNOSTIC_DIR}/step-${stepNum}-failure.png`
      await this.page.screenshot({ path: screenshotPath, fullPage: true })

      this.report.steps.push({
        number: stepNum,
        name,
        status: 'FAIL',
        duration,
        error: errorMsg,
        screenshot: screenshotPath
      })

      this.report.status = 'FAIL'
      this.report.errors.push(`Step ${stepNum} (${name}): ${errorMsg}`)

      console.log(`❌ Step ${stepNum} FAILED: ${errorMsg}`)
      return false
    }
  }

  async capturePageState(label: string) {
    const stateDir = `${DIAGNOSTIC_DIR}/states`
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true })
    }

    // Screenshot
    await this.page.screenshot({
      path: `${stateDir}/${label}-screenshot.png`,
      fullPage: true
    })

    // HTML
    const html = await this.page.content()
    fs.writeFileSync(`${stateDir}/${label}-dom.html`, html)

    // Local storage
    const localStorage = await this.page.evaluate(() => JSON.stringify(window.localStorage))
    fs.writeFileSync(`${stateDir}/${label}-localstorage.json`, localStorage)

    console.log(`📸 Captured page state: ${label}`)
  }

  generateReport(): DiagnosticReport {
    // Generate recommendations based on findings
    if (this.report.errors.some(e => e.includes('wallet') || e.includes('Wallet'))) {
      this.report.recommendations.push('Check Phantom wallet extension is installed and connected')
      this.report.recommendations.push('Verify wallet is set to Solana Devnet')
    }

    if (this.report.errors.some(e => e.includes('Network'))) {
      this.report.recommendations.push('Check internet connection')
      this.report.recommendations.push('Verify Solana devnet RPC is accessible')
    }

    if (this.report.errors.some(e => e.includes('Program'))) {
      this.report.recommendations.push('Verify Solana program is deployed on devnet')
      this.report.recommendations.push('Check program ID matches configuration')
    }

    if (this.report.errors.some(e => e.includes('insufficient'))) {
      this.report.recommendations.push('Ensure wallet has sufficient SOL balance')
      this.report.recommendations.push('Request devnet SOL from faucet if needed')
    }

    return this.report
  }

  saveReport() {
    const reportPath = `${DIAGNOSTIC_DIR}/diagnostic-report.json`
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2))

    // Also generate human-readable markdown
    const mdPath = `${DIAGNOSTIC_DIR}/diagnostic-report.md`
    const markdown = this.generateMarkdown()
    fs.writeFileSync(mdPath, markdown)

    console.log(`\n📄 Diagnostic report saved:`)
    console.log(`   JSON: ${reportPath}`)
    console.log(`   Markdown: ${mdPath}`)
  }

  private generateMarkdown(): string {
    const { timestamp, testName, status, steps, errors, warnings, recommendations } = this.report

    let md = `# 🧪 Betting Diagnostic Report\n\n`
    md += `**Test:** ${testName}\n`
    md += `**Time:** ${timestamp}\n`
    md += `**Status:** ${status === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`

    md += `---\n\n## 📊 Summary\n\n`
    md += `- Total Steps: ${steps.length}\n`
    md += `- Passed: ${steps.filter(s => s.status === 'PASS').length}\n`
    md += `- Failed: ${steps.filter(s => s.status === 'FAIL').length}\n`
    md += `- Errors: ${errors.length}\n`
    md += `- Warnings: ${warnings.length}\n\n`

    md += `---\n\n## 🔍 Step Details\n\n`
    for (const step of steps) {
      const icon = step.status === 'PASS' ? '✅' : '❌'
      md += `### ${icon} Step ${step.number}: ${step.name}\n\n`
      md += `- **Status:** ${step.status}\n`
      md += `- **Duration:** ${step.duration}ms\n`

      if (step.error) {
        md += `- **Error:** \`${step.error}\`\n`
      }

      if (step.screenshot) {
        md += `- **Screenshot:** ${step.screenshot}\n`
      }

      md += `\n`
    }

    if (errors.length > 0) {
      md += `---\n\n## ❌ Errors\n\n`
      errors.forEach((error, i) => {
        md += `${i + 1}. ${error}\n`
      })
      md += `\n`
    }

    if (warnings.length > 0) {
      md += `---\n\n## ⚠️ Warnings\n\n`
      warnings.forEach((warning, i) => {
        md += `${i + 1}. ${warning}\n`
      })
      md += `\n`
    }

    if (recommendations.length > 0) {
      md += `---\n\n## 💡 Recommendations\n\n`
      recommendations.forEach((rec, i) => {
        md += `${i + 1}. ${rec}\n`
      })
      md += `\n`
    }

    md += `---\n\n**Generated:** ${timestamp}\n`

    return md
  }
}

test.describe('Betting Flow Diagnostic', () => {
  test('Complete betting flow diagnosis', async ({ page }) => {
    const diagnostic = new BettingDiagnostic(page, 'Complete Betting Flow')

    // Step 1: Load market page
    const loaded = await diagnostic.runStep('Load market detail page', async () => {
      await page.goto(`${BASE_URL}/markets/2`, { waitUntil: 'networkidle' })
      await expect(page.locator('h1, h2')).toContainText(/Will ETH/i)
    })

    if (!loaded) {
      diagnostic.saveReport()
      throw new Error('Failed to load market page - cannot continue')
    }

    await diagnostic.capturePageState('01-market-loaded')

    // Step 2: Check betting panel exists
    await diagnostic.runStep('Verify betting panel exists', async () => {
      await expect(page.locator('text=Place Your Bet')).toBeVisible({ timeout: 5000 })
    })

    // Step 3: Check wallet button
    const walletVisible = await diagnostic.runStep('Verify wallet button visible', async () => {
      const walletButton = page.locator('button:has-text(/wallet|connect/i)')
      await expect(walletButton).toBeVisible({ timeout: 5000 })
    })

    await diagnostic.capturePageState('02-wallet-button-check')

    // Step 4: Check if wallet is already connected
    const isConnected = await page.locator('text=/wallet balance|balance/i').isVisible()

    if (!isConnected) {
      diagnostic.report.warnings.push('Wallet not connected - cannot test full betting flow')
      diagnostic.report.recommendations.push('Connect Phantom wallet manually and re-run test')
      diagnostic.report.recommendations.push('Or use Playwright with wallet extension installed')

      // Try to click connect button to see what happens
      await diagnostic.runStep('Attempt wallet connection', async () => {
        const connectBtn = page.locator('button:has-text(/connect/i)')
        await connectBtn.click()
        await page.waitForTimeout(2000)

        // Check if wallet popup appeared or if there's an error
        const hasError = await page.locator('text=/error|failed/i').count() > 0
        if (hasError) {
          throw new Error('Wallet connection failed')
        }
      })

      await diagnostic.capturePageState('03-wallet-connection-attempt')
    } else {
      console.log('ℹ️  Wallet already connected')

      await diagnostic.capturePageState('03-wallet-connected')

      // Step 5: Select outcome
      await diagnostic.runStep('Select YES outcome', async () => {
        const yesButton = page.locator('button:has-text("YES")').first()
        await yesButton.click()
        await page.waitForTimeout(500)

        // Verify selection
        const isSelected = await page.locator('button:has-text("YES")').first().evaluate(
          el => el.classList.contains('border-green-500') || el.classList.contains('bg-green-500')
        )
        expect(isSelected).toBeTruthy()
      })

      await diagnostic.capturePageState('04-outcome-selected')

      // Step 6: Enter amount
      await diagnostic.runStep('Enter bet amount', async () => {
        const amountInput = page.locator('input[type="text"]').first()
        await amountInput.fill('0.01')
        await page.waitForTimeout(500)

        // Verify amount entered
        const value = await amountInput.inputValue()
        expect(value).toBe('0.01')
      })

      await diagnostic.capturePageState('05-amount-entered')

      // Step 7: Check Place Bet button enabled
      await diagnostic.runStep('Verify Place Bet button enabled', async () => {
        const placeBetBtn = page.locator('button:has-text("Place Bet")')
        await expect(placeBetBtn).toBeEnabled({ timeout: 2000 })
      })

      // Step 8: Click Place Bet
      await diagnostic.runStep('Click Place Bet button', async () => {
        const placeBetBtn = page.locator('button:has-text("Place Bet")')
        await placeBetBtn.click()
        await page.waitForTimeout(1000)
      })

      await diagnostic.capturePageState('06-place-bet-clicked')

      // Step 9: Check confirmation modal
      const modalAppeared = await diagnostic.runStep('Verify confirmation modal appears', async () => {
        await expect(page.locator('text=Confirm Your Bet')).toBeVisible({ timeout: 3000 })
      })

      if (modalAppeared) {
        await diagnostic.capturePageState('07-confirmation-modal')

        // Step 10: Click Confirm in modal
        await diagnostic.runStep('Click Confirm Bet in modal', async () => {
          const confirmBtn = page.locator('button:has-text("Confirm Bet")')
          await confirmBtn.click()
          await page.waitForTimeout(1000)
        })

        await diagnostic.capturePageState('08-confirm-clicked')

        // Step 11: Wait for wallet popup or result
        await diagnostic.runStep('Wait for transaction result', async () => {
          // Wait for either success or error message
          await page.waitForSelector(
            'text=/Bet placed successfully|Failed to place bet|Transaction rejected/i',
            { timeout: 30000 }
          )
        })

        await diagnostic.capturePageState('09-transaction-result')

        // Step 12: Check final state
        await diagnostic.runStep('Verify final state', async () => {
          const hasSuccess = await page.locator('text=/Bet placed successfully/i').isVisible()
          const hasError = await page.locator('text=/Failed|rejected|error/i').isVisible()

          if (hasError) {
            const errorText = await page.locator('text=/Failed|rejected|error/i').first().textContent()
            throw new Error(`Betting failed: ${errorText}`)
          }

          expect(hasSuccess).toBeTruthy()
        })

        await diagnostic.capturePageState('10-final-state')
      }
    }

    // Generate and save report
    diagnostic.generateReport()
    diagnostic.saveReport()

    // Log summary
    console.log(`\n═══════════════════════════════════════════════════`)
    console.log(`DIAGNOSTIC SUMMARY`)
    console.log(`═══════════════════════════════════════════════════`)
    console.log(`Status: ${diagnostic.generateReport().status}`)
    console.log(`Steps: ${diagnostic.generateReport().steps.length}`)
    console.log(`Errors: ${diagnostic.generateReport().errors.length}`)
    console.log(`Warnings: ${diagnostic.generateReport().warnings.length}`)
    console.log(`═══════════════════════════════════════════════════\n`)

    // If there were errors, log them
    if (diagnostic.generateReport().errors.length > 0) {
      console.log(`ERRORS FOUND:`)
      diagnostic.generateReport().errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`)
      })
    }

    // Log recommendations
    if (diagnostic.generateReport().recommendations.length > 0) {
      console.log(`\nRECOMMENDATIONS:`)
      diagnostic.generateReport().recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`)
      })
    }
  })
})
