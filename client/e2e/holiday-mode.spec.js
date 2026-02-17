import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid, addTask } from './helpers/auth.js';
import { testKids } from './fixtures/testData.js';

test.describe('Holiday Mode', () => {
  test('should show holiday mode toggle on dashboard for admin', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await expect(page.locator('[role="switch"]')).toBeVisible();
    await expect(page.getByText('Holiday Mode')).toBeVisible();
  });

  test('should show holiday mode section in family settings for admin', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    await expect(page.getByText('Holiday Mode')).toBeVisible();
    await expect(page.locator('[role="switch"]')).toBeVisible();
  });

  test('should toggle holiday mode on and off from dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);

    const toggle = page.locator('[role="switch"]');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('should toggle holiday mode from family settings', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    const toggle = page.locator('[role="switch"]');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('should persist holiday mode state across page reload', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    await page.locator('[role="switch"]').click();
    await expect(page.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');

    await page.reload();
    await expect(page.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  });

  test('should sync holiday mode state between dashboard and family settings', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Enable from dashboard
    await page.locator('[role="switch"]').click();
    await expect(page.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');

    // Navigate to family settings - toggle should also be on
    await page.getByRole('link', { name: /Family/i }).click();
    await expect(page.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  });

  test('should hide holiday tasks in normal mode on dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, { name: 'Holiday Cleanup', point_value: 5, repeat_schedule: 'holidays' });

    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Holiday task should NOT appear in normal mode
    await expect(page.getByText('Holiday Cleanup')).not.toBeVisible();
  });

  test('should show holiday tasks when holiday mode is enabled', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, { name: 'Holiday Cleanup', point_value: 5, repeat_schedule: 'holidays' });

    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Enable holiday mode
    await page.locator('[role="switch"]').click();

    // Holiday task should now appear
    await expect(page.getByText('Holiday Cleanup')).toBeVisible();
  });

  test('should hide daily task and show holiday task when holiday mode toggled', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, { name: 'Daily Chore', point_value: 5, repeat_schedule: 'daily' });
    await addTask(page, { name: 'Holiday Fun', point_value: 10, repeat_schedule: 'holidays' });

    await page.getByRole('link', { name: /Dashboard/i }).click();

    // Normal mode: daily visible, holiday not visible
    await expect(page.getByText('Daily Chore')).toBeVisible();
    await expect(page.getByText('Holiday Fun')).not.toBeVisible();

    // Enable holiday mode
    await page.locator('[role="switch"]').click();

    // Holiday mode: daily still visible, holiday now visible too
    await expect(page.getByText('Daily Chore')).toBeVisible();
    await expect(page.getByText('Holiday Fun')).toBeVisible();
  });

  test('should show Holidays option in task repeat schedule dropdown', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    await page.getByRole('button', { name: '+ Add Task' }).click();

    const scheduleSelect = page.getByLabel('Repeat Schedule');
    const holidayOption = scheduleSelect.locator('option[value="holidays"]');
    await expect(holidayOption).toBeAttached();
    await expect(holidayOption).toHaveText('Holidays only');
  });

  test('should display Holidays badge on tasks with holiday schedule', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Tasks/i }).click();

    await addTask(page, { name: 'Holiday Task', point_value: 5, repeat_schedule: 'holidays' });
    await page.reload();

    await expect(page.getByText('Holidays')).toBeVisible();
  });
});
