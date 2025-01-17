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

To generate a code coverage report, the frontend must first be instrumented so that the coverage can be measured.
This command can be used to build the frontend with coverage instrumentation:

```bash
./sail npm run build -- --config vite.config.coverage.js
```

After that you can run the tests with the coverage report:

```bash
npm run cypress:run
```

To generate a code coverage report in HTML format you can use the following command:

```bash
./sail npm run create-coverage-report
```

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

## Visual Regression Testing with Happo.io

We aim to cover as much functionality as possible with our frontend tests. However, testing every aspect of the application can be challenging and sometimes simply not possible, e.g. layout shifts, svg rendered charts, etc.

PILOS relies on several third-party libraries, such as UI components (PrimeVue), charts (Chart.js) and others. While these libraries are generally high quality and well tested, they may occasionally introduce bugs, regressions or integration issues into our application. Frequent updates to these libraries also require us to ensure that our application continues to look and behave as expected.

Manually identifying visual regressions is a time-consuming and error-prone process that has been a significant pain point in the past. To address this, we implemented visual regression testing using [Happo](https://happo.io/).

Happo is a powerful tool that allows us to take screenshots of our application and compare them to previous versions to detect visual changes. Integrating Happo into our existing Cypress test system was straightforward and we will extend its use to all areas of the application where visual changes are expected.

By using Happo for visual regression testing, we can maintain a high standard of visual quality in our application while minimising manual effort.

### Automated Testing Environment

To ensure consistent results, we run visual regression tests exclusively in the GitHub Action runner. This controlled environment minimizes discrepancies and provides reliable feedback.

If a screenshot differs from the baseline, we can review the changes and determine whether this is a bug or an intentional change.

### Adding Screenshots in Tests

To capture a screenshot for visual regression testing, simply add the `.happoScreenshot()` command to the Cypress chain. For example:

```javascript
cy.get("button").happoScreenshot();
```

### Debugging Tests Locally

Although visual regression tests run exclusively in the GitHub Action runner, you can write and debug tests locally. Use the following command to open Cypress for interactive debugging:

Before running the tests make sure you have correctly installed cypress as described in the [Installing cypress](#installing-cypress) section.

```bash
npm run cypress:open -- -P ./tests/Visual --config experimentalInteractiveRunEvents=true
```

This setup allows you to ensure your tests are functioning correctly before committing changes.
