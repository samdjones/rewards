import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid } from './helpers/auth.js';
import { testKids } from './fixtures/testData.js';

test.describe('Dashboard', () => {
  test('should show empty state when no kids exist', async ({ page }) => {
    // Setup user with family but no kids
    await setupAuthenticatedUser(page);

    // Should show message about adding kids
    await expect(page.getByText(/Add.*kid|No kids|Get started.*adding/i)).toBeVisible();
  });

  test('should show empty state when no tasks exist', async ({ page }) => {
    // Setup user with family and one kid
    await setupAuthenticatedUser(page);

    // Navigate to Kids page to add a kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Navigate back to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Reload to see updated dashboard
    await page.reload();

    // Should show message about adding tasks
    await expect(page.getByText(/Add.*task|No tasks|Create.*first task/i)).toBeVisible();
  });

  test('should display task matrix with kids and tasks', async ({ page }) => {
    // Setup user with family
    await setupAuthenticatedUser(page);

    // Navigate to Kids page to add kids
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await addKid(page, testKids[1]);

    // Add tasks (navigate to tasks page)
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /\+ Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByLabel(/Point Value/i).fill('5');
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Go back to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Should show task matrix
    await expect(page.getByText('Make Bed')).toBeVisible();
    await expect(page.getByText(testKids[0].name)).toBeVisible();
    await expect(page.getByText(testKids[1].name)).toBeVisible();
  });

  test('should update points when checking task', async ({ page }) => {
    const taskPointValue = 5;

    // Setup user with family, kid, and task
    await setupAuthenticatedUser(page);

    // Navigate to Kids page to add a kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /\+ Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByLabel(/Point Value/i).fill(taskPointValue.toString());
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Go to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Check task
    const checkbox = page.getByRole('checkbox').first();
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();

    // Wait for API update and points to reflect
    await expect(checkbox).toBeChecked();
    await expect(page.getByText(new RegExp(`${taskPointValue}\\s*pts`, 'i')).first()).toBeVisible();
  });

  test('should decrease points when unchecking task', async ({ page }) => {
    const taskPointValue = 5;

    // Setup user with family, kid, and task
    await setupAuthenticatedUser(page);

    // Navigate to Kids page to add a kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /\+ Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByLabel(/Point Value/i).fill(taskPointValue.toString());
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Go to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Check task first
    const checkbox = page.getByRole('checkbox').first();
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();

    // Wait for check to complete
    await expect(checkbox).toBeChecked();
    await expect(page.getByText(new RegExp(`${taskPointValue}\\s*pts`, 'i')).first()).toBeVisible();

    // Uncheck task
    await checkbox.click();

    // Wait for uncheck to complete
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByText(/\b0\s*pts/i).first()).toBeVisible();
  });

  test('should filter tasks by date (today)', async ({ page }) => {
    // Setup user with family, kid, and task
    await setupAuthenticatedUser(page);

    // Navigate to Kids page to add a kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /\+ Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByLabel(/Point Value/i).fill('5');
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Go to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Select today (should be default)
    const todayButton = page.getByRole('button', { name: /Today/i });
    if (await todayButton.isVisible()) {
      await todayButton.click();
    }

    // Task should be visible
    await expect(page.getByText('Make Bed')).toBeVisible();
  });

  test('should filter tasks by date (yesterday)', async ({ page }) => {
    // Setup user with family, kid, and task
    await setupAuthenticatedUser(page);

    // Navigate to Kids page to add a kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add task (one-time, so should only show on today)
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /\+ Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByLabel(/Point Value/i).fill('5');
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();

    // Go to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Select yesterday
    const yesterdayButton = page.getByRole('button', { name: /Yesterday/i });
    if (await yesterdayButton.isVisible()) {
      await yesterdayButton.click();

      // Tasks from yesterday should be empty (no completed tasks)
      await expect(page.getByText(/No tasks|Add.*task/i)).toBeVisible();
    }
  });

  test('should navigate to kids page from dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Click on Kids navigation link
    await page.getByRole('link', { name: /Kids/i }).click();

    // Should be on kids page
    await expect(page).toHaveURL(/\/kids/);
  });

  test('should navigate to tasks page from dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Click on Tasks navigation link
    await page.getByRole('link', { name: /Tasks/i }).click();

    // Should be on tasks page
    await expect(page).toHaveURL(/\/tasks/);
  });
});
