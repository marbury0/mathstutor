import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow & Form Validation', () => {
  test.beforeEach(async ({ request }) => {
    console.log('Resetting database...');
    const response = await request.post('/api/test/reset');
    expect(response.ok()).toBeTruthy();
  });

  test('should reject empty name input and show warning dialog', async ({ page }) => {
    await page.goto('/');

    // Set up dialog handler to check alert message
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Please type your name first!');
      await dialog.accept();
      dialogTriggered = true;
    });

    // Attempt to proceed without name input
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    expect(dialogTriggered).toBe(true);

    // Verify we are still on Step 1
    await expect(page.getByText('Which year are you in at school?')).not.toBeVisible();
  });

  test('should complete onboarding successfully with no pets and default year group', async ({ page }) => {
    await page.goto('/');

    // Step 1: Enter Name
    await page.getByPlaceholder('Your name...').fill('Alex');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();

    // Step 2: Tutor Name Selection (custom name "Mathy")
    await page.getByPlaceholder("Tutor's name (e.g. Maths Bot, Mathy)...").fill('Mathy');
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 3: Age selection (Select Age 7, which maps to Year 3)
    await page.getByRole('button', { name: '7', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 4: Hobbies (Add one hobby)
    await page.getByPlaceholder('e.g. Minecraft, Football...').fill('Chess');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Chess')).toBeVisible();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();

    // Step 5: Pets (Do not add any pets, proceed directly)
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 6: Visual Theme (accept default 'ocean' theme)
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 7: Confidence Picker
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();

    // Arrive at Dashboard
    await expect(page.getByRole('heading', { name: 'Welcome back, Alex!' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Year 3 • Mathy is ready for your daily 20-minute maths sprint!')).toBeVisible();
  });

  test('should complete onboarding with multiple hobbies and pets and seed Year 6 curriculum', async ({ page }) => {
    await page.goto('/');

    // Step 1: Name
    await page.getByPlaceholder('Your name...').fill('Sophia');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();

    // Step 2: Tutor Name Selection (default name "Maths Bot")
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 3: Age selection (Select Age 10, which maps to Year 6)
    await page.getByRole('button', { name: '10', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 4: Hobbies (Add multiple)
    await page.getByPlaceholder('e.g. Minecraft, Football...').fill('Minecraft');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('e.g. Minecraft, Football...').fill('Gymnastics');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Minecraft')).toBeVisible();
    await expect(page.getByText('Gymnastics')).toBeVisible();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();

    // Step 5: Pets (Add multiple pets with different types)
    await page.getByPlaceholder("Pet's name (e.g. Fluffy)").fill('Whiskers');
    await page.selectOption('select', 'Cat');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Whiskers (Cat)')).toBeVisible();

    await page.getByPlaceholder("Pet's name (e.g. Fluffy)").fill('Goldie');
    await page.selectOption('select', 'Fish');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Goldie (Fish)')).toBeVisible();

    // Step 5: Pets
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 6: Visual Theme (accept default 'ocean' theme)
    await page.getByRole('button', { name: 'Next! ➡️' }).click();

    // Step 7: Confidence Picker
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();

    // Verify Dashboard displays correct info
    await expect(page.getByRole('heading', { name: 'Welcome back, Sophia!' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Year 6 • Maths Bot is ready for your daily 20-minute maths sprint!')).toBeVisible();
  });
});
