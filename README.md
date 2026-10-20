# MoroSystems – QA Automation Assignment

[![MoroSystems QA Automation](https://github.com/xscard00/MoroSystems-Playwright-Tests/actions/workflows/playwright.yml/badge.svg)](https://github.com/xscard00/MoroSystems-Playwright-Tests/actions/workflows/playwright.yml)

Automated API and web UI tests implemented with **Playwright and TypeScript** for the MoroSystems Automation Tester assignment. The project demonstrates a maintainable Page Object Model, typed API requests, positive and negative assertions, cross-browser testing, responsive checks, visual regression, and GitHub Actions CI.

**Repository:** https://github.com/xscard00/MoroSystems-Playwright-Tests

## Test coverage

| Area | Scenarios | Execution |
| --- | --- | --- |
| Todo API | 6 scenarios: CRUD, completion/reopening, validation, and unknown IDs | Playwright API project |
| Careers UI | 3 city filters: Brno, Praha, Hradec Králové | Chromium, Firefox, WebKit (9 runs) |
| Responsive UI | Homepage and Careers across 7 CSS viewport sizes | Chromium, Firefox, WebKit (42 runs) |
| Visual regression | Homepage and filtered Careers list at 5 viewport sizes | Chromium on Windows (10 runs) |
| Google-to-Careers E2E | Google search → MoroSystems → Careers → Brno filter | Assisted local run only; excluded from CI |

**CI executes 57 test instances:** 6 API and 51 functional/responsive UI. The two documented API contract mismatches are intentionally reported as *expected failures*; they are not hidden or silently accepted. The Google and visual tests are excluded from unattended CI for the reasons described below.

### Responsive viewport matrix

The following dimensions are **CSS pixels**, not physical display pixels:

| Profile | Viewport |
| --- | --- |
| Mobile | 390 × 844 |
| Large mobile | 430 × 932 |
| Tablet portrait | 820 × 1180 |
| Tablet landscape | 1180 × 820 |
| Full HD desktop | 1920 × 1080 |
| QHD desktop | 2560 × 1440 |
| 4K UHD desktop | 3840 × 2160 |

Responsive tests verify key page content, the absence of document-level horizontal overflow (with a 2 CSS-pixel tolerance), and working Careers filtering. They do not claim to emulate actual mobile hardware or detect every possible visual defect.

## Technology and structure

- **TypeScript** and **Playwright Test** (`@playwright/test`)
- **Page Object Model (POM)** for UI interactions and assertions
- **Typed API client** for the Todo backend; Playwright's `request` fixture for HTTP calls
- **Parameterized tests** for cities and viewport sizes
- **GitHub Actions** for API and cross-browser GUI execution
- **HTML reports**, test steps, screenshots on failure, and traces retained on failure

```text
.
├── .github/
│   └── workflows/
│       └── playwright.yml          # Separate API and GUI CI jobs
├── api/
│   ├── TodoApiClient.ts            # HTTP operations
│   └── TodoTypes.ts                # Request and response types
├── pages/
│   ├── BasePage.ts
│   ├── GoogleSearchPage.ts
│   ├── GoogleResultsPage.ts
│   ├── MoroSystemsHomePage.ts
│   └── MoroSystemsCareerPage.ts
├── tests/
│   ├── api/
│   │   ├── todo-crud.spec.ts
│   │   └── todo-negative.spec.ts
│   └── gui/
│       ├── google-to-career.spec.ts
│       ├── moro-career.spec.ts
│       ├── moro-responsive.spec.ts
│       ├── moro-visual.spec.ts
│       └── moro-visual.spec.ts-snapshots/  # Committed Windows baselines
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── package-lock.json
```

## Prerequisites

- **Node.js 24** and npm (the CI workflow uses Node.js 24)
- Git
- Playwright browsers for GUI tests
- A running [MoroSystems Todo backend](https://github.com/morosystems/todo-be) for API tests
- Internet access for tests against the public MoroSystems website

The commands below can be run from **PowerShell on Windows**, unless otherwise noted.

## Installation

```powershell
git clone https://github.com/xscard00/MoroSystems-Playwright-Tests.git
cd MoroSystems-Playwright-Tests
npm ci
npx playwright install chromium firefox webkit
npm run typecheck
```

For Linux environments, Playwright also supports installing browser system dependencies with `npx playwright install --with-deps chromium firefox webkit` (used in CI).

### Start the Todo backend (API tests)

In a **separate terminal**, from the test repository's root:

```powershell
git clone https://github.com/morosystems/todo-be.git todo-be
cd todo-be
npm install
npm start
```

Keep the server running while executing API tests in another terminal. By default, tests expect it at **`http://localhost:8080`**; the CI workflow verifies readiness using `GET /tasks`.

To target another API origin, set `TODO_API_URL` before running the tests:

```powershell
$env:TODO_API_URL = 'http://localhost:8080'
npm run test:api
```

The locally cloned `todo-be/` directory is ignored by Git.

## Running tests

Run these commands from the **test repository's root**:

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Check TypeScript types without emitting files |
| `npm run test:list` | List discovered Playwright tests |
| `npm run test:api` | Run the 6 Todo API scenarios (backend required) |
| `npm run test:gui` | Run GUI projects, excluding manual Google tests |
| `npm run test:gui:chromium` | GUI tests in Chromium |
| `npm run test:gui:firefox` | GUI tests in Firefox |
| `npm run test:gui:webkit` | GUI tests in WebKit |
| `npm test` | Run API and GUI projects, excluding manual Google tests |
| `npx playwright show-report` | Open the latest HTML test report |

**Important:** The `npm test` and `npm run test:gui` scripts do **not** exclude `@visual`. On Windows, they can run the Chromium visual checks against the committed Windows baselines; on other local operating systems those baseline comparisons are not portable. For a platform-independent functional GUI run, use the same exclusion as CI:

```powershell
npx playwright test --project=chromium --project=firefox --project=webkit --grep-invert '@manual-captcha|@visual' --workers=2
```

### Google end-to-end scenario (manual assistance)

The Google scenario is tagged `@manual-captcha` because Google may show an anti-bot/CAPTCHA challenge. The test **does not bypass CAPTCHA**. Run it interactively in Chromium:

```powershell
$env:MANUAL_CAPTCHA = 'true'
npm run test:google:manual
```

Complete any Google challenge manually, then resume execution in **Playwright Inspector**. The scenario currently looks for a Google result headed `MoroSystems.cz`; Google result titles and placement (including sponsored results) can change. This makes the scenario unsuitable for unattended CI. To unset the variable afterward:

```powershell
Remove-Item Env:\MANUAL_CAPTCHA
```

### Visual regression (Windows)

Visual checks use Playwright's `toHaveScreenshot()` and are tagged `@visual`. They compare the homepage viewport and the **filtered Careers job-list component** at five sizes: mobile, tablet, Full HD, QHD, and 4K UHD.

The committed reference images are in:

```text
tests/gui/moro-visual.spec.ts-snapshots/
```

Playwright appends the browser engine and operating system to snapshot names, for example `homepage-mobile-chromium-win32.png`.

Run the comparisons on **Windows** with a compatible Playwright/browser environment:

```powershell
npx playwright test tests/gui/moro-visual.spec.ts --project=chromium --workers=1
```

**Only when intentionally accepting a visual change**, regenerate the baselines and review the resulting images before committing them:

```powershell
npx playwright test tests/gui/moro-visual.spec.ts --project=chromium --workers=1 --update-snapshots
```

Font rendering and other pixels may differ by operating system. GitHub Actions therefore **excludes `@visual`**; enabling Linux visual comparisons would first require separately generated and reviewed Linux baselines. Snapshot generation itself is not proof that a visual comparison has passed—the subsequent non-update run performs that comparison.

## API coverage and known contract differences

The tests use the backend's **OpenAPI v1.1.0** contract and make assertions about both HTTP status codes and response data. Test-created tasks use unique identifiers/text and are cleaned up after execution, allowing API tests to run in parallel.

| Test | Scenario | Expected outcome |
| --- | --- | --- |
| `TC-API-001` | List, create, verify, update, verify, delete, verify deletion | Pass |
| `TC-API-002` | Complete task, verify completed list, reopen, verify removal | Pass |
| `TC-API-003` | Create task without required `text` | HTTP 422 |
| `TC-API-004` | Update task without required `text` | HTTP 422 |
| `TC-API-005` | Delete a nonexistent task | Known contract mismatch |
| `TC-API-006` | Complete a nonexistent task | Known contract mismatch |

**Known API issues:**

1. **`DELETE /tasks/{id}` with an unknown ID:** OpenAPI documents HTTP **400**, but the backend returns **404** with `id not found, nothing to delete`.
2. **`POST /tasks/{id}/complete` with an unknown ID:** OpenAPI documents HTTP **400**, but the backend returns **404** with `id not found, nothing to complete`.

These two tests are tagged `@known-issue` and use Playwright's **expected-failure** mechanism *only when the specific documented 404 response and message are observed*. Unexpected status codes still fail normally. If the backend starts returning the documented 400 response, the tests are able to pass normally.

**Method note:** The original assignment refers to a `PUT` update, but the actual Todo backend/OpenAPI implementation updates tasks via **`POST /tasks/{id}`**. The API client intentionally follows the implemented endpoint and records this discrepancy rather than issuing an unsupported request.

## Continuous integration

Workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)

GitHub Actions runs on pushes and pull requests targeting `main`/`master`, and can also be started manually. It uses **Ubuntu 24.04** and **Node.js 24**, with independent jobs:

- **API – Todo Backend:** installs dependencies, type-checks the project, clones and starts `morosystems/todo-be`, waits for backend readiness, and runs 6 API cases with two workers.
- **GUI – Cross Browser:** installs Chromium, Firefox and WebKit, type-checks, and runs 51 Careers/responsive test instances across all three browsers with two workers. It excludes `@manual-captcha` and `@visual`.

Each job uploads its **Playwright HTML report** as a separate GitHub Actions artifact (30-day retention). Failure diagnostics include test results, and the API job also uploads the backend log on failure. The most recently verified CI run for commit `a8c6540` finished with **55 ordinary passes and 2 expected API failures**, with no unexpected failures.

[View GitHub Actions runs](https://github.com/xscard00/MoroSystems-Playwright-Tests/actions)

## Design decisions and limitations

- Page Objects encapsulate browser interactions; test specs define the scenarios and expected outcomes.
- API calls are centralized in a small typed client instead of adding generated code to this exercise-sized project.
- The Google search flow requires manual intervention when challenged; it is not represented as fully automated CI coverage.
- Public job listings and page design may change over time, so GUI assertions and screenshot baselines may require maintenance.
- Responsive viewport checks are layout-oriented, not a substitute for full device emulation, accessibility auditing, or manual visual review.

---

*Prepared as an automation testing solution for the MoroSystems technical assignment.*
