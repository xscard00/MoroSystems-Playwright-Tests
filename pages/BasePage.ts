import { expect, type Page } from '@playwright/test';

/**
 * Provides browser operations shared by all Page Objects.
 *
 * Page Objects inherit these helpers instead of duplicating navigation,
 * URL assertions or page-title assertions.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Opens an absolute URL provided by the test.
   *
   * Waiting for DOMContentLoaded avoids depending on third-party resources
   * while subsequent assertions verify that the expected page is ready.
   *
   * @param url Absolute URL to open.
   */
  async openPage(url: string): Promise<void> {
    console.log(`[Browser] Opening page: ${url}`);

    await this.page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log(`[Browser] Current URL: ${this.page.url()}`);
  }

  /**
   * Checks the entire URL, including the query string and fragment.
   * Use this for navigation where an exact destination is required.
   *
   * @param expectedUrl Expected absolute URL.
   */
  async verifyUrl(expectedUrl: string): Promise<void> {
    await expect(
      this.page,
      `Expected exact URL: ${expectedUrl}`
    ).toHaveURL(expectedUrl);

    console.log(`[Browser] Verified URL: ${this.page.url()}`);
  }

  /**
   * Checks the URL origin and pathname, ignoring query parameters and hash.
   * This is useful when an external link adds UTM or Google Ads parameters.
   * It still rejects a different protocol, hostname, port or page path.
   *
   * @param expectedUrl Expected absolute URL without required query parameters.
   */
  async verifyUrlWithoutParams(expectedUrl: string): Promise<void> {
    const expected = new URL(expectedUrl);

    await expect(
      this.page,
      `Expected destination: ${expected.origin}${expected.pathname}`
    ).toHaveURL(actual =>
      actual.origin === expected.origin &&
      actual.pathname === expected.pathname
    );

    console.log(
      `[Browser] Verified URL: ${expected.origin}${expected.pathname} ` +
      '(query parameters and fragment ignored)'
    );
  }

  /**
   * Checks the browser page title using an exact string or a regular expression.
   *
   * @param expectedTitle Expected title text or regular-expression pattern.
   */
  async verifyTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);

    console.log(`[Browser] Verified page title: ${await this.page.title()}`);
  }
}
