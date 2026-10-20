import { expect, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Google search results.
 *
 * Locates results by their visible heading, supports manual CAPTCHA
 * verification and checks the destination after clicking a result.
 *
 * The expected heading and destination URL are supplied by the test.
 */
export class GoogleResultsPage extends BasePage {
  /**
   * Detects Google's known CAPTCHA and anti-bot URL paths.
   * This check does not attempt to bypass the challenge.
   */
  private isCaptchaDisplayed(): boolean {
    return /\/sorry\/|\/recaptcha\//i.test(this.page.url());
  }

  /**
   * Returns links containing a standard or sponsored-result heading.
   * Google's markup can differ between these result types.
   */
  private getResultLinks(): Locator {
    return this.page.locator('a:has(h3), a:has([role="heading"])');
  }

  /**
   * Finds the first visible result whose heading matches the supplied text.
   * Strings require an exact match; RegExp values allow flexible matching.
   *
   * @param title Expected search-result heading or pattern.
   * @returns Matching link, or null when no visible result matches.
   */
  private async findResult(title: string | RegExp): Promise<Locator | null> {
    const links = this.getResultLinks();
    const count = await links.count();

    for (let index = 0; index < count; index++) {
      const link = links.nth(index);
      if (!(await link.isVisible())) continue;

      const heading = link.locator('h3, [role="heading"]').first();
      if (!(await heading.isVisible())) continue;

      const actualTitle = (await heading.textContent())?.trim() ?? '';
      const matches = typeof title === 'string'
        ? actualTitle === title
        : title.test(actualTitle);

      if (matches) {
        console.log(`[Google] Matching result found: ${actualTitle}`);
        return link;
      }
    }

    return null;
  }

  /**
   * Logs up to ten result headings and destinations after a failed search.
   * Handles both heading variants without waiting for a missing h3 element.
   */
  private async logSearchResults(): Promise<void> {
    console.log(`[Google DEBUG] Current URL: ${this.page.url()}`);
    console.log(`[Google DEBUG] Page title: ${await this.page.title()}`);

    const links = this.getResultLinks();
    const count = await links.count();
    console.log(`[Google DEBUG] Search result candidates: ${count}`);

    for (let index = 0; index < Math.min(count, 10); index++) {
      const link = links.nth(index);
      const heading = link.locator('h3, [role="heading"]').first();
      const title = (await heading.count()) > 0
        ? (await heading.textContent())?.trim() ?? '(empty heading)'
        : '(heading unavailable)';

      const href = (await link.getAttribute('href')) ?? '(no href)';
      const shortHref = href.length > 160 ? `${href.slice(0, 160)}...` : href;

      console.log(`[Google DEBUG] ${index + 1}: ${title} -> ${shortHref}`);
    }
  }

  /**
   * Waits for a matching search result to appear.
   *
   * MANUAL_CAPTCHA=true pauses in Playwright Inspector, allowing the user
   * to complete Google's verification and then resume the test manually.
   *
   * @param title Expected result heading or pattern.
   */
  async waitForResults(title: string | RegExp): Promise<void> {
    if (process.env.MANUAL_CAPTCHA === 'true') {
      console.log('[Google] Manual verification mode enabled.');
      console.log(
        '[Google] Complete CAPTCHA if necessary, then resume in Playwright Inspector.'
      );
      await this.page.pause();
    }

    try {
      await expect.poll(async () => {
        if (this.isCaptchaDisplayed()) return 'captcha';
        return (await this.findResult(title)) ? 'results' : 'loading';
      }, {
        timeout: 15_000,
        message: `Waiting for Google result: ${title}`,
      }).toBe('results');
    } catch (error) {
      await this.logSearchResults();

      if (this.isCaptchaDisplayed()) {
        throw new Error(
          'Google CAPTCHA detected. Manual verification is required to continue.'
        );
      }

      throw error;
    }

    console.log(`[Google] Search result available: ${title}`);
  }

  /**
   * Verifies that a visible Google result has the expected heading.
   *
   * @param title Expected result heading or pattern.
   */
  async verifyResult(title: string | RegExp): Promise<void> {
    const result = await this.findResult(title);
    if (!result) throw new Error(`Google result not found: ${title}`);

    await expect(result).toBeVisible();
    console.log(`[Google] Search result verified: ${title}`);
  }

  /**
   * Clicks the selected search result and verifies its destination.
   * Tracking parameters are ignored, but origin and pathname must match.
   *
   * @param title Expected result heading or pattern.
   * @param expectedUrl Expected destination URL without tracking parameters.
   */
  async openResult(title: string | RegExp, expectedUrl: string): Promise<void> {
    const result = await this.findResult(title);
    if (!result) throw new Error(`Google result not found: ${title}`);

    await result.click();
    await this.verifyUrlWithoutParams(expectedUrl);

    const currentUrl = new URL(this.page.url());
    console.log(
      `[Google] Opened search result: ${currentUrl.origin}${currentUrl.pathname}`
    );
  }
}
