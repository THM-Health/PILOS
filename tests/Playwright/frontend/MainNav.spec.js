import { test, expect } from "../support/test.js";

test.describe("Main navigation", () => {
  test("shows no main menu entries for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to be rendered, otherwise the checks below could pass too early
    await expect(page.getByTestId("app-footer")).toBeVisible();
    await expect(page.getByTestId("navbar-rooms")).toHaveCount(0);
    await expect(page.getByTestId("navbar-meetings")).toHaveCount(0);
    await expect(page.getByTestId("navbar-admin")).toHaveCount(0);
    await expect(page.getByTestId("navbar-monitor")).toHaveCount(0);
  });

  test.describe("authenticated", () => {
    test.use({ authenticated: true });

    test.beforeEach(async ({ currentUserResponse }) => {
      currentUserResponse.data.permissions = [];
    });

    test("shows only rooms entry without permissions", async ({ page }) => {
      await page.goto("/");

      await expect(page.getByTestId("navbar-rooms")).toHaveAttribute(
        "href",
        "/rooms",
      );
      await expect(page.getByTestId("navbar-meetings")).toHaveCount(0);
      await expect(page.getByTestId("navbar-admin")).toHaveCount(0);
      await expect(page.getByTestId("navbar-monitor")).toHaveCount(0);
    });

    test("shows meetings entry with meetings.viewAny permission", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.permissions = ["meetings.viewAny"];

      await page.goto("/");

      await expect(page.getByTestId("navbar-rooms")).toHaveAttribute(
        "href",
        "/rooms",
      );
      await expect(page.getByTestId("navbar-meetings")).toHaveAttribute(
        "href",
        "/meetings",
      );
      await expect(page.getByTestId("navbar-admin")).toHaveCount(0);
      await expect(page.getByTestId("navbar-monitor")).toHaveCount(0);
    });

    test("shows admin entry with admin.view permission", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.permissions = ["admin.view"];

      await page.goto("/");

      await expect(page.getByTestId("navbar-rooms")).toHaveAttribute(
        "href",
        "/rooms",
      );
      await expect(page.getByTestId("navbar-meetings")).toHaveCount(0);
      await expect(page.getByTestId("navbar-admin")).toHaveAttribute(
        "href",
        "/admin",
      );
      await expect(page.getByTestId("navbar-monitor")).toHaveCount(0);
    });

    test("shows monitor menu with system.monitor permission", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.permissions = ["system.monitor"];

      await page.goto("/");

      await expect(page.getByTestId("navbar-rooms")).toHaveAttribute(
        "href",
        "/rooms",
      );
      await expect(page.getByTestId("navbar-monitor")).toBeVisible();
      await expect(page.getByTestId("navbar-meetings")).toHaveCount(0);
      await expect(page.getByTestId("navbar-admin")).toHaveCount(0);
    });

    test.describe("monitor submenu", () => {
      test.beforeEach(async ({ currentUserResponse }) => {
        currentUserResponse.data.permissions = ["system.monitor"];
      });

      for (const [name, monitor] of [
        ["horizon", { horizon: true, pulse: false, telescope: false }],
        ["pulse", { horizon: true, pulse: true, telescope: false }],
        ["telescope", { horizon: true, pulse: false, telescope: true }],
      ]) {
        test(`shows ${name} entry`, async ({ page, configResponse }) => {
          configResponse.data.monitor = monitor;

          await page.goto("/");
          await page.locator("#mainmenu").getByTestId("navbar-monitor").click();
          const submenu = page.locator("#mainmenu").getByTestId("submenu");
          await expect(submenu).toBeVisible();

          const entry = submenu.getByTestId(`navbar-monitor-${name}`);
          await expect(entry).toHaveAttribute("href", `/${name}`);
          await expect(entry).toHaveAttribute("target", "_blank");
        });
      }

      test("hides pulse entry when monitor.pulse is false", async ({
        page,
        configResponse,
      }) => {
        configResponse.data.monitor = {
          horizon: true,
          pulse: false,
          telescope: true,
        };

        await page.goto("/");
        await page.locator("#mainmenu").getByTestId("navbar-monitor").click();
        const submenu = page.locator("#mainmenu").getByTestId("submenu");
        await expect(submenu).toBeVisible();

        await expect(
          submenu.getByTestId("navbar-monitor-horizon"),
        ).toBeVisible();
        await expect(submenu.getByTestId("navbar-monitor-pulse")).toHaveCount(
          0,
        );
      });

      test("hides telescope entry when monitor.telescope is false", async ({
        page,
        configResponse,
      }) => {
        configResponse.data.monitor = {
          horizon: true,
          pulse: true,
          telescope: false,
        };

        await page.goto("/");
        await page.locator("#mainmenu").getByTestId("navbar-monitor").click();
        const submenu = page.locator("#mainmenu").getByTestId("submenu");
        await expect(submenu).toBeVisible();

        await expect(
          submenu.getByTestId("navbar-monitor-horizon"),
        ).toBeVisible();
        await expect(
          submenu.getByTestId("navbar-monitor-telescope"),
        ).toHaveCount(0);
      });
    });
  });
});
