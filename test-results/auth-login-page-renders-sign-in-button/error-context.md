# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> login page renders sign-in button
- Location: tests\auth.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Sign in with Google')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Sign in with Google')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('login page renders sign-in button', async ({ page }) => {
  4  |   await page.goto('/login');
> 5  |   await expect(page.locator('text=Sign in with Google')).toBeVisible();
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  6  |   await expect(page.locator('text=DriftScout')).toBeVisible();
  7  | });
  8  | 
  9  | test('unauthenticated user is redirected to login', async ({ page }) => {
  10 |   await page.goto('/');
  11 |   await expect(page).toHaveURL(/\/login/);
  12 | });
  13 | 
```