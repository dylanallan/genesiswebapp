import { test, expect } from '@playwright/test';

test('user can sign up, login, and access dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173'); // Change to your local or deployed URL

  // Sign up
  await page.click('text=Create your account');
  await page.fill('input[type="email"]', 'testuser+' + Date.now() + '@example.com');
  await page.fill('input[type="password"]', 'TestPassword123');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

  // Logout
  await page.click('button:has-text("Sign out")');
  await expect(page.locator('text=Sign in to your account')).toBeVisible();

  // Login
  await page.fill('input[type="email"]', 'testuser@example.com');
  await page.fill('input[type="password"]', 'TestPassword123');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
}); 