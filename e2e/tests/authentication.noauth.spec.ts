import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects/DashboardPage';

test.describe('Authentication', () => {
  test('should successfully log in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login page
    await loginPage.navigate();

    // Perform login with valid credentials
    await loginPage.login('10xadmin', '10xpassword');

    // Wait for redirect to home page
    await page.waitForURL('/home');

    // Verify the URL is correct
    expect(page.url()).toContain('/home');

    // Verify the welcome heading is displayed
    await expect(dashboardPage.welcomeHeading).toBeVisible();

    // Verify the logout link is visible
    await expect(dashboardPage.logoutLink).toBeVisible();
  });
});
