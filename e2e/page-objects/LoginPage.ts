import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginError: Locator;
  readonly loginForm: Locator;

  constructor(page: Page) {
    super(page, "/login");

    this.usernameInput = page.locator('[data-testid="username-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.loginError = page.locator('#loginError');
    this.loginForm = page.locator('#loginForm');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    
    // Wait for jQuery to be loaded
    await this.page.waitForFunction(() => typeof (window as any).$ !== 'undefined');
    
    // Click the button and wait for navigation
    await Promise.all([
      this.page.waitForURL('/home', { timeout: 10000 }),
      this.loginButton.click({ force: true })
    ]);
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.loginError.isVisible();
  }
}
