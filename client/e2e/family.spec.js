import { test, expect } from '@playwright/test';
import { registerUser, createFamily, joinFamily, setupAuthenticatedUser } from './helpers/auth.js';
import { generateFamilyName } from './fixtures/testData.js';

test.describe('Family Setup', () => {
  test('should create new family and redirect to dashboard', async ({ page }) => {
    // Register new user
    await registerUser(page);

    // Should be on family setup page
    await expect(page).toHaveURL('/family/setup');

    // Create family
    const familyName = generateFamilyName();
    await createFamily(page, familyName);

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('should show family name after creation', async ({ page }) => {
    const familyName = generateFamilyName();
    await setupAuthenticatedUser(page, { familyName });

    // Family name should be visible somewhere on the page
    await expect(page.getByText(familyName)).toBeVisible();
  });

  test('should show error for invalid invite code', async ({ page }) => {
    // Register new user
    await registerUser(page);

    // Should be on family setup page
    await expect(page).toHaveURL('/family/setup');

    // Try to join with invalid code
    await page.getByRole('button', { name: /Join Existing Family/i }).click();
    await page.getByPlaceholder(/invite code/i).fill('INVALID123');
    await page.getByRole('button', { name: /Join Family/i }).click();

    // Should show error
    await expect(page.getByText(/Invalid.*code|not found|does not exist/i)).toBeVisible();

    // Should remain on family setup page
    await expect(page).toHaveURL('/family/setup');
  });

  test('should join family with valid invite code', async ({ page, context }) => {
    // Create first user and family
    const page1 = page;
    await setupAuthenticatedUser(page1);

    // Get invite code from settings or family page
    // This assumes there's a way to view the invite code
    await page1.getByRole('button', { name: /Settings|Family/i }).click();
    const inviteCodeElement = page1.getByText(/[A-Z0-9]{6,}/);
    const inviteCode = await inviteCodeElement.textContent();

    // Create second user in new page
    const page2 = await context.newPage();
    await registerUser(page2);

    // Should be on family setup page
    await expect(page2).toHaveURL('/family/setup');

    // Join family with invite code
    await joinFamily(page2, inviteCode.trim());

    // Should redirect to dashboard
    await expect(page2).toHaveURL('/');
    await expect(page2.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    await page2.close();
  });

  test('should not allow user with family to access family setup page', async ({ page }) => {
    // Setup user with family
    await setupAuthenticatedUser(page);

    // Try to access family setup page
    await page.goto('/family/setup');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should require family name when creating family', async ({ page }) => {
    // Register new user
    await registerUser(page);

    // Should be on family setup page
    await expect(page).toHaveURL('/family/setup');

    // Try to create family without name
    await page.getByRole('button', { name: /Create New Family/i }).click();
    await page.getByRole('button', { name: /Create Family/i }).click();

    // Should show validation error
    await expect(page.getByText(/required|enter.*name/i)).toBeVisible();
  });
});
