import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid, addTask, completeTaskOnTasksPage } from './helpers/auth.js';
import { testKids, testTasks } from './fixtures/testData.js';

test.describe('Tasks CRUD Operations', () => {
  test('should show empty state when no tasks exist', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    await expect(page.getByText(/No tasks yet/i)).toBeVisible();
  });

  test('should create task with all fields', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    const task = testTasks[0]; // Make Bed - daily, Chores
    await addTask(page, task);

    // Reload to verify persistence
    await page.reload();

    await expect(page.getByText(task.name)).toBeVisible();
    await expect(page.getByText(task.description)).toBeVisible();
    await expect(page.getByText(task.category)).toBeVisible();
    await expect(page.getByText('Daily')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    // Open modal
    await page.getByRole('button', { name: '+ Add Task' }).click();

    // Both name and point_value should have required attribute
    const nameInput = page.getByLabel('Task Name *');
    const pointInput = page.getByLabel('Point Value *');
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(pointInput).toHaveAttribute('required', '');

    // Try to submit empty form - modal should stay open
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should edit task', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    await addTask(page, testTasks[0]);
    await page.reload();

    // Click Edit
    await page.getByRole('button', { name: 'Edit' }).click();

    // Change name and points
    await page.locator('#edit_name').clear();
    await page.locator('#edit_name').fill('Clean Room');
    await page.locator('#edit_point_value').clear();
    await page.locator('#edit_point_value').fill('15');

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.waitForTimeout(500);

    // Reload to verify persistence
    await page.reload();

    await expect(page.getByText('Clean Room')).toBeVisible();
    await expect(page.getByText('15 pts')).toBeVisible();
  });

  test('should delete task', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    await addTask(page, testTasks[0]);
    await page.reload();

    await expect(page.getByText(testTasks[0].name)).toBeVisible();

    // Accept the confirm dialog
    page.on('dialog', dialog => dialog.accept());

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(500);

    // Reload to verify deletion
    await page.reload();

    await expect(page.getByText(testTasks[0].name)).not.toBeVisible();
    await expect(page.getByText(/No tasks yet/i)).toBeVisible();
  });

  test('should complete task for child', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Add a kid first
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Go to Tasks and add a task
    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, testTasks[0]);
    await page.reload();

    // Complete task for the kid
    await completeTaskOnTasksPage(page, testTasks[0].name, testKids[0].name);
  });

  test('should cancel task creation', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    // Open modal and fill data
    await page.getByRole('button', { name: '+ Add Task' }).click();
    await page.getByLabel('Task Name *').fill('Canceled Task');
    await page.getByLabel('Point Value *').fill('99');

    // Close modal
    await page.getByRole('button', { name: 'Close modal' }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Reload and verify task was not saved
    await page.reload();
    await expect(page.getByText('Canceled Task')).not.toBeVisible();
  });

  test('should display points summary per day', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    // Add a daily task (5 pts) and a weekdays task (3 pts)
    await addTask(page, testTasks[0]); // Make Bed - daily, 5 pts
    await addTask(page, testTasks[1]); // Brush Teeth - weekdays, 3 pts

    await page.reload();

    // Points summary should be visible
    await expect(page.getByText('Available Points Per Day')).toBeVisible();

    // Day columns should be visible
    await expect(page.getByText('Mon')).toBeVisible();
    await expect(page.getByText('Tue')).toBeVisible();
    await expect(page.getByText('Sat')).toBeVisible();
    await expect(page.getByText('Sun')).toBeVisible();
  });
});
