import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid, addTask, addReward, completeTaskOnTasksPage } from './helpers/auth.js';
import { testKids, testTasks, testRewards } from './fixtures/testData.js';

test.describe('Rewards CRUD Operations', () => {
  test('should show empty state when no rewards exist', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Rewards/i }).click();

    await expect(page.getByText(/No rewards yet/i)).toBeVisible();
  });

  test('should create reward with all fields', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Rewards/i }).click();

    const reward = testRewards[0]; // Ice Cream
    await addReward(page, reward);

    // Reload to verify persistence
    await page.reload();

    await expect(page.getByText(reward.name)).toBeVisible();
    await expect(page.getByText(reward.description)).toBeVisible();
    await expect(page.getByText(`${reward.cost} pts`)).toBeVisible();
    await expect(page.getByText(reward.category)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Rewards/i }).click();

    // Open modal
    await page.getByRole('button', { name: '+ Add Reward' }).click();

    // Both name and cost should have required attribute
    const nameInput = page.getByLabel('Reward Name *');
    const costInput = page.getByLabel('Point Cost *');
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(costInput).toHaveAttribute('required', '');
    await expect(costInput).toHaveAttribute('min', '1');

    // Try to submit empty form - modal should stay open
    await page.getByRole('button', { name: 'Add Reward', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should edit reward', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Rewards/i }).click();

    await addReward(page, testRewards[0]);
    await page.reload();

    // Click Edit
    await page.getByRole('button', { name: 'Edit' }).click();

    // Change name and cost using hyphenated IDs
    await page.locator('#edit-name').clear();
    await page.locator('#edit-name').fill('Gelato');
    await page.locator('#edit-point_cost').clear();
    await page.locator('#edit-point_cost').fill('75');

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.waitForTimeout(500);

    // Reload to verify persistence
    await page.reload();

    await expect(page.getByText('Gelato')).toBeVisible();
    await expect(page.getByText('75 pts')).toBeVisible();
  });

  test('should delete reward', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Rewards/i }).click();

    await addReward(page, testRewards[0]);
    await page.reload();

    await expect(page.getByText(testRewards[0].name)).toBeVisible();

    // Accept the confirm dialog
    page.on('dialog', dialog => dialog.accept());

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(500);

    // Reload to verify deletion
    await page.reload();

    await expect(page.getByText(testRewards[0].name)).not.toBeVisible();
    await expect(page.getByText(/No rewards yet/i)).toBeVisible();
  });

  test('should redeem reward for kid with points', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Setup: add kid
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add task and complete it to give kid points
    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, testTasks[0]); // 5 pts
    await page.reload();
    await completeTaskOnTasksPage(page, testTasks[0].name, testKids[0].name);

    // Add a cheap reward (cost <= earned points)
    await page.getByRole('link', { name: /Rewards/i }).click();
    await addReward(page, { name: 'Small Treat', cost: 5 });
    await page.reload();

    // Click Redeem
    await page.getByRole('button', { name: 'Redeem' }).click();

    // Select the kid (checkbox inside label)
    const childLabel = page.locator('label').filter({ hasText: testKids[0].name });
    await childLabel.locator('input[type="checkbox"]').check();

    // Handle success alert
    page.once('dialog', dialog => dialog.accept());

    await page.getByRole('button', { name: 'Redeem Reward' }).click();
    await page.waitForTimeout(500);
  });

  test('should disable redeem for insufficient points', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Setup: add kid (0 points)
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, testKids[0]);

    // Add an expensive reward
    await page.getByRole('link', { name: /Rewards/i }).click();
    await addReward(page, testRewards[1]); // Movie Night - 100 pts
    await page.reload();

    // Click Redeem
    await page.getByRole('button', { name: 'Redeem' }).click();

    // Checkbox should be disabled since kid has 0 points
    const childLabel = page.locator('label').filter({ hasText: testKids[0].name });
    const checkbox = childLabel.locator('input[type="checkbox"]');
    await expect(checkbox).toBeDisabled();

    // "(need N)" text should be shown
    await expect(childLabel.getByText(/\(need \d+\)/)).toBeVisible();
  });

  test('should cancel reward creation', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Rewards/i }).click();

    // Open modal and fill data
    await page.getByRole('button', { name: '+ Add Reward' }).click();
    await page.getByLabel('Reward Name *').fill('Canceled Reward');
    await page.getByLabel('Point Cost *').fill('999');

    // Close modal
    await page.getByRole('button', { name: 'Close modal' }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Reload and verify reward was not saved
    await page.reload();
    await expect(page.getByText('Canceled Reward')).not.toBeVisible();
  });
});
