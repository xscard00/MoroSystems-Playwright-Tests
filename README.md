# MoroSystems – QA Automation Assignment

[![MoroSystems QA Automation](https://github.com/xscard00/MoroSystems-Playwright-Tests/actions/workflows/playwright.yml/badge.svg)](https://github.com/xscard00/MoroSystems-Playwright-Tests/actions/workflows/playwright.yml)

Automated API and web UI tests implemented with **Playwright and TypeScript** for the MoroSystems Automation Tester assignment. The project demonstrates a maintainable Page Object Model, typed API requests, positive and negative assertions, cross-browser testing, responsive checks, visual regression, and GitHub Actions CI.

**Repository:** https://github.com/xscard00/MoroSystems-Playwright-Tests

## Known limitations and API contract discrepancies

> [!WARNING]
> **Google CAPTCHA — manual assistance required.** Google can challenge automated searches and redirect to `/sorry/`. The `TC-GUI-001` scenario cannot reliably run unattended; it is marked `@manual-captcha` and excluded from CI. The test does not bypass CAPTCHA. Google result titles, ordering and sponsored placements may also change. See [Google E2E](#google-end-to-end-scenario-manual-assistance).

> [!CAUTION]
> **Todo API: documented HTTP 400 vs actual HTTP 404.** For nonexistent IDs, both `DELETE /tasks/{id}` and `POST /tasks/{id}/complete` currently return HTTP **404**, although OpenAPI v1.1.0 documents **400**. Tests `TC-API-005` and `TC-API-006` report these as **expected failures**, not as backend passes. See [evidence and reproduction](#contract-evidence-and-how-to-reproduce).

> [!IMPORTANT]
> **Assignment says PUT; actual API uses POST.** The assignment describes updating a task with `PUT`, but the published Todo API contract exposes `POST /tasks/{id}`. The client uses the implemented `POST` endpoint. See [the original requirement and OpenAPI evidence](#contract-evidence-and-how-to-reproduce).


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

## Installation from a clean Windows PC (PowerShell)

The following setup works when **Git, Node.js, npm, VS Code and Playwright are not installed yet**. You do **not** need to install TypeScript, Python, Java, Docker or Playwright globally. Project-local dependencies are installed through `npm ci`; browser binaries are installed separately through Playwright.

### 1. Install required software

Open **PowerShell** and verify that Windows Package Manager is available:

```powershell
winget --version
```

Install **Git** and **Node.js LTS with npm** (Node.js **24** is the version used in CI; a compatible version is needed locally):

```powershell
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

Visual Studio Code is **optional** (useful for viewing and debugging test code):

```powershell
winget install --id Microsoft.VisualStudioCode -e --source winget
```

If `winget` is missing, install the Windows **App Installer** or download the installers directly from [Git for Windows](https://git-scm.com/downloads/win), [Node.js](https://nodejs.org/en/download), and optionally [Visual Studio Code](https://code.visualstudio.com/download).

**Close and reopen PowerShell** after the installations so newly installed commands are available in `PATH`, then verify:

```powershell
git --version
node --version
npm.cmd --version
```

> [!NOTE]
> **PowerShell execution policy:** On a fresh Windows installation, running `npm` or `npx` may produce `npm.ps1 cannot be loaded because running scripts is disabled`. All Windows examples below use **`npm.cmd` and `npx.cmd`**, which avoid changing PowerShell security settings. As an alternative, users who understand their environment may set `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. Organization-managed Group Policy may override this setting. See [Microsoft's execution-policy documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy).

### 2. Clone this repository and install dependencies

In a new PowerShell terminal, create a workspace inside your Windows user profile (no administrator rights required):

```powershell
$workspace = Join-Path $HOME 'Projects'
New-Item -ItemType Directory -Force -Path $workspace | Out-Null
Set-Location $workspace
git clone https://github.com/xscard00/MoroSystems-Playwright-Tests.git
Set-Location .\MoroSystems-Playwright-Tests
npm.cmd ci
npx.cmd playwright install chromium firefox webkit
npm.cmd run typecheck
npm.cmd run test:list
```

The `npm ci` command installs the exact dependencies resolved in `package-lock.json`. It also installs Playwright Test and TypeScript locally. The separate `playwright install` command downloads the three browser engines used by the GUI projects; **you do not need to install Chrome, Firefox or Safari manually**.

> [!NOTE]
> For Linux, use `npm`/`npx` without `.cmd`; on supported Linux systems, `npx playwright install --with-deps chromium firefox webkit` also installs required system libraries. The visual snapshots included here are Windows-specific and are excluded from the standard scripts.

### 3. Start the Todo backend for API tests

Open a **second PowerShell terminal**, separate from the test terminal. The backend is a separate application and must remain running during API tests:

```powershell
Set-Location "$HOME\Projects\MoroSystems-Playwright-Tests"
git clone https://github.com/morosystems/todo-be.git todo-be
Set-Location .\todo-be
npm.cmd install
npm.cmd start
```

When the server is running, verify the local endpoint **from another terminal**:

```powershell
Invoke-RestMethod 'http://localhost:8080/tasks'
```

The API base URL defaults to `http://localhost:8080`. If using a different host/port, set it in the **test terminal**:

```powershell
$env:TODO_API_URL = 'http://localhost:8080'
```

The `todo-be/` directory is excluded by `.gitignore`. If the backend is already cloned and running, do not clone it again.

### 4. Run the tests in the first terminal

```powershell
Set-Location "$HOME\Projects\MoroSystems-Playwright-Tests"
npm.cmd run typecheck
npm.cmd run test:api       # requires running backend
npm.cmd run test:gui       # public website, browsers and internet required
npm.cmd test               # all default API + functional/responsive GUI tests
npx.cmd playwright show-report
```

**Expected results:** API: six scenarios (four ordinary passes and two known expected failures); GUI: 51 runs across Chromium, Firefox and WebKit. Google CAPTCHA and visual snapshots are excluded from the default scripts.

> [!TIP]
> If the API fails with `ECONNREFUSED`, check that the Todo backend terminal is still running and that `http://localhost:8080/tasks` responds. If GUI tests cannot launch a browser, rerun `npx.cmd playwright install chromium firefox webkit`.

## Running tests

Run these commands from the **test repository's root**:

| Command | Purpose |
| --- | --- |
| `npm.cmd run typecheck` | Check TypeScript types without emitting files |
| `npm.cmd run test:list` | List discovered Playwright tests |
| `npm.cmd run test:api` | Run the 6 Todo API scenarios (backend required) |
| `npm.cmd run test:gui` | Run GUI projects, excluding manual Google and visual tests |
| `npm.cmd run test:gui:chromium` | GUI tests in Chromium |
| `npm.cmd run test:gui:firefox` | GUI tests in Firefox |
| `npm.cmd run test:gui:webkit` | GUI tests in WebKit |
| `npm.cmd test` | Run API and GUI projects, excluding manual Google and visual tests |
| `npx.cmd playwright show-report` | Open the latest HTML test report |

**Default scripts are portable:** `npm.cmd test` and `npm.cmd run test:gui` exclude both `@manual-captcha` and `@visual`. The 10 Windows visual checks are **opt-in**, using the dedicated command below. On Linux/macOS, use `npm`/`npx` rather than their Windows `.cmd` variants.

### Google end-to-end scenario (manual assistance)

> [!WARNING]
> **CAPTCHA can block the Google end-to-end flow.** This scenario requires an attended run and cannot guarantee unattended completion. The Google search result may also be a sponsored listing, which is not guaranteed to appear.

The Google scenario is tagged `@manual-captcha` because Google may show an anti-bot/CAPTCHA challenge. The test **does not bypass CAPTCHA**. Run it interactively in Chromium:

```powershell
$env:MANUAL_CAPTCHA = 'true'
npm.cmd run test:google:manual
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
npx.cmd playwright test tests/gui/moro-visual.spec.ts --project=chromium --workers=1
```

**Only when intentionally accepting a visual change**, regenerate the baselines and review the resulting images before committing them:

```powershell
npx.cmd playwright test tests/gui/moro-visual.spec.ts --project=chromium --workers=1 --update-snapshots
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

### Contract evidence and how to reproduce

The following findings come from **three separate sources**: the original **MoroSystems Automation Tester assignment (page 3)**, the official Todo backend **OpenAPI v1.1.0**, and the backend's actual HTTP responses captured in our automated tests.

**Source references:**

- [Official Todo backend repository](https://github.com/morosystems/todo-be) — clone and run this backend, not a mock.
- **Generated OpenAPI JSON:** [`http://localhost:8080/v3/api-docs`](http://localhost:8080/v3/api-docs) — available **after starting the backend**. Also inspect the Swagger UI at [`http://localhost:8080/api-docs`](http://localhost:8080/api-docs).
- **Observed behavior and assertions:** [`tests/api/todo-negative.spec.ts`](tests/api/todo-negative.spec.ts), [`tests/api/todo-crud.spec.ts`](tests/api/todo-crud.spec.ts) and [`api/TodoApiClient.ts`](api/TodoApiClient.ts). These tests run against the real backend and record the HTTP status and error message.
- **Assignment reference:** *MoroSystems – Automation Tester Test Case*, page 3, API step 4, explicitly requests a **PUT** update; the supplied assignment PDF is external to this repository.

> [!CAUTION]
> **API contract mismatch #1 — delete nonexistent task**  
> OpenAPI `DELETE /tasks/{id}` documents **HTTP 400** (`ID of task was not found`). The real backend returns **HTTP 404** with `id not found, nothing to delete`. Demonstrated by **TC-API-005** (`@known-issue`).

> [!CAUTION]
> **API contract mismatch #2 — complete nonexistent task**  
> OpenAPI `POST /tasks/{id}/complete` documents **HTTP 400** (`ID of task was not found`). The real backend returns **HTTP 404** with `id not found, nothing to complete`. Demonstrated by **TC-API-006** (`@known-issue`).

Both tests use Playwright's **expected-failure** mechanism **only when that exact known 404 status and message occur**. A new unexpected error (for example, HTTP 500) remains an unexpected failure. If the backend returns the documented 400, the test can pass normally. Note that **404 is not inherently an invalid HTTP design choice** for an unknown resource; the defect here is the inconsistency with the *published contract*.

> [!IMPORTANT]
> **Assignment vs implementation — PUT / POST**  
> The assignment requests `PUT` for task updates. The **actual OpenAPI specification** lists `POST /tasks/{id}` as *“Updates text of given task, then returns modified task”*; `PUT /tasks/{id}` is not declared there. [`TodoApiClient.updateTask()`](api/TodoApiClient.ts) deliberately uses `POST`. The discrepancy is documented instead of treating an unsupported `PUT` as a working endpoint.

**Reproduce the evidence locally** in PowerShell while `todo-be` is running:

```powershell
# 1. Inspect the documented methods/status codes (OpenAPI v1.1.0):
$spec = Invoke-RestMethod 'http://localhost:8080/v3/api-docs'
$spec.info.version
$spec.paths.'/tasks/{id}'.PSObject.Properties.Name
$spec.paths.'/tasks/{id}'.delete.responses.PSObject.Properties.Name
$spec.paths.'/tasks/{id}/complete'.post.responses.PSObject.Properties.Name

# 2. Observe what the backend actually returns for unknown IDs:
curl.exe -i -X DELETE 'http://localhost:8080/tasks/nonexistent-readme-check'
curl.exe -i -X POST 'http://localhost:8080/tasks/nonexistent-readme-check/complete'
```

The OpenAPI lists `400` among the error responses for both operations, while the two commands against the tested backend version return `404`. The current tests also verify the response body, not just the status code. The API implementation and OpenAPI may change in the future; always compare the outputs from the backend version being tested.

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
