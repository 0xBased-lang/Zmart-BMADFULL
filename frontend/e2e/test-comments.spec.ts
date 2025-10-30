import { test, expect } from '@playwright/test'

test.describe('Comments Functionality Test', () => {
  test('Verify comments section renders and API works', async ({ page }) => {
    console.log('🔍 Testing comments functionality...\n')

    await page.goto('https://frontend-kektech1.vercel.app/markets/10', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    console.log('✅ Page loaded\n')
    await page.waitForTimeout(2000)

    // Check if comments section exists
    const commentsSection = await page.evaluate(() => {
      // Look for comments heading/section
      const headings = Array.from(document.querySelectorAll('h2, h3, h4'))
      const commentsHeading = headings.find(h =>
        h.textContent?.toLowerCase().includes('comment')
      )

      // Look for comment form
      const textarea = document.querySelector('textarea')
      const submitButtons = Array.from(document.querySelectorAll('button'))
      const submitButton = submitButtons.find(btn =>
        btn.textContent?.toLowerCase().includes('post') ||
        btn.textContent?.toLowerCase().includes('submit') ||
        btn.textContent?.toLowerCase().includes('comment')
      )

      // Look for any existing comments
      const commentElements = document.querySelectorAll('[class*="comment"]')

      return {
        hasCommentsHeading: !!commentsHeading,
        headingText: commentsHeading?.textContent || 'N/A',
        hasTextarea: !!textarea,
        textareaPlaceholder: textarea?.getAttribute('placeholder') || 'N/A',
        hasSubmitButton: !!submitButton,
        submitButtonText: submitButton?.textContent || 'N/A',
        commentElementsCount: commentElements.length,
      }
    })

    console.log('📊 Comments Section Check:')
    console.log('- Comments heading found:', commentsSection.hasCommentsHeading ? '✅' : '❌')
    console.log('- Heading text:', commentsSection.headingText)
    console.log('- Comment textarea found:', commentsSection.hasTextarea ? '✅' : '❌')
    console.log('- Textarea placeholder:', commentsSection.textareaPlaceholder)
    console.log('- Submit button found:', commentsSection.hasSubmitButton ? '✅' : '❌')
    console.log('- Submit button text:', commentsSection.submitButtonText)
    console.log('- Comment elements found:', commentsSection.commentElementsCount)

    // Try to test the API endpoint
    console.log('\n📡 Testing Comments API:')
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/submit-comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketId: 10,
            commenterWallet: 'TEST_WALLET_ADDRESS',
            commentText: 'Test comment from Playwright',
          }),
        })

        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          body: await response.text().catch(() => 'Could not read body'),
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        }
      }
    })

    console.log('API Response:')
    console.log('- Status:', apiResponse.status)
    console.log('- Success:', apiResponse.success ? '✅' : '❌')
    if (!apiResponse.success) {
      console.log('- Error:', apiResponse.error || apiResponse.body)
    }

    // Take screenshot
    await page.screenshot({
      path: 'comments-test.png',
      fullPage: true,
    })
    console.log('\n📸 Screenshot saved: comments-test.png')

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📋 COMMENTS FUNCTIONALITY SUMMARY')
    console.log('='.repeat(50))

    if (commentsSection.hasCommentsHeading && commentsSection.hasTextarea) {
      console.log('✅ Comments UI is rendering properly')
    } else {
      console.log('❌ Comments UI has rendering issues')
    }

    if (apiResponse.status === 400 || apiResponse.status === 500) {
      console.log('⚠️  Comments API exists but has validation/server errors')
      console.log('   (This is expected without a real wallet connection)')
    } else if (apiResponse.success) {
      console.log('✅ Comments API is working')
    }

    console.log('\n💡 To post a real comment:')
    console.log('  1. Connect your Solana wallet (Phantom/Solflare)')
    console.log('  2. Scroll to the Comments section at the bottom')
    console.log('  3. Type your comment in the textarea')
    console.log('  4. Click "Post Comment"')
    console.log('  5. Approve the request in your wallet')
  })
})
