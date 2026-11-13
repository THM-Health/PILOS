---
title: Testing
---

Our goal is to build a high-quality product by focusing equally on robust architecture, smooth UI/UX design, and accessible experiences. By combining these elements, we aim to deliver a stable, reliable, and user-friendly platform.

Maintaining product quality is an ongoing process that requires consistent effort. To prevent quality degradation over time, we have established a comprehensive testing strategy that includes the following components:

1. **PHP Backend Testing**
    - We use several levels of backend testing, including unit testing, integration testing and more. These tests ensure that each component works correctly and integrates seamlessly with others.

2. **Frontend Testing**
    - Our frontend tests focus on isolated End-to-End (E2E) testing, with most tests stubbing the backend. This allows us to validate the frontend functionality independently and comprehensively.

3. **System Testing**
    - We perform system testing to verify that the entire application works as expected. This includes ensuring that the Docker container initialises correctly, and confirming that the frontend and backend work together seamlessly.

4. **Visual Regression Testing**
    - Visual regression testing is our latest addition. These tests help us to quickly identify and fix visual inconsistencies, ensuring a consistent user interface and experience.

By combining these testing methods, we ensure that PILOS maintains its high quality standards and continues to meet user expectations.

## PHP Backend Testing with PHPUnit

The backend of PILOS is written in PHP and uses the Laravel framework.
Laravel provides a robust PHPUnit based testing system that allows us to test the application on different levels.
You can learn more about Laravel testing in the [official documentation](https://laravel.com/docs/11.x/testing).

To run the full test suite using a real BigBlueButton server you need to set the test server in the `.env` file:

```bash
BBB_TEST_SERVER_HOST=https://your-bbb-server.com/bigbluebutton/
BBB_TEST_SERVER_SECRET=your-secret
```

To run all the tests, you can use the following command:

```bash
./sail artisan test
```

You can also pass the following options to the `test` command:

- `--parallel` to run the tests in parallel
- `--coverage` to generate a code coverage report
- `--coverage-html <REPORT_DIR>` to generate a code coverage report in HTML format

### Coverage

Before you can run the tests with coverage, you need to enable `xdebug` and set its mode to `coverage` in the `.env` file:

```bash
ENABLE_XDEBUG=yes
XDEBUG_MODE=coverage
```

## Frontend Testing with Cypress

The frontend of PILOS is written in JavaScript and uses the Vue.js framework.
For testing Cypress is used. You can learn more about Cypress in the [official documentation](https://docs.cypress.io/guides/overview/why-cypress).

The tests stub the backend API requests with fixtures. This allows us to test the frontend in isolation and without the need for a running backend.
It also helps to simulate a lot of different edge cases and error scenarios.

### Installing Cypress

First you need to fulfill the [system requirements](https://docs.cypress.io/app/get-started/install-cypress#System-requirements) of Cypress.
Please make sure your OS is supported and all required packages are installed.

If the system requirements are met, you can install Cypress on your local machine:

```bash
npx cypress install
```

### Installing Chrome for Testing

Cypress tests run using [Chrome for Testing](https://developer.chrome.com/docs/automation-and-testing/chrome-for-testing/) to provide a reproducible and reliable test environment.

By default, our Cypress setup automatically downloads the latest stable version of Chrome for Testing.

To use a specific version, you can install it with [Puppeteer’s CLI](https://pptr.dev/browsers-api#cli) and select that version in the Cypress UI.

### Running Cypress Tests

First you need to have the frontend either running compiled (`./sail npm run build`) or in development mode (`./sail npm run dev`).

You can then run the tests in the interactive mode with:

```bash
npm run cypress:open
```

Or you can run the tests headless with:

```bash
npm run cypress:run
```

### Coverage

The code coverage of the frontend tests is measured by the browser itself (V8, Chromium only) and mapped back to the sources, including the `<script>` of the Vue components, with source maps. The frontend must be built with source maps and without minification:

```bash
./sail npm run build -- --config vite.config.coverage.js
```

After that you can run the tests with coverage enabled. The report is created in the `coverage` directory (`lcov.info`, `coverage-final.json`) and a summary is printed:

```bash
COVERAGE=true npx playwright test --project=frontend
```

Remember to build the frontend normally again (`./sail npm run build`) afterwards. The template of a Vue component is compiled to a render function, so only the script part is shown line by line.

## System Testing with Cypress

System tests are used to verify that the entire application operates as expected.
To ensure that the frontend and backend work together seamlessly, the tests are using the real backend API and a real BigBlueButton server.
The tests are also using Cypress for functional testing.

To run the system tests a separate docker-compose file needs to be started:

```bash
docker compose -f compose.test.yml -f compose.test.local.yml up -d
```

Before running the tests make sure you have correctly installed cypress as described in the [Installing cypress](#installing-cypress) section.

You can then run the tests in the interactive mode with:

```bash
npm run cypress:open -- -P ./tests/System
```

Or you can run the tests headless with:

```bash
npm run cypress:run -- -P ./tests/System
```

## Visual Regression Testing with Playwright

We aim to cover as much functionality as possible with our frontend tests. However, testing every aspect of the application can be challenging and sometimes simply not possible, e.g. layout shifts, canvas rendered charts, etc.

PILOS relies on several third-party libraries, such as UI components (PrimeVue), charts (Chart.js) and others. Frequent updates to these libraries require us to ensure that our application continues to look and behave as expected. To detect visual regressions we use the native screenshot comparison of [Playwright](https://playwright.dev/docs/test-snapshots).

The visual tests live in `tests/Playwright/visual` and are run with the `visual` project. Like the frontend tests they mock config, auth and page APIs, but they load English translations from the real `/api/v1/locale` API (same as the old Cypress visual suite). The baseline screenshots are committed to the repository next to the tests (`__screenshots__`).

### Adding Screenshots in Tests

```javascript
await expect(page.getByTestId("chart")).toHaveScreenshot("chart.png");
```

### Baseline Environment

Screenshots differ between operating systems (fonts, anti-aliasing), so baselines are only created in the Linux environment that is also used by the GitHub Action runner. Create or update them with the official Playwright image (the host name of `APP_URL` must be reachable from the container):

```bash
docker run --rm -v "$PWD":/work -w /work --ipc=host mcr.microsoft.com/playwright:v1.65.0-noble \
  npx playwright test --project=visual --update-snapshots
```

If a screenshot differs from the baseline, the test fails and the actual, expected and diff images are available in the `playwright-visual-results` artifact of the workflow run. Review the change and either fix the bug or update the baseline.
