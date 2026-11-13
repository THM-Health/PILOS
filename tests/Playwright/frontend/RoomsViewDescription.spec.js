import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as participantNameCheckTest } from "../support/fixtures/participantNameCheck.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { RoomDescription } from "../support/pages/RoomDescription.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import {
  checkRoomAuthErrors,
  setValidRememberedParticipantName,
} from "../support/room.js";
import {
  mockApiRequest,
  validationErrors,
  serverError,
  modelNotFound,
} from "../support/utils.js";

const test = mergeTests(roomControllerTest, participantNameCheckTest);

test.describe("Rooms view description", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await setValidRememberedParticipantName(page, "Laura Rivera");
  });

  test.describe("permissions", () => {
    test("guest can not edit", async ({ page, roomResponse }) => {
      roomResponse.data.current_user = null;
      roomResponse.data.description = "<p>Room description</p>";
      await page.route("**/api/v1/currentUser", (route) =>
        route.fulfill({ json: {} }),
      );

      await page.goto("/rooms/abc-def-123");

      await expect(page.getByText("rooms.description.title")).toBeVisible();
      const viewer = page.getByTestId("room-description-viewer");
      await expect(viewer).toBeVisible();
      await expect(viewer.locator("p")).toHaveText("Room description");
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toHaveCount(0);
    });

    test("rooms.viewAll permission can not edit", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = ["rooms.viewAll"];
      roomResponse.data.description = "<p>Room description</p>";

      await page.goto("/rooms/abc-def-123");

      const viewer = page.getByTestId("room-description-viewer");
      await expect(viewer).toBeVisible();
      await expect(viewer.locator("p")).toHaveText("Room description");
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toHaveCount(0);
    });

    test("co-owner can edit", async ({ page, roomResponse }) => {
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      roomResponse.data.is_co_owner = true;
      roomResponse.data.description = "<p>Room description</p>";

      await page.goto("/rooms/abc-def-123");

      const viewer = page.getByTestId("room-description-viewer");
      await expect(viewer).toBeVisible();
      await expect(viewer.locator("p")).toHaveText("Room description");
      await expect(page.getByTestId("room-description-edit-button")).toHaveText(
        "app.edit",
      );
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toBeEnabled();
    });

    test("rooms.manage permission can edit", async ({
      page,
      currentUserResponse,
      roomResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll", "rooms.manage"];
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = [
        "rooms.viewAll",
        "rooms.manage",
      ];
      roomResponse.data.description = "<p>Room description</p>";

      await page.goto("/rooms/abc-def-123");

      const viewer = page.getByTestId("room-description-viewer");
      await expect(viewer).toBeVisible();
      await expect(viewer.locator("p")).toHaveText("Room description");
      await expect(page.getByTestId("room-description-edit-button")).toHaveText(
        "app.edit",
      );
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toBeEnabled();
    });
  });

  test.describe("edit description", () => {
    test.beforeEach(async ({ page, roomResponse }) => {
      roomResponse.data.description = "<p>Room description</p>";
      await page.goto("/rooms/abc-def-123");
      await expect(
        page.getByTestId("room-description-viewer").locator("p"),
      ).toHaveText("Room description");
    });

    test("open editor with current description", async ({ page }) => {
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
      await page.getByTestId("room-description-edit-button").click();

      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
      await expect(page.locator(".tiptap")).toBeFocused();
      await expect(page.locator(".tiptap p")).toHaveText("Room description");
    });

    test("cancel editing discards changes", async ({ page }) => {
      await page.getByTestId("room-description-edit-button").click();
      await expect(page.locator(".tiptap")).toBeFocused();
      await new RoomDescription(page).clearContent();

      await expect(
        page.getByTestId("room-description-cancel-edit-button"),
      ).toHaveText("app.cancel_editing");
      await page.getByTestId("room-description-cancel-edit-button").click();

      await expect(
        page.getByTestId("room-description-cancel-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
      await expect(
        page.getByTestId("room-description-viewer").locator("p"),
      ).toHaveText("Room description");

      // Open editor again and check that description stayed the same
      await page.getByTestId("room-description-edit-button").click();
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
      await expect(page.locator(".tiptap")).toBeFocused();
      await expect(page.locator(".tiptap p")).toHaveText("Room description");
    });

    test("save description", async ({ page, roomResponse }) => {
      await page.getByTestId("room-description-edit-button").click();
      await expect(page.locator(".tiptap")).toBeFocused();
      await new RoomDescription(page).clearContent();
      await page.locator(".tiptap").pressSequentially("New test description");

      const putRoomDescriptionApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/description",
        { status: 204, hold: true },
      );
      roomResponse.data.description = "<p>New test description</p>";

      await page.getByTestId("room-description-save-button").click();

      // Check loading
      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(
        page.getByTestId("room-description-cancel-edit-button"),
      ).toBeDisabled();
      await expect(
        page.getByTestId("room-description-save-button"),
      ).toBeDisabled();
      putRoomDescriptionApiMock.release();

      const request = await putRoomDescriptionApiMock.waitForRequest();
      expect(request.postDataJSON()).toEqual({
        description: "<p>New test description</p>",
      });

      // Check that editor is closed and new description is shown
      await expect(
        page.getByTestId("room-description-cancel-edit-button"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("room-description-viewer").locator("p"),
      ).toHaveText("New test description");
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toBeVisible();
    });
  });

  test.describe("formatting", () => {
    test.beforeEach(async ({ page, roomResponse }) => {
      roomResponse.data.description = "<p>New test description</p>";
      await page.goto("/rooms/abc-def-123");

      await page.getByTestId("room-description-edit-button").click();
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
      await expect(page.locator(".tiptap")).toBeFocused();
      await expect(page.locator(".tiptap p")).toHaveText(
        "New test description",
      );

      await new RoomDescription(page).selectContent();
    });

    test("text type dropdown", async ({ page }) => {
      const items = page.getByTestId("tip-tap-menu-dropdown-item-button");
      await expect(items).toHaveCount(0);

      await page.getByTestId("tip-tap-text-type-dropdown").click();

      await expect(items).toHaveCount(4);
      const labels = [
        "rooms.description.heading1",
        "rooms.description.heading2",
        "rooms.description.heading3",
        "rooms.description.paragraph",
      ];
      for (const [index, label] of labels.entries()) {
        await expect(items.nth(index)).toHaveText(label);
        await expect(items.nth(index)).toBeVisible();
      }

      await items.nth(0).click();
      await expect(items).toHaveCount(0);
    });

    test("change text type to heading", async ({ page }) => {
      await page.getByTestId("tip-tap-text-type-dropdown").click();
      await page
        .getByTestId("tip-tap-menu-dropdown-item-button")
        .nth(0)
        .click();

      const tiptap = page.locator(".tiptap");
      await expect(tiptap).toBeFocused();
      await expect(tiptap.locator("h1")).toHaveText("New test description");
      // Added trailing node
      await expect(tiptap.locator("p")).toHaveText("");
      await expect(tiptap.locator("p")).toBeVisible();

      await expect
        .poll(() =>
          page.evaluate(() => window.getSelection().toString().trim()),
        )
        .toBe("New test description");
    });

    test("bold button toggles bold", async ({ page }) => {
      await page.getByTestId("tip-tap-text-type-dropdown").click();
      await page
        .getByTestId("tip-tap-menu-dropdown-item-button")
        .nth(0)
        .click();
      await expect(page.locator(".tiptap h1")).toBeVisible();

      const bold = page.getByTestId("tip-tap-bold-button");
      await expect(bold).toBeVisible();
      await expect(bold).toHaveClass(/p-button-secondary/);
      await expect(bold).toHaveAttribute("data-p-severity", "secondary");
      await bold.click();

      await expect(bold).toHaveClass(/p-button-primary/);
      await expect(bold).toHaveAttribute("data-p-severity", "primary");

      // The selection stays the same
      await expect
        .poll(() =>
          page.evaluate(() => window.getSelection().toString().trim()),
        )
        .toBe("New test description");

      const tiptap = page.locator(".tiptap");
      await expect(tiptap).toBeFocused();
      await expect(tiptap.locator("h1 strong")).toHaveText(
        "New test description",
      );
    });

    test("save formatted description", async ({ page, roomResponse }) => {
      await page.getByTestId("tip-tap-text-type-dropdown").click();
      await page
        .getByTestId("tip-tap-menu-dropdown-item-button")
        .nth(0)
        .click();
      await page.getByTestId("tip-tap-bold-button").click();
      await expect(page.locator(".tiptap h1 strong")).toBeVisible();

      const putRoomDescriptionApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/description",
        { status: 204 },
      );
      roomResponse.data.description =
        "<h1><strong>New test description</strong></h1>";

      await page.getByTestId("room-description-save-button").click();

      const request = await putRoomDescriptionApiMock.waitForRequest();
      expect(request.postDataJSON()).toEqual({
        description: "<h1><strong>New test description</strong></h1><p></p>",
      });

      // Check that editor is closed and new description is shown
      await expect(
        page.getByTestId("room-description-cancel-edit-button"),
      ).toHaveCount(0);
      const viewer = page.getByTestId("room-description-viewer");
      await expect(viewer.locator("h1 strong")).toHaveText(
        "New test description",
      );
      await expect(viewer.locator("p")).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
      await expect(
        page.getByTestId("room-description-edit-button"),
      ).toBeVisible();
    });
  });

  test.describe("edit description errors", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123");

      await expect(page.getByText("rooms.description.missing")).toBeVisible();
      await expect(page.getByTestId("room-description-viewer")).toHaveCount(0);

      await page.getByTestId("room-description-edit-button").click();
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
    });

    test("422 error", async ({ page }) => {
      const putRoomDescriptionApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/description",
        validationErrors(
          {
            description: [
              "The Description must not be greater than 65000 characters.",
            ],
          },
          "The Description must not be greater than 65000 characters",
        ),
      );

      await page.getByTestId("room-description-save-button").click();
      await putRoomDescriptionApiMock.waitForRequest();

      await expect(
        page.getByText(
          "The Description must not be greater than 65000 characters.",
        ),
      ).toBeVisible();

      await expectToastAndClose(
        page,
        "The Description must not be greater than 65000 characters",
      );
    });

    test("500 error replaces validation error and editing can be cancelled", async ({
      page,
    }) => {
      const validationMessage =
        "The Description must not be greater than 65000 characters.";
      const putRoomDescriptionApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/description",
        validationErrors(
          { description: [validationMessage] },
          "The Description must not be greater than 65000 characters",
        ),
      );

      await page.getByTestId("room-description-save-button").click();
      await putRoomDescriptionApiMock.waitForRequest();
      await expect(page.getByText(validationMessage)).toBeVisible();
      await expectToastAndClose(
        page,
        "The Description must not be greater than 65000 characters",
      );

      const putRoomDescriptionApiMock2 = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/description",
        serverError(),
      );

      await page.getByTestId("room-description-save-button").click();
      await putRoomDescriptionApiMock2.waitForRequest();

      // Check that 422 error message is hidden
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByText(validationMessage)).toHaveCount(0);

      // Cancel editing
      await page.getByTestId("room-description-cancel-edit-button").click();

      await expect(
        page.getByTestId("room-description-cancel-edit-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
    });

    test("auth errors", async ({ page }) => {
      await page.getByTestId("room-description-cancel-edit-button").click();
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);

      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-description-edit-button").click();
          await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
          await page.getByTestId("room-description-save-button").click();
        },
        "PUT",
        "api/v1/rooms/abc-def-123/description",
        "description",
      );
    });

    test("404 error redirects to room index", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      const putRoomDescriptionApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/description",
        modelNotFound("room", ["abc-def-123"]),
      );

      await page.getByTestId("room-description-save-button").click();
      await putRoomDescriptionApiMock.waitForRequest();

      // Check that redirect to room index page worked
      await expect(page).toHaveURL(
        (url) =>
          url.pathname.endsWith("/rooms") || url.pathname.endsWith("/rooms/"),
      );

      // Check that error message gets shown
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test.describe("description changes", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123");

      await expect(page.getByText("rooms.description.missing")).toBeVisible();
      await expect(page.getByTestId("room-description-viewer")).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
    });

    test("reload room shows changed description", async ({
      page,
      roomResponse,
      getRoomApiMock,
    }) => {
      roomResponse.data.description = "<p>Room description</p>";

      await page.getByTestId("reload-room-button").click();
      await getRoomApiMock.waitForRequest(2);

      await expect(
        page.getByTestId("room-description-viewer").locator("p"),
      ).toHaveText("Room description");
      await expect(page.getByText("rooms.description.missing")).toHaveCount(0);
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
    });

    test("reload room keeps the editor content while editing", async ({
      page,
      roomResponse,
      getRoomApiMock,
    }) => {
      roomResponse.data.description = "<p>Room description</p>";
      await page.getByTestId("reload-room-button").click();
      await expect(page.getByTestId("room-description-viewer")).toBeVisible();

      // Open editor
      await page.getByTestId("room-description-edit-button").click();

      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
      await expect(page.locator(".tiptap p")).toHaveText("Room description");
      await expect(page.getByTestId("room-description-viewer")).toHaveCount(0);
      await expect(page.getByText("rooms.description.missing")).toHaveCount(0);

      // Reload room with different description
      roomResponse.data.description = "<p>Changed room description</p>";
      await page.getByTestId("reload-room-button").click();
      await getRoomApiMock.waitForRequest(3);

      // Check that description inside the editor stays the same
      await expect(page.getByTestId("tip-tap-editor")).toBeVisible();
      await expect(page.locator(".tiptap p")).toHaveText("Room description");
      await expect(page.getByTestId("room-description-viewer")).toHaveCount(0);
      await expect(page.getByText("rooms.description.missing")).toHaveCount(0);

      // Cancel editing and check that new description is shown
      await page.getByTestId("room-description-cancel-edit-button").click();

      await expect(
        page.getByTestId("room-description-viewer").locator("p"),
      ).toHaveText("Changed room description");
      await expect(page.getByTestId("tip-tap-editor")).toHaveCount(0);
    });
  });

  test.describe("external link", () => {
    test.beforeEach(async ({ page, roomResponse }) => {
      await page.addInitScript(() => {
        window.__openCalls = [];
        window.open = (...args) => {
          window.__openCalls.push(args);
          return true;
        };
      });
      roomResponse.data.description = `<a href="https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b">Test Link</a>`;
      await page.goto("/rooms/abc-def-123");

      const viewer = page.getByTestId("room-description-viewer");
      await expect(viewer).toBeVisible();
      await expect(
        page.getByTestId("room-description-viewer-confirm-dialog"),
      ).toHaveCount(0);
      await viewer.getByRole("link", { name: "Test Link" }).click();
    });

    test("cancel opening the link", async ({ page }) => {
      const dialog = page.getByTestId("room-description-viewer-confirm-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        "rooms.description.external_link_warning.title",
      );
      await expect(dialog).toContainText(
        `rooms.description.external_link_warning.description_{"link":"https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b"}`,
      );

      const reject = dialog.getByTestId("confirm-dialog-reject-button");
      await expect(reject).toHaveText("app.cancel");
      await reject.click();

      await expect(dialog).toHaveCount(0);
      expect(await page.evaluate(() => window.__openCalls)).toEqual([]);
    });

    test("confirm opening the link", async ({ page }) => {
      const dialog = page.getByTestId("room-description-viewer-confirm-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        "rooms.description.external_link_warning.title",
      );
      await expect(dialog).toContainText(
        `rooms.description.external_link_warning.description_{"link":"https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b"}`,
      );

      const accept = dialog.getByTestId("confirm-dialog-accept-button");
      await expect(accept).toHaveText("app.continue");
      await accept.click();

      await expect
        .poll(() => page.evaluate(() => window.__openCalls))
        .toEqual([
          [
            "https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b",
            "_blank",
          ],
        ]);
    });
  });

  test.describe("sanitize html", () => {
    test.beforeEach(async ({ page, roomResponse }) => {
      roomResponse.data.description =
        '<script>alert("XSS Code")</script>' +
        `<a href="https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b">Test Link</a>` +
        '<p style="text-align: center; color: rgb(255, 0, 0); background-color: rgb(0, 255, 0);" >Content with valid style</p>' +
        '<p style="text-align: justify; color: rgba(255, 0, 0, 0); background-color: rgba(0, 255, 0, 0);">Content with invalid style values</p>' +
        '<p style="text-align: center; color: rgb(0, 0, 255); background-color: rgb(255, 255, 0); position: absolute" >Content with invalid style attributes</p>' +
        '<img src="http://example.org/demo.png" width="250px"  alt="Image text"/>' +
        "<button>Button</button>";
      await page.goto("/rooms/abc-def-123");

      await expect(page.getByTestId("room-description-viewer")).toBeVisible();
    });

    test("removes dangerous code, tags and sources that are not allowed", async ({
      page,
    }) => {
      const viewer = page.getByTestId("room-description-viewer");
      await expect(viewer.getByText("Content with valid style")).toBeVisible();

      await expect(viewer.locator("script")).toHaveCount(0);
      await expect(viewer.locator("button")).toHaveCount(0);
      await expect(viewer.locator("img")).toHaveCount(0);
    });

    test("keeps allowed style attributes", async ({ page }) => {
      const paragraph = page
        .getByTestId("room-description-viewer")
        .locator("p", { hasText: "Content with valid style" });
      await expect(paragraph).toBeVisible();
      await expect(paragraph).toHaveAttribute(
        "style",
        "text-align: center; color: rgb(255, 0, 0); background-color: rgb(0, 255, 0);",
      );
    });

    test("removes allowed style attributes with values that are not allowed", async ({
      page,
    }) => {
      const paragraph = page
        .getByTestId("room-description-viewer")
        .locator("p", { hasText: "Content with invalid style values" });
      await expect(paragraph).toBeVisible();
      await expect(paragraph).toHaveAttribute("style", "");
    });

    test("removes style attributes that are not allowed", async ({ page }) => {
      const paragraph = page
        .getByTestId("room-description-viewer")
        .locator("p", { hasText: "Content with invalid style attributes" });
      await expect(paragraph).toBeVisible();
      await expect(paragraph).toHaveAttribute(
        "style",
        "text-align: center; color: rgb(0, 0, 255); background-color: rgb(255, 255, 0);",
      );
    });

    test("keeps links", async ({ page }) => {
      const link = page
        .getByTestId("room-description-viewer")
        .locator("a", { hasText: "Test Link" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        "href",
        "https://thm-health.github.io/PILOS-Redirect_Test_Pages/?foo=a&bar=b",
      );
    });
  });
});
