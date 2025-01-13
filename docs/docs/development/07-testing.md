---
title: Testing
---

Our goal is to build a high-quality product by focusing equally on robust architecture, smooth UI/UX design, and accessible experiences. By combining these elements, we aim to deliver a stable, reliable, and user-friendly platform.

Maintaining product quality is an ongoing process that requires consistent effort. To prevent quality degradation over time, we have established a comprehensive testing strategy, which includes the following components:

1. **PHP Backend Testing**

    - We employ multiple levels of backend tests, including unit tests, integration tests, and more. These tests ensure that each component functions correctly and integrates seamlessly with others.

2. **Frontend Testing**

    - Our frontend tests focus on isolated End-to-End (E2E) testing, with most tests stubbing the backend. This allows us to validate the frontend functionality independently and comprehensively.

3. **System Testing**

    - We conduct system tests to verify that the entire application operates as expected. These include ensuring the Docker container initializes correctly and confirming that the frontend and backend work together seamlessly.

4. **Visual Regression Testing**
    - Visual regression tests are our latest addition. These tests help us quickly identify and address visual inconsistencies, ensuring a consistent user interface and experience.

By combining these testing methodologies, we ensure that PILOS maintains its high standards of quality and continues to meet user expectations.

## PHP Backend Testing with PHPUnit

The backend of PILOS is written in PHP and uses the Laravel framework.
Laravel provides a robust PHPUnit based test system that allows us to test the application at different levels.
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

To run the frontend tests, you first have to install cypress outside the container:

```bash
npx cypress install
```

Next you need to have the frontend either running compiled (`./sail npm run build`) or in development mode (`./sail npm run dev`).

You can then run the tests in the interactive mode with:

```bash
npx cypress open
```

Or you can run the tests headless with:

```bash
npx cypress run
```

### Coverage

To generate a code coverage report the frontend first has to be instrumented to the coverage can be measured.
This can build the frontend with the coverage instrumentation:

```bash
./sail npm run build -- --config vite.config.coverage.js
```

After that you can run the tests with the coverage report:

```bash
npx cypress run
```

To generate a code coverage report in HTML format you can use the following command:

```bash
./sail npm run create-coverage-report
```

## System Testing with Cypress

System tests are used to verify that the entire application operates as expected.

To run the system tests we have a separate docker-compose file that needs to be started:

```bash
docker compose -f compose.test.yml -f compose.test.local.yml up -d
```

You can then run the tests in the interactive mode with:

```bash
npx cypress open -P ./tests/System
```

Or you can run the tests headless with:

```bash
npx cypress run -P ./tests/System
```

## Visual Regression Testing with Happo.io

We aim to cover as much functionality as possible with our frontend tests. However, testing every aspect of the application can be challenging
and sometimes simply not possible, e.g. layout shifts, svg rendered charts, etc.

PILOS relies on several third-party libraries, such as UI Components (PrimeVue), Charts (Chart.js), and others. While these libraries are generally high quality and well-tested, they may occasionally introduce bugs, regressions, or integration issues within our application. Frequent updates to these libraries further necessitate ensuring that our application continues to look and behave as expected.

Identifying visual regressions manually is a time-consuming and error-prone process, which has been a significant pain point in the past. To address this, we have implemented visual regression testing using [Happo](https://happo.io/).

Happo is a powerful tool that enables us to take screenshots of our application and compare them against previous versions to detect visual changes.
Integrating Happo into our existing Cypress test system was straightforward, and we will extend its use to all areas of the application where visual changes are expected.

### Automated Testing Environment

To ensure consistent results, we run visual regression tests exclusively in the GitHub Action runner. This controlled environment minimizes discrepancies and provides reliable feedback.

When a screenshot differs from the baseline, we can review the changes and determine whether it indicate a bug or an intentional update.

### Adding Screenshots in Tests

To capture a screenshot for visual regression testing, simply add the `.happoScreenshot()` command to the Cypress chain. For example:

```javascript
cy.get("button").happoScreenshot();
```

### Debugging Tests Locally

Although visual regression tests run exclusively in the GitHub Action runner, you can write and debug tests locally. Use the following command to open Cypress for interactive debugging:

```bash
npx cypress open -P ./tests/Visual --config experimentalInteractiveRunEvents=true
```

This setup allows you to ensure your tests are functioning correctly before committing changes.

By leveraging Happo for visual regression testing, we can maintain a high standard of visual quality in our application while minimizing manual effort.
