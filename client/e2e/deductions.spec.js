import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid, addTask } from './helpers/auth.js';
import { testKids } from './fixtures/testData.js';

/**
 * Helper: add a kid and a daily task so the task matrix (and Deduct button) is visible
 */
async function setupKidWithTask(page, kidData) {
  await page.getByRole('link', { name: /Kids/i }).click();
  await addKid(page, kidData);

  await page.getByRole('link', { name: /Tasks/i }).click();
  await addTask(page, { name: 'Make Bed', point_value: 5, repeat_schedule: 'daily' });

  await page.getByRole('link', { name: /Dashboard/i }).click();
}

/**
 * Helper: give a child some points by completing a daily task on the dashboard
 */
async function giveChildPoints(page, kidData, pointValue = 10) {
  await page.getByRole('link', { name: /Kids/i }).click();
  await addKid(page, kidData);

  await page.getByRole('link', { name: /Tasks/i }).click();
  await addTask(page, { name: 'Make Bed', point_value: pointValue, repeat_schedule: 'daily' });

  await page.getByRole('link', { name: /Dashboard/i }).click();

  const checkbox = page.getByRole('checkbox').first();
  await checkbox.click();
  await expect(checkbox).toBeChecked();
}

test.describe('Point Deductions', () => {
  test('should show Deduct button for each child on dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await setupKidWithTask(page, testKids[0]);

    await expect(page.getByRole('button', { name: 'Deduct' })).toBeVisible();
  });

  test('should open deduct modal when Deduct button clicked on dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await setupKidWithTask(page, testKids[0]); // Alice

    await page.getByRole('button', { name: 'Deduct' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(`Deduct from ${testKids[0].name}`)).toBeVisible();
  });

  test('should close deduct modal when Close button clicked', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await setupKidWithTask(page, testKids[0]);

    await page.getByRole('button', { name: 'Deduct' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should disable submit button when no amount entered', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await setupKidWithTask(page, testKids[0]);

    await page.getByRole('button', { name: 'Deduct' }).click();

    // Submit button should be disabled with no amount
    await expect(page.getByRole('button', { name: /Deduct.*points/i })).toBeDisabled();
  });

  test('should deduct points from child on dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await giveChildPoints(page, testKids[0], 10);

    // Verify 10 pts earned
    await expect(page.getByText('10 pts total')).toBeVisible();

    // Open deduct modal and deduct 3 points
    await page.getByRole('button', { name: 'Deduct' }).click();
    await page.getByLabel('Amount to deduct *').fill('3');
    await page.getByRole('button', { name: 'Deduct 3 points' }).click();

    // Points should update to 7
    await expect(page.getByText('7 pts total')).toBeVisible();
  });

  test('should accept an optional reason when deducting', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await giveChildPoints(page, testKids[0], 10);

    await page.getByRole('button', { name: 'Deduct' }).click();
    await page.getByLabel('Amount to deduct *').fill('2');
    await page.getByLabel('Reason (optional)').fill('Left room messy');
    await page.getByRole('button', { name: 'Deduct 2 points' }).click();

    // Modal closes and points update
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('8 pts total')).toBeVisible();
  });

  test('should show Deduct Points button on child detail page', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await page.reload();

    await page.getByText(testKids[0].name).first().click();
    await expect(page).toHaveURL(/\/children\/\d+/);

    await expect(page.getByRole('button', { name: 'Deduct Points' })).toBeVisible();
  });

  test('should open deduct modal from child detail page', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await page.reload();

    await page.getByText(testKids[0].name).first().click();
    await page.getByRole('button', { name: 'Deduct Points' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(`Deduct from ${testKids[0].name}`)).toBeVisible();
  });

  test('should deduct points from child detail page and update display', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await giveChildPoints(page, testKids[0], 10);

    // Navigate to child detail
    await page.getByRole('link', { name: /Kids/i }).click();
    await page.reload();
    await page.getByText(testKids[0].name).first().click();
    await expect(page).toHaveURL(/\/children\/\d+/);

    // Deduct 4 points
    await page.getByRole('button', { name: 'Deduct Points' }).click();
    await page.getByLabel('Amount to deduct *').fill('4');
    await page.getByRole('button', { name: 'Deduct 4 points' }).click();

    // Points display should update to 6
    const pointsSection = page.getByText('current points').locator('..');
    await expect(pointsSection).toContainText('6');
  });

  test('should show deduction in activity log on child detail page', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await giveChildPoints(page, testKids[0], 10);

    // Navigate to child detail
    await page.getByRole('link', { name: /Kids/i }).click();
    await page.reload();
    await page.getByText(testKids[0].name).first().click();

    // Deduct with a reason
    await page.getByRole('button', { name: 'Deduct Points' }).click();
    await page.getByLabel('Amount to deduct *').fill('5');
    await page.getByLabel('Reason (optional)').fill('Bad behaviour');
    await page.getByRole('button', { name: 'Deduct 5 points' }).click();

    // Activity log should show the adjustment
    await expect(page.getByText('Point Adjustment')).toBeVisible();
    await expect(page.getByText('-5 points')).toBeVisible();
    await expect(page.getByText('Bad behaviour')).toBeVisible();
  });

  test('should show multiple Deduct buttons for multiple children on dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);

    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);
    await addKid(page, testKids[1]);

    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, { name: 'Make Bed', point_value: 5, repeat_schedule: 'daily' });

    await page.getByRole('link', { name: /Dashboard/i }).click();

    const deductButtons = page.getByRole('button', { name: 'Deduct' });
    await expect(deductButtons).toHaveCount(2);
  });
});
