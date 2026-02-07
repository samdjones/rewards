import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid } from './helpers/auth.js';
import { testKids } from './fixtures/testData.js';

test.describe('Kids CRUD Operations', () => {
  test('should open add kid modal', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Click add kid button
    await page.getByRole('button', { name: '+ Add Kid' }).click();

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Name *')).toBeVisible();
    await expect(page.getByLabel('Age (optional)')).toBeVisible();
  });

  test('should create kid with required fields', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Add kid
    const kid = await addKid(page, testKids[0]);

    // Reload to see kid in list
    await page.reload();

    // Kid should appear in list
    await expect(page.getByText(kid.name)).toBeVisible();
  });

  test('should show kid in list after creation', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Add multiple kids
    await addKid(page, testKids[0]);
    await addKid(page, testKids[1]);
    await addKid(page, testKids[2]);

    // Reload to see all kids
    await page.reload();

    // All kids should be visible
    await expect(page.getByText(testKids[0].name)).toBeVisible();
    await expect(page.getByText(testKids[1].name)).toBeVisible();
    await expect(page.getByText(testKids[2].name)).toBeVisible();
  });

  test('should validate required fields when creating kid', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Open modal
    await page.getByRole('button', { name: '+ Add Kid' }).click();

    // Name field should have required attribute (HTML5 validation)
    const nameInput = page.getByLabel('Name *');
    await expect(nameInput).toHaveAttribute('required', '');

    // Modal should still be visible after attempting to submit without data
    await page.getByRole('button', { name: 'Add Kid', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should delete kid with confirmation', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Add kid
    const kid = await addKid(page, testKids[0]);
    await page.reload();

    // Delete kid
    const deleteButton = page.getByRole('button', { name: /Delete|Remove/i }).first();
    await deleteButton.click();

    // Confirm deletion
    await page.getByRole('button', { name: /Confirm|Yes|Delete/i }).click();

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Kid should not be visible
    await expect(page.getByText(kid.name)).not.toBeVisible();
  });

  test('should navigate to kid detail page', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Add kid
    const kid = await addKid(page, testKids[0]);
    await page.reload();

    // Click on kid name or view button
    await page.getByText(kid.name).first().click();

    // Should navigate to kid detail page
    await expect(page).toHaveURL(/\/kids\/\d+/);
    await expect(page.getByText(kid.name)).toBeVisible();
  });

  test('should edit kid information', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Add kid
    const kid = await addKid(page, testKids[0]);
    await page.reload();

    // Click edit button
    const editButton = page.getByRole('button', { name: /Edit/i }).first();
    await editButton.click();

    // Update kid name
    const newName = 'Updated Kid Name';
    await page.getByLabel(/Name/i).clear();
    await page.getByLabel(/Name/i).fill(newName);

    // Save changes
    await page.getByRole('button', { name: /Save|Update/i }).click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Updated name should be visible
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should display kid points on kids page', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Add kid
    await addKid(page, testKids[0]);
    await page.reload();

    // Should show points (initially 0)
    await expect(page.getByText(/0\s*points?/i)).toBeVisible();
  });

  test('should show empty state when no kids exist', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Should show empty state
    await expect(page.getByText(/No kids|Add.*first kid|Get started/i)).toBeVisible();
  });

  test('should cancel kid creation', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Navigate to kids page
    await page.getByRole('link', { name: /Kids/i }).click();

    // Open modal
    await page.getByRole('button', { name: '+ Add Kid' }).click();

    // Fill in some data
    await page.getByLabel('Name *').fill('Test Kid');

    // Close modal with X button
    await page.getByRole('button', { name: 'Close modal' }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Reload and check kid wasn't created
    await page.reload();
    await expect(page.getByText('Test Kid')).not.toBeVisible();
  });
});
