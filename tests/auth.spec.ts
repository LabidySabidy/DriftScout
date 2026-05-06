import { test, expect } from '@playwright/test';

test('login page renders sign-in button', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('text=Sign in with Google')).toBeVisible();
  await expect(page.locator('text=DriftScout')).toBeVisible();
});

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
