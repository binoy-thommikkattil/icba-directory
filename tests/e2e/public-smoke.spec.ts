import { expect, test } from '@playwright/test';

test.describe('public browser journeys', () => {
  test('starts at login and exposes email signup entry points', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'ICBA Directory' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In with Email' })).toBeVisible();

    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByPlaceholder('e.g. John Mark')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('navigates the public visitor path from home to visit and beliefs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /welcome to/i })).toBeVisible();

    await page.getByRole('link', { name: 'Plan a Visit' }).click();
    await expect(page.getByRole('heading', { name: 'Plan Your Visit' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weekly Schedule' })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: 'What We Believe' }).click();
    await expect(page.getByRole('heading', { name: 'Statement of Faith' })).toBeVisible();
  });
});
