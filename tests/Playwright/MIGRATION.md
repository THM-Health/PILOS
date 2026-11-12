# Cypress → Playwright migration plan

Status: **PoC done** (this folder). 4 frontend specs (28 atomic tests) and 1 visual spec (2 screenshots) ported, all green.

```bash
npm run playwright:run          # headless, all PoC specs
npm run playwright:ui           # UI mode with time travel
```

## PoC scope and result

| Ported spec                        | Tests | What it proves                                                                |
| ---------------------------------- | ----- | ----------------------------------------------------------------------------- |
| `Banner`                           | 3     | fixture mutation, CSS assertions, `reload`, link navigation                   |
| `Login`                            | 5     | held ("indefinite") requests, request body/header assertions, cookies, toasts |
| `GeneralApplication` (locale part) | 4     | request spies, 422 handling, overlay/loading state                            |
| `RoomsViewBrowserNotification`     | 3     | replacing `cy.stub(win, "Notification")` via `addInitScript`                  |

The PoC uses native Playwright features wherever possible. Only `support/test.js` is custom (one `test.extend`, two small helpers).

| Cypress                                          | Playwright (native unless noted)                                                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cy.intercept` + fixture                         | `page.route` + `route.fulfill({ path \| json })`                                                                                                          |
| `cy.wait("@alias")`                              | `page.waitForRequest()` (create the promise before the action)                                                                                            |
| `interceptIndefinitely`                          | promise gate inside the `page.route` handler (inline)                                                                                                     |
| `cy.fixture` + mutate                            | custom fixtures `config` / `currentUser` (mutable, served for the test)                                                                                   |
| (no equivalent)                                  | **frontend tests never use the real API**: any `/api/` or `/sanctum/` request that is not mocked is blocked and fails the test (custom automatic fixture) |
| `cy.init()`                                      | custom option `test.use({ authenticated: true })`                                                                                                         |
| `cy.checkFinalState` + `window.it` override      | custom automatic fixture (no leftover toasts, no uncaught errors)                                                                                         |
| `cy.checkToastMessage`                           | custom `expectToastAndClose()`                                                                                                                            |
| `cy.stub(win, "Notification")`                   | custom `stubNotification()` via `page.addInitScript`                                                                                                      |
| `Cypress.expose("darkMode")` + `patchMatchMedia` | `test.use({ colorScheme: "dark" })`                                                                                                                       |
| clipboard permissions                            | not needed (Cypress-only workaround)                                                                                                                      |
| `data-test` selectors                            | `testIdAttribute: "data-test"` → `page.getByTestId()`                                                                                                     |
| viewport / TZ / reduced motion / accept-language | `use` in `playwright.config.js`                                                                                                                           |
| Chrome for Testing setup (`tests/Utils/cypress`) | not needed, Playwright's Chromium is a Chrome for Testing build                                                                                           |

### Projects

Projects group the suites and browsers (`tests/Playwright/{frontend,visual,system}`):

```bash
npm run playwright:run                           # --project=frontend (Chrome for Testing)
npx playwright test --project=frontend-firefox   # Firefox (npx playwright install firefox)
npm run playwright:run:all                       # all projects
```

`system` is configured but has no tests yet (it uses `http://localhost:9080`, the docker test stack).

### Visual tests (Happo removed)

Visual tests use Playwright's native `expect(locator).toHaveScreenshot()`; Happo, `happo.config.js` and the Cypress visual
suite (`tests/Visual`) are removed. Baselines are committed in `tests/Playwright/visual/__screenshots__` and are created in the
official Linux Playwright image (same as CI), see the command in `playwright.config.js` and `docs/docs/development/07-testing.md`.
Running the `visual` project on macOS will not match the Linux baselines, use Docker. The CI visual job now runs
`npx playwright test --project=visual` and uploads diffs as an artifact on failure.

Locale loading matches Cypress visual `cy.init()`: the visual project sets `mockLocale: false`, so `/api/v1/locale/*`
is not mocked and English strings come from the real locale API. Frontend tests keep mocking `/api/v1/locale/en` from
`en.json` (default `mockLocale: true`).

### Notification stub

The `Notification` stub is still needed. Natively (`permissions: ["notifications"]`) Chromium headless grants the permission for
`requestPermission()` but keeps `Notification.permission === "denied"`, which is what the app reads; Firefox reports `default`
and `requestPermission()` never resolves without a prompt. The "default, then granted/denied on request" flows cannot be
driven without the stub.

### Atomic tests

