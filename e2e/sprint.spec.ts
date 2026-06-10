import { test, expect } from '@playwright/test';

test.describe('Sprint Adaptive Learning Loop', () => {
  test.beforeEach(async ({ request, page }) => {
    // Reset database and perform onboarding to get a clean dashboard session
    await request.post('/api/test/reset');
    
    await page.goto('/');
    await page.getByPlaceholder('Your name...').fill('Danny');
    await page.getByRole('button', { name: 'Next! 🚀' }).click();
    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'Almost done! ➡️' }).click();
    await page.getByRole('button', { name: 'Next! ➡️' }).click();
    await page.getByRole('button', { name: 'I do okay! 👍' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back, Danny! 🌟' })).toBeVisible({ timeout: 15000 });
  });

  test('should start sprint with 20-minute timer and correct UI header details', async ({ page }) => {
    // Click Start Sprint
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();

    // Verify timer starts at 20 minutes (20:00 or 19:59)
    const timerText = page.locator('#sprint-timer');
    await expect(timerText).toBeVisible();
    const timerValue = await timerText.innerText();
    expect(timerValue).toMatch(/⏱️ (20:00|19:\d{2})/);

    // Verify score starts at 0
    await expect(page.getByText('⭐ Score: 0')).toBeVisible();

    // Verify question is loaded
    await expect(page.locator('h2')).toContainText('What is 2 + 2?');
  });

  test('should show hint on first incorrect answer and toggle submit button text', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();
    
    // Type incorrect answer
    await page.getByPlaceholder('Type your answer...').fill('999');
    await page.getByRole('button', { name: 'Submit 🚀' }).click();

    // Verify hint container is shown with the friendly AI hint
    const hintCard = page.locator('text=💡 Hint:');
    await expect(hintCard).toBeVisible();
    await expect(hintCard).toContainText('think about what you get when you put 2 and 2 together');

    // Verify button text changes to "Try Again! 🔄"
    await expect(page.getByRole('button', { name: 'Try Again! 🔄' })).toBeVisible();
  });

  test('should show math explanation card on second consecutive incorrect answer', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();
    
    // Attempt 1: Wrong Answer
    await page.getByPlaceholder('Type your answer...').fill('999');
    await page.getByRole('button', { name: 'Submit 🚀' }).click();
    await expect(page.locator('text=💡 Hint:')).toBeVisible();

    // Attempt 2: Wrong Answer again
    await page.getByPlaceholder('Type your answer...').fill('888');
    await page.getByRole('button', { name: 'Try Again! 🔄' }).click();

    // Verify explanation card is rendered showing the solution
    const explanationCard = page.locator('text=Don\'t worry! Here\'s how to do it:');
    await expect(explanationCard).toBeVisible();
    await expect(page.getByText('Since 2 + 2 equals 4, the answer is 4.')).toBeVisible();

    // Verify next progression action button is visible
    await expect(page.getByRole('button', { name: 'Got it! Next question ➡️' })).toBeVisible();
  });

  test('should reset attempt states, clear input, and load next question on explanation acceptance', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();
    
    // Complete two wrong answers
    await page.getByPlaceholder('Type your answer...').fill('111');
    await page.getByRole('button', { name: 'Submit 🚀' }).click();
    await page.getByPlaceholder('Type your answer...').fill('222');
    await page.getByRole('button', { name: 'Try Again! 🔄' }).click();

    // Click Got It
    await page.getByRole('button', { name: 'Got it! Next question ➡️' }).click();

    // Verify hint and explanation are gone
    await expect(page.locator('text=💡 Hint:')).not.toBeVisible();
    await expect(page.locator('text=Don\'t worry! Here\'s how to do it:')).not.toBeVisible();

    // Verify input is empty
    await expect(page.getByPlaceholder('Type your answer...')).toHaveValue('');

    // Verify submit button is back to default
    await expect(page.getByRole('button', { name: 'Submit 🚀' })).toBeVisible();
  });

  test('should immediately load next question and increment score on correct answer', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();

    // Input correct answer (4)
    await page.getByPlaceholder('Type your answer...').fill('4');
    await page.getByRole('button', { name: 'Submit 🚀' }).click();

    // Verify score increases
    await expect(page.getByText('⭐ Score: 1')).toBeVisible();

    // Verify input is cleared for next question
    await expect(page.getByPlaceholder('Type your answer...')).toHaveValue('');
  });

  test('should allow a correct answer on second attempt after receiving a hint', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Sprint! 🚀' }).click();

    // 1st Attempt: Wrong Answer
    await page.getByPlaceholder('Type your answer...').fill('10');
    await page.getByRole('button', { name: 'Submit 🚀' }).click();
    await expect(page.locator('text=💡 Hint:')).toBeVisible();

    // 2nd Attempt: Correct Answer (4)
    await page.getByPlaceholder('Type your answer...').fill('4');
    await page.getByRole('button', { name: 'Try Again! 🔄' }).click();

    // Verify explanation does not show (because they eventually got it right)
    await expect(page.locator('text=Don\'t worry! Here\'s how to do it:')).not.toBeVisible();

    // Verify score increases and next question loads
    await expect(page.getByText('⭐ Score: 1')).toBeVisible();
    await expect(page.getByPlaceholder('Type your answer...')).toHaveValue('');
  });
});
