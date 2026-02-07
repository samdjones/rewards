import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid, addTask, completeTaskOnTasksPage } from './helpers/auth.js';
import { testKids, testTasks } from './fixtures/testData.js';

test.describe('Child Detail Page', () => {
  test('should navigate to child detail and display info', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Add a kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]); // Alice, age 8
    await page.reload();

    // Click on kid card to navigate
    await page.getByText(testKids[0].name).first().click();

    // Should be on child detail page
    await expect(page).toHaveURL(/\/children\/\d+/);
    await expect(page.getByText(testKids[0].name)).toBeVisible();
    await expect(page.getByText(`Age ${testKids[0].age}`)).toBeVisible();
    await expect(page.getByText('current points')).toBeVisible();
  });

  test('should show zero stats for new child', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await page.reload();

    // Navigate to detail
    await page.getByText(testKids[0].name).first().click();
    await expect(page).toHaveURL(/\/children\/\d+/);

    // All 4 stat labels should be visible
    await expect(page.getByText('Tasks Completed')).toBeVisible();
    await expect(page.getByText('Total Points Earned')).toBeVisible();
    await expect(page.getByText('Rewards Redeemed')).toBeVisible();
    await expect(page.getByText('Points Spent')).toBeVisible();
  });

  test('should show empty activity', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await page.reload();

    await page.getByText(testKids[0].name).first().click();

    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('No activity yet')).toBeVisible();
  });

  test('should show activity after task completion', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Add kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add task and complete it
    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, testTasks[0]); // Make Bed, 5 pts
    await page.reload();
    await completeTaskOnTasksPage(page, testTasks[0].name, testKids[0].name);

    // Navigate to child detail
    await page.getByRole('link', { name: /Kids/i }).click();
    await page.reload();
    await page.getByText(testKids[0].name).first().click();

    // Should show completion activity
    await expect(page.getByText(`Completed: ${testTasks[0].name}`)).toBeVisible();
    await expect(page.getByText(`+${testTasks[0].point_value} points`)).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await page.reload();

    await page.getByText(testKids[0].name).first().click();
    await expect(page).toHaveURL(/\/children\/\d+/);

    // Click back button
    await page.getByRole('button', { name: '← Back to Dashboard' }).click();

    await expect(page).toHaveURL('/');
  });

  test('should disable reset points when zero', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await page.reload();

    await page.getByText(testKids[0].name).first().click();

    const resetButton = page.getByRole('button', { name: 'Reset Points' });
    await expect(resetButton).toBeDisabled();
  });

  test('should reset points to zero', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Add kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add task and complete it to earn points
    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, testTasks[0]); // Make Bed, 5 pts
    await page.reload();
    await completeTaskOnTasksPage(page, testTasks[0].name, testKids[0].name);

    // Navigate to child detail
    await page.getByRole('link', { name: /Kids/i }).click();
    await page.reload();
    await page.getByText(testKids[0].name).first().click();

    // Reset points button should be enabled
    const resetButton = page.getByRole('button', { name: 'Reset Points' });
    await expect(resetButton).toBeEnabled();

    // Accept confirm dialog and click reset
    page.on('dialog', dialog => dialog.accept());
    await resetButton.click();
    await page.waitForTimeout(1000);

    // Points should show 0
    await expect(page.getByText('0').first()).toBeVisible();

    // Activity should show Point Adjustment
    await expect(page.getByText('Point Adjustment')).toBeVisible();
  });
});
