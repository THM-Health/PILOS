import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { expect, expectToastAndClose } from "../support/test.js";

import { validationErrors, mockApiRequest } from "../support/utils.js";

const test = mergeTests(roomControllerTest, roomTypeControllerTest);

test.describe("General", () => {
  test.use({ authenticated: true });

  test.describe("locales", () => {
    test("all locales get rendered", async ({ page }) => {
      await page.goto("/rooms");

      await page.getByTestId("navbar-locale").click();
      const submenu = page.getByTestId("submenu").nth(1);
      await expect(submenu.locator("li")).toHaveCount(3);
      await expect(submenu.getByTestId("navbar-locale-de")).toHaveText(
        "Deutsch",
      );
      await expect(submenu.getByTestId("navbar-locale-en")).toHaveText(
        "English",
      );
      await expect(submenu.getByTestId("navbar-locale-fr")).toHaveText(
        "Français",
      );
    });

    test("hide locale menu if only one locale is available", async ({
      page,
      configResponse,
    }) => {
      // NOTE: the Cypress version mocked /api/v1/locales, which the app never calls, so it passed vacuously.
      configResponse.data.general.enabled_locales = { en: "English" };

      await page.goto("/rooms");

      // Wait for the page to be rendered, otherwise the check below could pass too early
      await expect(page.getByTestId("room-search")).toBeVisible();
      await expect(page.getByTestId("navbar-locale")).toBeHidden();
    });

    test.describe("changing selected locale", () => {
      test.beforeEach(async ({ page, postLocaleApiMock }) => {
        // Hold the locale request to be able to check the loading state
        postLocaleApiMock.respondWith({ status: 200, hold: true });

        await page.goto("/rooms");
        await expect(page.getByTestId("room-search")).toBeVisible();
        await expect(page.getByTestId("overlay")).toBeHidden();

        await page.getByTestId("navbar-locale").click();
        const submenu = page.getByTestId("submenu").nth(1);
        await expect(submenu).toBeVisible();
        await expect(submenu.getByTestId("navbar-locale-de")).toHaveText(
          "Deutsch",
        );
        await submenu.getByTestId("navbar-locale-de").click();
      });

      test("shows overlay while the locale is changed", async ({
        page,
        postLocaleApiMock,
      }) => {
        await expect(page.getByTestId("overlay")).toBeVisible();

        postLocaleApiMock.release();
        await expect(page.getByTestId("overlay")).toBeHidden();
      });

      test("sends the locale and loads the new locale", async ({
        postLocaleApiMock,
        getLocaleDeApiMock,
      }) => {
        postLocaleApiMock.release();

        await expect(postLocaleApiMock).toHaveReceivedRequest({
          json: { locale: "de" },
        });
        await getLocaleDeApiMock.waitForRequest();
      });

      test("closes the menu", async ({
        page,
        postLocaleApiMock,
        getLocaleDeApiMock,
      }) => {
        postLocaleApiMock.release();

        await getLocaleDeApiMock.waitForRequest();
        await expect(page.getByTestId("submenu").nth(1)).toBeHidden();
      });
    });

    test.describe("changing selected locale error", () => {
      test("shows validation error and does not change the language on 422", async ({
        page,
        postLocaleApiMock,
        getLocaleDeApiMock,
      }) => {
        const localeRequest = postLocaleApiMock.waitForNextRequest();
        postLocaleApiMock.respondWith(
          validationErrors({ locale: ["Test"] }, "Test"),
        );

        await page.goto("/rooms");
        await page.getByTestId("navbar-locale").click();
        await page
          .getByTestId("submenu")
          .nth(1)
          .getByTestId("navbar-locale-de")
          .click();

        await localeRequest;
        await expectToastAndClose(page, "Test");
        // The request for the new language must not have been sent
        expect(getLocaleDeApiMock.requests).toHaveLength(0);
      });

      test("shows server error and does not change the language on 500", async ({
        page,
        postLocaleApiMock,
        getLocaleDeApiMock,
      }) => {
        const localeRequest = postLocaleApiMock.waitForNextRequest();
        postLocaleApiMock.respondWith({
          status: 500,
          json: { message: ["Test"] },
        });

        await page.goto("/rooms");
        await page.getByTestId("navbar-locale").click();
        await page
          .getByTestId("submenu")
          .nth(1)
          .getByTestId("navbar-locale-de")
          .click();

        await localeRequest;
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":["Test"]}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        expect(getLocaleDeApiMock.requests).toHaveLength(0);
      });
    });

    test.describe("PrimeVue locale", () => {
      test.beforeEach(async ({ postLocaleApiMock }) => {
        postLocaleApiMock.respondWith({
          status: 200,
        });
      });

      test("uses locale with exact match", async ({
        page,
        getLocaleDeApiMock,
      }) => {
        const getLocaleDeRequestsAfterChange = getLocaleDeApiMock.respondWith({
          path: "tests/Playwright/fixtures/en.json",
        });

        await page.goto("/rooms");
        await expect(page.getByTestId("room-search")).toBeVisible();

        await page.getByTestId("navbar-locale").click();
        const submenu = page.getByTestId("submenu").nth(1);
        await expect(submenu).toBeVisible();
        await expect(submenu.getByTestId("navbar-locale-de")).toHaveText(
          "Deutsch",
        );
        const deLocale = getLocaleDeRequestsAfterChange.waitForNextRequest();
        await submenu.getByTestId("navbar-locale-de").click();
        await deLocale;

        await expect(
          page.getByTestId("paginator-next-button").first(),
        ).toHaveAttribute("aria-label", "Nächste Seite");
        await expect(
          page.getByTestId("paginator-page").first(),
        ).toHaveAttribute("aria-label", "Seite 1");
      });

      test("uses parent locale for invalid language-region codes (de-XX -> de)", async ({
        page,
        configResponse,
      }) => {
        // (imaginary) region-specific locale that is supported by the backend but not by PrimeLocale
        configResponse.data.general.enabled_locales = {
          en: "English",
          "de-xx": "Deutsch",
        };
        const getLocaleDeXxApiMock = await mockApiRequest(
          page,
          "GET",
          "locale/de-xx",
          { path: "tests/Playwright/fixtures/en.json" },
        );

        await page.goto("/rooms");
        await expect(page.getByTestId("room-search")).toBeVisible();

        await page.getByTestId("navbar-locale").click();
        const submenu = page.getByTestId("submenu").nth(1);
        await expect(submenu).toBeVisible();
        await expect(submenu.getByTestId("navbar-locale-de-xx")).toHaveText(
          "Deutsch",
        );
        const deXxLocale = getLocaleDeXxApiMock.waitForNextRequest();
        await submenu.getByTestId("navbar-locale-de-xx").click();
        await deXxLocale;

        // PrimeVue uses German as fallback for the unsupported regional German locale
        await expect(
          page.getByTestId("paginator-next-button").first(),
        ).toHaveAttribute("aria-label", "Nächste Seite");
        await expect(
          page.getByTestId("paginator-page").first(),
        ).toHaveAttribute("aria-label", "Seite 1");
      });

      test("uses local fallback (en) for unsupported PrimeLocale locales", async ({
        page,
        configResponse,
      }) => {
        configResponse.data.general.enabled_locales = {
          en: "English",
          xx: "Invalid locale",
        };
        const getLocaleXxApiMock = await mockApiRequest(
          page,
          "GET",
          "locale/xx",
          { path: "tests/Playwright/fixtures/en.json" },
        );

        await page.goto("/rooms");
        await expect(page.getByTestId("room-search")).toBeVisible();

        await page.getByTestId("navbar-locale").click();
        const submenu = page.getByTestId("submenu").nth(1);
        await expect(submenu).toBeVisible();
        await expect(submenu.getByTestId("navbar-locale-xx")).toHaveText(
          "Invalid locale",
        );
        const xxLocale = getLocaleXxApiMock.waitForNextRequest();
        await submenu.getByTestId("navbar-locale-xx").click();
        await xxLocale;

        // PrimeVue pagination falls back to English
        await expect(
          page.getByTestId("paginator-next-button").last(),
        ).toHaveAttribute("aria-label", "Next Page");
        await expect(page.getByTestId("paginator-page").last()).toHaveAttribute(
          "aria-label",
          "Page 1",
        );
      });
    });
  });

  test.describe("welcome page", () => {
    test("disabled welcome page redirects unauthenticated users to login", async ({
      page,
      configResponse,
      getCurrentUserApiMock,
    }) => {
      configResponse.data.general.no_welcome_page = true;
      configResponse.data.auth.local = true;
      getCurrentUserApiMock.respondWith({ json: {} });

      await page.goto("/");

      await expect(page).toHaveURL(/\/login\?redirect=\/rooms/);
      await expect(page.getByTestId("login-tab-button-local")).toBeVisible();
    });

    test("disabled welcome page redirects authenticated users to rooms overview", async ({
      page,
      configResponse,
    }) => {
      configResponse.data.general.no_welcome_page = true;

      await page.goto("/");

      await expect(page).toHaveURL(/\/rooms/);
      await expect(page.getByTestId("room-search")).toBeVisible();
    });

    test("welcome page shown", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("h1")).toContainText("home.title");
    });
  });

  test.describe("help button", () => {
    test("shows help button with link if help url specified", async ({
      page,
      configResponse,
    }) => {
      configResponse.data.general.help_url = `https://thm-health.github.io/PILOS-Redirect_Test_Pages/help?foo=a&bar=b`;

      await page.goto("/");

      const help = page.getByTestId("navbar-help");
      await expect(help).toBeVisible();
      await expect(help).toHaveAttribute(
        "href",
        `https://thm-health.github.io/PILOS-Redirect_Test_Pages/help?foo=a&bar=b`,
      );
      await expect(help).toHaveAttribute("target", "_blank");
    });

    test("help button opens the help url", async ({ page, configResponse }) => {
      const helpUrl = `https://thm-health.github.io/PILOS-Redirect_Test_Pages/help?foo=a&bar=b`;
      configResponse.data.general.help_url = helpUrl;
      // eslint-disable-next-line no-restricted-syntax -- external URL, not an API request
      await page.route(helpUrl, (route) =>
        route.fulfill({ contentType: "text/html", body: "help" }),
      );

      await page.goto("/");

      // Open in the same tab instead of a new one
      const help = page.getByTestId("navbar-help");
      await expect(help).toBeVisible();
      await help.evaluate((link) => link.removeAttribute("target"));
      await help.click();

      await expect(page).toHaveURL(helpUrl);
    });

    test("help button hidden if help url not specified", async ({
      page,
      configResponse,
    }) => {
      configResponse.data.general.help_url = "";

      await page.goto("/");

      // Wait for the page to be rendered, otherwise the check below could pass too early
      await expect(page.getByTestId("navbar-dark-mode")).toBeVisible();
      await expect(page.getByTestId("navbar-help")).toBeHidden();
    });
  });

  test.describe("dark mode", () => {
    test("change to dark mode", async ({ page }) => {
      await page.goto("/");

      const toggle = page.getByTestId("navbar-dark-mode");
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await expect(toggle.locator("svg")).toHaveAttribute(
        "data-test",
        "navbar-dark-mode-disabled-icon",
      );

      await toggle.click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expect(toggle.locator("svg")).toHaveAttribute(
        "data-test",
        "navbar-dark-mode-enabled-icon",
      );

      await toggle.click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await expect(toggle.locator("svg")).toHaveAttribute(
        "data-test",
        "navbar-dark-mode-disabled-icon",
      );
    });

    test.describe("system dark mode", () => {
      test.use({ colorScheme: "dark" });

      test("change to light mode", async ({ page }) => {
        await page.goto("/");

        const toggle = page.getByTestId("navbar-dark-mode");
        await expect(page.locator("html")).toHaveClass(/dark/);
        await expect(toggle.locator("svg")).toHaveAttribute(
          "data-test",
          "navbar-dark-mode-enabled-icon",
        );

        await toggle.click();
        await expect(page.locator("html")).not.toHaveClass(/dark/);
        await expect(toggle.locator("svg")).toHaveAttribute(
          "data-test",
          "navbar-dark-mode-disabled-icon",
        );

        await toggle.click();
        await expect(page.locator("html")).toHaveClass(/dark/);
        await expect(toggle.locator("svg")).toHaveAttribute(
          "data-test",
          "navbar-dark-mode-enabled-icon",
        );
      });
    });
  });

  test.describe("enforced color mode", () => {
    test.describe("light", () => {
      // Prefer dark mode to verify that light mode is actually enforced
      test.use({ colorScheme: "dark" });

      test("hides the dark mode button and forces light mode", async ({
        page,
        configResponse,
      }) => {
        configResponse.data.theme.enforced_color_mode = "light";

        await page.goto("/");

        // Wait for the navbar to render before asserting that the toggle is hidden
        await expect(page.getByTestId("navbar-locale")).toBeVisible();
        await expect(page.getByTestId("navbar-dark-mode")).toHaveCount(0);
        await expect(page.locator("html")).not.toHaveClass(/dark/);
      });
    });

    test.describe("dark", () => {
      // Prefer light mode to verify that dark mode is actually enforced
      test.use({ colorScheme: "light" });

      test("hides the dark mode button and forces dark mode", async ({
        page,
        configResponse,
      }) => {
        configResponse.data.theme.enforced_color_mode = "dark";

        await page.goto("/");

        // Wait for the navbar to render before asserting that the toggle is hidden
        await expect(page.getByTestId("navbar-locale")).toBeVisible();
        await expect(page.getByTestId("navbar-dark-mode")).toHaveCount(0);
        await expect(page.locator("html")).toHaveClass(/dark/);
      });
    });
  });

  test.describe("invalid route params", () => {
    const invalidPaths = [
      "/rooms/..%2Fother",
      "/rooms/abc%2Fdef",
      "/rooms/abc%3Ffoo",
      "/rooms/abc%26foo",
      "/rooms/abc_def_123",
      "/rooms/abc.def.123",
      "/rooms/..%2Fother/join",
      "/rooms/abc_def/invalid_personalized_link",
      "/rooms/abc-def-123/..%2Fother",
      "/rooms/abc-def-123/%3Ffoo",
      "/rooms/abc-def-123/token-with-hyphen",
      "/rooms/abc-def-123/token_with_underscore",
    ];

    const invalidAdminIds = ["abc", "..%2Fother", "2abc", "2.0"];
    for (const resource of [
      "users",
      "roles",
      "room_types",
      "servers",
      "server_pools",
    ]) {
      for (const id of invalidAdminIds) {
        invalidPaths.push(`/admin/${resource}/${id}`);
        invalidPaths.push(`/admin/${resource}/${id}/edit`);
      }
    }

    for (const path of invalidPaths) {
      test(`rejects ${path}`, async ({ page }) => {
        // The resource requests must never be sent for invalid route params
        const resourceRequests = [];
        page.on("request", (request) => {
          if (
            /\/api\/v1\/(rooms|users|roles|roomTypes|servers|serverPools)(\/|\?|$)/.test(
              new URL(request.url()).pathname + new URL(request.url()).search,
            )
          ) {
            resourceRequests.push(`${request.method()} ${request.url()}`);
          }
        });

        await page.goto(path);

        await expect(page).toHaveURL(/\/404/);
        await expect(page.getByText("app.not_found")).toBeVisible();
        expect(resourceRequests).toEqual([]);
      });
    }
  });
});
