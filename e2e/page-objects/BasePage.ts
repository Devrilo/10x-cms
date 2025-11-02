import { type Page, type Locator } from "@playwright/test";

export abstract class BasePage {
  readonly page: Page;
  readonly url: string;
  readonly logoutLink: Locator;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
    this.logoutLink = page.locator('[data-testid="logout-link"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle'): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }
}
