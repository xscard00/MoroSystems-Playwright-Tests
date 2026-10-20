import { expect, test, type Page } from '@playwright/test';

import { MoroSystemsHomePage } from '../../pages/MoroSystemsHomePage';
import { MoroSystemsCareerPage } from '../../pages/MoroSystemsCareerPage';

/**
 * TC-GUI-003/004: Responsive layout checks for MoroSystems.
 *
 * Each viewport runs as an independent test in Chromium, Firefox and WebKit.
 * The dimensions below are CSS pixels, which control responsive breakpoints.
 * They are not the physical pixel resolutions of mobile or tablet displays.
 *
 * The tests verify essential content, horizontal overflow and city filtering.
 * They do not replace visual regression testing or full mobile emulation.
 */
const homeUrl = 'https://www.morosystems.cz/';
const careersUrl = 'https://www.morosystems.cz/kariera/';
const filterCity = 'Brno';

/**
 * Representative CSS viewports, including large desktop displays.
 *
 * High-density mobile and tablet screens may have 2-3 times as many
 * physical pixels; CSS viewport width is what matters for responsive CSS.
 */
const viewports = [
  { name: 'Mobile', width: 390, height: 844 },
  { name: 'Large mobile', width: 430, height: 932 },
  { name: 'Tablet portrait', width: 820, height: 1180 },
  { name: 'Tablet landscape', width: 1180, height: 820 },
  { name: 'Full HD desktop', width: 1920, height: 1080 },
  { name: 'QHD desktop', width: 2560, height: 1440 },
  { name: '4K UHD desktop', width: 3840, height: 2160 },
] as const;

/**
 * Verifies that the document does not overflow horizontally.
 *
 * A 2 CSS-pixel tolerance allows for subpixel layout rounding differences.
 * This detects page-level overflow but not clipped text inside components.
 *
 * @param page Playwright page with the tested viewport dimensions.
 */
async function verifyNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(
    async () => page.evaluate(() => {
      const root = document.documentElement;
      return Math.max(0, root.scrollWidth - root.clientWidth);
    }),
    {
      message: 'The page must not require horizontal scrolling.',
      timeout: 5_000,
    }
  ).toBeLessThanOrEqual(2);
}

for (const viewport of viewports) {
  test(`TC-GUI-003: Homepage responsive layout - ${viewport.name}`, async ({ page }) => {
    const homePage = new MoroSystemsHomePage(page);

    await test.step(`01 - Set ${viewport.name} viewport (${viewport.width}x${viewport.height})`, async () => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
    });

    await test.step('02 - Open and verify MoroSystems homepage', async () => {
      await homePage.open(homeUrl);
      await expect(
        page.getByRole('heading', { level: 1 }).filter({ visible: true }).first(),
        'The homepage must display a visible primary heading.'
      ).toBeVisible();
    });

    await test.step('03 - Verify homepage has no horizontal overflow', async () => {
      await verifyNoHorizontalOverflow(page);
    });
  });

  test(`TC-GUI-004: Careers responsive layout - ${viewport.name}`, async ({ page }) => {
    const homePage = new MoroSystemsHomePage(page);
    const careerPage = new MoroSystemsCareerPage(page);

    await test.step(`01 - Set ${viewport.name} viewport (${viewport.width}x${viewport.height})`, async () => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
    });

    await test.step('02 - Open and verify Careers page', async () => {
      // Navigate directly: mobile navigation may differ from desktop menus.
      await homePage.openPage(careersUrl);
      await homePage.acceptCookiesIfPresent();
      await careerPage.verifyPage(careersUrl);
    });

    await test.step('03 - Verify Careers has no horizontal overflow', async () => {
      await verifyNoHorizontalOverflow(page);
    });

    await test.step(`04 - Verify city filtering at ${viewport.name} width`, async () => {
      await careerPage.filterByCity(filterCity);
      await careerPage.verifyFilteredPositions(filterCity);
    });
  });
}
