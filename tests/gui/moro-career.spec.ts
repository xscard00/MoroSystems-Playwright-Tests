
import { test } from '@playwright/test';

import { MoroSystemsHomePage } from '../../pages/MoroSystemsHomePage';
import { MoroSystemsCareerPage } from '../../pages/MoroSystemsCareerPage';

/**
 * TC-GUI-002: MoroSystems Career City Filtering
 *
 * Verifies that the Careers page correctly filters
 * available job positions by the selected city.
 *
 * Test data and expected URLs are defined here,
 * not inside the Page Objects.
 *
 * Each city runs as an independent Playwright test
 * with its own isolated browser context.
 */

// TEST DATA
const homeUrl = 'https://www.morosystems.cz/';
const careersUrl = 'https://www.morosystems.cz/kariera/';

const cities = [
  'Brno',
  'Praha',
  'Hradec Králové',
];

// PARAMETRIZED TESTS
for (const city of cities) {

  test(`TC-GUI-002: Filter career positions by ${city}`, async ({ page }) => {

    // Initialize Page Objects for this test.
    const moroHome = new MoroSystemsHomePage(page);
    const careerPage = new MoroSystemsCareerPage(page);

    await test.step('01 - Open MoroSystems homepage', async () => {
      await moroHome.open(homeUrl);
    });

    await test.step('02 - Navigate to Careers via menu', async () => {
      await moroHome.openCareers(careersUrl);
    });

    await test.step('03 - Verify Careers page', async () => {
        await careerPage.verifyPage(careersUrl);
    });

    await test.step(`04 - Select city: ${city}`, async () => {
      await careerPage.filterByCity(city);
    });

    await test.step(`05 - Verify positions for: ${city}`, async () => {
      await careerPage.verifyFilteredPositions(city);
    });

  });
}
