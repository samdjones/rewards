import { test, expect } from '@playwright/test';
import { registerUser, loginUser, setupAuthenticatedUser, logout } from './helpers/auth.js';
import { validUser, invalidCredentials } from './fixtures/testData.js';

test.describe('Authentication', () => {
  test('should register new user and redirect to family setup', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;

    await page.goto('/register');
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Should redirect to family setup
    await expect(page).toHaveURL('/family/setup');
    await expect(page.getByRole('heading', { name: 'Set Up Your Family' })).toBeVisible();
  });

  test('should show error when registering with existing email', async ({ page }) => {
    // First registration
    const email = `test-${Date.now()}@example.com`;
    await registerUser(page, { email, ...validUser });

    // Try to register again with same email
    await page.goto('/register');
    await page.getByLabel('Name').fill('Jane Doe');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password456');
    await page.getByRole('button', { name: 'Register' }).click();

    // Should show error
    await expect(page.getByText('Email already registered')).toBeVisible();
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Setup: Create user with family first
    const credentials = await setupAuthenticatedUser(page);

    // Logout
    await logout(page);

    // Login again
    await loginUser(page, credentials.email, credentials.password);

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(invalidCredentials.email);
    await page.getByLabel('Password').fill(invalidCredentials.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();

    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout and redirect to login page', async ({ page }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page);

    // Should be on dashboard
    await expect(page).toHaveURL('/');

    // Logout
    await logout(page);

    // Should be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect authenticated user away from login page', async ({ page }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page);

    // Try to access login page
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should redirect authenticated user away from register page', async ({ page }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page);

    // Try to access register page
    await page.goto('/register');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });
});
