# Testing Guide

This document provides comprehensive testing information for the Rewards application.

## Overview

The application has three levels of testing:

1. **Unit Tests** - Backend API integration tests (Vitest + Supertest)
2. **Functional Tests** - API endpoint tests in containerized environment
3. **UI E2E Tests** - End-to-end user flow tests (Playwright)

## Unit Tests

### Backend Integration Tests

Located in `/server/src/__tests__/`

**Run tests:**

```bash
# From project root
npm test

# From server directory
cd server
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

**Current coverage:** 105+ tests covering:
- Authentication (register, login, JWT)
- Family management (create, join, invite codes)
- Kids CRUD operations
- Tasks CRUD operations
- Rewards CRUD operations
- Task completion tracking
- Points calculation

## Functional API Tests

### Containerized Integration Tests

Located in `/scripts/functional-tests.sh`

Tests the complete API in a production-like Podman container.

**Run tests:**

```bash
# From project root
./scripts/functional-tests.sh
```

**What it does:**
1. Builds container image
2. Starts container on test port
3. Waits for health check
4. Runs API integration tests
5. Cleans up container

**Test scenarios:**
- User registration and authentication
- Family creation and management
- Kids CRUD operations
- Complete user flows

## UI E2E Tests

### Playwright End-to-End Tests

Located in `/client/e2e/`

Tests critical user flows through the browser.

### Installation

**First time setup:**

```bash
cd client
npm install -D @playwright/test
npx playwright install --with-deps
```

This installs:
- Playwright test runner
- Chromium, Firefox, and WebKit browsers
- System dependencies

### Running Tests

**All tests:**

```bash
# From project root
npm run test:ui

# From client directory
cd client
npm run test:e2e
```

**Interactive UI mode (recommended for development):**

```bash
cd client
npm run test:e2e:ui
```

UI mode provides:
- Visual test runner
- Watch mode
- Time travel debugging
- Click to run individual tests

**Headed mode (see browser):**

```bash
cd client
npm run test:e2e:headed
```

**Debug mode (step through tests):**

```bash
cd client
npm run test:e2e:debug
```

**Specific browser:**

```bash
cd client
npm run test:e2e:chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**View test report:**

```bash
cd client
npm run test:e2e:report
```

### Running with Container

Test against containerized app:

```bash
# From project root
./scripts/ui-tests.sh
```

This is the same approach used in CI/CD.

### Test Coverage

**Authentication** (8 tests):
- User registration
- Login/logout flows
- Invalid credentials
- Protected route access
- Redirect behavior

**Family Setup** (6 tests):
- Create new family
- Join existing family
- Invite code validation
- Access control
- Required fields

**Dashboard** (10 tests):
- Empty states (no kids, no tasks)
- Task matrix display
- Point tracking (check/uncheck tasks)
- Date filtering (today/yesterday)
- Navigation

**Kids CRUD** (11 tests):
- Add kid modal
- Create kid
- Edit kid
- Delete kid with confirmation
- Kid detail page
- Validation
- Empty states
- Cancel operations

**Total: 35 E2E tests**

### Test Structure

```
client/e2e/
├── helpers/
│   └── auth.js          # Helper functions for authentication
├── fixtures/
│   └── testData.js      # Reusable test data
├── auth.spec.js         # Authentication tests
├── family.spec.js       # Family setup tests
├── dashboard.spec.js    # Dashboard tests
├── kids.spec.js         # Kids CRUD tests
└── README.md            # E2E testing documentation
```

## CI/CD Testing

All tests run automatically in GitHub Actions on push and pull requests.

### Pipeline

```
lint → audit → unit-tests → build-scan → functional-tests
                                       → ui-tests
```

**Workflow:**

1. **Lint**: ESLint checks
2. **Audit**: npm security audit
3. **Unit Tests**: Backend integration tests
4. **Build & Scan**:
   - Build container
   - Trivy vulnerability scan
5. **Functional Tests**: API tests in container (parallel)
6. **UI Tests**: E2E tests in container (parallel)

### CI Configuration

UI tests in CI:
- Run only on Chromium (fastest)
- 2 retries on failure
- Upload test reports on failure
- Upload test results always
- Uses containerized app on port 13001

### Viewing CI Results

**Failed tests:**
- Check "Actions" tab in GitHub
- Download "playwright-report" artifact
- View HTML report locally

**All test results:**
- Download "playwright-results" artifact
- Contains screenshots, videos, traces

## Debugging Tests

### Playwright Debugging

