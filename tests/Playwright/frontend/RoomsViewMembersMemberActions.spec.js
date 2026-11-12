import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { mockMethod, nthRequest, queryOf } from "../support/utils.js";
import {
  interceptRoomViewRequests,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { checkRoomAuthErrors } from "../support/room.js";

const MEMBERS_URL = "**/api/v1/rooms/abc-def-123/member*";
const ADD_MEMBER_URL = "**/api/v1/rooms/abc-def-123/member";
const MEMBER_URL = "**/api/v1/rooms/abc-def-123/member/5";
const USER_SEARCH_URL = "**/api/v1/users/search*";

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];

const SERVER_ERROR_RESPONSE = { status: 500, json: { message: "Test" } };

const ROOM_NOT_FOUND_RESPONSE = {
  status: 404,
  json: { message: "model_not_found", model: "room", ids: ["abc-def-123"] },
};

const MEMBER_NOT_FOUND_RESPONSE = {
  status: 404,
  json: { message: "model_not_found", model: "user", ids: [5] },
};

const LAURA_SEARCH_RESULT = {
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
};

const ROLES = [
  ["participant", "rooms.roles.participant", "#participant-role"],
  ["moderator", "rooms.roles.moderator", "#moderator-role"],
  ["co-owner", "rooms.roles.co_owner", "#co_owner-role"],
];

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Answer the members request with the members fixture, optionally changed by `changes`.
 */
function mockMembers(page, changes = () => {}) {
  const members = readFixture("roomMembers.json");
  changes(members);
  return mockMethod(page, "GET", MEMBERS_URL, { status: 200, json: members });
}

/**
 * Answer the members request with the first member removed.
 */
function mockMembersWithoutFirstMember(page) {
  return mockMembers(page, (members) => {
    members.data = members.data.slice(1, 3);
    members.meta.to = 2;
    members.meta.total = 2;
    members.meta.total_no_filter = 2;
  });
}

/**
 * Open the add single user dialog via the add button menu.
 */
async function openAddSingleDialog(page) {
  await page.getByTestId("room-members-add-button").click();
  await expect(page.locator("#overlay_menu_0")).toHaveText(
    "rooms.members.add_single_user",
  );
  await page.locator("#overlay_menu_0").click();
  await expect(
    page.getByTestId("room-members-add-single-dialog"),
  ).toBeVisible();
}

/**
 * Open the dialog of the given member action for the first member.
 */
async function openMemberDialog(page, action) {
  await page
    .getByTestId("room-member-item")
    .first()
    .getByTestId(`room-members-${action}-button`)
    .click();
  await expect(page.getByTestId(`room-members-${action}-dialog`)).toBeVisible();
}

