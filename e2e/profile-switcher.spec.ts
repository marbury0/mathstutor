import { test, expect } from '@playwright/test';

test.describe('Multi-Profile Switcher & User isolation', () => {
  test.beforeEach(async ({ request }) => {
    // Reset database to a clean state
    await request.post('/api/test/reset');
  });

  test('should register multiple students, switch between them, and show user-specific parent dashboards', async ({ page }) => {
    // 1. Onboard first student: Emily (Age 9 -> Year 5)
    await page.goto('/');
    await page.getByPlaceholder('Your name...').fill('Emily');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();

    // Verify Emily's dashboard loads
    await expect(page.getByRole('heading', { name: 'Welcome back, Emily! 🌟' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Year 5 • Ready for your daily 20-minute math sprint?')).toBeVisible();

    // 2. Select "Add Profile" to onboard second student: Bobby (Age 8 -> Year 4)
    await page.selectOption('select', 'new');

    // Onboarding form should be visible again
    await page.getByPlaceholder('Your name...').fill('Bobby');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: '8', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();

    // Verify Bobby's dashboard loads
    await expect(page.getByRole('heading', { name: 'Welcome back, Bobby! 🌟' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Year 4 • Ready for your daily 20-minute math sprint?')).toBeVisible();

    // 3. Switch back to Emily via the profile dropdown
    await page.selectOption('select', { label: 'Emily (Yr 5)' });

    // Verify we are back on Emily's dashboard
    await expect(page.getByRole('heading', { name: 'Welcome back, Emily! 🌟' })).toBeVisible();
    await expect(page.getByText('Year 5 • Ready for your daily 20-minute math sprint?')).toBeVisible();

    // 4. View Emily's Parent Dashboard
    await page.getByRole('link', { name: 'View Stats 📊' }).click();
    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByRole('heading', { name: 'Parent Dashboard: Emily 📈' })).toBeVisible();

    // Go back to Tutor
    await page.getByRole('link', { name: 'Back to Tutor' }).click();

    // 5. Switch back to Bobby
    await page.selectOption('select', { label: 'Bobby (Yr 4)' });
    await expect(page.getByRole('heading', { name: 'Welcome back, Bobby! 🌟' })).toBeVisible();

    // View Bobby's Parent Dashboard
    await page.getByRole('link', { name: 'View Stats 📊' }).click();
    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByRole('heading', { name: 'Parent Dashboard: Bobby 📈' })).toBeVisible();
  });
});
