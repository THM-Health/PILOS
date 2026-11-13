import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { expect } from "../support/test.js";

const test = mergeTests(roomControllerTest, roomTypeControllerTest);

test.describe("Banner", () => {
  test.use({ authenticated: true });

  test.describe("enabled", () => {
    test.beforeEach(async ({ configResponse }) => {
      Object.assign(configResponse.data.banner, {
        enabled: true,
        title: "Banner title",
        icon: "fa-solid fa-door-open",
        message: "Banner text message",
        link: `https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b`,
        link_text: "Example link",
        link_style: "link",
        link_target: "blank",
        color: "#FFFFFF",
        background: "#000000",
      });
    });

    test("shows title, icon and message", async ({ page }) => {
      await page.goto("/");

      const banner = page.getByTestId("app-banner");
      await expect(banner.getByTestId("banner-title")).toContainText(
        "Banner title",
      );
      await expect(banner.getByTestId("banner-icon")).toHaveClass(
        /fa-solid fa-door-open/,
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner text message",
      );
    });

    test("uses the configured colors", async ({ page }) => {
      await page.goto("/");

      const banner = page.getByTestId("app-banner");
      await expect(banner).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(banner).toHaveCSS("background-color", "rgb(0, 0, 0)");
    });

    test("shows the link", async ({ page }) => {
      await page.goto("/");

      const link = page
        .getByTestId("app-banner")
        .getByTestId("banner-link-button");
      await expect(link).toHaveAttribute(
        "href",
        `https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b`,
      );
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveText("Example link");
      await expect(link).toHaveAttribute("data-p-severity", "link");
      await expect(link).toHaveClass(/p-0 underline/);
      await expect(link).toHaveCSS("color", "rgb(255, 255, 255)");
    });

    test("updates after the settings changed", async ({
      page,
      configResponse,
    }) => {
      await page.goto("/");
      await expect(page.getByTestId("app-banner")).toBeVisible();

      Object.assign(configResponse.data.banner, {
        title: "New banner title",
        message: "Banner message",
        color: "#000000",
        background: "#ef4444",
        icon: null,
        link: null,
      });
      await page.reload();

      const banner = page.getByTestId("app-banner");
      await expect(banner).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(banner).toHaveCSS("background-color", "rgb(239, 68, 68)");
      await expect(banner.getByTestId("banner-title")).toContainText(
        "New banner title",
      );
      await expect(banner.getByTestId("banner-message")).toHaveText(
        "Banner message",
      );
    });

    test("hides icon and link if not configured", async ({
      page,
      configResponse,
    }) => {
      configResponse.data.banner.icon = null;
      configResponse.data.banner.link = null;

      await page.goto("/");

      await expect(page.getByTestId("app-banner")).toBeVisible();
      await expect(page.getByTestId("banner-icon")).toBeHidden();
      await expect(page.getByTestId("banner-link-button")).toBeHidden();
    });
  });

  test("check banner link works correctly", async ({
    page,
    configResponse,
    baseURL,
  }) => {
    Object.assign(configResponse.data.banner, {
      enabled: true,
      title: "Banner title",
      link: baseURL + "/rooms",
      link_text: "Room link",
      link_style: "danger",
      link_target: "self",
      color: "#FFFFFF",
      background: "#000000",
    });

    // Requests needed to show the room index page (target of the link)

    await page.goto("/");

    const banner = page.getByTestId("app-banner");
    const link = banner.getByTestId("banner-link-button");
    await expect(banner).toHaveCSS("background-color", "rgb(0, 0, 0)");
    await expect(banner.getByTestId("banner-icon")).toBeHidden();
    await expect(banner.getByTestId("banner-message")).toBeHidden();
    await expect(link).toHaveAttribute("href", baseURL + "/rooms");
    await expect(link).toHaveAttribute("target", "_self");
    await expect(link).toHaveAttribute("data-p-severity", "danger");
    await expect(link).not.toHaveClass(/p-0 underline/);

    await link.click();

    // Redirect worked and the banner is still shown
    await expect(page).toHaveURL(/\/rooms/);
    await expect(banner.getByTestId("banner-title")).toContainText(
      "Banner title",
    );
    await expect(link).toHaveText("Room link");
  });

  test("check banner hidden if disabled", async ({ page, configResponse }) => {
    configResponse.data.banner.enabled = false;
    configResponse.data.banner.title = "Banner title";

    await page.goto("/");

    // Wait for the page to be rendered, otherwise the check below could pass too early
    await expect(page.getByTestId("app-footer")).toBeVisible();
    await expect(page.getByTestId("app-banner")).toBeHidden();
  });
});