test.describe("Rooms view members member actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await interceptRoomViewRequests(page);
    await mockMembers(page);

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
      await openAddSingleDialog(page);

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
      config,
    }) => {
      config.data.user.search_by_name = false;
      await page.reload();
      await expect(page.getByTestId("room-member-item")).toHaveCount(3);

      await openAddSingleDialog(page);

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
      await openAddSingleDialog(page);

      const search = await mockMethod(page, "GET", USER_SEARCH_URL, {
        status: 204,
      });

      const input = page.getByTestId("select-user-dropdown").locator("input");
      await input.click();
      await input.pressSequentially("L");

      expect(queryOf(await nthRequest(search))).toMatchObject({ query: "L" });

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
      await openAddSingleDialog(page);

      const search = await mockMethod(
        page,
        "GET",
        USER_SEARCH_URL,
        LAURA_SEARCH_RESULT,
      );

      const input = page.getByTestId("select-user-dropdown").locator("input");
      await input.click();
      await input.pressSequentially("Laura");

      expect(queryOf(await nthRequest(search))).toMatchObject({
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
        await openAddSingleDialog(page);

        const search = await mockMethod(
          page,
          "GET",
          USER_SEARCH_URL,
          LAURA_SEARCH_RESULT,
        );

        const input = page.getByTestId("select-user-dropdown").locator("input");
        await input.click();
        await input.pressSequentially("L");
        await nthRequest(search);

        await expect(page.locator(".multiselect__content")).toBeVisible();
        await page.locator(".multiselect__option").nth(1).click();
        await expect(page.locator(".multiselect__content")).toHaveCount(0);
      });

      test("shows the roles unchecked", async ({ page }) => {
        for (const [name, label, input] of ROLES) {
          const group = page.getByTestId(`${name}-role-group`);
          await expect(group).toContainText(label);
          await expect(group.locator(input)).not.toBeChecked();
        }
      });

      test("adds the member with the selected role", async ({ page }) => {
        await page.locator("#moderator-role").click();
        await expect(page.locator("#moderator-role")).toBeChecked();

        const addMember = await mockMethod(page, "POST", ADD_MEMBER_URL, {
          status: 204,
          hold: true,
        });
        await mockMembers(page, (members) => {
          members.data.push({
            id: 10,
            firstname: "Laura",
            lastname: "Walter",
            email: "LauraMWalter@domain.tld",
            role: 2,
            image: null,
          });
          members.meta.per_page = 4;
          members.meta.to = 4;
          members.meta.total = 4;
          members.meta.total_no_filter = 4;
        });

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

        addMember.release();

        expect((await nthRequest(addMember)).postDataJSON()).toEqual({
          user: 10,
          role: 2,
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
        await mockMethod(page, "POST", ADD_MEMBER_URL, {
          status: 422,
          json: {
            message: "The Role field is required.",
            errors: { role: ["The Role field is required."] },
          },
        });
        await page.getByTestId("dialog-save-button").click();

        await expect(dialog).toContainText("The Role field is required.");

        // The user is already a member, the previous error is replaced
        await page.locator("#participant-role").click();
        await mockMethod(page, "POST", ADD_MEMBER_URL, {
          status: 422,
          json: {
            message: "The user is already member of the room.",
            errors: { user: ["The user is already member of the room."] },
          },
        });
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

        await mockMethod(page, "POST", ADD_MEMBER_URL, {
          status: 422,
          json: {
            message: "The Role field is required.",
            errors: { role: ["The Role field is required."] },
          },
        });
        await page.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText("The Role field is required.");

        await page.locator("#participant-role").click();
        await mockMethod(page, "POST", ADD_MEMBER_URL, {
          status: 422,
          json: {
            message: "The user is already member of the room.",
            errors: { user: ["The user is already member of the room."] },
          },
        });
        await page.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText(
          "The user is already member of the room.",
        );

        await mockMethod(page, "POST", ADD_MEMBER_URL, SERVER_ERROR_RESPONSE);
        await page.getByTestId("dialog-save-button").click();

        await expectToastAndClose(page, SERVER_ERROR_TOAST);
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
      await openAddSingleDialog(page);

      await mockMethod(page, "GET", USER_SEARCH_URL, SERVER_ERROR_RESPONSE);

      const input = page.getByTestId("select-user-dropdown").locator("input");
      await input.click();
      await input.pressSequentially("L");

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
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
          await openAddSingleDialog(page);
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
          await openAddSingleDialog(page);
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
      await interceptRoomIndexRequests(page);
      await openAddSingleDialog(page);

      await mockMethod(page, "POST", ADD_MEMBER_URL, ROOM_NOT_FOUND_RESPONSE);
      await page.getByTestId("dialog-save-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("edit member", () => {
    test("shows the current role of the member", async ({ page }) => {
      await expect(page.getByTestId("room-member-item").first()).toContainText(
        "rooms.roles.participant",
      );

      await expect(page.getByTestId("room-members-edit-dialog")).toHaveCount(0);
      await openMemberDialog(page, "edit");

      for (const [name, label, input] of ROLES) {
        const group = page.getByTestId(`${name}-role-group`);
        await expect(group).toContainText(label);
        if (name === "participant") {
          await expect(group.locator(input)).toBeChecked();
        } else {
          await expect(group.locator(input)).not.toBeChecked();
        }
      }
    });

    test("changes the role of the member", async ({ page }) => {
      await openMemberDialog(page, "edit");

      await page.locator("#moderator-role").click();
      await expect(page.locator("#participant-role")).not.toBeChecked();
      await expect(page.locator("#moderator-role")).toBeChecked();

      const editMember = await mockMethod(page, "PUT", MEMBER_URL, {
        status: 204,
        hold: true,
      });
      await mockMembers(page, (members) => {
        members.data[0].role = 2;
      });

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

      editMember.release();

      expect((await nthRequest(editMember)).postDataJSON()).toEqual({
        role: 2,
      });

      await expect(page.getByTestId("room-members-edit-dialog")).toHaveCount(0);
      await expect(page.getByTestId("room-member-item").first()).toContainText(
        "rooms.roles.moderator",
      );
    });

    test("reloads the members if the member is gone", async ({ page }) => {
      await openMemberDialog(page, "edit");

      await mockMethod(page, "PUT", MEMBER_URL, MEMBER_NOT_FOUND_RESPONSE);
      await mockMembersWithoutFirstMember(page);

      await page.getByTestId("dialog-save-button").click();

      await expect(page.getByTestId("room-members-edit-dialog")).toHaveCount(0);
      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
      await expectToastAndClose(page, "app.errors.not_member_of_room");
    });

    test("shows validation errors", async ({ page }) => {
      await openMemberDialog(page, "edit");

      await mockMethod(page, "PUT", MEMBER_URL, {
        status: 422,
        json: {
          message: "The selected role is invalid.",
          errors: { role: ["The selected role is invalid."] },
        },
      });
      await page.getByTestId("dialog-save-button").click();

      await expect(page.getByTestId("room-members-edit-dialog")).toContainText(
        "The selected role is invalid.",
      );
    });

    test("shows a server error and hides the validation errors", async ({
      page,
    }) => {
      const dialog = page.getByTestId("room-members-edit-dialog");
      await openMemberDialog(page, "edit");

      await mockMethod(page, "PUT", MEMBER_URL, {
        status: 422,
        json: {
          message: "The selected role is invalid.",
          errors: { role: ["The selected role is invalid."] },
        },
      });
      await page.getByTestId("dialog-save-button").click();
      await expect(dialog).toContainText("The selected role is invalid.");

      await mockMethod(page, "PUT", MEMBER_URL, SERVER_ERROR_RESPONSE);
      await page.getByTestId("dialog-save-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
      await expect(dialog).toBeVisible();
      await expect(dialog).not.toContainText("The selected role is invalid.");

      await page.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toHaveCount(0);
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await openMemberDialog(page, "edit");
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
      await interceptRoomIndexRequests(page);
      await openMemberDialog(page, "edit");

      await mockMethod(page, "PUT", MEMBER_URL, ROOM_NOT_FOUND_RESPONSE);
      await page.getByTestId("dialog-save-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("delete member", () => {
    test("shows the confirmation dialog", async ({ page }) => {
      await expect(page.getByTestId("room-members-delete-dialog")).toHaveCount(
        0,
      );
      await openMemberDialog(page, "delete");

      const dialog = page.getByTestId("room-members-delete-dialog");
      await expect(dialog).toContainText("rooms.members.modals.remove.title");
      await expect(dialog).toContainText(
        'rooms.members.modals.remove.confirm_{"firstname":"Laura","lastname":"Rivera"}',
      );
    });

    test("deletes the member", async ({ page }) => {
      await openMemberDialog(page, "delete");

      const deleteMember = await mockMethod(page, "DELETE", MEMBER_URL, {
        status: 204,
        hold: true,
      });
      await mockMembersWithoutFirstMember(page);

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

      deleteMember.release();
      await nthRequest(deleteMember);

      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
      await expect(page.getByTestId("room-members-delete-dialog")).toHaveCount(
        0,
      );
    });

    test("reloads the members if the member is gone", async ({ page }) => {
      await openMemberDialog(page, "delete");

      await mockMethod(page, "DELETE", MEMBER_URL, MEMBER_NOT_FOUND_RESPONSE);
      await mockMembersWithoutFirstMember(page);

      await page.getByTestId("dialog-continue-button").click();

      await expect(page.getByTestId("room-members-delete-dialog")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
      await expectToastAndClose(page, "app.errors.not_member_of_room");
    });

    test("shows a server error", async ({ page }) => {
      await openMemberDialog(page, "delete");

      await mockMethod(page, "DELETE", MEMBER_URL, SERVER_ERROR_RESPONSE);
      await page.getByTestId("dialog-continue-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
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
          await openMemberDialog(page, "delete");
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
      await interceptRoomIndexRequests(page);
      await openMemberDialog(page, "delete");

      await mockMethod(page, "DELETE", MEMBER_URL, ROOM_NOT_FOUND_RESPONSE);
      await page.getByTestId("dialog-continue-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });
});