Cypress Cloud billed per test, so the Cypress suite favours very large tests (662 tests, median 80 lines, 184 over 150 lines,
53 over 300; largest: 1,443 lines for "change room type with expert mode enabled"). Playwright has no per-test cost and runs
tests in parallel, so port big tests as several small ones: one behaviour per test, shared setup in `beforeEach`, no
reload/second phase inside a test. The PoC specs show the pattern (Banner: 1 → 5 tests, Login: 5 → 13, locale change: 1 → 2).
Rule of thumb for the port: split any test over ~150 lines and every test with more than one `reload`/`visit` phase.

### Findings

0. **Cypress frontend tests leak real API calls.** With the new guard, the Login "redirect query" test turned out to call the real
   `/sanctum/csrf-cookie`. Expect more of these when porting; each one gets an explicit mock.
1. **Cypress passes a test vacuously.** `GeneralApplication` › "hide locale menu if only one locale is available"
   mocks `/api/v1/locales`, which the app never calls (locales come from `config.general.enabled_locales`). Cypress's
   `should("not.exist")` passed before the page had rendered. The ported test mocks the config and waits for the page.
   Expect more of these: auditing every `should("not.exist")` / `not.be.visible` is a side benefit of the port.
2. Playwright is stricter about locators (strict mode: a locator matching 2+ elements throws), which will surface
   ambiguous selectors, e.g. `cy.get(...).eq(1)` patterns need an explicit `.nth(1)` or a better test id.
3. Playwright runs tests fully in parallel per worker (one browser context each). Cypress ran 15 GeneralApplication tests
   in 18 s; the 15 PoC tests across 4 specs take about 7 s. Not a like-for-like benchmark, but the direction is clear.
4. The specs rely on the dev app being reachable at `APP_URL` (`TrustHosts` rejects other hosts), same as Cypress.

## Size of the job

| Suite                                   | Specs | Lines   | Notes                                                   |
| --------------------------------------- | ----- | ------- | ------------------------------------------------------- |
| `tests/Frontend/e2e` (mocked API)       | 82    | ~81,000 | ~11.6k `cy.get`, ~1.8k `cy.intercept`, 6 use `cy.clock` |
| `tests/Visual/e2e` (Happo)              | 1     | ~550    | needs Happo's Playwright integration                    |
| `tests/System/e2e` (real stack, docker) | 5     | ~550    | `seed` task shells out to `docker compose exec`         |
| Custom commands (`support/commands/*`)  | -     | ~1,900  | `checkPermissionGroup` alone is used ~670 times         |

The syntax change is mechanical, so most of it is codemod/LLM-assisted work plus review. The expensive parts are the
support layer (done in the PoC) and the Cypress-specific behaviours listed below.

## Decisions

| Topic            | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coverage         | V8 coverage collected by Playwright (Chromium, `COVERAGE=true`) and mapped to `resources/js/**` (Vue SFC `<script>` included) with source maps via `monocart-coverage-reports`, report in `coverage/` (`lcov.info`) for Codecov. Replaces istanbul instrumentation + nyc, whose statements for Vue SFCs were mostly compiled template code mapped to whole template lines. The coverage build is unminified with source maps (`vite.config.coverage.js`). |
| Reporting        | No hosted dashboard. HTML report + traces/screenshots are uploaded as GitHub artifacts (per shard).                                                                                                                                                                                                                                                                                                                                                       |
| Visual baselines | Created in the official Linux Playwright Docker image, see `npm run playwright:run:visual` / `07-testing.md`.                                                                                                                                                                                                                                                                                                                                             |
| Cutover          | Hard cutover on this branch: all specs are ported, then Cypress is removed in one go.                                                                                                                                                                                                                                                                                                                                                                     |
| Porting          | AI-assisted, one spec at a time, reviewed.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Browsers         | Chrome for Testing on every PR (5 shards), Firefox nightly (`nightly-frontend-firefox.yml`).                                                                                                                                                                                                                                                                                                                                                              |
| System tests     | Database reset **before every test** (`support/system.js`, same as Cypress `beforeEach`), therefore `--workers=1`.                                                                                                                                                                                                                                                                                                                                        |
| Support code     | Follows the `playwright-best-practices` skill: fixtures for per-test state and shared mocks, page objects only for UI with 5+ interactions in 3+ specs, stateless helper functions otherwise, no monkey patching.                                                                                                                                                                                                                                         |
| Fixtures         | Moved to `tests/Playwright/fixtures` (Cypress config points there until it is removed).                                                                                                                                                                                                                                                                                                                                                                   |
| Tooling          | `eslint-plugin-playwright` added. At cutover remove `cypress`, `@cypress/code-coverage`, `eslint-plugin-cypress`, `eslint-plugin-mocha`, `@puppeteer/browsers`, `cypress.config.js`, `tests/Utils/cypress`, `tests/Frontend`, `tests/System/{e2e,support,cypress.config.js}`.                                                                                                                                                                             |
| CI speed         | Frontend, visual and nightly Firefox tests run in the official Playwright image via `tools/playwright-docker.sh` (browsers and system libs preinstalled, tag derived from the installed `@playwright/test` version, so it also matches the visual baselines). `npm ci --ignore-scripts` with the npm cache for dependencies. System tests stay on the host (they call `docker compose exec`), so they still install Chromium.                             |
| Retries          | `retries: 2` on CI, `failOnFlakyTests: false` (flaky tests are reported, not failed). Both are in `playwright.config.js`; set `failOnFlakyTests: true` to make flakiness fail the build. Re-evaluate after a few weeks of CI data.                                                                                                                                                                                                                        |

