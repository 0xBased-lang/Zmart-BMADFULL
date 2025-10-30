import { test } from '@playwright/test'

test.describe('API Debugging', () => {
  test('Capture full API error details', async ({ page }) => {
    const apiErrors: any[] = []
    const apiSuccess: any[] = []

    // Capture all API responses
    page.on('response', async response => {
      if (response.url().includes('supabase.co/rest/v1/')) {
        const url = response.url()
        const status = response.status()

        try {
          const body = await response.text()

          if (status >= 400) {
            apiErrors.push({
              url: url.split('?')[0],
              status,
              query: url.split('?')[1] || 'none',
              body: body.substring(0, 500)
            })
          } else {
            apiSuccess.push({
              url: url.split('?')[0],
              status,
              query: url.split('?')[1] || 'none',
              bodyLength: body.length
            })
          }
        } catch (e) {
          console.log('Could not parse response')
        }
      }
    })

    console.log('🔍 Testing Homepage...\n')
    await page.goto('https://frontend-kektech1.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForTimeout(2000)

    console.log('✅ SUCCESSFUL API CALLS:')
    console.log('='.repeat(50))
    apiSuccess.forEach(call => {
      console.log(`${call.status} ${call.url}`)
      console.log(`  Query: ${call.query.substring(0, 100)}`)
      console.log(`  Response size: ${call.bodyLength} bytes\n`)
    })

    console.log('\n❌ FAILED API CALLS:')
    console.log('='.repeat(50))
    apiErrors.forEach(err => {
      console.log(`${err.status} ${err.url}`)
      console.log(`  Query: ${err.query}`)
      console.log(`  Error: ${err.body}\n`)
    })

    console.log('\n🔍 Testing Leaderboard...\n')

    // Reset for leaderboard page
    apiErrors.length = 0
    apiSuccess.length = 0

    await page.goto('https://frontend-kektech1.vercel.app/leaderboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForTimeout(3000)

    console.log('\n📊 LEADERBOARD API RESULTS:')
    console.log('='.repeat(50))

    const leaderboardCalls = [...apiSuccess, ...apiErrors]

    console.log(`Total API calls: ${leaderboardCalls.length}`)
    console.log(`Success: ${apiSuccess.length}`)
    console.log(`Failed: ${apiErrors.length}\n`)

    if (apiSuccess.length > 0) {
      console.log('Successful calls:')
      apiSuccess.forEach(call => {
        console.log(`  ${call.status} ${call.url}`)
        console.log(`    Data size: ${call.bodyLength} bytes`)
      })
    }

    if (apiErrors.length > 0) {
      console.log('\nFailed calls:')
      apiErrors.forEach(err => {
        console.log(`  ${err.status} ${err.url}`)
        console.log(`    ${err.body}`)
      })
    }
  })
})
