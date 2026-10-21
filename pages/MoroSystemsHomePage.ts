import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the MoroSystems website.
 *
 * Handles homepage navigation, optional cookie rejection and navigation to
 * Careers. Test data and destination URLs remain in the test scenarios.
 */
export class MoroSystemsHomePage extends BasePage {
  /**
   * Opens the homepage, rejects optional cookies when prompted and verifies the destination.
   * Used by independent GUI tests that do not start at Google.
   *
   * @param url Expected absolute homepage URL.
   */
  async open(url: string): Promise<void> {
    await this.openPage(url);
    await this.rejectOptionalCookiesIfPresent();
    await this.verifyHomepage(url);
  }

  /**
   * Rejects optional cookies when the consent dialog appears.
   *
   * The consent banner may load after the initial document. Wait up to three
   * seconds for its button; only a timeout means the dialog is absent.
   * Other errors are rethrown so genuine problems do not go unnoticed.
   */
  async rejectOptionalCookiesIfPresent(): Promise<void> {
    const rejectOptionalCookiesButton = this.page.locator('#cookiescript_reject');

    try {
      await rejectOptionalCookiesButton.waitFor({
        state: 'visible',
        timeout: 3_000,
      });
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'TimeoutError') {
        throw error;
      }

      console.log('[MoroSystems] Cookie dialog not displayed.');
      return;
    }

    console.log('[MoroSystems] Cookie dialog detected.');

    await rejectOptionalCookiesButton.click();
    await expect(rejectOptionalCookiesButton).toBeHidden();

    console.log('[MoroSystems] Optional cookies rejected (necessary cookies only).');
  }

  /**
   * Verifies the exact homepage URL and confirms the MoroSystems page title.
   * This intentionally rejects a Careers page or another subpage.
   *
   * @param expectedUrl Exact homepage URL supplied by the test.
   */
  async verifyHomepage(expectedUrl: string): Promise<void> {
    await this.verifyUrl(expectedUrl);
    await this.verifyTitle(/MoroSystems/i);

    console.log('[MoroSystems] Homepage verified.');
  }

  /**
   * Opens Careers by clicking a visible link on the MoroSystems website.
   * Verifies the destination and rejects optional cookies if a dialog appears.
   *
   * @param expectedUrl Exact Careers page URL supplied by the test.
   */
  async openCareers(expectedUrl: string): Promise<void> {
    console.log('[MoroSystems] Opening Careers via navigation menu.');

    const careersLink = this.page
      .locator('a[href*="/kariera/"]')
      .filter({ visible: true })
      .first();

    await expect(
      careersLink,
      'A visible Careers navigation link must exist.'
    ).toBeVisible();

    await careersLink.click();
    await this.verifyUrl(expectedUrl);
    await this.rejectOptionalCookiesIfPresent();

    console.log('[MoroSystems] Careers page opened via menu.');
  }
}
