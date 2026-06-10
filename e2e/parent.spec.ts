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
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Emily! 🌟' })).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Parent Dashboard
    await page.goto('/parent');

    // 3. Verify that Year 5 curriculum topics are visible with 0% mastery
    await expect(page.getByText('Prime Numbers')).toBeVisible();
    await expect(page.getByText('Multiplying Decimals')).toBeVisible();
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
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Ethan! 🌟' })).toBeVisible({ timeout: 15000 });

    // 2. Start the Sprint
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();
    await expect(page.locator('h2')).toContainText('What is 2 + 2?');

    // 3. Answer one question correctly to score 1 point
    await page.getByPlaceholder('Type your answer...').fill('4');
    await page.getByRole('button', { name: 'Submit 🚀' }).click();
    await expect(page.getByText('⭐ Score: 1')).toBeVisible();

    // 4. Fast-forward the virtual clock by 7 seconds to force the 5-second sprint timer to expire
    console.log('Fast-forwarding clock to end of session...');
    for (let i = 0; i < 7; i++) {
      await page.clock.runFor(1000);
    }

    // 5. Verify the "Time's Up!" end-screen appears
    await expect(page.getByText("Time's Up! 🏁")).toBeVisible();
    await expect(page.getByText('You scored 1 points!')).toBeVisible();

    // 6. Navigate back to Home/Dashboard (which reloads the dashboard state)
    await page.goto('/');

    // 7. Navigate to Parent Dashboard
    await page.goto('/parent');

    // 8. Verify the completed session is now logged in the list
    await expect(page.getByText('No sessions recorded yet.')).not.toBeVisible();
    await expect(page.getByText('1 pts')).toBeVisible();
    await expect(page.getByText('0 mins')).toBeVisible(); // 5 seconds rounds down to 0 minutes
  });
});
