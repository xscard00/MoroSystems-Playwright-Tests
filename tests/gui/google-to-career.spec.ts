import { test } from '@playwright/test';

import { GoogleSearchPage } from '../../pages/GoogleSearchPage';
import { GoogleResultsPage } from '../../pages/GoogleResultsPage';
import { MoroSystemsHomePage } from '../../pages/MoroSystemsHomePage';
import { MoroSystemsCareerPage } from '../../pages/MoroSystemsCareerPage';

/**
 * TC-GUI-001: Google search to MoroSystems Careers.
 *
 * Covers the GUI assignment from submitting a Google query to validating
 * the city-filtered job list on the official MoroSystems website.
 *
 * Google may require manual CAPTCHA verification. The @manual-captcha tag
 * excludes this scenario from unattended CI runs. For assisted local runs,
 * set MANUAL_CAPTCHA=true and resume execution in Playwright Inspector.
 */

// Test data is kept outside Page Objects to separate scenarios from UI logic.
const googleUrl = 'https://www.google.com/?hl=en';
const searchText = 'MoroSystems';
const searchResultTitle = 'MoroSystems.cz';
const expectedHomeUrl = 'https://www.morosystems.cz/';
const expectedPageTitle =
  'MoroSystems - smysluplná IT řešení a technologické inovace';
const careersUrl = 'https://www.morosystems.cz/kariera/';
const city = 'Brno';

test('TC-GUI-001: Google to MoroSystems Careers @manual-captcha', async ({ page }) => {
  // Allow extra time only when the scenario requires human interaction.
  test.setTimeout(process.env.MANUAL_CAPTCHA === 'true' ? 5 * 60_000 : 60_000);

  const googleSearch = new GoogleSearchPage(page);
  const googleResults = new GoogleResultsPage(page);
  const moroHome = new MoroSystemsHomePage(page);
  const careers = new MoroSystemsCareerPage(page);

  await test.step('01 - Open Google homepage', async () => {
    await googleSearch.open(googleUrl);
  });

  await test.step('02 - Accept Google cookies if present', async () => {
    await googleSearch.acceptCookiesIfPresent();
  });

  await test.step('03 - Search for MoroSystems', async () => {
    await googleSearch.searchFor(searchText);
  });

  await test.step('04 - Wait for Google search results', async () => {
    await googleResults.waitForResults(searchResultTitle);
  });

  await test.step('05 - Verify MoroSystems search result', async () => {
    await googleResults.verifyResult(searchResultTitle);
  });

  await test.step('06 - Open official MoroSystems homepage', async () => {
    // openResult() verifies the exact origin and path, ignoring tracking params.
    await googleResults.openResult(searchResultTitle, expectedHomeUrl);
  });

  await test.step('07 - Verify official homepage title', async () => {
    // Match the page title stated explicitly in the assignment.
    await moroHome.verifyTitle(expectedPageTitle);
  });

  await test.step('08 - Navigate to Careers via menu', async () => {
    await moroHome.openCareers(careersUrl);
  });

  await test.step('09 - Verify Careers page', async () => {
    await careers.verifyPage(careersUrl);
  });

  await test.step(`10 - Filter positions by ${city}`, async () => {
    await careers.filterByCity(city);
  });

  await test.step(`11 - Verify filtered positions for ${city}`, async () => {
    await careers.verifyFilteredPositions(city);
  });
});
