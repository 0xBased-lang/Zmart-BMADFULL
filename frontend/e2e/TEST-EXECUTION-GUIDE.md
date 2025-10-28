# Test Execution Guide
**Story 4.3 - Frontend E2E Tests with Playwright**

Step-by-step guide to execute the E2E test suite against devnet backend.

---

## 📋 Prerequisites

### 1. Supabase Database Configuration

Ensure you have a test database configured:

```bash
# Copy example environment file
cp .env.test.example .env.test

# Edit .env.test with your test database credentials
# Required variables:
# - NEXT_PUBLIC_SUPABASE_URL=<your-test-db-url>
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-test-db-key>
```

### 2. Solana Devnet Configuration

Verify devnet RPC endpoint is accessible:

```bash
# Test devnet connection
curl https://api.devnet.solana.com -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Should return: {"jsonrpc":"2.0","result":"ok","id":1}
```

### 3. Install Dependencies

```bash
# Install Node dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

---

## 🌱 Step 1: Seed Test Database

**Seed the database with consistent test data:**

```bash
# Run seeding script
npm run test:seed
```

**Expected output:**
```
🌱 Starting test data seeding...
📍 Supabase URL: https://your-test-db.supabase.co

🧹 Clearing existing test data...
✅ Test data cleared

👥 Seeding test users...
✅ Seeded 3 test users

📊 Seeding test markets...
✅ Seeded 5 test markets

📝 Seeding test proposals...
✅ Seeded 3 test proposals

🎲 Seeding test bets...
✅ Seeded 5 test bets

💬 Seeding test comments...
✅ Seeded 2 test comments

✅ Test data seeding complete!

📊 Summary:
   - 3 users
   - 5 markets
   - 3 proposals
   - 5 bets
   - 2 comments

🧪 Ready to run E2E tests!
```

---

## 🧪 Step 2: Run Test Suite

### Option A: Run All Tests (Recommended)

```bash
# Seed database and run all tests
npm run test:seed-and-run
```

### Option B: Run Tests Only

```bash
# Run all E2E tests
npm run test:e2e
```

### Option C: Run Specific Test Suites

```bash
# Run only betting flow tests
npx playwright test market-discovery-betting.spec.ts

# Run only proposal tests
npx playwright test proposal-creation-voting.spec.ts

# Run only responsive design tests
npx playwright test responsive-design.spec.ts

# Run only accessibility tests
npx playwright test accessibility.spec.ts
```

### Option D: Run Tests with UI (Interactive)

```bash
# Open Playwright test UI
npm run test:e2e:ui
```

### Option E: Run Tests in Headed Mode (See Browser)

```bash
# Run tests with visible browser
npm run test:e2e:headed
```

---

## 📊 Step 3: View Test Results

### HTML Report

After test execution, view the comprehensive HTML report:

```bash
# Open test report
npm run test:report

# Or manually
npx playwright show-report
```

The report includes:
- ✅ Test results (passed/failed/skipped)
- 📸 Screenshots of failures
- 🎥 Videos of failures
- ⏱️ Execution times
- 📝 Test logs

### Console Output

Tests provide real-time console output:

```
Running 65 tests using 4 workers
  ✓  market-discovery-betting.spec.ts:23:1 › should connect wallet successfully (1.2s)
  ✓  market-discovery-betting.spec.ts:45:1 › should display markets list (0.8s)
  ✓  market-discovery-betting.spec.ts:67:1 › should place YES bet successfully (2.3s)
  ...

