import { test } from "../support/fixtures/roomsMembersLinks.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { mockMethod, nthRequest } from "../support/utils.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import { checkRoomAuthErrors } from "../support/room.js";

test.use({ authenticated: true });

test.describe("Rooms view personalized links token actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rooms/abc-def-123#tab=tokens");
    await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
      3,
    );
  });

  test.describe("add personalized link", () => {
    test("shows the empty add dialog", async ({ page }) => {
      const dialog = page.getByTestId("room-personalized-links-add-dialog");
      await expect(dialog).toHaveCount(0);
      await page.getByTestId("room-personalized-links-add-button").click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.personalized_links.add");

      await expect(dialog.getByTestId("firstname-field")).toContainText(
        "app.firstname",
      );
      await expect(dialog.locator("#firstname")).toHaveValue("");
      await expect(dialog.getByTestId("lastname-field")).toContainText(
        "app.lastname",
      );
      await expect(dialog.locator("#lastname")).toHaveValue("");

      await expect(dialog.getByTestId("participant-role-group")).toContainText(
        "rooms.roles.participant",
      );
      await expect(dialog.locator("#participant-role")).not.toBeChecked();
      await expect(dialog.getByTestId("moderator-role-group")).toContainText(
        "rooms.roles.moderator",
      );
      await expect(dialog.locator("#moderator-role")).not.toBeChecked();

      await dialog.locator("#participant-role").click();
      await expect(dialog.locator("#participant-role")).toBeChecked();
    });

    test("adds a personalized link", async ({ page, personalizedLinks }) => {
      await page.getByTestId("room-personalized-links-add-button").click();
      const dialog = page.getByTestId("room-personalized-links-add-dialog");
      await dialog.locator("#firstname").fill("Laura");
      await dialog.locator("#lastname").fill("Walter");
      await dialog.locator("#participant-role").click();

      const newLink = {
        id: 4,
        token:
          "rwb8nyBvjtVDi3Wd3zM3ZBAJqHyNM18rtrzvPTiLmm2PK3sZGHSmwS0OscMRPtG8Vt13t2GW1KX6UOQQ7HkmjYGdd8qGJitsflt1",
        firstname: "Laura",
        lastname: "Walter",
        role: 1,
        expires: null,
        last_usage: null,
      };
      const addRequest = await mockMethod(
        page,
        "POST",
        "**/api/v1/rooms/abc-def-123/personalizedLinks",
        {
          status: 201,
          json: { data: newLink },
          hold: true,
        },
      );
      personalizedLinks.data.push(newLink);
      personalizedLinks.meta.per_page = 4;
      personalizedLinks.meta.to = 4;
      personalizedLinks.meta.total = 4;
      personalizedLinks.meta.total_no_filter = 4;

      await expect(page.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("dialog-save-button").click();

      // Check loading
      await expect(dialog.locator("#firstname")).toBeDisabled();
      await expect(dialog.locator("#lastname")).toBeDisabled();
      await expect(dialog.locator("#participant-role")).toBeDisabled();
      await expect(dialog.locator("#moderator-role")).toBeDisabled();
      await expect(page.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toContainText(
        "app.cancel",
      );
      addRequest.release();

      // Check that correct data was sent
      const request = await nthRequest(addRequest);
      expect(request.postDataJSON()).toEqual({
        firstname: "Laura",
        lastname: "Walter",
        role: 1,
      });

      await expect(dialog).toHaveCount(0);

      // Check that new personalized link is shown
      const items = page.getByTestId("room-personalized-link-item");
      await expect(items).toHaveCount(4);
      const item = items.nth(3);
      await expect(item).toContainText("Laura Walter");
      await expect(item).toContainText("rooms.roles.participant");
      await expect(item).not.toContainText(
        "rooms.personalized_links.last_used_at",
      );
      await expect(item).not.toContainText(
        "rooms.personalized_links.expires_at",
      );
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId("room-personalized-links-add-button").click();
        await expect(
          page.getByTestId("room-personalized-links-add-dialog"),
        ).toBeVisible();
      });

      test("shows validation errors", async ({ page }) => {
        await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/personalizedLinks",
          {
            status: 422,
            json: {
              message: "The firstname field is required. (and 2 more errors)",
              errors: {
                firstname: ["The firstname field is required."],
                lastname: ["The lastname field is required."],
                role: ["The role field is required."],
              },
            },
          },
        );
        await page.getByTestId("dialog-save-button").click();

        const dialog = page.getByTestId("room-personalized-links-add-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("The role field is required.");
        await expect(dialog.getByTestId("firstname-field")).toContainText(
          "The firstname field is required.",
        );
        await expect(dialog.getByTestId("lastname-field")).toContainText(
          "The lastname field is required.",
        );
      });

      test("shows a server error and hides the validation errors", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-personalized-links-add-dialog");
        await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/personalizedLinks",
          {
            status: 422,
            json: {
              message: "The firstname field is required. (and 2 more errors)",
              errors: {
                firstname: ["The firstname field is required."],
                lastname: ["The lastname field is required."],
                role: ["The role field is required."],
              },
            },
          },
        );
        await page.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText("The role field is required.");

        await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/personalizedLinks",
          { status: 500, json: { message: "Test" } },
        );
        await page.getByTestId("dialog-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(dialog).toBeVisible();
        await expect(dialog.getByTestId("firstname-field")).not.toContainText(
          "The firstname field is required.",
        );
        await expect(dialog.getByTestId("lastname-field")).not.toContainText(
          "The lastname field is required.",
        );

        await page.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toHaveCount(0);
      });

      test("handles auth errors", async ({ page }) => {
        await page.getByTestId("dialog-cancel-button").click();
        await expect(
          page.getByTestId("room-personalized-links-add-dialog"),
        ).toHaveCount(0);

        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page
              .getByTestId("room-personalized-links-add-button")
              .click();
            await expect(
              page.getByTestId("room-personalized-links-add-dialog"),
            ).toBeVisible();
            await page.getByTestId("dialog-save-button").click();
          },
          "POST",
          "api/v1/rooms/abc-def-123/personalizedLinks",
          "tokens",
        );
      });

      test("redirects to the room index page if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);

        await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/personalizedLinks",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );
        await page.getByTestId("dialog-save-button").click();

        await expect(page).toHaveURL((url) => url.pathname === "/rooms");
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("edit personalized link", () => {
    test("shows the current values of the personalized link", async ({
      page,
    }) => {
      await expect(
        page.getByTestId("room-personalized-link-item").first(),
      ).toContainText("John Doe");
      await expect(
        page.getByTestId("room-personalized-link-item").first(),
      ).toContainText("rooms.roles.participant");

      await expect(
        page.getByTestId("room-personalized-links-edit-dialog"),
      ).toHaveCount(0);
      await page
        .getByTestId("room-personalized-link-item")
        .nth(0)
        .getByTestId("room-personalized-links-edit-button")
        .click();
      await expect(
        page.getByTestId("room-personalized-links-edit-dialog"),
      ).toBeVisible();

      const dialog = page.getByTestId("room-personalized-links-edit-dialog");
      await expect(dialog).toContainText("rooms.personalized_links.edit");
      await expect(dialog.getByTestId("firstname-field")).toContainText(
        "app.firstname",
      );
      await expect(dialog.locator("#firstname")).toHaveValue("John");
      await expect(dialog.getByTestId("lastname-field")).toContainText(
        "app.lastname",
      );
      await expect(dialog.locator("#lastname")).toHaveValue("Doe");

      await expect(dialog.getByTestId("participant-role-group")).toContainText(
        "rooms.roles.participant",
      );
      await expect(dialog.locator("#participant-role")).toBeChecked();
      await expect(dialog.getByTestId("moderator-role-group")).toContainText(
        "rooms.roles.moderator",
      );
      await expect(dialog.locator("#moderator-role")).not.toBeChecked();

      await dialog.locator("#moderator-role").click();
      await expect(dialog.locator("#moderator-role")).toBeChecked();
      await expect(dialog.locator("#participant-role")).not.toBeChecked();
    });

    test("edits a personalized link", async ({ page, personalizedLinks }) => {
      await page
        .getByTestId("room-personalized-link-item")
        .nth(0)
        .getByTestId("room-personalized-links-edit-button")
        .click();
      await expect(
        page.getByTestId("room-personalized-links-edit-dialog"),
      ).toBeVisible();
      const dialog = page.getByTestId("room-personalized-links-edit-dialog");

      await dialog.locator("#firstname").fill("Laura");
      await dialog.locator("#lastname").fill("Walter");
      await dialog.locator("#moderator-role").click();

      const editRequest = await mockMethod(
        page,
        "PUT",
        "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
        {
          status: 200,
          json: {
            data: {
              id: 1,
              token:
                "1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R",
              firstname: "Laura",
              lastname: "Walter",
              role: 2,
              expires: "2021-10-17T12:21:19.000000Z",
              last_usage: "2021-09-17T14:36:11.000000Z",
            },
          },
          hold: true,
        },
      );
      personalizedLinks.data[0].firstname = "Laura";
      personalizedLinks.data[0].lastname = "Walter";
      personalizedLinks.data[0].role = 2;

      await expect(page.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("dialog-save-button").click();

      // Check loading
      await expect(dialog.locator("#firstname")).toBeDisabled();
      await expect(dialog.locator("#lastname")).toBeDisabled();
      await expect(dialog.locator("#participant-role")).toBeDisabled();
      await expect(dialog.locator("#moderator-role")).toBeDisabled();
      await expect(page.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toContainText(
        "app.cancel",
      );
      editRequest.release();

      // Check that correct data was sent
      const request = await nthRequest(editRequest);
      expect(request.postDataJSON()).toEqual({
        firstname: "Laura",
        lastname: "Walter",
        role: 2,
      });

      await expect(dialog).toHaveCount(0);

      // Check that edited personalized link is shown
      const item = page.getByTestId("room-personalized-link-item").first();
      await expect(item).toContainText("Laura Walter");
      await expect(item).toContainText("rooms.roles.moderator");
      await expect(item).toContainText(
        'rooms.personalized_links.last_used_at_{"date":"09/17/2021, 16:36"}',
      );
      await expect(item).toContainText(
        'rooms.personalized_links.expires_at_{"date":"10/17/2021, 14:21"}',
      );
    });

    test("removes a personalized link that does not exist anymore", async ({
      page,
      personalizedLinks,
    }) => {
      await page
        .getByTestId("room-personalized-link-item")
        .nth(2)
        .getByTestId("room-personalized-links-edit-button")
        .click();
      await expect(
        page.getByTestId("room-personalized-links-edit-dialog"),
      ).toBeVisible();

      await mockMethod(
        page,
        "PUT",
        "**/api/v1/rooms/abc-def-123/personalizedLinks/3",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room_personalized_link",
            ids: [3],
          },
        },
      );
      personalizedLinks.data = personalizedLinks.data.slice(0, 2);
      personalizedLinks.meta.to = 2;
      personalizedLinks.meta.total = 2;
      personalizedLinks.meta.total_no_filter = 2;
      await page.getByTestId("dialog-save-button").click();

      await expect(
        page.getByTestId("room-personalized-links-edit-dialog"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        2,
      );
      await expectToastAndClose(page, "rooms.flash.personalized_link_gone");
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await page
          .getByTestId("room-personalized-link-item")
          .nth(0)
          .getByTestId("room-personalized-links-edit-button")
          .click();
        await expect(
          page.getByTestId("room-personalized-links-edit-dialog"),
        ).toBeVisible();
      });

      test("shows validation errors", async ({ page }) => {
        await mockMethod(
          page,
          "PUT",
          "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
          {
            status: 422,
            json: {
              message: "The firstname field is required. (and 2 more errors)",
              errors: {
                firstname: ["The firstname field is required."],
                lastname: ["The lastname field is required."],
                role: ["The selected role is invalid."],
              },
            },
          },
        );
        await page.getByTestId("dialog-save-button").click();

        const dialog = page.getByTestId("room-personalized-links-edit-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("The selected role is invalid.");
        await expect(dialog.getByTestId("firstname-field")).toContainText(
          "The firstname field is required.",
        );
        await expect(dialog.getByTestId("lastname-field")).toContainText(
          "The lastname field is required.",
        );
      });

      test("shows a server error and hides the validation errors", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-personalized-links-edit-dialog");
        await mockMethod(
          page,
          "PUT",
          "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
          {
            status: 422,
            json: {
              message: "The firstname field is required. (and 2 more errors)",
              errors: {
                firstname: ["The firstname field is required."],
                lastname: ["The lastname field is required."],
                role: ["The selected role is invalid."],
              },
            },
          },
        );
        await page.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText("The selected role is invalid.");

        await mockMethod(
          page,
          "PUT",
          "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
          { status: 500, json: { message: "Test" } },
        );
        await page.getByTestId("dialog-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText("The selected role is invalid.");
        await expect(dialog.getByTestId("firstname-field")).not.toContainText(
          "The firstname field is required.",
        );
        await expect(dialog.getByTestId("lastname-field")).not.toContainText(
          "The lastname field is required.",
        );

        await page.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toHaveCount(0);
      });

      test("handles auth errors", async ({ page }) => {
        await page.getByTestId("dialog-cancel-button").click();
        await expect(
          page.getByTestId("room-personalized-links-edit-dialog"),
        ).toHaveCount(0);

        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page
              .getByTestId("room-personalized-link-item")
              .nth(0)
              .getByTestId("room-personalized-links-edit-button")
              .click();
            await expect(
              page.getByTestId("room-personalized-links-edit-dialog"),
            ).toBeVisible();
            await page.getByTestId("dialog-save-button").click();
          },
          "PUT",
          "api/v1/rooms/abc-def-123/personalizedLinks/1",
          "tokens",
        );
      });

      test("redirects to the room index page if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);

        await mockMethod(
          page,
          "PUT",
          "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );
        await page.getByTestId("dialog-save-button").click();

        await expect(page).toHaveURL((url) => url.pathname === "/rooms");
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("delete personalized link", () => {
    test("shows the confirmation dialog", async ({ page }) => {
      await expect(
        page.getByTestId("room-personalized-links-delete-dialog"),
      ).toHaveCount(0);
      await page
        .getByTestId("room-personalized-link-item")
        .nth(0)
        .getByTestId("room-personalized-links-delete-button")
        .click();
      await expect(
        page.getByTestId("room-personalized-links-delete-dialog"),
      ).toBeVisible();

      const dialog = page.getByTestId("room-personalized-links-delete-dialog");
      await expect(dialog).toContainText("rooms.personalized_links.delete");
      await expect(dialog).toContainText(
        'rooms.personalized_links.confirm_delete_{"firstname":"John","lastname":"Doe"}',
      );
    });

    test("deletes a personalized link", async ({ page, personalizedLinks }) => {
      await page
        .getByTestId("room-personalized-link-item")
        .nth(0)
        .getByTestId("room-personalized-links-delete-button")
        .click();
      await expect(
        page.getByTestId("room-personalized-links-delete-dialog"),
      ).toBeVisible();

      const deleteRequest = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
        {
          status: 204,
          hold: true,
        },
      );
      personalizedLinks.data = personalizedLinks.data.slice(1, 3);
      personalizedLinks.meta.to = 2;
      personalizedLinks.meta.total = 2;
      personalizedLinks.meta.total_no_filter = 2;

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();

      // Check loading
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      deleteRequest.release();

      await nthRequest(deleteRequest);
      await expect(
        page.getByTestId("room-personalized-links-delete-dialog"),
      ).toHaveCount(0);

      // Check that personalized link was deleted
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        2,
      );
    });

    test("removes a personalized link that does not exist anymore", async ({
      page,
      personalizedLinks,
    }) => {
      await page
        .getByTestId("room-personalized-link-item")
        .nth(2)
        .getByTestId("room-personalized-links-delete-button")
        .click();
      await expect(
        page.getByTestId("room-personalized-links-delete-dialog"),
      ).toBeVisible();

      await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/personalizedLinks/3",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room_personalized_link",
            ids: [3],
          },
        },
      );
      personalizedLinks.data = personalizedLinks.data.slice(0, 2);
      personalizedLinks.meta.to = 2;
      personalizedLinks.meta.total = 2;
      personalizedLinks.meta.total_no_filter = 2;
      await page.getByTestId("dialog-continue-button").click();

      await expect(
        page.getByTestId("room-personalized-links-delete-dialog"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-personalized-link-item")).toHaveCount(
        2,
      );
      await expectToastAndClose(page, "rooms.flash.personalized_link_gone");
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await page
          .getByTestId("room-personalized-link-item")
          .nth(0)
          .getByTestId("room-personalized-links-delete-button")
          .click();
        await expect(
          page.getByTestId("room-personalized-links-delete-dialog"),
        ).toBeVisible();
      });

      test("shows a server error", async ({ page }) => {
        await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
          { status: 500, json: { message: "Test" } },
        );
        await page.getByTestId("dialog-continue-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(
          page.getByTestId("room-personalized-links-delete-dialog"),
        ).toBeVisible();

        await page.getByTestId("dialog-cancel-button").click();
        await expect(
          page.getByTestId("room-personalized-links-delete-dialog"),
        ).toHaveCount(0);
      });

      test("handles auth errors", async ({ page }) => {
        await page.getByTestId("dialog-cancel-button").click();
        await expect(
          page.getByTestId("room-personalized-links-delete-dialog"),
        ).toHaveCount(0);

        await checkRoomAuthErrors(
          page,
          async (page) => {
            await page
              .getByTestId("room-personalized-link-item")
              .nth(0)
              .getByTestId("room-personalized-links-delete-button")
              .click();
            await expect(
              page.getByTestId("room-personalized-links-delete-dialog"),
            ).toBeVisible();
            await page.getByTestId("dialog-continue-button").click();
          },
          "DELETE",
          "api/v1/rooms/abc-def-123/personalizedLinks/1",
          "tokens",
        );
      });

      test("redirects to the room index page if the room is not found", async ({
        page,
      }) => {
        await interceptRoomIndexRequests(page);

        await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/personalizedLinks/1",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );
        await page.getByTestId("dialog-continue-button").click();

        await expect(page).toHaveURL((url) => url.pathname === "/rooms");
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("copy personalized link", () => {
    test.use({ permissions: ["clipboard-read", "clipboard-write"] });

    test("copies the link to the clipboard", async ({ page, baseURL }) => {
      await page
        .getByTestId("room-personalized-link-item")
        .first()
        .getByTestId("room-personalized-links-copy-button")
        .click();

      const text = await page.evaluate(() => navigator.clipboard.readText());
      expect(text).toBe(
        `${baseURL}/rooms/abc-def-123#personalizedLink=1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R`,
      );

      await expectToastAndClose(
        page,
        'rooms.personalized_links.room_link_copied_{"firstname":"John","lastname":"Doe"}',
      );
    });
  });
});
