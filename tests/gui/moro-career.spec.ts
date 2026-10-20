import { test } from '@playwright/test';

import { MoroSystemsHomePage } from '../../pages/MoroSystemsHomePage';
import { MoroSystemsCareerPage } from '../../pages/MoroSystemsCareerPage';

/**
 * TC-GUI-002: Verify city filtering on the MoroSystems Careers page.
 *
 * Each city is a separate Playwright test with an isolated browser context.
 * The same scenario runs in Chromium, Firefox and WebKit through the projects
 * defined in playwright.config.ts. It starts directly on the MoroSystems site
 * to avoid depending on Google's CAPTCHA challenge.
 */

// Scenario inputs remain in the test rather than in the Page Objects.
const homeUrl = 'https://www.morosystems.cz/';
const careersUrl = 'https://www.morosystems.cz/kariera/';
const cities = ['Brno', 'Praha', 'Hradec Králové'] as const;

for (const city of cities) {
  test(`TC-GUI-002: Filter career positions by ${city}`, async ({ page }) => {
    const homePage = new MoroSystemsHomePage(page);
    const careerPage = new MoroSystemsCareerPage(page);

    await test.step('01 - Open MoroSystems homepage', async () => {
      await homePage.open(homeUrl);
    });

    await test.step('02 - Navigate to Careers via menu', async () => {
      await homePage.openCareers(careersUrl);
    });

    await test.step('03 - Verify Careers page', async () => {
      await careerPage.verifyPage(careersUrl);
    });

    await test.step(`04 - Select city: ${city}`, async () => {
      await careerPage.filterByCity(city);
    });

    await test.step(`05 - Verify positions for: ${city}`, async () => {
      // Assert that all matching jobs are visible and all others are hidden.
      await careerPage.verifyFilteredPositions(city);
    });
  });
}
