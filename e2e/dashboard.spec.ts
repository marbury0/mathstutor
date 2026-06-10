import { test, expect } from '@playwright/test';

test.describe('Student Dashboard & Navigation', () => {
  test.beforeEach(async ({ request, page }) => {
    // Reset database and perform onboarding first to have a valid session
    await request.post('/api/test/reset');

    await page.goto('/');
    await page.getByPlaceholder('Your name...').fill('Bobby');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: '8', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Bobby! 🌟' })).toBeVisible({ timeout: 15000 });
  });

  test('should display correct student profile in dashboard header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back, Bobby! 🌟' })).toBeVisible();
    await expect(page.getByText('Year 4 • Ready for your daily 20-minute math sprint?')).toBeVisible();
    await expect(page.getByText('🔥 0 Day Streak')).toBeVisible();
  });

  test('should support navigation between student dashboard and parent dashboard', async ({ page }) => {
    // Click View Stats button
    await page.getByRole('link', { name: 'View Stats 📊' }).click();

    // Verify we arrived at Parent Dashboard
    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByRole('heading', { name: 'Parent Dashboard: Bobby 📈' })).toBeVisible();

    // Click Back to Tutor
    await page.getByRole('link', { name: 'Back to Tutor' }).click();

    // Verify we are back on the main student dashboard
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Welcome back, Bobby! 🌟' })).toBeVisible();
  });

  test('should navigate to parent dashboard via footer parental link', async ({ page }) => {
    // Click footer parental controls link
    await page.getByRole('link', { name: 'Parental Controls & Dashboard' }).click();

    // Verify URL
    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByRole('heading', { name: 'Parent Dashboard: Bobby 📈' })).toBeVisible();
  });
});
