# E2E Test Suite Documentation
**Story 4.3 - Frontend E2E Tests with Playwright**

Comprehensive end-to-end testing for the Zmart prediction market platform.

---

## 📋 Test Coverage

### Test Files

| Test File | Coverage | Tests |
|-----------|----------|-------|
| `market-discovery-betting.spec.ts` | Market browsing and betting flow | 10+ tests |
| `proposal-creation-voting.spec.ts` | Proposal lifecycle | 12+ tests |
| `market-resolution-dispute.spec.ts` | Resolution and disputes | 7+ tests |
| `payout-claims.spec.ts` | Payout claim flow | 7+ tests |
| `responsive-design.spec.ts` | Mobile/tablet/desktop | 15+ tests |
| `accessibility.spec.ts` | WCAG 2.1 AA compliance | 14+ tests |

### Acceptance Criteria Mapping

- ✅ **AC #1**: Wallet mocking and automation (`fixtures/wallet-mock.ts`)
- ✅ **AC #2**: Betting flow tests (wallet → browse → bet → dashboard)
- ✅ **AC #3**: Proposal creation and voting tests
- ✅ **AC #4**: Market resolution and dispute tests
- ✅ **AC #5**: Payout claim tests
- ✅ **AC #6**: Responsive design tests (375px, 768px, 1280px)
- ✅ **AC #7**: Accessibility tests (keyboard, ARIA, WCAG)
- ✅ **AC #8**: CI/CD integration with GitHub Actions

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/market-discovery-betting.spec.ts

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
```

### View Test Reports

```bash
# View HTML report after test run
npm run test:report

# Or manually
npx playwright show-report
```

---

## 🔧 Configuration

### Environment Variables

Tests use `.env.test` for configuration:

```env
# Solana devnet configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Test wallet keys
TEST_WALLET_PUBLIC_KEY=11111111111111111111111111111111
TEST_ADMIN_PUBLIC_KEY=AdminAdminAdminAdminAdminAdminAd

# Supabase test database
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key_here
```

### Playwright Configuration

Key settings in `playwright.config.ts`:

- **Parallel Execution**: 4 workers in CI, unlimited locally
- **Retries**: 2 retries in CI for flaky tests
- **Timeouts**: 120s global, 30s for actions/navigation
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12, iPad Pro
- **Screenshots**: Only on failure
- **Videos**: Retained on failure

---

## 🧪 Test Strategy

### Wallet Automation

All tests use mocked Phantom wallet via `fixtures/wallet-mock.ts`:

```typescript
import { mockPhantomWallet, connectWalletInUI, TEST_WALLETS } from './fixtures/wallet-mock';

// Inject wallet mock before test
await mockPhantomWallet(page, TEST_WALLETS.USER1, {
  autoApprove: true,
  rejectConnection: false,
  rejectTransactions: false,
});

// Connect wallet in UI
await connectWalletInUI(page);
```

**Test Wallets**:
- `TEST_WALLETS.USER1`: Primary user for most tests
- `TEST_WALLETS.USER2`: Secondary user for multi-user scenarios
- `TEST_WALLETS.ADMIN`: Admin user for admin-only operations

### Test Data

Consistent test data via `fixtures/test-data.ts`:

```typescript
import { TEST_MARKETS, TEST_PROPOSALS, TEST_BETS } from './fixtures/test-data';

// Use predefined test markets
await page.goto(`/markets/${TEST_MARKETS.ACTIVE_MARKET.id}`);

// Wait for blockchain confirmation
await waitForBlockchainConfirmation(3000);

// Wait for real-time updates
await waitForRealtimeUpdate(2000);
```

---

## 📊 Test Execution

### Local Development

```bash
# Run tests while developing
npm run test:e2e

# Debug specific test
npx playwright test e2e/market-discovery-betting.spec.ts --debug

# Run with trace viewer
npx playwright test --trace on

# Generate Playwright code
npx playwright codegen http://localhost:3000
```

### CI/CD Pipeline

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**CI Configuration**: `.github/workflows/e2e-tests.yml`

**Test Matrix**:
- Desktop: Chromium, Firefox, WebKit
- Mobile: Chrome (Pixel 5), Safari (iPhone 12)
- Tablet: iPad Pro

**Execution Time**: ~10-15 minutes for full suite

---

## 🐛 Debugging

### Common Issues

**Issue**: Tests fail with "Timeout exceeded"
- **Solution**: Increase timeout in test or check devnet RPC availability

**Issue**: Wallet connection fails
- **Solution**: Verify wallet mock is injected before navigation

**Issue**: Elements not found
- **Solution**: Check selectors match actual implementation

**Issue**: Tests pass locally but fail in CI
- **Solution**: Check for timing issues, add explicit waits

### Debug Techniques

```bash
# Run in debug mode
npx playwright test --debug

# Generate trace for failed test
npx playwright test --trace on

# View trace file
npx playwright show-trace trace.zip

# Take screenshot at specific point
await page.screenshot({ path: 'debug.png' });

# Log page content
console.log(await page.content());
```

---

## 📝 Writing New Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';
import { mockPhantomWallet, connectWalletInUI, TEST_WALLETS } from './fixtures/wallet-mock';
import { TEST_MARKETS } from './fixtures/test-data';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await mockPhantomWallet(page, TEST_WALLETS.USER1);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/');
    await connectWalletInUI(page);

    // Your test logic here
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes**: Prefer `[data-testid="element"]` over CSS classes
2. **Wait for state**: Use `page.waitForLoadState('networkidle')` after navigation
3. **Explicit waits**: Use `page.waitForSelector()` instead of `page.waitForTimeout()`
4. **Mock wallet first**: Always inject wallet mock in `beforeEach`
5. **Clean selectors**: Use specific, stable selectors
6. **Test isolation**: Each test should be independent
7. **Error handling**: Test both success and failure scenarios

---

## 🔄 Maintenance

### Updating Tests

When frontend changes:
1. Update selectors in affected tests
2. Add new test cases for new features
3. Update test data fixtures if needed
4. Run full test suite to verify

### Performance

- **Target**: <10 minutes for full suite
- **Current**: ~15 minutes (65+ tests)
- **Optimization**: Use parallel execution (4 workers)

### Test Reliability

- **Flaky Test Policy**: Investigate and fix, don't ignore
- **Retry Strategy**: Max 2 retries in CI
- **Timeout Strategy**: 30s actions, 120s tests

---

## 📈 Test Metrics

### Coverage Goals

- ✅ **User Journeys**: 100% of critical paths
- ✅ **Cross-Browser**: Chrome, Firefox, Safari
- ✅ **Responsive**: Mobile, Tablet, Desktop
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Error Handling**: Happy path + error scenarios

### Success Criteria

- 100% test pass rate on main branch
- <10 minutes execution time
- <1% flaky test rate
- All critical user journeys covered

---

## 🎯 Next Steps

1. **Add more test data**: Seed devnet database with consistent test markets
2. **Enhance wallet mock**: Support more complex transaction scenarios
3. **Add performance tests**: Measure page load times and interactions
4. **Integrate axe-core**: Automated accessibility auditing
5. **Visual regression**: Screenshot comparison testing

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: 2025-10-28
**Story**: 4.3
**Test Count**: 65+ tests
**Coverage**: All acceptance criteria ✅
