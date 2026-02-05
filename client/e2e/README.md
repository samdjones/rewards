# E2E Testing with Playwright

This directory contains end-to-end tests for the Rewards application using Playwright.

## Overview

The E2E tests cover critical user flows:
- **Authentication**: Registration, login, logout, protected routes
- **Family Setup**: Create family, join family, invite codes
- **Dashboard**: Task matrix, point tracking, date filtering
- **Kids CRUD**: Add, edit, delete, and view kids

## Structure

```
e2e/
├── helpers/
│   └── auth.js          # Authentication helper functions
├── fixtures/
│   └── testData.js      # Reusable test data
├── auth.spec.js         # Authentication tests (8 tests)
├── family.spec.js       # Family setup tests (6 tests)
├── dashboard.spec.js    # Dashboard tests (10 tests)
├── kids.spec.js         # Kids CRUD tests (11 tests)
└── README.md            # This file
```

## Running Tests

### Prerequisites

Install Playwright and its browsers:

```bash
cd client
npm install -D @playwright/test
npx playwright install --with-deps
```

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run only chromium tests (fastest)
npm run test:e2e:chromium

# View test report
npm run test:e2e:report
```

### With Container

The tests can run against a containerized version of the app:

```bash
# From project root
./scripts/ui-tests.sh
```

This script:
1. Builds the app container
2. Starts it on port 13001
3. Runs Playwright tests against it
4. Cleans up after completion

## CI/CD Integration

Tests run automatically in GitHub Actions:
- After building and scanning the container
- Only on chromium browser (for speed)
- Uploads test reports on failure
- Uploads test results on all runs

## Writing Tests

### Best Practices

1. **Use semantic selectors**
   ```javascript
   // Good
   page.getByRole('button', { name: 'Login' })
   page.getByLabel('Email')

   // Avoid
   page.locator('.login-button')
   ```

2. **Generate unique test data**
   ```javascript
   const email = `test-${Date.now()}@example.com`;
   ```

3. **Use helper functions**
   ```javascript
   import { setupAuthenticatedUser } from './helpers/auth.js';

   test('my test', async ({ page }) => {
     await setupAuthenticatedUser(page);
     // Test code here
   });
   ```

4. **Trust auto-waiting**
   - Playwright waits automatically for elements
   - Only use explicit waits when necessary
   - Use `waitForURL` for navigation

5. **Keep tests independent**
   - Each test should set up its own data
   - Don't rely on test execution order
   - Clean state between tests (automatic with Playwright)

### Helper Functions

Available in `helpers/auth.js`:

- `registerUser(page, userData)` - Register a new user
- `loginUser(page, email, password)` - Login with credentials
- `setupAuthenticatedUser(page, options)` - Full setup (register + create family)
- `logout(page)` - Logout current user
- `createFamily(page, familyName)` - Create a new family
- `joinFamily(page, inviteCode)` - Join existing family
- `addKid(page, kidData)` - Add a kid to the family

### Test Data

Reusable test data available in `fixtures/testData.js`:

- `validUser` - Valid user credentials
- `invalidCredentials` - Invalid login credentials
- `testFamily` - Family data
- `testKids` - Array of kid data
- `testTasks` - Array of task data
- `testRewards` - Array of reward data
- `generateTestEmail()` - Generate unique email
- `generateFamilyName()` - Generate unique family name

## Configuration

Playwright configuration is in `playwright.config.js`:

- **Base URL**: `https://localhost:3000` (or `PLAYWRIGHT_BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Video**: On retry failure
- **Traces**: On first retry

## Debugging

### UI Mode

Best for development - interactive test runner:

```bash
npm run test:e2e:ui
```

### Debug Mode

Step through tests with debugger:

```bash
npm run test:e2e:debug
```

### View Reports

After test run:

```bash
npm run test:e2e:report
```

### Common Issues

**HTTPS Errors**: Tests ignore self-signed certificates via `ignoreHTTPSErrors: true`

**Timeouts**: Increase timeout in test or config if needed:
```javascript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

**Flaky Tests**:
- Check for race conditions
- Add proper waits (`waitForURL`, `waitForLoadState`)
- Use Playwright's auto-waiting features

## Coverage

Current test coverage:

- **Authentication**: 8 tests
  - Registration flows
  - Login/logout
  - Protected routes
  - Error handling

- **Family Setup**: 6 tests
  - Create family
  - Join family
  - Validation
  - Access control

- **Dashboard**: 10 tests
  - Empty states
  - Task matrix
  - Point tracking
  - Date filtering
  - Navigation

- **Kids CRUD**: 11 tests
  - Create/read/update/delete
  - Validation
  - Detail pages
  - Empty states

**Total**: 35 E2E tests

## Future Enhancements

- Tasks CRUD tests
- Rewards tests
- Family settings/admin tests
- Cross-browser testing in CI
- Visual regression testing
- Performance testing with Lighthouse
