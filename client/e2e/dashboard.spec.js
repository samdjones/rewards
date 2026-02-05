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
    await addKid(page, testKids[0]);

    // Reload to see updated dashboard
    await page.reload();

    // Should show message about adding tasks
    await expect(page.getByText(/Add.*task|No tasks|Create.*first task/i)).toBeVisible();
  });

  test('should display task matrix with kids and tasks', async ({ page }) => {
    // Setup user with family
    await setupAuthenticatedUser(page);

    // Add kids
    await addKid(page, testKids[0]);
    await addKid(page, testKids[1]);

    // Add tasks (navigate to tasks page)
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByRole('button', { name: /Add|Create/i }).click();

    // Go back to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Should show task matrix
    await expect(page.getByText('Make Bed')).toBeVisible();
    await expect(page.getByText(testKids[0].name)).toBeVisible();
    await expect(page.getByText(testKids[1].name)).toBeVisible();
  });

  test('should update points when checking task', async ({ page }) => {
    // Setup user with family, kid, and task
    await setupAuthenticatedUser(page);
    const kid = await addKid(page, testKids[0]);

    // Add task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByRole('button', { name: /Add|Create/i }).click();

    // Go to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Get initial points
    const initialPoints = await page.getByText(/\d+\s*points?/i).textContent();
    const pointsMatch = initialPoints.match(/(\d+)/);
    const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;

    // Check task
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.check();

    // Wait for update
    await page.waitForTimeout(1000);

    // Points should increase
    await expect(page.getByText(new RegExp(`${points + kid.pointsPerTask}\\s*points?`, 'i'))).toBeVisible();
  });

  test('should decrease points when unchecking task', async ({ page }) => {
    // Setup user with family, kid, and task
    await setupAuthenticatedUser(page);
    const kid = await addKid(page, testKids[0]);

    // Add task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByRole('button', { name: /Add|Create/i }).click();

    // Go to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Check task first
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.check();
    await page.waitForTimeout(1000);

    // Get points after checking
    const checkedPoints = await page.getByText(/\d+\s*points?/i).textContent();
    const pointsMatch = checkedPoints.match(/(\d+)/);
    const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;

    // Uncheck task
    await checkbox.uncheck();
    await page.waitForTimeout(1000);

    // Points should decrease
    await expect(page.getByText(new RegExp(`${points - kid.pointsPerTask}\\s*points?`, 'i'))).toBeVisible();
  });

  test('should filter tasks by date (today)', async ({ page }) => {
    // Setup user with family, kid, and task
    await setupAuthenticatedUser(page);
    await addKid(page, testKids[0]);

    // Add task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByRole('button', { name: /Add|Create/i }).click();

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
    await addKid(page, testKids[0]);

    // Add task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await page.getByRole('button', { name: /Add Task/i }).click();
    await page.getByLabel(/Task name|Name/i).fill('Make Bed');
    await page.getByRole('button', { name: /Add|Create/i }).click();

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
