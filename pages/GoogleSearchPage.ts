import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Google search homepage.
 *
 * Opens Google, handles optional cookie consent and submits search queries.
 * CAPTCHA handling is intentionally delegated to GoogleResultsPage.
 */
export class GoogleSearchPage extends BasePage {
  /**
   * Opens Google and verifies that the search field is visible.
   *
   * @param url Absolute Google homepage URL supplied by the test.
   */
  async open(url: string): Promise<void> {
    await this.openPage(url);
    await expect(this.page.locator('[name="q"]').first()).toBeVisible();

    console.log('[Google] Homepage loaded.');
  }

  /**
   * Accepts Google's cookie consent when the dialog appears.
   *
   * The dialog is optional and may appear in English or Czech. Waiting for
   * at most three seconds avoids slowing down runs with stored consent.
   */
  async acceptCookiesIfPresent(): Promise<void> {
    const acceptButton = this.page.getByRole('button', {
      name: /^(Accept all|Přijmout vše)$/i,
    });

    try {
      await acceptButton.waitFor({ state: 'visible', timeout: 3_000 });
    } catch {
      console.log('[Google] Cookie dialog not displayed.');
      return;
    }

    await acceptButton.click();
    await expect(acceptButton).toBeHidden();

    console.log('[Google] Cookies accepted.');
  }

  /**
   * Enters a query in Google's search field and submits it with Enter.
   * The resulting page is verified by GoogleResultsPage, not here.
   *
   * @param query Search text supplied by the test.
   */
  async searchFor(query: string): Promise<void> {
    const searchField = this.page.locator('[name="q"]').first();
    await expect(searchField).toBeVisible();

    console.log(`[Google] Searching for: ${query}`);
    await searchField.fill(query);
    await searchField.press('Enter');

    console.log('[Google] Search submitted.');
  }
}
