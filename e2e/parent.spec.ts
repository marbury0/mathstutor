import { test, expect } from '@playwright/test';

test.describe('Parent Dashboard & Progress Tracking', () => {
  test.beforeEach(async ({ request }) => {
    // Reset database for a clean state
    await request.post('/api/test/reset');
  });

  test('should display seeded curriculum topics and baseline mastery progress', async ({ page }) => {
    // 1. Onboard student as Year 5
    await page.goto('/');
    await page.getByPlaceholder('Your name...').fill('Emily');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Tutor Name step
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Pets Step
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Theme Step
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Emily!' })).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Parent Dashboard
    await page.goto('/parent');

    // 3. Verify that Year 5 curriculum topics are visible with 0% mastery
    await expect(page.getByText('Prime Numbers')).toBeVisible();
    await expect(page.getByText('Multiplying & Dividing by 10, 100, 1000')).toBeVisible();
    await expect(page.getByText('Angles')).toBeVisible();

    // Verify mastery starts at 0%
    const masteryValues = page.locator('span', { hasText: '0%' });
    await expect(masteryValues.first()).toBeVisible();

    // 4. Verify no sessions are recorded yet
    await expect(page.getByText('No sessions recorded yet.')).toBeVisible();
  });

  test('should log completed session and display it in recent sprints history', async ({ page }) => {
    // Install Playwright virtual clock BEFORE navigation to mock timers and date values
    await page.clock.install();

    // 1. Onboard student as Year 5 with test=true URL query
    await page.goto('/?test=true');
    await page.getByPlaceholder('Your name...').fill('Ethan');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Tutor Name step
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Pets Step
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Theme Step
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Ethan!' })).toBeVisible({ timeout: 15000 });

    // 2. Start the Sprint
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();
    await expect(page.locator('h2')).toContainText('What is 2 + 2?');

    // 3. Answer one question correctly to score 1 point
    await page.getByPlaceholder('Type your answer...').fill('4');
    await page.getByRole('button', { name: 'Submit 🚀' }).click();
    await expect(page.getByText('Score: 1')).toBeVisible();

    // 4. Fast-forward the virtual clock by 7 seconds to force the 5-second sprint timer to expire
    console.log('Fast-forwarding clock to end of session...');
    for (let i = 0; i < 7; i++) {
      await page.clock.runFor(1000);
    }

    // 5. Verify the "Time's Up!" end-screen appears
    await expect(page.getByText("Time's Up!")).toBeVisible();
    await expect(page.getByText('You scored 1 points!')).toBeVisible();

    // 6. Navigate back to Home/Dashboard (which reloads the dashboard state)
    await page.goto('/');

    // 7. Navigate to Parent Dashboard
    await page.goto('/parent');

    // 8. Verify the completed session is now logged in the list
    await expect(page.getByText('No sessions recorded yet.')).not.toBeVisible();
    await expect(page.getByText('1 pts')).toBeVisible();
    await expect(page.getByText('0m 5s duration')).toBeVisible();
  });

  test('should allow editing child profile name, age, and year group', async ({ page }) => {
    // 1. Onboard student as Year 5
    await page.goto('/');
    await page.getByPlaceholder('Your name...').fill('Ethan');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Tutor Name step
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Pets Step
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Theme Step
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Ethan!' })).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Parent Dashboard
    await page.goto('/parent');

    // 3. Edit profile to change name to 'Ethan Progressed', age to 10 (Year 6)
    await page.getByPlaceholder('Name...', { exact: true }).fill('Ethan Progressed');
    await page.locator('select').nth(3).selectOption('10');
    await page.locator('select').nth(4).selectOption('6');
    await page.getByRole('button', { name: 'Save Profile Changes' }).click();

    // 4. Verify success message
    await expect(page.getByText('Profile updated successfully! 🎉')).toBeVisible();

    // 5. Verify the header updates
    await expect(page.getByRole('heading', { name: 'Parent Dashboard: Ethan Progressed 📈' })).toBeVisible();

    // 6. Navigate back to Home and verify dashboard shows Year 6 details
    await page.getByRole('link', { name: 'Back to Tutor' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Ethan Progressed!' })).toBeVisible();
    await expect(page.getByText('Year 6 • Maths Bot is ready for your daily 20-minute maths sprint!')).toBeVisible();
  });

  test('should allow editing child interests (hobbies/pets) and custom maths topics', async ({ page }) => {
    // 1. Onboard student as Year 5
    await page.goto('/');
    await page.getByPlaceholder('Your name...').fill('Chloe');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Tutor Name step
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    
    // Add initial hobby
    await page.getByPlaceholder('e.g. Minecraft, Football...').fill('Painting');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();

    // Add initial pet
    await page.getByPlaceholder("Pet's name (e.g. Fluffy)").fill('Bella');
    await page.selectOption('select', 'Dog');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Pets Step

    await page.getByRole('button', { name: 'Next! ➡️' }).click(); // Theme Step
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Chloe!' })).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Parent Dashboard
    await page.goto('/parent');

    // 3. Add a new hobby
    await page.getByPlaceholder('e.g. Football, Coding...').fill('Tennis');
    await page.getByRole('button', { name: 'Add Hobby' }).click();
    await expect(page.getByText('Tennis')).toBeVisible();

    // 4. Remove the old hobby ('Painting')
    await page.locator('span:has-text("Painting")').getByRole('button', { name: '✕' }).click();
    await expect(page.locator('span:has-text("Painting")')).not.toBeVisible();

    // 5. Add a new pet
    await page.getByPlaceholder("Pet's name (e.g. Fluffy)").fill('Goldie');
    await page.selectOption('select:has-text("Dog")', 'Fish');
    await page.getByRole('button', { name: 'Add Pet' }).click();
    await expect(page.getByText('Goldie (Fish)')).toBeVisible();

    // 6. Remove the old pet ('Bella')
    await page.locator('span:has-text("Bella (Dog)")').getByRole('button', { name: '✕' }).click();
    await expect(page.locator('span:has-text("Bella (Dog)")')).not.toBeVisible();

    // Save profile changes
    await page.getByRole('button', { name: 'Save Profile Changes' }).click();
    await expect(page.getByText('Profile updated successfully! 🎉')).toBeVisible();

    // 7. Add a custom maths topic
    await page.getByPlaceholder('e.g. Roman Numerals, Long Division...').fill('Custom Division');
    await page.getByRole('button', { name: 'Add Topic' }).click();
    await page.getByText('Custom Division').first(); // wait...
    await expect(page.getByText('Custom Division')).toBeVisible();

    // 8. Delete a maths topic
    // Set up dialog handler to accept deletion
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure you want to remove "Custom Division"?');
      await dialog.accept();
    });

    // Click trash icon next to 'Custom Division'
    await page.locator('span', { hasText: 'Custom Division' }).getByRole('button', { name: '🗑️' }).click();
    await expect(page.getByText('Custom Division')).not.toBeVisible();
  });
});
