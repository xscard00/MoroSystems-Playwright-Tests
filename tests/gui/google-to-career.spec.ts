
import { test } from '@playwright/test';

import { GoogleSearchPage } from '../../pages/GoogleSearchPage';
import { GoogleResultsPage } from '../../pages/GoogleResultsPage';
import { MoroSystemsHomePage } from '../../pages/MoroSystemsHomePage';
import { MoroSystemsCareerPage } from '../../pages/MoroSystemsCareerPage';

/**
 * TC-GUI-001: Google Search to MoroSystems Careers
 *
 * Test objective:
 * 1. Open Google and search for MoroSystems.
 * 2. Find the official MoroSystems website result.
 * 3. Click the result and open the company homepage.
 * 4. Verify the exact homepage URL and page title.
 * 5. Navigate to Careers through the website menu.
 * 6. Filter available positions by city.
 * 7. Verify the filtered job positions.
 *
 * Known limitation:
 * Google may require manual CAPTCHA verification.
 * Set MANUAL_CAPTCHA=true for interactive execution.
 */

// TEST DATA

const googleUrl = 'https://www.google.com/?hl=en';

const searchText = 'MoroSystems';

// Search result heading shown by Google.
const searchResultTitle = 'MoroSystems.cz';

// Official website information from the assignment.
const expectedHomeUrl = 'https://www.morosystems.cz/';

const expectedPageTitle =
  'MoroSystems - smysluplná IT řešení a technologické inovace';

const careersUrl = 'https://www.morosystems.cz/kariera/';

const city = 'Brno';

// TEST SCENARIO

test('TC-GUI-001: Google to MoroSystems Careers @manual-captcha', async ({
  page,
}) => {

  // Allow time for manual Google CAPTCHA verification.
  test.setTimeout(5 * 60 * 1000);

  // Initialize Page Objects.
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
    await googleResults.openResult(
      searchResultTitle,
      expectedHomeUrl
    );
  });

await test.step('07 - Verify official homepage', async () => {

  // Ignore tracking parameters added by Google Ads.
  await moroHome.verifyUrlWithoutParams(expectedHomeUrl);

  // Verify the exact page title from the assignment.
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
