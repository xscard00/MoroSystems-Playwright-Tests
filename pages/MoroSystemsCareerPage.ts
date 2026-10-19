
import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the MoroSystems Careers page.
 *
 * Responsibilities:
 * - Verify that the Careers page is displayed.
 * - Interact with the city filter.
 * - Validate filtered job positions.
 *
 * All expected values are supplied by the test.
 * Common browser operations are inherited from BasePage.
 */
export class MoroSystemsCareerPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  /**
   * Verifies the exact Careers page URL
   * and checks that the jobs section is visible.
   *
   * @param expectedUrl Expected Careers page URL.
   */
  async verifyPage(expectedUrl: string): Promise<void> {

    // STEP 1: Verify the exact URL.
    await this.verifyUrl(expectedUrl);

    // STEP 2: Verify that the job section is displayed.
    await expect(
      this.page.getByRole('heading', {
        name: 'Koho hledáme',
      })
    ).toBeVisible();

    console.log('[Careers] Careers page verified.');
  }

  /**
   * Selects a city using the custom dropdown.
   *
   * The site uses labels with data-filter attributes.
   *
   * @param city City selected by the test.
   */
  async filterByCity(city: string): Promise<void> {

    console.log(`[Careers] Selecting city: ${city}`);

    // STEP 1: Find the custom city filter.
    const cityFilter = this.page.locator(
      '.inp-custom-select'
    );

    await expect(cityFilter).toBeVisible();

    // STEP 2: Open the dropdown.
    const dropdownTrigger = cityFilter.locator(
      '.inp-custom-select__select'
    );

    await dropdownTrigger.click();

    console.log('[Careers] City dropdown opened.');

    // STEP 3: Find the requested city.
    const cityOption = cityFilter.locator(
      'label[data-filter]'
    ).filter({
      hasText: new RegExp(
        `^\\s*${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
        'i'
      ),
    });

    await expect(cityOption).toBeVisible();

    // STEP 4: Select the requested city.
    await cityOption.click();

    // STEP 5: Verify the selected city is displayed.
    const selectedCity = cityFilter.locator(
      '.inp-custom-select__select-wrap'
    );

    await expect(selectedCity).toContainText(city);

    console.log(
      `[Careers] City filter confirmed: ${city}`
    );
  }

  /**
   * Verifies all job positions after applying a city filter.
   *
   * Validation:
   * 1. The dropdown displays the selected city.
   * 2. Job positions exist on the page.
   * 3. Matching positions are visible.
   * 4. Non-matching positions are hidden.
   * 5. At least one matching position exists.
   *
   * @param city Selected city.
   */
  async verifyFilteredPositions(city: string): Promise<void> {

    console.log(
      `[Careers] Verifying positions for: ${city}`
    );

    // STEP 1: Verify selected city.
    const selectedCity = this.page.locator(
      '.inp-custom-select__select-wrap'
    );

    await expect(selectedCity).toContainText(city);

    // STEP 2: Locate job position elements.
    const positions = this.page.locator(
      '.c-positions li[data-filter]'
    );

    const totalCount = await positions.count();

    expect(
      totalCount,
      'The Careers page must contain job positions.'
    ).toBeGreaterThan(0);

    let matchingCount = 0;
    let hiddenCount = 0;

    // STEP 3: Validate every job position.
    for (let index = 0; index < totalCount; index++) {

      const position = positions.nth(index);

      const filterAttribute = await position.getAttribute(
        'data-filter'
      );

      expect(
        filterAttribute,
        `Position ${index + 1} must have a data-filter attribute.`
      ).not.toBeNull();

      // Example: "Brno, Hradec Králové"
      const supportedCities = (filterAttribute ?? '')
        .split(',')
        .map(value => value.trim());

      const matchesCity = supportedCities.includes(city);

      if (matchesCity) {

        // Matching positions must be visible.
        await expect(position).not.toHaveClass(
          /\bis-hidden\b/
        );

        await expect(
          position.locator('a.c-positions__link')
        ).toBeVisible();

        matchingCount++;

        console.log(
          `[Careers] Position ${index + 1}: ` +
          `${filterAttribute} -> VISIBLE (PASS)`
        );

      } else {

        // Other positions must be hidden.
        await expect(position).toHaveClass(
          /\bis-hidden\b/
        );

        hiddenCount++;

        console.log(
          `[Careers] Position ${index + 1}: ` +
          `${filterAttribute} -> HIDDEN (PASS)`
        );
      }
    }

    // STEP 4: Prevent passing without matching jobs.
    expect(
      matchingCount,
      `Expected at least one position for ${city}.`
    ).toBeGreaterThan(0);

    console.log(
      `[Careers] Filter validated. ` +
      `Matching positions: ${matchingCount}, ` +
      `Hidden positions: ${hiddenCount}.`
    );
  }
}
