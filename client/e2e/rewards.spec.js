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

    // Navigate to Kids page and click Redeem on the kid card
    await page.getByRole('link', { name: /Kids/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Redeem' }).click();

    // Modal should show the reward; click Redeem on the reward
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Small Treat')).toBeVisible();

    // Handle success alert
    page.once('dialog', dialog => dialog.accept());

    // Click the Redeem button for the reward in the modal
    await page.getByRole('dialog').getByRole('button', { name: 'Redeem' }).click();
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

    // Navigate to Kids page and click Redeem on the kid card
    await page.getByRole('link', { name: /Kids/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Redeem' }).click();

    // Modal should show - reward's Redeem button should be disabled
    await expect(page.getByRole('dialog')).toBeVisible();
    const rewardRedeem = page.getByRole('dialog').getByRole('button', { name: 'Redeem' });
    await expect(rewardRedeem).toBeDisabled();
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