**Interactive UI mode:**
```bash
cd client
npm run test:e2e:ui
```

**Debug specific test:**
```bash
cd client
npx playwright test auth.spec.js --debug
```

**View traces:**
```bash
cd client
npx playwright show-trace test-results/path/to/trace.zip
```

### Common Issues

**"Failed to connect" errors:**
- Ensure app is running on correct port
- Check `PLAYWRIGHT_BASE_URL` environment variable
- Verify health endpoint is accessible

**HTTPS certificate errors:**
- Should be handled by `ignoreHTTPSErrors: true`
- Check Playwright config if issues persist

**Timeout errors:**
- App may be slow to start
- Increase timeout in `playwright.config.js`
- Check container logs: `podman logs rewards-ui-test`

**Flaky tests:**
- Add proper waits (`waitForURL`, `waitForLoadState`)
- Check for race conditions
- Ensure unique test data (timestamps)
- Use Playwright's auto-waiting

### Test Debugging Tips

1. **Use UI mode** - Best visualization of test execution
2. **Add screenshots** - `await page.screenshot({ path: 'debug.png' })`
3. **Pause execution** - `await page.pause()`
4. **Console logs** - Check browser console in headed mode
5. **Network tab** - Monitor API calls in browser DevTools

## Writing New Tests

### Best Practices

**1. Use semantic selectors:**
```javascript
// Good
await page.getByRole('button', { name: 'Login' });
await page.getByLabel('Email');
await page.getByText('Welcome');

// Avoid
await page.locator('.btn-login');
await page.locator('#email-input');
```

**2. Generate unique data:**
```javascript
const email = `test-${Date.now()}@example.com`;
```

**3. Use helper functions:**
```javascript
import { setupAuthenticatedUser } from './helpers/auth.js';

test('my test', async ({ page }) => {
  await setupAuthenticatedUser(page);
  // Your test code
});
```

**4. Keep tests independent:**
- Each test sets up its own data
- No shared state between tests
- Don't rely on test execution order

**5. Trust auto-waiting:**
- Playwright waits for elements automatically
- Only use explicit waits when necessary
- Use `waitForURL` for navigation

### Example Test

```javascript
import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid } from './helpers/auth.js';

test('should add and display kid', async ({ page }) => {
  // Setup: authenticated user with family
  await setupAuthenticatedUser(page);

  // Navigate to kids page
  await page.getByRole('link', { name: /Kids/i }).click();

  // Add kid
  await page.getByRole('button', { name: /Add Kid/i }).click();
  await page.getByLabel(/Name/i).fill('Test Kid');
  await page.getByLabel(/Points per task/i).fill('10');
  await page.getByRole('button', { name: /Create/i }).click();

  // Verify
  await page.reload();
  await expect(page.getByText('Test Kid')).toBeVisible();
});
```

## Local Development Workflow

### Typical Testing Flow

1. **Write code changes**

2. **Run unit tests:**
   ```bash
   npm test
   ```

3. **Start dev server:**
   ```bash
   npm run client
   ```

4. **Run E2E tests (interactive):**
   ```bash
   cd client
   npm run test:e2e:ui
   ```

5. **Fix any failures**

6. **Run full test suite:**
   ```bash
   ./scripts/ui-tests.sh
   ```

7. **Commit and push** (CI will run all tests)

## Test Maintenance

### Updating Tests

When modifying the UI:
1. Update relevant E2E test selectors
2. Run tests to verify they still pass
3. Update test expectations if behavior changed
4. Add new tests for new features

### Adding New Tests

1. Create test file in `client/e2e/`
2. Import helpers and fixtures
3. Write descriptive test names
4. Use semantic selectors
5. Add to this documentation

### Test Data Management

- Use fixtures for reusable data
- Generate unique data per test
- Clean up test data (automatic with containers)
- Don't hardcode production data

## Performance

### Test Execution Times

**Unit Tests:** ~10 seconds (105+ tests)
**Functional Tests:** ~30 seconds (container startup + tests)
**UI E2E Tests:** ~2 minutes (35 tests, chromium only)

**Total CI Pipeline:** ~5-7 minutes

### Optimization Tips

- Run only changed tests during development
- Use `test.only` for focused testing
- Run chromium only for quick feedback
- Use headed mode only when debugging
- Parallelize independent tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright CI Guide](https://playwright.dev/docs/ci)

## Support

For issues with tests:
1. Check this documentation
2. Review test output and error messages
3. Use Playwright UI mode for debugging
4. Check GitHub Actions logs for CI failures
5. Review test code and selectors
