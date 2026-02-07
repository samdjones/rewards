import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, joinFamily } from './helpers/auth.js';

test.describe('Family Settings', () => {
  test('should navigate to settings page', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Family/i }).click();

    await expect(page).toHaveURL(/\/family\/settings/);
    await expect(page.getByText('Family Settings')).toBeVisible();
  });

  test('should show and hide invite code', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    // Initially masked
    await expect(page.locator('code').first()).toHaveText('********');

    // Click Show
    await page.getByRole('button', { name: 'Show' }).click();

    // Code should be visible (not masked)
    const code = page.locator('code').first();
    await expect(code).not.toHaveText('********');
    const visibleCode = await code.textContent();
    expect(visibleCode.length).toBeGreaterThan(0);

    // Click Hide
    await page.getByRole('button', { name: 'Hide' }).click();

    // Should be masked again
    await expect(page.locator('code').first()).toHaveText('********');
  });

  test('should regenerate invite code', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    // Show the code first
    await page.getByRole('button', { name: 'Show' }).click();
    const originalCode = await page.locator('code').first().textContent();

    // Accept confirm dialog and click Regenerate
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Regenerate' }).click();
    await page.waitForTimeout(1000);

    // New code should be different
    const newCode = await page.locator('code').first().textContent();
    expect(newCode).not.toEqual(originalCode);
    expect(newCode).not.toEqual('********');
  });

  test('should display family members', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    await expect(page.getByText('Family Members')).toBeVisible();
    await expect(page.getByText('(you)')).toBeVisible();
    await expect(page.getByText('admin')).toBeVisible();
  });

  test('should allow second member to join family', async ({ page, browser }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    // Get invite code
    await page.getByRole('button', { name: 'Show' }).click();
    const inviteCode = await page.locator('code').first().textContent();

    // Open new context for second user
    const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await context2.newPage();

    // Register second user
    const baseURL = page.url().split('/family')[0];
    await page2.goto(baseURL + '/register');
    await page2.getByLabel('Name').fill('Second Parent');
    await page2.getByLabel('Email').fill(`second-${Date.now()}@example.com`);
    await page2.getByLabel('Password').fill('password123');
    await page2.getByRole('button', { name: 'Register' }).click();
    await page2.waitForURL(/\/family\/setup/);

    // Join family with invite code
    await joinFamily(page2, inviteCode);

    // Reload first page to see updated members
    await page.reload();
    await page.waitForTimeout(500);

    // Should now show 2 members
    await expect(page.getByText('Second Parent')).toBeVisible();

    await context2.close();
  });

  test('should remove a member', async ({ page, browser }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    // Get invite code
    await page.getByRole('button', { name: 'Show' }).click();
    const inviteCode = await page.locator('code').first().textContent();

    // Add second member via new context
    const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await context2.newPage();
    const baseURL = page.url().split('/family')[0];
    await page2.goto(baseURL + '/register');
    await page2.getByLabel('Name').fill('Remove Me');
    await page2.getByLabel('Email').fill(`remove-${Date.now()}@example.com`);
    await page2.getByLabel('Password').fill('password123');
    await page2.getByRole('button', { name: 'Register' }).click();
    await page2.waitForURL(/\/family\/setup/);
    await joinFamily(page2, inviteCode);
    await context2.close();

    // Reload to see the member
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.getByText('Remove Me')).toBeVisible();

    // Accept confirm dialog and remove
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.waitForTimeout(1000);

    // Member should be gone
    await expect(page.getByText('Remove Me')).not.toBeVisible();
  });

  test('should leave family', async ({ page, browser }) => {
    // Create family with admin
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    // Get invite code
    await page.getByRole('button', { name: 'Show' }).click();
    const inviteCode = await page.locator('code').first().textContent();

    // Create second user who will leave
    const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await context2.newPage();
    const baseURL = page.url().split('/family')[0];
    await page2.goto(baseURL + '/register');
    await page2.getByLabel('Name').fill('Leaver');
    await page2.getByLabel('Email').fill(`leaver-${Date.now()}@example.com`);
    await page2.getByLabel('Password').fill('password123');
    await page2.getByRole('button', { name: 'Register' }).click();
    await page2.waitForURL(/\/family\/setup/);
    await joinFamily(page2, inviteCode);

    // Navigate to settings on second user's page
    await page2.getByRole('link', { name: /Family/i }).click();

    // Accept confirm dialog and leave
    page2.on('dialog', dialog => dialog.accept());
    await page2.getByRole('button', { name: 'Leave Family' }).click();

    // Should redirect to family setup
    await page2.waitForURL(/\/family\/setup/);

    await context2.close();
  });

  test('should delete family with double confirmation', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    // Accept both confirm dialogs
    let dialogCount = 0;
    page.on('dialog', async (dialog) => {
      dialogCount++;
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Delete Family' }).click();

    // Should redirect to family setup
    await page.waitForURL(/\/family\/setup/);

    // Both confirms should have fired
    expect(dialogCount).toBeGreaterThanOrEqual(2);
  });
});
