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
 * Add a task via the Tasks page modal
 * @param {import('@playwright/test').Page} page
 * @param {Object} taskData - { name, point_value, description?, category?, repeat_schedule? }
 */
export async function addTask(page, taskData = {}) {
  const name = taskData.name || 'Test Task';
  const point_value = taskData.point_value || 5;

  // Open add task modal
  await page.getByRole('button', { name: '+ Add Task' }).click();

  // Fill required fields
  await page.getByLabel('Task Name *').fill(name);
  await page.getByLabel('Point Value *').fill(point_value.toString());

  // Fill optional fields
  if (taskData.description) {
    await page.getByLabel('Description').fill(taskData.description);
  }
  if (taskData.category) {
    await page.getByLabel('Category').fill(taskData.category);
  }
  if (taskData.repeat_schedule) {
    await page.getByLabel('Repeat Schedule').selectOption(taskData.repeat_schedule);
  }

  // Submit with exact match to avoid matching the "+ Add Task" header button
  await page.getByRole('button', { name: 'Add Task', exact: true }).click();

  // Wait for modal to close
  await page.waitForTimeout(500);

  return { name, point_value };
}

/**
 * Add a reward via the Rewards page modal
 * @param {import('@playwright/test').Page} page
 * @param {Object} rewardData - { name, cost, description?, category? }
 */
export async function addReward(page, rewardData = {}) {
  const name = rewardData.name || 'Test Reward';
  const cost = rewardData.cost || 50;

  // Open add reward modal
  await page.getByRole('button', { name: '+ Add Reward' }).click();

  // Fill required fields
  await page.getByLabel('Reward Name *').fill(name);
  await page.getByLabel('Point Cost *').fill(cost.toString());

  // Fill optional fields
  if (rewardData.description) {
    await page.getByLabel('Description').fill(rewardData.description);
  }
  if (rewardData.category) {
    await page.getByLabel('Category').fill(rewardData.category);
  }

  // Submit with exact match
  await page.getByRole('button', { name: 'Add Reward', exact: true }).click();

  // Wait for modal to close
  await page.waitForTimeout(500);

  return { name, cost };
}

/**
 * Complete a task on the Tasks page for a given child
 * @param {import('@playwright/test').Page} page
 * @param {string} taskName
 * @param {string} childName
 */
export async function completeTaskOnTasksPage(page, taskName, childName) {
  // Find the task card and click Complete
  const taskCard = page.locator(`text=${taskName}`).locator('..').locator('..');
  await taskCard.getByRole('button', { name: 'Complete' }).click();

  // Select child from dropdown
  await page.getByLabel('Select Child *').selectOption({ label: childName });

  // Handle the native alert
  page.once('dialog', dialog => dialog.accept());

  // Click Mark Complete
  await page.getByRole('button', { name: 'Mark Complete' }).click();

  // Wait for completion
  await page.waitForTimeout(500);
}

/**
 * Add a kid to the family
 * @param {import('@playwright/test').Page} page
 * @param {Object} kidData
 */
export async function addKid(page, kidData = {}) {
  const name = kidData.name || 'Test Kid';
  const age = kidData.age || null;

  // Open add kid modal
  await page.getByRole('button', { name: '+ Add Kid' }).click();

  // Fill in kid details
  await page.getByLabel('Name *').fill(name);
  if (age) {
    await page.getByLabel('Age (optional)').fill(age.toString());
  }

  // Submit (use exact match to avoid matching the "+ Add Kid" button)
  await page.getByRole('button', { name: 'Add Kid', exact: true }).click();

  // Wait for modal to close
  await page.waitForTimeout(500);

  return { name, age };
}
