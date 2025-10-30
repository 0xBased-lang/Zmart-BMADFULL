import { test, expect } from '@playwright/test'

/**
 * Web3 Comments API Debugging with Advanced Error Detection
 */

test.describe('Debug Comments API', () => {
  test('Test comments API with detailed error capture', async ({ page }) => {
    console.log('🔍 Starting comments API debugging...\n')

    // Capture all console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Capture all network requests to /api/submit-comment
    const apiCalls: any[] = []
    page.on('response', async response => {
      if (response.url().includes('/api/submit-comment')) {
        try {
          const body = await response.text()
          apiCalls.push({
            status: response.status(),
            statusText: response.statusText(),
            url: response.url(),
            body: body,
            headers: response.headers()
          })
        } catch (e) {
          console.log('Could not read response body')
        }
      }
    })

    // Navigate to market page
    await page.goto('/markets/10', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    console.log('✅ Page loaded\n')
    await page.waitForTimeout(2000)

    // Check if comments section exists
    const commentsCheck = await page.evaluate(() => {
      // Look for comments section
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
      const discussionHeading = headings.find(h =>
        h.textContent?.toLowerCase().includes('discussion') ||
        h.textContent?.toLowerCase().includes('comment')
      )

      // Look for comment form
      const textarea = document.querySelector('textarea')
      const buttons = Array.from(document.querySelectorAll('button'))
      const submitButton = buttons.find(btn =>
        btn.textContent?.toLowerCase().includes('post') ||
        btn.textContent?.toLowerCase().includes('comment')
      )

      // Look for wallet connection button
      const walletButton = buttons.find(btn =>
        btn.textContent?.toLowerCase().includes('wallet') ||
        btn.textContent?.toLowerCase().includes('connect')
      )

      return {
        hasDiscussionHeading: !!discussionHeading,
        headingText: discussionHeading?.textContent,
        hasTextarea: !!textarea,
        textareaPlaceholder: textarea?.getAttribute('placeholder'),
        hasSubmitButton: !!submitButton,
        submitButtonText: submitButton?.textContent,
        submitButtonDisabled: submitButton?.hasAttribute('disabled'),
        hasWalletButton: !!walletButton,
        walletButtonText: walletButton?.textContent,
      }
    })

    console.log('📊 Comments Section Check:')
    console.log('- Discussion heading found:', commentsCheck.hasDiscussionHeading ? '✅' : '❌')
    console.log('- Heading text:', commentsCheck.headingText)
    console.log('- Textarea found:', commentsCheck.hasTextarea ? '✅' : '❌')
    console.log('- Placeholder:', commentsCheck.textareaPlaceholder)
    console.log('- Submit button found:', commentsCheck.hasSubmitButton ? '✅' : '❌')
    console.log('- Submit button text:', commentsCheck.submitButtonText)
    console.log('- Submit button disabled:', commentsCheck.submitButtonDisabled)
    console.log('- Wallet button found:', commentsCheck.hasWalletButton ? '✅' : '❌')
    console.log('- Wallet button text:', commentsCheck.walletButtonText)

    // Test the API directly from the page context
    console.log('\n📡 Testing Comments API Directly:')

    const apiTest = await page.evaluate(async () => {
      try {
        // Test 1: Missing all fields
        const test1 = await fetch('/api/submit-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const result1 = await test1.json()

        // Test 2: With all required fields
        const test2 = await fetch('/api/submit-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketId: 10,
            commentText: 'Test comment from Playwright',
            signature: btoa('test_signature_' + Date.now()),
            walletAddress: 'EbhZNcMVvTuHcHk5iuhLwzHCaFrkRpHqrusGge6o2wRX'
          })
        })
        const result2 = await test2.json()

        return {
          test1: {
            status: test1.status,
            body: result1
          },
          test2: {
            status: test2.status,
            body: result2
          }
        }
      } catch (error: any) {
        return {
          error: error.message
        }
      }
    })

    console.log('\n Test 1 (Missing fields):')
    console.log('  Status:', apiTest.test1?.status)
    console.log('  Response:', JSON.stringify(apiTest.test1?.body, null, 2))

    console.log('\n Test 2 (All fields):')
    console.log('  Status:', apiTest.test2?.status)
    console.log('  Response:', JSON.stringify(apiTest.test2?.body, null, 2))

    // Check for any API calls that were captured
    if (apiCalls.length > 0) {
      console.log('\n📋 Captured API Calls:')
      apiCalls.forEach((call, idx) => {
        console.log(`\n Call ${idx + 1}:`)
        console.log('  Status:', call.status)
        console.log('  Body:', call.body)
      })
    }

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors Detected:')
      consoleErrors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`)
      })
    }

    // Take screenshot
    await page.screenshot({
      path: 'comments-debug-detailed.png',
      fullPage: true
    })
    console.log('\n📸 Screenshot saved: comments-debug-detailed.png')

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎯 DIAGNOSIS SUMMARY')
    console.log('='.repeat(60))

    if (!commentsCheck.hasDiscussionHeading) {
      console.log('❌ Comments section NOT rendering on page')
    } else if (!commentsCheck.hasTextarea) {
      console.log('⚠️  Comments section exists but textarea missing')
      console.log('   This might be because wallet is not connected')
    } else {
      console.log('✅ Comments UI is rendering')
    }

    if (apiTest.test2?.status === 500) {
      console.log('❌ API returning 500 server error')
      console.log('   Error details:', apiTest.test2.body)
    } else if (apiTest.test2?.status === 400) {
      console.log('⚠️  API returning 400 validation error')
      console.log('   This is expected without proper signature')
    } else if (apiTest.test2?.status === 200 || apiTest.test2?.status === 201) {
      console.log('✅ API is working correctly!')
    }

    console.log('\n💡 Recommendations:')
    if (!commentsCheck.hasDiscussionHeading) {
      console.log('  1. Check if CommentsSection component is included in page')
      console.log('  2. Verify component is not conditionally hidden')
    }
    if (apiTest.test2?.status === 500) {
      console.log('  1. Check Vercel deployment logs')
      console.log('  2. Verify Supabase connection in production')
      console.log('  3. Check if comments table exists in production DB')
    }

    console.log('='.repeat(60))
  })
})
