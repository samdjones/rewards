# E2E Testing Setup - Quick Start Guide

This guide will help you set up and run the Playwright E2E tests for the Rewards application.

## Prerequisites

- Node.js 20 or later
- npm
- Podman (for containerized testing)
- Git

## Installation

### 1. Install Playwright

From the project root:

```bash
cd client
npm install -D @playwright/test
```

### 2. Install Browsers

Install Playwright browsers with system dependencies:

```bash
npx playwright install --with-deps
```

This installs Chromium, Firefox, and WebKit browsers along with required system libraries.

**For Linux systems**, if you encounter permission issues:

```bash
# Install system dependencies separately
sudo npx playwright install-deps

# Then install browsers
npx playwright install
```

### 3. Verify Installation

Check that Playwright is installed correctly:

```bash
npx playwright --version
```

Expected output: `Version 1.x.x`

## Running Tests

### Quick Start

**Run all tests:**

```bash
# From project root
npm run test:ui

# Or from client directory
cd client
npm run test:e2e
```

**Run with UI mode (recommended for development):**

```bash
cd client
npm run test:e2e:ui
```

This opens an interactive test runner where you can:
- See all tests visually
- Run individual tests
- Watch tests in real-time
- Debug failures with time-travel

### Test Scripts

Available npm scripts:

| Script | Description |
|--------|-------------|
| `test:e2e` | Run all tests headlessly |
| `test:e2e:ui` | Interactive UI mode |
| `test:e2e:headed` | Run with visible browser |
| `test:e2e:debug` | Debug mode with step-through |
| `test:e2e:chromium` | Run only Chromium tests (fastest) |
| `test:e2e:report` | View HTML test report |

### Running Against Local Development Server

1. **Start the development server:**

   ```bash
   # Terminal 1
   cd /home/samuel/code/rewards
   ./scripts/deploy.sh
   ```

2. **Run tests:**

   ```bash
   # Terminal 2
   cd client
   npm run test:e2e
   ```

The tests will automatically use `https://localhost:3000` as the base URL.

### Running Against Container

To test the production build in a container:

```bash
# From project root
./scripts/ui-tests.sh
```

This script:
1. Builds the container image
2. Starts the container on port 13001
3. Waits for the app to be ready
4. Runs the E2E tests
5. Cleans up automatically

This is the same approach used in CI/CD.

## Test Structure

```
client/e2e/
├── helpers/
│   └── auth.js              # Authentication helpers
├── fixtures/
│   └── testData.js          # Test data and utilities
├── auth.spec.js             # 8 authentication tests
├── family.spec.js           # 6 family setup tests
├── dashboard.spec.js        # 10 dashboard tests
├── kids.spec.js             # 11 kids CRUD tests
└── README.md                # Detailed documentation
```

**Total: 35 E2E tests covering critical user flows**

## Test Coverage

### Authentication (8 tests)
- User registration → family setup redirect
- Duplicate email validation
- Login with valid credentials
- Invalid credentials error handling
- Logout functionality
- Protected route access control
- Authenticated user redirects

### Family Setup (6 tests)
- Create new family
- Family name display
- Join family with invite code
- Invalid invite code handling
- Access control (users with families)
- Required field validation

### Dashboard (10 tests)
- Empty state: no kids
- Empty state: no tasks
- Task matrix display
- Point tracking (check task → increase points)
- Point tracking (uncheck task → decrease points)
- Date filtering (today)
- Date filtering (yesterday)
- Navigation to kids page
- Navigation to tasks page

### Kids CRUD (11 tests)
- Open add kid modal
- Create kid with required fields
- Display kids in list
- Required field validation
- Delete kid with confirmation
- Navigate to kid detail page
- Edit kid information
- Display kid points
- Empty state handling
- Cancel kid creation

## Configuration

### Playwright Config

Located at: `/home/samuel/code/rewards/client/playwright.config.js`

Key settings:
- **Base URL**: `https://localhost:3000` (override with `PLAYWRIGHT_BASE_URL`)
- **Browsers**: Chromium, Firefox, WebKit
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Workers**: 1 on CI, parallel locally
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Captured on first retry
- **HTTPS**: Ignores certificate errors (self-signed certs)

### Environment Variables

```bash
# Override base URL
export PLAYWRIGHT_BASE_URL="https://localhost:13001"

# CI mode (enables retries and optimizations)
export CI=true
```

## Debugging

### Interactive UI Mode (Best for Development)

```bash
cd client
npm run test:e2e:ui
```

Features:
- Visual test execution
- Click to run specific tests
- Watch mode (re-run on file changes)
- Time-travel debugging
- Screenshot/video playback

### Debug Mode

Step through tests with debugger:

```bash
cd client
npm run test:e2e:debug
```

Use in test code:
```javascript
await page.pause(); // Pause execution
```

### View Test Reports

After running tests:

```bash
cd client
npm run test:e2e:report
```

Opens an HTML report with:
- Test results summary
- Screenshots of failures
- Trace viewer
- Network activity
- Console logs

### Common Issues

#### 1. "Failed to connect to localhost:3000"

