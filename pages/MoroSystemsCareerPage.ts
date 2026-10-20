import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the MoroSystems Careers page.
 *
 * Provides city filtering and verifies which job positions are shown.
 * Expected URLs and city names are supplied by the test, not hard-coded here.
 */
export class MoroSystemsCareerPage extends BasePage {
  /**
   * Confirms that the browser is on the Careers page and its jobs section
   * is displayed.
   *
   * @param expectedUrl Exact Careers page URL.
   */
  async verifyPage(expectedUrl: string): Promise<void> {
    await this.verifyUrl(expectedUrl);
    await expect(
      this.page.getByRole('heading', { name: 'Koho hledáme' })
    ).toBeVisible();

    console.log('[Careers] Careers page verified.');
  }

  /**
   * Opens the custom city dropdown and selects the requested city.
   *
   * The site uses a custom selector rather than a native <select> element.
   * The option text is matched exactly to prevent partial city-name matches.
   *
   * @param city City to select (for example, "Brno").
   */
  async filterByCity(city: string): Promise<void> {
    console.log(`[Careers] Selecting city: ${city}`);

    const cityFilter = this.page.locator('.inp-custom-select');
    await expect(cityFilter).toBeVisible();

    await cityFilter.locator('.inp-custom-select__select').click();
    console.log('[Careers] City dropdown opened.');

    // Escape regex metacharacters in city names before matching option text.
    const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cityOption = cityFilter.locator('label[data-filter]').filter({
      hasText: new RegExp(`^\\s*${escapedCity}\\s*$`, 'i'),
    });

    await expect(cityOption).toBeVisible();
    await cityOption.click();

    // Verify that the selection is reflected in the custom dropdown.
    await expect(
      cityFilter.locator('.inp-custom-select__select-wrap')
    ).toContainText(city);

    console.log(`[Careers] City filter confirmed: ${city}`);
  }

  /**
   * Checks the selected city and every job in the filtered list.
   *
   * A job matches when its comma-separated data-filter attribute contains
   * the selected city. Matching jobs must be visible; other jobs must be
   * hidden. At least one matching job is required for this test scenario.
   *
   * @param city City previously selected with filterByCity().
   */
  async verifyFilteredPositions(city: string): Promise<void> {
    console.log(`[Careers] Verifying positions for: ${city}`);

    await expect(
      this.page.locator('.inp-custom-select__select-wrap')
    ).toContainText(city);

    const positions = this.page.locator('.c-positions li[data-filter]');

    // Auto-wait for the first job instead of failing on a transient empty list.
    await expect(
      positions.first(),
      'The Careers page must contain job positions.'
    ).toBeAttached();

    const totalCount = await positions.count();
    let matchingCount = 0;
    let hiddenCount = 0;

    for (let index = 0; index < totalCount; index++) {
      const position = positions.nth(index);
      const filterAttribute = await position.getAttribute('data-filter');

      expect(
        filterAttribute,
        `Position ${index + 1} must have a data-filter attribute.`
      ).not.toBeNull();

      // Example attribute: "Brno, Hradec Králové".
      const supportedCities = (filterAttribute ?? '')
        .split(',')
        .map(value => value.trim());

      const matchesCity = supportedCities.includes(city);
      const jobLink = position.locator('a.c-positions__link');

      if (matchesCity) {
        await expect(position).not.toHaveClass(/\bis-hidden\b/);
        await expect(jobLink).toBeVisible();
        matchingCount++;
      } else {
        await expect(position).toHaveClass(/\bis-hidden\b/);
        await expect(jobLink).toBeHidden();
        hiddenCount++;
      }

      console.log(
        `[Careers] Position ${index + 1}: ${filterAttribute} -> ` +
        `${matchesCity ? 'VISIBLE' : 'HIDDEN'} (PASS)`
      );
    }

    // Prevent a false-positive result when no job belongs to the chosen city.
    expect(
      matchingCount,
      `Expected at least one position for ${city}.`
    ).toBeGreaterThan(0);

    console.log(
      `[Careers] Filter validated. ` +
      `Matching positions: ${matchingCount}, hidden positions: ${hiddenCount}.`
    );
  }
}
