import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Perform login
  await page.fill('[data-testid="username-input"]', process.env.TEST_USER_USERNAME || '10xadmin');
  await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD || '10xpassword');
  await page.click('[data-testid="login-button"]');

  // Wait for successful login
  await page.waitForURL('/home');

  // Save signed-in state
  await page.context().storageState({
    path: './e2e/.auth/user.json'
  });
});
