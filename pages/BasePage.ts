
import {
  expect,
  type Page,
} from '@playwright/test';

/**
 * Base class for all Page Objects.
 *
 * Contains reusable browser operations that are
 * independent of a specific website.
 */
export class BasePage {

  constructor(protected readonly page: Page) {}

  /**
   * Opens a website using the URL supplied by the test.
   *
   * @param url - Absolute URL of the requested page.
   */
  async openPage(url: string): Promise<void> {

    console.log(`[Browser] Opening page: ${url}`);

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
    });

    console.log(`[Browser] Current URL: ${this.page.url()}`);
  }

  /**
   * Verifies that the browser is displaying
   * the exact URL supplied by the test.
   *
   * Checks protocol, hostname, path and query string.
   *
   * @param expectedUrl - Expected absolute URL.
   */
  async verifyUrl(expectedUrl: string): Promise<void> {

    await expect(
      this.page,
      `Expected URL: ${expectedUrl}`
    ).toHaveURL(expectedUrl);

    console.log(`[Browser] Verified URL: ${this.page.url()}`);
  }

  /**
   * Verifies the browser page title.
   *
   * A regular expression allows flexible matching.
   *
   * @param expectedTitle - Expected title or pattern.
   */
  async verifyTitle(
    expectedTitle: string | RegExp
  ): Promise<void> {

    await expect(this.page).toHaveTitle(expectedTitle);

    console.log(
      `[Browser] Verified page title: ${await this.page.title()}`
    );
  }


/**
 * Verifies the page URL without query parameters
 * and URL fragments.
 *
 * Compares:
 * - Protocol
 * - Hostname
 * - Port
 * - Pathname
 *
 * Useful when external websites append tracking
 * parameters such as UTM or Google Ads identifiers.
 *
 * @param expectedUrl Expected page URL.
 */
async verifyUrlWithoutParams(
  expectedUrl: string
): Promise<void> {

  const expected = new URL(expectedUrl);

  await expect(
    this.page,
    `Expected page URL without query parameters: ${expectedUrl}`
  ).toHaveURL(actual => {

    return (
      actual.origin === expected.origin &&
      actual.pathname === expected.pathname
    );
  });

const currentUrl = new URL(this.page.url());

console.log(
  `[Browser] Verified URL: ` +
  `${currentUrl.origin}${currentUrl.pathname}` +
  ` (query parameters ignored)`
);
}

}