65 passed (2.5m)
```

---

## 🎯 Expected Test Results

### Test Count by Suite

| Test Suite | Expected Tests | Critical Tests |
|------------|----------------|----------------|
| Market Discovery & Betting | 10+ | 7 |
| Proposal Creation & Voting | 12+ | 8 |
| Market Resolution & Disputes | 7+ | 5 |
| Payout Claims | 7+ | 5 |
| Responsive Design | 15+ | 10 |
| Accessibility | 14+ | 8 |
| **Total** | **65+** | **43** |

### Success Criteria

✅ **100% test pass rate on critical tests**
✅ **>95% pass rate on all tests** (allowing for flaky network tests)
✅ **<10 minutes execution time** (with 4 parallel workers)
✅ **No accessibility violations** (WCAG 2.1 AA)

---

## 🐛 Troubleshooting

### Issue: Tests timeout

**Symptoms**: Tests fail with "Timeout exceeded"

**Solutions**:
1. Check devnet RPC availability: `curl https://api.devnet.solana.com`
2. Increase timeout in `playwright.config.ts` (default: 120s)
3. Check Supabase database connectivity
4. Verify localhost:3000 is serving the application

### Issue: Wallet connection fails

**Symptoms**: Tests fail at "Connect Wallet" step

**Solutions**:
1. Verify wallet mock is injected: Check `e2e/fixtures/wallet-mock.ts`
2. Check browser console for errors in headed mode
3. Ensure wallet adapter is properly configured in application

### Issue: Database seeding fails

**Symptoms**: `npm run test:seed` errors

**Solutions**:
1. Verify Supabase credentials in `.env.test`
2. Check database tables exist (migrations applied)
3. Verify test user has write permissions
4. Try clearing data manually: Delete rows with `id LIKE 'test-%'`

### Issue: Tests pass locally but fail in CI

**Symptoms**: CI pipeline shows failures

**Solutions**:
1. Check CI environment variables are set
2. Verify Playwright browsers are installed in CI
3. Add retries in CI: Already configured (2 retries)
4. Check for timing issues: Add explicit waits

---

## 🚀 Running Tests in CI/CD

### GitHub Actions (Automatic)

Tests run automatically on:
- **Push** to `main` or `develop` branches
- **Pull requests** to `main` or `develop`
- **Manual** workflow dispatch

**CI Configuration**: `.github/workflows/e2e-tests.yml`

### View CI Test Results

1. Go to repository **Actions** tab
2. Select latest **E2E Tests** workflow run
3. View test results in workflow summary
4. Download test artifacts (reports, screenshots, videos)

---

## 📈 Test Metrics

### Performance Targets

- **Total execution time**: <10 minutes (4 parallel workers)
- **Average test duration**: <8 seconds per test
- **Retry rate**: <5% of tests need retry
- **Flaky test rate**: <1% of tests flaky

### Coverage Targets

- **User journeys**: 100% critical paths covered
- **Pages tested**: 100% of user-facing pages
- **Browsers tested**: Chromium, Firefox, WebKit
- **Viewports tested**: Mobile (375px), Tablet (768px), Desktop (1280px)
- **Accessibility**: WCAG 2.1 AA compliance

---

## 🔄 Continuous Testing

### Development Workflow

1. **Before starting work**: Run `npm run test:seed-and-run` to verify baseline
2. **During development**: Run specific test suite for feature
3. **Before committing**: Run full test suite
4. **After PR creation**: CI runs tests automatically

### Maintenance

**Weekly**:
- Review flaky tests and fix
- Update test data fixtures as needed
- Check for new accessibility violations

**Monthly**:
- Update Playwright version
- Review test execution times
- Optimize slow tests

**Per Release**:
- Full test suite execution
- Review test coverage
- Update test documentation

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [E2E Test README](./README.md)
- [Test Data Fixtures](./fixtures/)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

## ✅ Test Execution Checklist

**Before running tests:**
- [ ] Database credentials configured (`.env.test`)
- [ ] Devnet RPC endpoint accessible
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] Application builds successfully (`npm run build`)

**Running tests:**
- [ ] Seed test database (`npm run test:seed`)
- [ ] Run test suite (`npm run test:e2e`)
- [ ] All tests pass (or >95% pass rate)
- [ ] Review test report (`npm run test:report`)

**After tests:**
- [ ] Review failures and fix
- [ ] Check accessibility violations
- [ ] Update test documentation if needed
- [ ] Commit test results/artifacts if required

---

**Last Updated**: 2025-10-28
**Story**: 4.3
**Status**: Ready for execution ✅
