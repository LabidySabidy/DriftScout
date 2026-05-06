# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> unauthenticated user is redirected to login
- Location: tests\auth.spec.ts:9:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/login/
Received string:  "http://localhost:5173/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:5173/"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('login page renders sign-in button', async ({ page }) => {
  4  |   await page.goto('/login');
  5  |   await expect(page.locator('text=Sign in with Google')).toBeVisible();
  6  |   await expect(page.locator('text=DriftScout')).toBeVisible();
  7  | });
  8  | 
  9  | test('unauthenticated user is redirected to login', async ({ page }) => {
  10 |   await page.goto('/');
> 11 |   await expect(page).toHaveURL(/\/login/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  12 | });
  13 | 
```