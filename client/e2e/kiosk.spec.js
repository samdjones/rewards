import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, addKid, addTask } from './helpers/auth.js';

test.describe('Kiosk Display', () => {
  test('should show pairing code on kiosk page', async ({ page }) => {
    await page.goto('/kiosk');

    // Should show pairing view with a 6-character code
    await expect(page.getByText('Kiosk Display')).toBeVisible();
    await expect(page.getByText(/Enter this code in Family Settings/i)).toBeVisible();

    // Should have 6 code characters
    const codeChars = page.locator('[class*="codeChar"]');
    await expect(codeChars).toHaveCount(6);

    // Should show countdown timer
    await expect(page.getByText(/Code expires in/i)).toBeVisible();
  });

  test('should not show navigation on kiosk page', async ({ page }) => {
    await page.goto('/kiosk');

    // Layout header/nav/footer should not be visible
    await expect(page.getByText('Kids Reward Tracker')).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Dashboard/i })).not.toBeVisible();
  });

  test('should pair kiosk and show dashboard', async ({ page, browser }) => {
    // Set up admin with family, kid, and task
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Kids/i }).click();
    await addKid(page, { name: 'Kiosk Kid' });
    await page.getByRole('link', { name: /Tasks/i }).click();
    await addTask(page, { name: 'Kiosk Task', point_value: 10, repeat_schedule: 'daily' });

    // Open kiosk page in a separate browser context (simulates private window)
    const kioskContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const kioskPage = await kioskContext.newPage();
    const baseURL = page.url().split('/')[0] + '//' + page.url().split('/')[2];
    await kioskPage.goto(baseURL + '/kiosk');

    // Wait for pairing code to appear
    await expect(kioskPage.getByText('Kiosk Display')).toBeVisible();
    const codeChars = kioskPage.locator('[class*="codeChar"]');
    await expect(codeChars).toHaveCount(6);

    // Read the 6-character code
    const chars = await codeChars.allTextContents();
    const pairingCode = chars.join('');
    expect(pairingCode).toHaveLength(6);

    // Admin navigates to Family Settings and enters the code
    await page.getByRole('link', { name: /Family/i }).click();
    await expect(page.getByText('Kiosk Display')).toBeVisible();

    const codeInput = page.locator('input[placeholder="Enter pairing code"]');
    await codeInput.fill(pairingCode);
    await page.getByRole('button', { name: 'Pair' }).click();

    // Wait for kiosk to detect pairing and show dashboard
    // Kiosk polls every 3 seconds so wait up to 10 seconds
    await expect(kioskPage.getByText('Kiosk Kid')).toBeVisible({ timeout: 10000 });
    await expect(kioskPage.getByText('Kiosk Task')).toBeVisible();

    // Family settings should show paired display
    await expect(page.getByText('Paired Displays')).toBeVisible({ timeout: 5000 });

    await kioskContext.close();
  });

  test('should show error for invalid pairing code', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.getByRole('link', { name: /Family/i }).click();

    const codeInput = page.locator('input[placeholder="Enter pairing code"]');
    await codeInput.fill('XXXXXX');
    await page.getByRole('button', { name: 'Pair' }).click();

    // Should show error
    await expect(page.getByText(/Invalid or expired/i)).toBeVisible({ timeout: 5000 });
  });

  test('should remove paired kiosk session', async ({ page, browser }) => {
    // Set up admin with family
    await setupAuthenticatedUser(page);

    // Open kiosk and get code
    const kioskContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const kioskPage = await kioskContext.newPage();
    const baseURL = page.url().split('/')[0] + '//' + page.url().split('/')[2];
    await kioskPage.goto(baseURL + '/kiosk');

    await expect(kioskPage.getByText('Kiosk Display')).toBeVisible();
    const codeChars = kioskPage.locator('[class*="codeChar"]');
    await expect(codeChars).toHaveCount(6);
    const chars = await codeChars.allTextContents();
    const pairingCode = chars.join('');

    // Pair the kiosk
    await page.getByRole('link', { name: /Family/i }).click();
    const codeInput = page.locator('input[placeholder="Enter pairing code"]');
    await codeInput.fill(pairingCode);
    await page.getByRole('button', { name: 'Pair' }).click();

    // Wait for paired display to show
    await expect(page.getByText('Paired Displays')).toBeVisible({ timeout: 5000 });

    // Remove the kiosk session
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Remove' }).click();

    // Paired displays section should disappear
    await expect(page.getByText('Paired Displays')).not.toBeVisible({ timeout: 5000 });

    await kioskContext.close();
  });
});
