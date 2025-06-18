import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate through main menu items', async ({ page }) => {
    // Test navigation menu
    const menuItems = [
      { name: 'Features', path: '/features' },
      { name: 'Pricing', path: '/pricing' },
      { name: 'About', path: '/about' },
      { name: 'Contact', path: '/contact' },
    ];

    for (const item of menuItems) {
      await page.getByRole('link', { name: item.name }).click();
      await expect(page).toHaveURL(new RegExp(item.path));
      await expect(page.getByRole('heading', { name: new RegExp(item.name, 'i') })).toBeVisible();
    }
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible();
  });

  test('should maintain user session', async ({ page }) => {
    // Login first
    await page.getByRole('textbox', { name: /email/i }).fill(process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill(process.env.TEST_USER_PASSWORD || 'password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify dashboard access
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });
}); 