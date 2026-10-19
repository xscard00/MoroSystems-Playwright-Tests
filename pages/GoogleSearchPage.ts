
import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Google Search homepage.
 *
 * Responsibilities:
 * - Open the Google homepage.
 * - Handle optional cookie consent.
 * - Submit a search query.
 *
 * Google may display CAPTCHA after search submission.
 * CAPTCHA handling belongs to GoogleResultsPage.
 *
 * Common browser operations are inherited from BasePage.
 */
export class GoogleSearchPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  /**
   * Opens the URL supplied by the test and verifies
   * that the Google search field is available.
   *
   * @param url Absolute URL of the Google homepage.
   */
  async open(url: string): Promise<void> {

    console.log(`[Google] Opening homepage: ${url}`);

    // Use the shared navigation method from BasePage.
    await this.openPage(url);

    // Verify that the search field is available.
    await expect(
      this.page.locator('[name="q"]').first()
    ).toBeVisible();

    console.log('[Google] Homepage loaded.');
  }

  /**
   * Accepts the optional Google cookies dialog.
   *
   * Google is requested in English, but Czech
   * is supported as a fallback.
   *
   * The wait is bounded because the dialog
   * does not appear on every test run.
   */
  async acceptCookiesIfPresent(): Promise<void> {

    const acceptButton = this.page.getByRole('button', {
      name: /^(Accept all|Přijmout vše)$/i,
    });

    const isVisible = await acceptButton
      .waitFor({
        state: 'visible',
        timeout: 3000,
      })
      .then(() => true)
      .catch(() => false);

    if (!isVisible) {
      console.log('[Google] Cookie dialog not detected.');
      return;
    }

    console.log('[Google] Accepting cookies.');

    await acceptButton.click();

    await expect(acceptButton).toBeHidden();

    console.log('[Google] Cookies accepted.');
  }

  /**
   * Submits a search query.
   *
   * @param query Text to search for.
   */
  async searchFor(query: string): Promise<void> {

    console.log(`[Google] Searching for: ${query}`);

    const searchField = this.page.locator(
      '[name="q"]'
    ).first();

    await expect(searchField).toBeVisible();

    await searchField.fill(query);

    await searchField.press('Enter');

    console.log('[Google] Search submitted.');
  }
}
