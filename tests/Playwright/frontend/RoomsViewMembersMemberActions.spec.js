import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";
import { test as roomMemberControllerTest } from "../support/fixtures/roomMemberController.js";
import { test as roomPersonalizedLinkControllerTest } from "../support/fixtures/roomPersonalizedLinkController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  mockApiRequest,
  getRequestQuery,
  validationErrors,
  serverError,
  modelNotFound,
} from "../support/utils.js";

import { checkRoomAuthErrors } from "../support/room.js";

const test = mergeTests(
  roomControllerTest,
  roomFileControllerTest,
  roomMemberControllerTest,
  roomPersonalizedLinkControllerTest,
  roomTypeControllerTest,
);
test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });

test.use({ authenticated: true });

test.describe("Rooms view members member actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rooms/abc-def-123#tab=members");
    await expect(page.getByTestId("room-member-item")).toHaveCount(3);
  });

  test.describe("add member", () => {
    test("opens the dialog from the add menu", async ({ page }) => {
      await expect(page.locator("#overlay_menu")).toHaveCount(0);
      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu")).toBeVisible();

      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toHaveCount(0);
      await expect(page.locator("#overlay_menu_0")).toHaveText(
        "rooms.members.add_single_user",
      );
      await page.locator("#overlay_menu_0").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();
    });

    test("shows the prompt and placeholder of the user search", async ({
      page,
    }) => {
      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu_0")).toHaveText(
        "rooms.members.add_single_user",
      );
      await page.locator("#overlay_menu_0").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();

      // Check autofocus
      await expect(page.locator(".multiselect__content")).toBeVisible();

      const dropdown = page.getByTestId("select-user-dropdown");
      await expect(dropdown).toContainText(
        "rooms.members.modals.add.no_options",
      );
      await expect(dropdown).toContainText(
        "rooms.members.modals.add.no_result",
      );
      await expect(dropdown.locator("input")).toHaveAttribute(
        "placeholder",
        "rooms.members.modals.add.placeholder",
      );
    });

    test("shows the email only prompt if search by name is disabled", async ({
      page,
      configResponse,
    }) => {
      configResponse.data.user.search_by_name = false;
      await page.reload();
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu_0")).toHaveText(
        "rooms.members.add_single_user",
      );
      await page.locator("#overlay_menu_0").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();

      const dropdown = page.getByTestId("select-user-dropdown");
      await expect(dropdown).toContainText(
        "rooms.members.modals.add.no_options_email_only",
      );
      await expect(dropdown.locator("input")).toHaveAttribute(
        "placeholder",
        "rooms.members.modals.add.placeholder_email_only",
      );
    });

    test("shows a hint if the search has too many results", async ({
      page,
    }) => {
      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu_0")).toHaveText(
        "rooms.members.add_single_user",
      );
      await page.locator("#overlay_menu_0").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();

      const getUsersSearchApiMock = await mockApiRequest(
        page,
        "GET",
        "users/search*",
        {
          status: 204,
        },
      );

      const input = page.getByTestId("select-user-dropdown").locator("input");
      await input.click();
      await input.pressSequentially("L");

      expect(
        getRequestQuery(await getUsersSearchApiMock.waitForRequest()),
      ).toMatchObject({
        query: "L",
      });

      const options = page.locator(".multiselect__option");
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expect(options).toHaveCount(2);
      await expect(options.nth(0)).toContainText(
        "rooms.members.modals.add.too_many_results",
      );
      await expect(options.nth(0)).toBeVisible();
      await expect(options.nth(1)).toContainText(
        "rooms.members.modals.add.no_options",
      );
      await expect(options.nth(1)).toBeHidden();
    });

    test("shows the search results", async ({ page }) => {
      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu_0")).toHaveText(
        "rooms.members.add_single_user",
      );
      await page.locator("#overlay_menu_0").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();

      const getUsersSearchApiMock = await mockApiRequest(
        page,
        "GET",
        "users/search*",
        {
          status: 200,
          json: {
            data: [
              {
                id: 5,
                firstname: "Laura",
                lastname: "Rivera",
                email: "LauraWRivera@domain.tld",
                image: null,
              },
              {
                id: 10,
                firstname: "Laura",
                lastname: "Walter",
                email: "LauraMWalter@domain.tld",
                image: null,
              },
            ],
          },
        },
      );

      const input = page.getByTestId("select-user-dropdown").locator("input");
      await input.click();
      await input.pressSequentially("Laura");

      expect(
        getRequestQuery(await getUsersSearchApiMock.waitForRequest()),
      ).toMatchObject({
        query: "Laura",
      });

      const options = page.locator(".multiselect__option");
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expect(options).toHaveCount(4);
      await expect(options.nth(0)).toContainText("Laura Rivera");
      await expect(options.nth(0)).toContainText("LauraWRivera@domain.tld");
      await expect(options.nth(0)).toBeVisible();
      await expect(options.nth(1)).toContainText("Laura Walter");
      await expect(options.nth(1)).toContainText("LauraMWalter@domain.tld");
      await expect(options.nth(1)).toBeVisible();
      await expect(options.nth(2)).toContainText(
        "rooms.members.modals.add.no_result",
      );
      await expect(options.nth(2)).toBeHidden();
      await expect(options.nth(3)).toContainText(
        "rooms.members.modals.add.no_options",
      );
      await expect(options.nth(3)).toBeHidden();
    });

    test.describe("with selected user", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId("room-members-add-button").click();
        await expect(page.locator("#overlay_menu_0")).toHaveText(
          "rooms.members.add_single_user",
        );
        await page.locator("#overlay_menu_0").click();
        await expect(
          page.getByTestId("room-members-add-single-dialog"),
        ).toBeVisible();

        const getUsersSearchApiMock = await mockApiRequest(
          page,
          "GET",
          "users/search*",
          {
            status: 200,
            json: {
              data: [
                {
                  id: 5,
                  firstname: "Laura",
                  lastname: "Rivera",
                  email: "LauraWRivera@domain.tld",
                  image: null,
                },
                {
                  id: 10,
                  firstname: "Laura",
                  lastname: "Walter",
                  email: "LauraMWalter@domain.tld",
                  image: null,
                },
              ],
            },
          },
        );

        const input = page.getByTestId("select-user-dropdown").locator("input");
        await input.click();
        await input.pressSequentially("L");
        await getUsersSearchApiMock.waitForRequest();

        await expect(page.locator(".multiselect__content")).toBeVisible();
        await page.locator(".multiselect__option").nth(1).click();
        await expect(page.locator(".multiselect__content")).toHaveCount(0);
      });

      test("shows the roles unchecked", async ({ page }) => {
        for (const [name, label, input] of [
          ["participant", "rooms.roles.participant", "#participant-role"],
          ["moderator", "rooms.roles.moderator", "#moderator-role"],
          ["co-owner", "rooms.roles.co_owner", "#co_owner-role"],
        ]) {
          const group = page.getByTestId(`${name}-role-group`);
          await expect(group).toContainText(label);
          await expect(group.locator(input)).not.toBeChecked();
        }
      });

      test("adds the member with the selected role", async ({
        page,
        roomMembersResponse,
      }) => {
        await page.locator("#moderator-role").click();
        await expect(page.locator("#moderator-role")).toBeChecked();

        const postRoomMemberApiMock = await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/member",
          {
            status: 204,
            hold: true,
          },
        );
        roomMembersResponse.data.push({
          id: 10,
          firstname: "Laura",
          lastname: "Walter",
          email: "LauraMWalter@domain.tld",
          role: 2,
          image: null,
        });
        roomMembersResponse.meta.per_page = 4;
        roomMembersResponse.meta.to = 4;
        roomMembersResponse.meta.total = 4;
        roomMembersResponse.meta.total_no_filter = 4;

        await expect(page.getByTestId("dialog-save-button")).toHaveText(
          "rooms.members.modals.add.add",
        );
        await page.getByTestId("dialog-save-button").click();

        // Loading state
        await expect(
          page.getByTestId("select-user-dropdown").locator("input"),
        ).toBeDisabled();
        await expect(page.locator("#participant-role")).toBeDisabled();
        await expect(page.locator("#moderator-role")).toBeDisabled();
        await expect(page.locator("#co_owner-role")).toBeDisabled();
        await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
          "app.cancel",
        );
        await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
        await expect(page.getByTestId("dialog-save-button")).toBeDisabled();

        postRoomMemberApiMock.release();

        await expect(postRoomMemberApiMock).toHaveReceivedRequest({
          json: {
            user: 10,
            role: 2,
          },
        });

        await expect(
          page.getByTestId("room-members-add-single-dialog"),
        ).toHaveCount(0);

        // The members are reloaded and the new member is shown
        const items = page.getByTestId("room-member-item");
        await expect(items).toHaveCount(4);
        await expect(items.nth(3)).toContainText("LW");
        await expect(items.nth(3)).toContainText("Laura Walter");
        await expect(items.nth(3)).toContainText("LauraMWalter@domain.tld");
        await expect(items.nth(3)).toContainText("rooms.roles.moderator");
      });

      test("shows validation errors of the add request", async ({ page }) => {
        const dialog = page.getByTestId("room-members-add-single-dialog");

        // The role is missing
        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/member",
          validationErrors(
            { role: ["The Role field is required."] },
            "The Role field is required.",
          ),
        );
        await page.getByTestId("dialog-save-button").click();

        await expect(dialog).toContainText("The Role field is required.");

        // The user is already a member, the previous error is replaced
        await page.locator("#participant-role").click();
        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/member",
          validationErrors(
            { user: ["The user is already member of the room."] },
            "The user is already member of the room.",
          ),
        );
        await page.getByTestId("dialog-save-button").click();

        await expect(dialog).toContainText(
          "The user is already member of the room.",
        );
        await expect(dialog).not.toContainText("The Role field is required.");
      });

      test("shows a server error and hides the validation errors", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-add-single-dialog");

        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/member",
          validationErrors(
            { role: ["The Role field is required."] },
            "The Role field is required.",
          ),
        );
        await page.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText("The Role field is required.");

        await page.locator("#participant-role").click();
        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/member",
          validationErrors(
            { user: ["The user is already member of the room."] },
            "The user is already member of the room.",
          ),
        );
        await page.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText(
          "The user is already member of the room.",
        );

        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/member",
          serverError(),
        );
        await page.getByTestId("dialog-save-button").click();

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText(
          "The user is already member of the room.",
        );
        await expect(dialog).not.toContainText("The Role field is required.");

        await page.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toHaveCount(0);
      });
    });

    test("shows a server error of the user search", async ({ page }) => {
      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu_0")).toHaveText(
        "rooms.members.add_single_user",
      );
      await page.locator("#overlay_menu_0").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();

      await mockApiRequest(page, "GET", "users/search*", serverError());

      const input = page.getByTestId("select-user-dropdown").locator("input");
      await input.click();
      await input.pressSequentially("L");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();

      await page.getByTestId("dialog-cancel-button").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toHaveCount(0);
    });

    test("handles auth errors of the user search", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-members-add-button").click();
          await expect(page.locator("#overlay_menu_0")).toHaveText(
            "rooms.members.add_single_user",
          );
          await page.locator("#overlay_menu_0").click();
          await expect(
            page.getByTestId("room-members-add-single-dialog"),
          ).toBeVisible();
          const input = page
            .getByTestId("select-user-dropdown")
            .locator("input");
          await input.click();
          await input.pressSequentially("a");
        },
        "GET",
        "api/v1/users/search*",
        "members",
      );
    });

    test("handles auth errors of the add request", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-members-add-button").click();
          await expect(page.locator("#overlay_menu_0")).toHaveText(
            "rooms.members.add_single_user",
          );
          await page.locator("#overlay_menu_0").click();
          await expect(
            page.getByTestId("room-members-add-single-dialog"),
          ).toBeVisible();
          await page.getByTestId("dialog-save-button").click();
        },
        "POST",
        "api/v1/rooms/abc-def-123/member",
        "members",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu_0")).toHaveText(
        "rooms.members.add_single_user",
      );
      await page.locator("#overlay_menu_0").click();
      await expect(
        page.getByTestId("room-members-add-single-dialog"),
      ).toBeVisible();

      await mockApiRequest(
        page,
        "POST",
        "rooms/abc-def-123/member",
        modelNotFound("room", ["abc-def-123"]),
      );
      await page.getByTestId("dialog-save-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test.describe("edit member", () => {
    test("shows the current role of the member", async ({ page }) => {
      await expect(page.getByTestId("room-member-item").first()).toContainText(
        "rooms.roles.participant",
      );

      await expect(page.getByTestId("room-members-edit-dialog")).toHaveCount(0);
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-edit-button")
        .click();
      await expect(page.getByTestId("room-members-edit-dialog")).toBeVisible();

      for (const [name, label, input] of [
        ["participant", "rooms.roles.participant", "#participant-role"],
        ["moderator", "rooms.roles.moderator", "#moderator-role"],
        ["co-owner", "rooms.roles.co_owner", "#co_owner-role"],
      ]) {
        const group = page.getByTestId(`${name}-role-group`);
        await expect(group).toContainText(label);
        if (name === "participant") {
          await expect(group.locator(input)).toBeChecked();
        } else {
          await expect(group.locator(input)).not.toBeChecked();
        }
      }
    });

    test("changes the role of the member", async ({
      page,
      roomMembersResponse,
    }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-edit-button")
        .click();
      await expect(page.getByTestId("room-members-edit-dialog")).toBeVisible();

      await page.locator("#moderator-role").click();
      await expect(page.locator("#participant-role")).not.toBeChecked();
      await expect(page.locator("#moderator-role")).toBeChecked();

      const putRoomMemberApiMock = await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/member/5",
        {
          status: 204,
          hold: true,
        },
      );
      roomMembersResponse.data[0].role = 2;

      await expect(page.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("dialog-save-button").click();

      // Loading state
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.cancel",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-save-button")).toBeDisabled();

      putRoomMemberApiMock.release();

      await expect(putRoomMemberApiMock).toHaveReceivedRequest({
        json: {
          role: 2,
        },
      });

      await expect(page.getByTestId("room-members-edit-dialog")).toHaveCount(0);
      await expect(page.getByTestId("room-member-item").first()).toContainText(
        "rooms.roles.moderator",
      );
    });

    test("reloads the members if the member is gone", async ({
      page,
      roomMembersResponse,
    }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-edit-button")
        .click();
      await expect(page.getByTestId("room-members-edit-dialog")).toBeVisible();

      await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/member/5",
        modelNotFound("user", [5]),
      );
      roomMembersResponse.data = roomMembersResponse.data.slice(1, 3);
      roomMembersResponse.meta.to = 2;
      roomMembersResponse.meta.total = 2;
      roomMembersResponse.meta.total_no_filter = 2;

      await page.getByTestId("dialog-save-button").click();

      await expect(page.getByTestId("room-members-edit-dialog")).toHaveCount(0);
      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
      await expectToastAndClose(page, "app.errors.not_member_of_room");
    });

    test("shows validation errors", async ({ page }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-edit-button")
        .click();
      await expect(page.getByTestId("room-members-edit-dialog")).toBeVisible();

      await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/member/5",
        validationErrors(
          { role: ["The selected role is invalid."] },
          "The selected role is invalid.",
        ),
      );
      await page.getByTestId("dialog-save-button").click();

      await expect(page.getByTestId("room-members-edit-dialog")).toContainText(
        "The selected role is invalid.",
      );
    });

    test("shows a server error and hides the validation errors", async ({
      page,
    }) => {
      const dialog = page.getByTestId("room-members-edit-dialog");
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-edit-button")
        .click();
      await expect(page.getByTestId("room-members-edit-dialog")).toBeVisible();

      await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/member/5",
        validationErrors(
          { role: ["The selected role is invalid."] },
          "The selected role is invalid.",
        ),
      );
      await page.getByTestId("dialog-save-button").click();
      await expect(dialog).toContainText("The selected role is invalid.");

      await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/member/5",
        serverError(),
      );
      await page.getByTestId("dialog-save-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(dialog).toBeVisible();
      await expect(dialog).not.toContainText("The selected role is invalid.");

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toHaveCount(0);
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page
            .getByTestId("room-member-item")
            .first()
            .getByTestId("room-members-edit-button")
            .click();
          await expect(
            page.getByTestId("room-members-edit-dialog"),
          ).toBeVisible();
          await page.getByTestId("dialog-save-button").click();
        },
        "PUT",
        "api/v1/rooms/abc-def-123/member/5",
        "members",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-edit-button")
        .click();
      await expect(page.getByTestId("room-members-edit-dialog")).toBeVisible();

      await mockApiRequest(
        page,
        "PUT",
        "rooms/abc-def-123/member/5",
        modelNotFound("room", ["abc-def-123"]),
      );
      await page.getByTestId("dialog-save-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test.describe("delete member", () => {
    test("shows the confirmation dialog", async ({ page }) => {
      await expect(page.getByTestId("room-members-delete-dialog")).toHaveCount(
        0,
      );
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-delete-button")
        .click();
      await expect(
        page.getByTestId("room-members-delete-dialog"),
      ).toBeVisible();

      const dialog = page.getByTestId("room-members-delete-dialog");
      await expect(dialog).toContainText("rooms.members.modals.remove.title");
      await expect(dialog).toContainText(
        'rooms.members.modals.remove.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("deletes the member", async ({ page, roomMembersResponse }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-delete-button")
        .click();
      await expect(
        page.getByTestId("room-members-delete-dialog"),
      ).toBeVisible();

      const deleteRoomMemberApiMock = await mockApiRequest(
        page,
        "DELETE",
        "rooms/abc-def-123/member/5",
        {
          status: 204,
          hold: true,
        },
      );
      roomMembersResponse.data = roomMembersResponse.data.slice(1, 3);
      roomMembersResponse.meta.to = 2;
      roomMembersResponse.meta.total = 2;
      roomMembersResponse.meta.total_no_filter = 2;

      await expect(page.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await page.getByTestId("dialog-continue-button").click();

      // Loading state
      await expect(page.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(page.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(page.getByTestId("dialog-continue-button")).toBeDisabled();

      deleteRoomMemberApiMock.release();
      await deleteRoomMemberApiMock.waitForRequest();

      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
      await expect(page.getByTestId("room-members-delete-dialog")).toHaveCount(
        0,
      );
    });

    test("reloads the members if the member is gone", async ({
      page,
      roomMembersResponse,
    }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-delete-button")
        .click();
      await expect(
        page.getByTestId("room-members-delete-dialog"),
      ).toBeVisible();

      await mockApiRequest(
        page,
        "DELETE",
        "rooms/abc-def-123/member/5",
        modelNotFound("user", [5]),
      );
      roomMembersResponse.data = roomMembersResponse.data.slice(1, 3);
      roomMembersResponse.meta.to = 2;
      roomMembersResponse.meta.total = 2;
      roomMembersResponse.meta.total_no_filter = 2;

      await page.getByTestId("dialog-continue-button").click();

      await expect(page.getByTestId("room-members-delete-dialog")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
      await expectToastAndClose(page, "app.errors.not_member_of_room");
    });

    test("shows a server error", async ({ page }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-delete-button")
        .click();
      await expect(
        page.getByTestId("room-members-delete-dialog"),
      ).toBeVisible();

      await mockApiRequest(
        page,
        "DELETE",
        "rooms/abc-def-123/member/5",
        serverError(),
      );
      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(
        page.getByTestId("room-members-delete-dialog"),
      ).toBeVisible();

      await page.getByTestId("dialog-cancel-button").click();
      await expect(page.getByTestId("room-members-delete-dialog")).toHaveCount(
        0,
      );
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page
            .getByTestId("room-member-item")
            .first()
            .getByTestId("room-members-delete-button")
            .click();
          await expect(
            page.getByTestId("room-members-delete-dialog"),
          ).toBeVisible();
          await page.getByTestId("dialog-continue-button").click();
        },
        "DELETE",
        "api/v1/rooms/abc-def-123/member/5",
        "members",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await page
        .getByTestId("room-member-item")
        .first()
        .getByTestId("room-members-delete-button")
        .click();
      await expect(
        page.getByTestId("room-members-delete-dialog"),
      ).toBeVisible();

      await mockApiRequest(
        page,
        "DELETE",
        "rooms/abc-def-123/member/5",
        modelNotFound("room", ["abc-def-123"]),
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
