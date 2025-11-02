import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  readonly welcomeHeading: Locator;
  readonly banner: Locator;

  constructor(page: Page) {
    super(page, "/home");

    this.welcomeHeading = page.getByRole('heading', { name: 'Welcome to 10xCMS' });
    this.banner = page.locator('img[alt="10xCMS Banner"]');
  }

  async isWelcomeHeadingVisible(): Promise<boolean> {
    return await this.welcomeHeading.isVisible();
  }

  async isLogoutLinkVisible(): Promise<boolean> {
    return await this.logoutLink.isVisible();
  }
}
