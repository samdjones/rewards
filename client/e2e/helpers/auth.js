/**
 * Authentication helper functions for E2E tests
 */

/**
 * Register a new user with unique credentials
 * @param {import('@playwright/test').Page} page
 * @param {Object} userData - Optional user data
 * @returns {Promise<{email: string, password: string, name: string}>}
 */
export async function registerUser(page, userData = {}) {
  const timestamp = Date.now();
  const email = userData.email || `test-${timestamp}@example.com`;
  const password = userData.password || 'password123';
  const name = userData.name || 'Test User';

  await page.goto('/register');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  return { email, password, name };
}

/**
 * Login with existing credentials
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

/**
 * Complete user setup: register + create family
 * Returns credentials for a fully authenticated user with family
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - Optional configuration
 * @returns {Promise<{email: string, password: string, name: string, familyName: string}>}
 */
export async function setupAuthenticatedUser(page, options = {}) {
  const familyName = options.familyName || 'Test Family';

  // Register new user
  const credentials = await registerUser(page, options.userData);

  // Should be redirected to family setup
  await page.waitForURL('/family/setup');

  // Create new family
  await page.getByRole('button', { name: /Create a New Family/i }).click();
  await page.getByLabel('Family Name').fill(familyName);
  await page.getByRole('button', { name: /Create Family/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/');

  return { ...credentials, familyName };
}

/**
 * Logout the current user
 * @param {import('@playwright/test').Page} page
 */
export async function logout(page) {
  await page.getByRole('button', { name: /Logout/i }).click();
  await page.waitForURL('/login');
}

/**
 * Create a family for an authenticated user
 * @param {import('@playwright/test').Page} page
 * @param {string} familyName
 */
export async function createFamily(page, familyName = 'Test Family') {
  await page.getByRole('button', { name: /Create a New Family/i }).click();
  await page.getByLabel('Family Name').fill(familyName);
  await page.getByRole('button', { name: /Create Family/i }).click();
  await page.waitForURL('/');
}

/**
 * Join a family using invite code
 * @param {import('@playwright/test').Page} page
 * @param {string} inviteCode
 */
export async function joinFamily(page, inviteCode) {
  await page.getByRole('button', { name: /Join with Invite Code/i }).click();
  await page.getByLabel('Invite Code').fill(inviteCode);
  await page.getByRole('button', { name: /Join Family/i }).click();
  await page.waitForURL('/');
}

/**
 * Add a kid to the family
 * @param {import('@playwright/test').Page} page
 * @param {Object} kidData
 */
export async function addKid(page, kidData = {}) {
  const name = kidData.name || 'Test Kid';
  const pointsPerTask = kidData.pointsPerTask || 10;

  // Open add kid modal
  await page.getByRole('button', { name: /Add Kid/i }).click();

  // Fill in kid details
  await page.getByLabel(/Name/i).fill(name);
  await page.getByLabel(/Points per task/i).fill(pointsPerTask.toString());

  // Submit
  await page.getByRole('button', { name: /Add|Create/i }).click();

  // Wait for modal to close
  await page.waitForTimeout(500);

  return { name, pointsPerTask };
}
