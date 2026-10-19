
import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

import { BasePage } from './BasePage';

/**
 * Page Object for Google Search results.
 *
 * Responsibilities:
 * - Handle manual CAPTCHA verification.
 * - Wait for Google Search results.
 * - Find a search result by its heading.
 * - Verify a result is visible.
 * - Click a result and validate its final URL.
 *
 * The class does not depend on a specific company.
 */
export class GoogleResultsPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  /**
   * Detects known Google CAPTCHA / bot protection URLs.
   *
   * CAPTCHA is never bypassed automatically.
   */
  private isCaptchaDisplayed(): boolean {
    return /\/sorry\/|\/recaptcha\//i.test(this.page.url());
  }

  /**
 * Returns clickable Google search results.
 *
 * Supports:
 * - Standard results containing an H3 heading.
 * - Sponsored results containing role="heading".
 */
private getResultLinks(): Locator {

  return this.page.locator(
    'a:has(h3), a:has([role="heading"])'
  );
}

/**
 * Finds a visible Google search result
 * by its heading text.
 *
 * Supports exact text or a regular expression.
 *
 * @param expectedTitle - Result heading or pattern.
 */
private async findResult(
  expectedTitle: string | RegExp
): Promise<Locator | null> {

  const links = this.getResultLinks();
  const count = await links.count();

  for (let index = 0; index < count; index++) {

    const link = links.nth(index);

    if (!(await link.isVisible())) {
      continue;
    }

    const heading = link.locator(
      'h3, [role="heading"]'
    ).first();

    if (!(await heading.isVisible())) {
      continue;
    }

    const actualTitle =
      (await heading.textContent())?.trim() ?? '';

    const matches =
      typeof expectedTitle === 'string'
        ? actualTitle === expectedTitle
        : expectedTitle.test(actualTitle);

    if (!matches) {
      continue;
    }

    console.log(
      `[Google] Matching result found: ${actualTitle}`
    );

    return link;
  }

  return null;
}

  /**
   * Prints search result headings and URLs
   * when additional diagnostics are needed.
   */
  private async logSearchResults(): Promise<void> {

    console.log(
      `[Google DEBUG] Current URL: ${this.page.url()}`
    );

    console.log(
      `[Google DEBUG] Page title: ${await this.page.title()}`
    );

    const links = this.getResultLinks();
    const count = await links.count();

    console.log(
      `[Google DEBUG] Search result candidates: ${count}`
    );

    for (let index = 0; index < Math.min(count, 10); index++) {

      const link = links.nth(index);

      const href = await link.getAttribute('href');

      const title = (
        await link.locator('h3').first().textContent()
      )?.trim();

      console.log(
        `[Google DEBUG] ${index + 1}: ${title} -> ${href}`
      );
    }
  }

  /**
   * Waits for the requested Google result.
   *
   * When MANUAL_CAPTCHA=true, Playwright Inspector
   * pauses execution for manual verification.
   *
   * @param title Expected Google result heading.
   */
  async waitForResults(title: string): Promise<void> {

    if (process.env.MANUAL_CAPTCHA === 'true') {

      console.log(
        '[Google] Manual verification mode enabled.'
      );

      console.log(
        '[Google] Complete CAPTCHA if necessary, ' +
        'then resume the test in Playwright Inspector.'
      );

      await this.page.pause();
    }

    try {

      await expect.poll(async () => {

        if (this.isCaptchaDisplayed()) {
          return 'captcha';
        }

        const result = await this.findResult(title);

        if (result) {
          return 'results';
        }

        return 'loading';

      }, {
        timeout: 15000,
        message: `Waiting for Google result: ${title}`,
      }).toBe('results');

    } catch (error) {

      // Log the page state when the result is unavailable.
      await this.logSearchResults();

      if (this.isCaptchaDisplayed()) {
        throw new Error(
          'Google CAPTCHA detected. ' +
          'Manual verification is required to continue.'
        );
      }

      throw error;
    }

    console.log(
      `[Google] Search result available: ${title}`
    );
  }

  /**
   * Verifies that a Google result with the
   * requested heading is visible.
   *
   * @param title Expected result heading.
   */
  async verifyResult(title: string): Promise<void> {

    const result = await this.findResult(title);

    expect(
      result,
      `Google must display search result: ${title}`
    ).not.toBeNull();

    await expect(result!).toBeVisible();

    console.log(
      `[Google] Search result verified: ${title}`
    );
  }

  
/**
 * Opens a selected Google search result.
 *
 * Validates the destination URL while ignoring
 * tracking parameters added by search engines.
 *
 * @param title Search result heading or pattern.
 * @param expectedUrl Expected destination URL.
 */
async openResult(
  title: string | RegExp,
  expectedUrl: string
): Promise<void> {

  const result = await this.findResult(title);

  expect(
    result,
    `Search result must exist before clicking: ${title}`
  ).not.toBeNull();

  await result!.click();

  // Google Ads may append UTM and click-tracking parameters.
  await this.verifyUrlWithoutParams(expectedUrl);


const currentUrl = new URL(this.page.url());

console.log(
  `[Google] Opened search result: ` +
  `${currentUrl.origin}${currentUrl.pathname}`
);
}

}