## Porting guide (for each spec)

1. Read the Cypress spec and the support commands it uses. Port with `test` from `support/test.js` (`support/system.js` for system tests).
2. One behaviour per test; shared setup in `beforeEach`; split tests over ~150 lines and tests with several visit/reload phases.
3. Mock everything the page requests (`page.route`); unmocked `/api/` requests fail the test. Use `config` / `currentUser` fixtures and `test.use({ authenticated: true })`.
4. Wait for something rendered before asserting absence (`toBeHidden`, `toHaveCount(0)`), otherwise the assertion passes too early. Cypress specs contain such vacuous checks, fix them while porting.
5. **Structure the shared code like the `playwright-best-practices` skill (`.claude/skills/playwright-best-practices`) says; the skill
   wins over everything else in this guide.** Three layers, used together, each with a threshold before something is extracted
   (references: `architecture/pom-vs-fixtures.md`, `core/page-object-model.md`, `core/fixtures-hooks.md`, `core/test-suite-structure.md`):
    - **Fixtures** (`test.extend`) for everything with a lifecycle or per-test state: login state, `config`/`currentUser`, and the
      mocked data of an area (e.g. `role`, `permissions`, `room`). A test changes the fixture object before `page.goto()`, the
      fixture serves it. Mocks used by several spec files are centralised in fixtures (copy-pasted mocks are an anti-pattern),
      per area in a `test.extend` file next to `support/test.js`. One small fixture per resource, no monolithic fixtures.
    - **Page objects** for UI with 5+ interactions that is used in 3+ spec files (e.g. permission list, room files tab, settings
      image selector, profile image cropper). One class per logical page/component, locators as `readonly` properties, methods named
      after the user intent, provided as fixtures. They do not assert (tests assert on the exposed locators) and do not manage
      resources. No locator-only classes.
    - **Helper functions** (`support/utils.js`, `support/general.js`, ...) for stateless utilities: `readFixture`, `mockMethod`,
      `nthRequest`, `parseFormData`, `expectToastAndClose` and larger assertion helpers such as `checkPermissionGroup`. No module-level
      state. Start with a helper and promote it to a page object or fixture when it grows or needs a lifecycle.
    - **Do not abstract** one-liners (`page.getByTestId("x")`, `clickButton()`), anything used in fewer than 3 places, or
      anything that exists only for one spec. Repeating a few lines is better than a helper that readers have to look up.
    - **Spec files** contain imports, `test.use` and the tests: shared setup in `beforeEach`, one feature per test, tests independent
      of each other, test data written in the test or provided by a fixture (never a block of constants before the first test, never a
      spec-local `readFixture`/toast/mock helper). Split files that get long by feature instead of hiding code in helpers.
    - Reference spec: `frontend/AdminRolesEdit.spec.js` (flat tests; its repeated role mocks move to fixtures with the next step).
6. Port a Cypress command to `support/` only when a second spec needs it; helpers take `page` (or a locator) as first argument.
7. Run the spec in `--project=frontend` (and `--repeat-each=3` to catch flakiness) and run eslint/prettier.

## Remaining work

- Port the remaining 78 frontend specs, the 5 system specs and the remaining visual screenshots (the PoC covers 4 frontend specs, 1 visual spec).
- Verify the coverage upload on the first CI run (the CI image is built with `VITE_COVERAGE=true`; locally the app is not instrumented).
- **Cleanup pass after the port**: done. Every frontend spec starts with its first test right after the imports (no constants or spec-local helpers); repeated mocks are fixtures in `support/fixtures/*.js` (one file per area, `test.extend` on top of `support/test.js`), and there are two page objects in `support/pages/` (only UI with 5+ interactions in 3+ specs qualifies). The full frontend suite passes (2113 tests). Keep to rule 5 for new specs.
- Replace `cy.clock/tick` (6 specs) with `page.clock`.
- Cutover: remove Cypress packages/files (see Tooling), move docs (`07-testing.md`, `.ai/rules/js.md`) to Playwright, delete `tests/Frontend`.

Cutover criteria: same test count (or more, because of splitting, minus vacuous ones), coverage upload at parity, CI wall time not worse, no flaky specs over 20 consecutive runs.
