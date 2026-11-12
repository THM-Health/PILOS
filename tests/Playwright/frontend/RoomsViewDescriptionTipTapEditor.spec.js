import { readFileSync } from "node:fs";
import { test, expect } from "../support/test.js";
import { mockMethod, selectTiptapContent } from "../support/utils.js";

const redirectBaseUrl =
  "https://thm-health.github.io/PILOS-Redirect_Test_Pages";
const EXTERNAL_LINK = `${redirectBaseUrl}/?foo=a&bar=b`;
const IMAGE_DESCRIPTION =
  '<img src="https://localhost/test.jpg" width="250px" alt="Test image"><p>Room description</p>';

/**
 * Mock the room request with the room fixture and the given description.
 */
async function mockRoomWithDescription(page, description) {
  const room = JSON.parse(
    readFileSync("tests/Playwright/fixtures/room.json", "utf8"),
  );
  room.data.description = description;
  await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123", {
    status: 200,
    json: room,
  });
}

test.describe("Rooms view description TipTap Editor", () => {
  test.use({ authenticated: true });

  test.describe("image", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomWithDescription(page, "<p>Room description</p>");
      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-description-edit-button").click();
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
    });

    test("cancel adding image", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-image-dialog");
      await expect(dialog).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-image-button")).toHaveClass(
        /p-button-secondary/,
      );
      await page.getByTestId("tip-tap-image-button").click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.description.modals.image.new");
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.cancel",
      );
      await dialog.getByTestId("dialog-cancel-button").click();

      await expect(dialog).toBeHidden();
    });

    test("add image validates src", async ({ page }) => {
      await page.getByTestId("tip-tap-image-button").click();

      const dialog = page.getByTestId("tip-tap-image-dialog");
      await expect(dialog).toContainText("rooms.description.modals.image.new");
      await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(
        dialog.getByTestId("tip-tap-image-delete-button"),
      ).toHaveCount(0);
      await expect(dialog.getByTestId("src-field")).toContainText(
        "rooms.description.modals.image.src",
      );
      await expect(dialog.locator("#src")).toHaveValue("");

      // Invalid src
      await dialog.locator("#src").fill("http://localhost/test.jpg");
      await expect(
        dialog.getByText("rooms.description.modals.image.invalid_src"),
      ).toBeVisible();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      // Valid src
      await dialog.locator("#src").fill("https://localhost/test.jpg");
      await expect(
        dialog.getByText("rooms.description.modals.image.invalid_src"),
      ).toHaveCount(0);
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
    });

    test("add image", async ({ page }) => {
      await page.getByTestId("tip-tap-image-button").click();

      const dialog = page.getByTestId("tip-tap-image-dialog");
      await expect(dialog.getByTestId("src-field")).toBeVisible();
      await dialog.locator("#src").fill("https://localhost/test.jpg");

      await expect(dialog.getByTestId("width-field")).toContainText(
        "rooms.description.modals.image.width",
      );
      await expect(dialog.locator("#width")).toHaveValue("");
      await dialog.locator("#width").fill("250px");

      await expect(dialog.getByTestId("alt-field")).toContainText(
        "rooms.description.modals.image.alt",
      );
      await expect(dialog.locator("#alt")).toHaveValue("");
      await dialog.locator("#alt").fill("Test image");

      await dialog.getByTestId("dialog-save-button").click();
      await expect(dialog).toBeHidden();

      const image = page.locator(".tiptap img");
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute("src", "https://localhost/test.jpg");
      await expect(image).toHaveAttribute("alt", "Test image");
      await expect(image).toHaveCSS("width", "250px");
    });
  });

  test.describe("existing image", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomWithDescription(page, IMAGE_DESCRIPTION);
      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-description-edit-button").click();
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();

      const image = page.locator(".tiptap img");
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute("src", "https://localhost/test.jpg");
      await expect(image).toHaveAttribute("alt", "Test image");
      await expect(image).toHaveCSS("width", "250px");
      await image.click();

      await expect(page.getByTestId("tip-tap-image-button")).toHaveClass(
        /p-button-primary/,
      );
      await page.getByTestId("tip-tap-image-button").click();
    });

    test("edit image validates src", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-image-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.description.modals.image.edit");
      await expect(dialog.locator("#src")).toHaveValue(
        "https://localhost/test.jpg",
      );

      // Invalid src
      await dialog.locator("#src").fill("http://localhost/test2.jpg");
      await expect(
        dialog.getByText("rooms.description.modals.image.invalid_src"),
      ).toBeVisible();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      // Valid src
      await dialog.locator("#src").fill("https://localhost/test2.jpg");
      await expect(
        dialog.getByText("rooms.description.modals.image.invalid_src"),
      ).toHaveCount(0);
      await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
    });

    test("edit image", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-image-dialog");
      await expect(dialog).toContainText("rooms.description.modals.image.edit");
      await expect(dialog.locator("#src")).toHaveValue(
        "https://localhost/test.jpg",
      );
      await expect(dialog.locator("#width")).toHaveValue("250px");
      await expect(dialog.locator("#alt")).toHaveValue("Test image");

      await dialog.locator("#src").fill("https://localhost/test2.jpg");
      await dialog.locator("#width").fill("300px");
      await dialog.locator("#alt").fill("Test image 2");
      await dialog.getByTestId("dialog-save-button").click();
      await expect(dialog).toBeHidden();

      const image = page.locator(".tiptap img");
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute("src", "https://localhost/test2.jpg");
      await expect(image).toHaveAttribute("alt", "Test image 2");
      await expect(image).toHaveCSS("width", "300px");
    });

    test("delete image", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-image-dialog");
      await expect(dialog).toContainText("rooms.description.modals.image.edit");
      await expect(
        dialog.getByTestId("tip-tap-image-delete-button"),
      ).toHaveText("app.delete");
      await dialog.getByTestId("tip-tap-image-delete-button").click();
      await expect(dialog).toBeHidden();

      await expect(page.locator(".tiptap p")).toHaveText("Room description");
      await expect(page.locator(".tiptap img")).toHaveCount(0);
    });
  });

  test.describe("new link", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomWithDescription(page, "<p>Room description</p>");
      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-description-edit-button").click();
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();

      await expect(page.locator(".tiptap")).toBeFocused();
      await expect(page.locator(".tiptap p")).toHaveText("Room description");
      await expect(page.locator(".tiptap a")).toHaveCount(0);

      await selectTiptapContent(page);
    });

    test("cancel adding link", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-link-dialog");
      await expect(dialog).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-link-button")).toHaveClass(
        /p-button-secondary/,
      );
      await page.getByTestId("tip-tap-link-button").click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.description.modals.link.new");
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.cancel",
      );
      await dialog.getByTestId("dialog-cancel-button").click();

      await expect(dialog).toBeHidden();
    });

    test("add link validates url", async ({ page }) => {
      await page.getByTestId("tip-tap-link-button").click();

      const dialog = page.getByTestId("tip-tap-link-dialog");
      await expect(dialog).toContainText("rooms.description.modals.link.new");
      await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(
        dialog.getByTestId("tip-tap-link-delete-button"),
      ).toHaveCount(0);
      await expect(dialog.getByTestId("url-field")).toContainText(
        "rooms.description.modals.link.url",
      );
      await expect(dialog.locator("#url")).toHaveValue("");

      // Invalid url
      await dialog.locator("#url").fill("invalid");
      await expect(
        dialog.getByText("rooms.description.modals.link.invalid_url"),
      ).toBeVisible();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      // Valid url
      await dialog.locator("#url").fill(EXTERNAL_LINK);
      await expect(
        dialog.getByText("rooms.description.modals.link.invalid_url"),
      ).toHaveCount(0);
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
    });

    test("add link", async ({ page }) => {
      await page.getByTestId("tip-tap-link-button").click();

      const dialog = page.getByTestId("tip-tap-link-dialog");
      await dialog.locator("#url").fill(EXTERNAL_LINK);
      await dialog.getByTestId("dialog-save-button").click();
      await expect(dialog).toBeHidden();

      await expect(page.locator(".tiptap")).toBeFocused();
      const link = page.locator(".tiptap a");
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", EXTERNAL_LINK);
      await expect(link).toHaveText("Room description");

      await expect
        .poll(() => page.evaluate(() => window.getSelection().toString()))
        .toBe("Room description");
    });
  });

  test.describe("existing link", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomWithDescription(
        page,
        `<a href="${EXTERNAL_LINK}">Test Link</a>`,
      );
      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-description-edit-button").click();
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();

      await expect(page.locator(".tiptap")).toBeFocused();
      const link = page.locator(".tiptap a");
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", EXTERNAL_LINK);
      await expect(link).toHaveText("Test Link");

      // Button is already active before the selection
      await expect(page.getByTestId("tip-tap-link-button")).toHaveClass(
        /p-button-primary/,
      );

      await selectTiptapContent(page);
      await expect(page.getByTestId("tip-tap-link-button")).toHaveClass(
        /p-button-primary/,
      );
      await page.getByTestId("tip-tap-link-button").click();
    });

    test("edit link validates url", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-link-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.description.modals.link.edit");
      await expect(dialog.locator("#url")).toHaveValue(EXTERNAL_LINK);

      // Invalid url
      await dialog.locator("#url").fill("invalid");
      await expect(
        dialog.getByText("rooms.description.modals.link.invalid_url"),
      ).toBeVisible();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();

      // Valid url
      await dialog.locator("#url").fill(redirectBaseUrl);
      await expect(
        dialog.getByText("rooms.description.modals.link.invalid_url"),
      ).toHaveCount(0);
      await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await expect(dialog.getByTestId("dialog-save-button")).toBeEnabled();
    });

    test("edit link", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-link-dialog");
      await expect(dialog).toContainText("rooms.description.modals.link.edit");
      await dialog.locator("#url").fill(redirectBaseUrl);
      await dialog.getByTestId("dialog-save-button").click();
      await expect(dialog).toBeHidden();

      await expect
        .poll(() => page.evaluate(() => window.getSelection().toString()))
        .toBe("Test Link");

      await expect(page.locator(".tiptap")).toBeFocused();
      const link = page.locator(".tiptap a");
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", redirectBaseUrl);
      await expect(link).toHaveText("Test Link");
    });

    test("delete link", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-link-dialog");
      await expect(dialog).toContainText("rooms.description.modals.link.edit");
      await expect(dialog.getByTestId("tip-tap-link-delete-button")).toHaveText(
        "app.delete",
      );
      await dialog.getByTestId("tip-tap-link-delete-button").click();
      await expect(dialog).toBeHidden();

      await expect
        .poll(() => page.evaluate(() => window.getSelection().toString()))
        .toBe("Test Link");

      await expect(page.locator(".tiptap p")).toHaveText("Test Link");
      await expect(page.locator(".tiptap a")).toHaveCount(0);
    });
  });

  test.describe("source code", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoomWithDescription(page, "<p>Room description</p>");
      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-description-edit-button").click();
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
      await expect(page.locator(".tiptap p")).toHaveText("Room description");
    });

    test("cancel changing source code", async ({ page }) => {
      const dialog = page.getByTestId("tip-tap-source-dialog");
      await expect(dialog).toHaveCount(0);
      await page.getByTestId("tip-tap-source-button").click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        "rooms.description.modals.source_code.title",
      );
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.cancel",
      );
      await dialog.getByTestId("dialog-cancel-button").click();

      await expect(dialog).toBeHidden();
    });

    test("change source code", async ({ page }) => {
      await page.getByTestId("tip-tap-source-button").click();

      const dialog = page.getByTestId("tip-tap-source-dialog");
      await expect(dialog).toContainText(
        "rooms.description.modals.source_code.title",
      );
      const textarea = dialog.getByTestId("source-textarea");
      await expect(textarea).toHaveValue("<p>Room description</p>");
      await textarea.pressSequentially("<h1>Additional room description</h1>");

      await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await dialog.getByTestId("dialog-save-button").click();
      await expect(dialog).toBeHidden();

      await expect(page.locator(".tiptap p").first()).toHaveText(
        "Room description",
      );
      await expect(page.locator(".tiptap h1")).toHaveText(
        "Additional room description",
      );
    });
  });
});
