
/**
 * Central configuration of URLs used by GUI tests.
 *
 * Environment variables allow overriding URLs
 * without changing Page Object source code.
 */

export const URLS = {
  google: process.env.GOOGLE_URL ??
    'https://www.google.com/?hl=en',

  moroHome: process.env.MORO_HOME_URL ??
    'https://www.morosystems.cz/',

  moroCareers: process.env.MORO_CAREERS_URL ??
    'https://www.morosystems.cz/kariera/',
};
