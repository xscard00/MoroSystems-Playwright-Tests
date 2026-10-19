
import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object representing the company website homepage.
 *
 * Responsibilities:
 * - Navigate to the homepage using the website UI.
 * - Handle optional cookie consent.
 * - Verify the homepage.
 * - Navigate to the Careers page.
 *
 * Website URLs are supplied by the test.
 * Common browser operations are inherited from BasePage.
 */
export class MoroSystemsHomePage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  /**
   * Opens the homepage directly using the URL
   * supplied by the test.
   *
   * Useful for independent homepage and career tests.
   *
   * @param url Expected homepage URL.
   */
  async open(url: string): Promise<void> {

    console.log(`[MoroSystems] Opening homepage: ${url}`);

    await this.openPage(url);

    await this.acceptCookiesIfPresent();

    await this.verifyHomepage(url);
  }

  /**
   * Handles the optional cookie consent dialog.
   *
   * Selects "Necessary cookies only".
   * The locator uses the existing element ID.
   */
  async acceptCookiesIfPresent(): Promise<void> {

    const necessaryCookiesButton = this.page.locator(
      '#cookiescript_reject'
    );

    const isVisible = await necessaryCookiesButton
      .waitFor({
        state: 'visible',
        timeout: 3000,
      })
      .then(() => true)
      .catch(() => false);

    if (!isVisible) {
      console.log(
        '[MoroSystems] Cookie dialog not displayed.'
      );
      return;
    }

    console.log(
      '[MoroSystems] Cookie dialog detected.'
    );

    await necessaryCookiesButton.click();

    await expect(necessaryCookiesButton).toBeHidden();

    console.log(
      '[MoroSystems] Necessary cookies selected.'
    );
  }

  /**
   * Navigates to the homepage through a website link.
   *
   * Unlike openPage(), this method does not navigate
   * directly using page.goto().
   *
   * @param expectedUrl Exact homepage URL.
   */
  async navigateToHomepage(
    expectedUrl: string
  ): Promise<void> {

    console.log(
      '[MoroSystems] Navigating to homepage via website link.'
    );

    // The page may already be the homepage.
    if (this.page.url() === expectedUrl) {
      console.log(
        '[MoroSystems] Already on the expected homepage.'
      );
      return;
    }

    // Prefer an existing link whose destination is
    // the homepage root, rather than navigating directly.
    const homepageLink = this.page
      .locator('a[href="/"]')
      .filter({ visible: true })
      .first();

    await expect(
      homepageLink,
      'A visible homepage navigation link must exist.'
    ).toBeVisible();

    await homepageLink.click();

    await this.verifyHomepage(expectedUrl);

    console.log(
      '[MoroSystems] Homepage opened via website navigation.'
    );
  }

  /**
   * Verifies the exact homepage URL and page title.
   *
   * Unlike the previous implementation, a Careers
   * subpage will NOT pass this verification.
   *
   * @param expectedUrl Exact homepage URL.
   */
  async verifyHomepage(
    expectedUrl: string
  ): Promise<void> {

    await this.verifyUrl(expectedUrl);

    await this.verifyTitle(/MoroSystems/i);

    console.log(
      `[MoroSystems] Homepage verified: ${this.page.url()}`
    );
  }

  /**
   * Navigates to Careers through the website menu.
   *
   * @param expectedUrl Exact Careers page URL.
   */
  async openCareers(
    expectedUrl: string
  ): Promise<void> {

    console.log(
      '[MoroSystems] Opening Careers via navigation menu.'
    );

    // Keep the previously verified locator.
    const careersLink = this.page
      .locator('a[href*="/kariera/"]')
      .filter({ visible: true })
      .first();

    await expect(careersLink).toBeVisible();

    // Use actual website navigation.
    await careersLink.click();

    // Validate the destination supplied by the test.
    await this.verifyUrl(expectedUrl);

    await this.acceptCookiesIfPresent();

    console.log(
      '[MoroSystems] Careers page opened via menu.'
    );
  }
}
