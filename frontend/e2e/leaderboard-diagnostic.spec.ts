import { test } from '@playwright/test'

test.describe('Leaderboard Diagnostic', () => {
  test('Investigate user_stats table issue', async ({ page }) => {
    console.log('🔍 LEADERBOARD DIAGNOSTIC STARTING...\n')
    
    // Track all network requests
    const apiCalls: any[] = []
    const errors: any[] = []
    
    page.on('request', request => {
      if (request.url().includes('supabase.co')) {
        apiCalls.push({
          url: request.url(),
          method: request.method()
        })
      }
    })
    
    page.on('response', async response => {
      if (response.url().includes('supabase.co') && response.status() >= 400) {
        try {
          const body = await response.json()
          errors.push({
            url: response.url(),
            status: response.status(),
            error: body
          })
        } catch (e) {
          errors.push({
            url: response.url(),
            status: response.status(),
            error: 'Could not parse error'
          })
        }
      }
    })
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text())
      }
    })
    
    // Navigate to leaderboard
    console.log('📍 Navigating to leaderboard page...')
    await page.goto('https://frontend-kektech1.vercel.app/leaderboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    })
    
    // Wait a bit for all API calls
    await page.waitForTimeout(3000)
    
    console.log('\n🔌 API CALLS MADE:')
    console.log('='.repeat(50))
    apiCalls.forEach(call => {
      console.log(`${call.method} ${call.url}`)
    })
    
    console.log('\n❌ API ERRORS:')
    console.log('='.repeat(50))
    errors.forEach(err => {
      console.log(`Status ${err.status}: ${err.url}`)
      console.log('Error:', JSON.stringify(err.error, null, 2))
    })
    
    // Check page content
    const pageText = await page.textContent('body')
    console.log('\n📊 PAGE CONTENT ANALYSIS:')
    console.log('='.repeat(50))
    console.log('Has "leaderboard" text:', pageText?.toLowerCase().includes('leaderboard'))
    console.log('Has error message:', pageText?.toLowerCase().includes('error'))
    console.log('Has loading state:', pageText?.toLowerCase().includes('loading'))
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/leaderboard-diagnostic.png', fullPage: true })
    console.log('\n📸 Screenshot saved to /tmp/leaderboard-diagnostic.png')
  })
})