**Solution:**
- Ensure dev server is running
- Check the URL in browser manually
- Verify port 3000 is not blocked

#### 2. "Timeout waiting for selector"

**Solution:**
- Element may have different text/role
- Check the actual page in headed mode
- Update selector to match actual element

```bash
npm run test:e2e:headed
```

#### 3. HTTPS Certificate Errors

**Solution:**
- Already handled by `ignoreHTTPSErrors: true`
- If still occurring, check playwright.config.js

#### 4. Tests Pass Locally but Fail in CI

**Solution:**
- Check timing issues (race conditions)
- Add explicit waits if needed
- Review CI logs and artifacts
- Check container startup time

## CI/CD Integration

Tests run automatically in GitHub Actions.

### Pipeline Flow

```
build-scan → functional-tests (parallel)
          → ui-tests (parallel)
```

### CI Configuration

Located at: `/.github/workflows/ci.yml`

UI tests job:
- Runs after build-scan completes
- Installs Playwright browsers
- Uses containerized app
- Runs chromium tests only (fastest)
- Uploads artifacts on failure

### Viewing CI Results

1. Go to GitHub repository
2. Click "Actions" tab
3. Select workflow run
4. Click "ui-tests" job
5. View logs

**On failure:**
- Download "playwright-report" artifact
- Extract and open `index.html`
- View screenshots, traces, and videos

## Development Workflow

### Writing New Tests

1. Create test file in `client/e2e/`
2. Import test framework and helpers:
   ```javascript
   import { test, expect } from '@playwright/test';
   import { setupAuthenticatedUser } from './helpers/auth.js';
   ```

3. Write test:
   ```javascript
   test('should do something', async ({ page }) => {
     await setupAuthenticatedUser(page);
     // Test code here
   });
   ```

4. Run in UI mode for development:
   ```bash
   npm run test:e2e:ui
   ```

### Best Practices

1. **Use semantic selectors**
   ```javascript
   page.getByRole('button', { name: 'Submit' })  // ✓
   page.locator('.btn-submit')                   // ✗
   ```

2. **Generate unique test data**
   ```javascript
   const email = `test-${Date.now()}@example.com`;
   ```

3. **Use helper functions**
   ```javascript
   import { setupAuthenticatedUser, addKid } from './helpers/auth.js';
   ```

4. **Keep tests independent**
   - Each test sets up its own data
   - No shared state
   - Don't rely on test order

5. **Trust auto-waiting**
   - Playwright waits automatically
   - Use `waitForURL` for navigation
   - Avoid manual timeouts

### Helper Functions Reference

Available in `helpers/auth.js`:

| Function | Description |
|----------|-------------|
| `registerUser(page, userData)` | Register new user |
| `loginUser(page, email, password)` | Login with credentials |
| `setupAuthenticatedUser(page, options)` | Full setup (register + family) |
| `logout(page)` | Logout current user |
| `createFamily(page, familyName)` | Create new family |
| `joinFamily(page, inviteCode)` | Join existing family |
| `addKid(page, kidData)` | Add kid to family |

## Performance

### Execution Times

| Test Suite | Tests | Time |
|------------|-------|------|
| Authentication | 8 | ~20s |
| Family Setup | 6 | ~15s |
| Dashboard | 10 | ~40s |
| Kids CRUD | 11 | ~35s |
| **Total** | **35** | **~2min** |

Times are for chromium, headless mode on modern hardware.

### Optimization Tips

- Use `test.only` to run single test during development
- Run chromium only: `npm run test:e2e:chromium`
- Use UI mode for interactive development
- Parallelize tests (automatic in Playwright)
- Skip unnecessary setup (use helpers efficiently)

## Troubleshooting

### Reset Everything

If tests are behaving strangely:

```bash
# Remove playwright cache
rm -rf client/test-results
rm -rf client/playwright-report
rm -rf client/playwright/.cache

# Reinstall browsers
cd client
npx playwright install --with-deps
```

### Check Playwright Installation

```bash
cd client
npx playwright --version
npx playwright test --list
```

### Verify Test Files

```bash
cd client
ls -la e2e/
```

Should show:
- `auth.spec.js`
- `family.spec.js`
- `dashboard.spec.js`
- `kids.spec.js`
- `helpers/auth.js`
- `fixtures/testData.js`

### Test Single File

```bash
cd client
npx playwright test auth.spec.js
```

### Verbose Output

```bash
cd client
npx playwright test --reporter=list
```

## Next Steps

1. **Run your first test:**
   ```bash
   cd client
   npm run test:e2e:ui
   ```

2. **Explore the test files** in `client/e2e/`

3. **Read the detailed documentation** in `client/e2e/README.md`

4. **Write your own tests** following the examples

5. **Check the full testing guide** in `docs/TESTING.md`

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Locators Guide](https://playwright.dev/docs/locators)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI Integration](https://playwright.dev/docs/ci)

## Support

For issues:
1. Check this guide and `docs/TESTING.md`
2. Review error messages and screenshots
3. Use UI mode for debugging
4. Check GitHub Actions logs for CI failures
5. Review Playwright documentation

---

**Happy Testing! 🎭**
