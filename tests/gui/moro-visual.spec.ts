import { expect, test, type Page } from '@playwright/test';

import { MoroSystemsHomePage } from '../../pages/MoroSystemsHomePage';
import { MoroSystemsCareerPage } from '../../pages/MoroSystemsCareerPage';

/**
 * TC-GUI-005/006: Visual regression checks for the MoroSystems website.
 *
 * Screenshots are compared with committed reference images (baselines).
 * These tests intentionally target Chromium only: different browser engines
 * render fonts and pixels differently and need their own baselines.
 *
 * The first execution creates baselines with --update-snapshots. Subsequent
 * executions compare the current rendering against those reference images.
 *
 * The tests cover representative CSS viewports. Responsive functionality
 * across all seven sizes and three engines is checked separately.
 */
const homeUrl = 'https://www.morosystems.cz/';
const careersUrl = 'https://www.morosystems.cz/kariera/';
const filterCity = 'Brno';

const visualViewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'full-hd', width: 1920, height: 1080 },
  { name: 'qhd', width: 2560, height: 1440 },
  { name: '4k-uhd', width: 3840, height: 2160 },
] as const;

/**
 * Waits for web fonts before capturing a visual baseline.
 *
 * Playwright's screenshot assertion already waits for two consecutive
 * matching renders and disables animations through its options below.
 *
 * @param page Browser page whose screenshot is about to be taken.
 */
async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test.describe('MoroSystems visual regression @visual', () => {
  // Pixel-based snapshots are browser-engine specific.
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Visual baselines are maintained for Chromium only.'
  );

  // CI runs on Linux, while initial screenshots are created on Windows.
  // Enable visual checks in CI only after Linux baselines are generated
  // and committed (RUN_VISUAL_CI=true).
  test.skip(
    Boolean(process.env.CI) && process.env.RUN_VISUAL_CI !== 'true',
    'Visual CI requires Linux-specific snapshot baselines.'
  );

  for (const viewport of visualViewports) {
    test(`TC-GUI-005: Homepage screenshot - ${viewport.name}`, async ({ page }) => {
      const homePage = new MoroSystemsHomePage(page);

      await test.step('01 - Set viewport and open homepage', async () => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await homePage.open(homeUrl);
        await waitForFonts(page);
      });

      await test.step('02 - Compare viewport with homepage baseline', async () => {
        // Capture the visible viewport, not the entire long homepage.
        await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
          animations: 'disabled',
          caret: 'hide',
          fullPage: false,
          scale: 'css',
          maxDiffPixelRatio: 0.005,
          timeout: 20_000,
        });
      });
    });

    test(`TC-GUI-006: Careers screenshot - ${viewport.name}`, async ({ page }) => {
      const homePage = new MoroSystemsHomePage(page);
      const careerPage = new MoroSystemsCareerPage(page);

      await test.step('01 - Set viewport and open Careers', async () => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        await homePage.openPage(careersUrl);
        await homePage.rejectOptionalCookiesIfPresent();
        await careerPage.verifyPage(careersUrl);
      });

      await test.step(`02 - Select ${filterCity} and verify jobs`, async () => {
        await careerPage.filterByCity(filterCity);
        await careerPage.verifyFilteredPositions(filterCity);
        await waitForFonts(page);
      });

      await test.step('03 - Compare filtered job list with baseline', async () => {
        // A component screenshot includes the job list even when it is
        // below the fold on mobile-sized viewports.
        const jobList = page.locator('.c-positions');
        await expect(jobList).toBeVisible();

        await expect(jobList).toHaveScreenshot(`careers-${viewport.name}.png`, {
          animations: 'disabled',
          caret: 'hide',
          scale: 'css',
          maxDiffPixelRatio: 0.005,
          timeout: 20_000,
        });
      });
    });
  }
});
