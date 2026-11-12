import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { mockMethod, nthRequest } from "../support/utils.js";
import {
  interceptRoomViewRequests,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { checkRoomAuthErrors } from "../support/room.js";

const MEMBERS_URL = "**/api/v1/rooms/abc-def-123/member*";
const BULK_URL = "**/api/v1/rooms/abc-def-123/member/bulk";

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];

const ROOM_NOT_FOUND_RESPONSE = {
  status: 404,
  json: { message: "model_not_found", model: "room", ids: ["abc-def-123"] },
};

const USER_NOT_A_MEMBER_RESPONSE = {
  status: 422,
  json: {
    message: "The user 'Laura Rivera' isn't a member.",
    errors: { "users.0": ["The user 'Laura Rivera' isn't a member."] },
  },
};

const SERVER_ERROR_RESPONSE = { status: 500, json: { message: "Test" } };

const LAURA_WALTER = {
  id: 10,
  firstname: "Laura",
  lastname: "Walter",
  email: "LauraMWalter@domain.tld",
  role: 2,
  image: null,
};

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

function setMemberTotal(members, total) {
  members.meta.per_page = Math.max(total, 3);
  members.meta.to = total || null;
  members.meta.from = total ? 1 : null;
  members.meta.total = total;
  members.meta.total_no_filter = total;
}

/**
 * Open the bulk import dialog via the add button menu.
 */
async function openBulkImportDialog(page) {
  await page.getByTestId("room-members-add-button").click();
  await page.locator("#overlay_menu_1").click();
  await expect(
    page.getByTestId("room-members-bulk-import-dialog"),
  ).toBeVisible();
}

/**
 * Check that the details of an import list item are hidden until the item button is clicked.
 */
async function expectErrorDetails(item, email, message) {
  await expect(item.getByText(email, { exact: true })).toBeVisible();
  await expect(item.getByText(message)).toBeHidden();
  await item.getByRole("button").click();
  await expect(item.getByText(message)).toBeVisible();
}

test.describe("Rooms view members bulk actions", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await interceptRoomViewRequests(page);
    await mockMembers(page);

    await page.goto("/rooms/abc-def-123#tab=members");
    await expect(page.getByTestId("room-member-item")).toHaveCount(3);
  });

  test.describe("bulk edit", () => {
    test("hides the edit button and dialog if no member is selected", async ({
      page,
    }) => {
      await expect(
        page.getByTestId("room-members-bulk-edit-button"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("room-members-bulk-edit-dialog"),
      ).toHaveCount(0);
    });

    test("selects and unselects members", async ({ page }) => {
      const items = page.getByTestId("room-member-item");

      for (const item of [items.nth(0), items.nth(1), items.nth(2)]) {
        await expect(item.locator("input")).not.toBeChecked();
      }

      await items.nth(0).locator("input").click();
      await items.nth(1).locator("input").click();

      await expect(items.nth(0).locator("input")).toBeChecked();
      await expect(items.nth(1).locator("input")).toBeChecked();
      await expect(items.nth(2).locator("input")).not.toBeChecked();

      await expect(items.nth(0)).toContainText("rooms.roles.participant");
      await expect(items.nth(1)).toContainText("rooms.roles.moderator");
      await expect(items.nth(2)).toContainText("rooms.roles.co_owner");

      await items.nth(1).locator("input").click();
      await expect(items.nth(0).locator("input")).toBeChecked();
      await expect(items.nth(1).locator("input")).not.toBeChecked();
    });

    test("opens the dialog with the roles for the selected members", async ({
      page,
    }) => {
      await page
        .getByTestId("room-member-item")
        .nth(0)
        .locator("input")
        .click();

      const dialog = page.getByTestId("room-members-bulk-edit-dialog");
      await expect(dialog).toHaveCount(0);
      await page.getByTestId("room-members-bulk-edit-button").click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'rooms.members.modals.edit.title_bulk_{"count":1,"n":1}',
      );

      for (const [group, role, id, value] of [
        ["participant", "participant", "participant", "1"],
        ["moderator", "moderator", "moderator", "2"],
        ["co-owner", "co_owner", "co_owner", "3"],
      ]) {
        const roleGroup = dialog.getByTestId(`${group}-role-group`);
        await expect(roleGroup).toContainText(`rooms.roles.${role}`);
        await expect(roleGroup.locator(`#${id}-role`)).not.toBeChecked();
        await expect(roleGroup.locator(`#${id}-role`)).toHaveValue(value);
      }
    });

    test("changes the role of one member", async ({ page }) => {
      const items = page.getByTestId("room-member-item");
      await items.nth(0).locator("input").click();
      await page.getByTestId("room-members-bulk-edit-button").click();

      const dialog = page.getByTestId("room-members-bulk-edit-dialog");
      await dialog.locator("#moderator-role").click();

      const bulkEdit = await mockMethod(page, "PUT", BULK_URL, {
        status: 204,
        hold: true,
      });
      await mockMembers(page, (members) => {
        members.data[0].role = 2;
      });

      await dialog.getByTestId("dialog-save-button").click();

      // Loading state
      await expect(dialog.locator("#participant-role")).toBeDisabled();
      await expect(dialog.locator("#moderator-role")).toBeDisabled();
      await expect(dialog.locator("#co_owner-role")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-save-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
        "app.save",
      );
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.cancel",
      );

      bulkEdit.release();

      expect((await nthRequest(bulkEdit)).postDataJSON()).toEqual({
        role: 2,
        users: [5],
      });

      // Dialog is closed, selection is reset and the new roles are shown
      await expect(dialog).toHaveCount(0);
      await expect(
        page.getByTestId("room-members-bulk-edit-button"),
      ).toHaveCount(0);
      await expect(items.nth(0).locator("input")).not.toBeChecked();
      await expect(items.nth(0)).toContainText("rooms.roles.moderator");
      await expect(items.nth(1)).toContainText("rooms.roles.moderator");
      await expect(items.nth(2)).toContainText("rooms.roles.co_owner");
    });

    test("changes the role of all members", async ({ page }) => {
      const items = page.getByTestId("room-member-item");
      await page.getByTestId("room-members-select-all-checkbox").click();

      for (const index of [0, 1, 2]) {
        await expect(items.nth(index).locator("input")).toBeChecked();
      }

      await page.getByTestId("room-members-bulk-edit-button").click();

      const dialog = page.getByTestId("room-members-bulk-edit-dialog");
      await expect(dialog).toContainText(
        'rooms.members.modals.edit.title_bulk_{"count":3,"n":3}',
      );
      await dialog.locator("#participant-role").click();

      const bulkEdit = await mockMethod(page, "PUT", BULK_URL, { status: 204 });
      await mockMembers(page, (members) => {
        for (const member of members.data) {
          member.role = 1;
        }
      });

      await dialog.getByTestId("dialog-save-button").click();

      expect((await nthRequest(bulkEdit)).postDataJSON()).toEqual({
        role: 1,
        users: [5, 6, 7],
      });

      await expect(dialog).toHaveCount(0);
      await expect(
        page.getByTestId("room-members-bulk-edit-button"),
      ).toHaveCount(0);

      for (const index of [0, 1, 2]) {
        await expect(items.nth(index)).toContainText("rooms.roles.participant");
        await expect(items.nth(index).locator("input")).not.toBeChecked();
      }
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId("room-members-select-all-checkbox").click();
        await page.getByTestId("room-members-bulk-edit-button").click();
        await expect(
          page.getByTestId("room-members-bulk-edit-dialog"),
        ).toBeVisible();
      });

      test("shows the validation error and keeps the selection after closing the dialog", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-bulk-edit-dialog");
        await mockMethod(page, "PUT", BULK_URL, {
          status: 422,
          json: {
            message: "The Role field is required.",
            errors: { role: ["The Role field is required."] },
          },
        });

        await dialog.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText("The Role field is required.");

        await dialog.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toHaveCount(0);

        await expect(
          page.getByTestId("room-members-select-all-checkbox").locator("input"),
        ).toBeChecked();
        for (const index of [0, 1, 2]) {
          await expect(
            page.getByTestId("room-member-item").nth(index).locator("input"),
          ).toBeChecked();
        }
      });

      test("hides the validation error when the dialog is opened again", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-bulk-edit-dialog");
        await mockMethod(page, "PUT", BULK_URL, {
          status: 422,
          json: {
            message: "The Role field is required.",
            errors: { role: ["The Role field is required."] },
          },
        });

        await dialog.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText("The Role field is required.");

        await dialog.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toHaveCount(0);

        await page.getByTestId("room-members-bulk-edit-button").click();
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText("The Role field is required.");
      });

      test("shows the validation error if a user is not a member", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-bulk-edit-dialog");
        await dialog.locator("#moderator-role").click();
        await mockMethod(page, "PUT", BULK_URL, USER_NOT_A_MEMBER_RESPONSE);

        await dialog.getByTestId("dialog-save-button").click();

        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          "The user 'Laura Rivera' isn't a member.",
        );
      });

      test("shows the server error and keeps the selection after closing the dialog", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-bulk-edit-dialog");
        await dialog.locator("#moderator-role").click();
        await mockMethod(page, "PUT", BULK_URL, USER_NOT_A_MEMBER_RESPONSE);
        await dialog.getByTestId("dialog-save-button").click();
        await expect(dialog).toContainText(
          "The user 'Laura Rivera' isn't a member.",
        );

        await mockMethod(page, "PUT", BULK_URL, SERVER_ERROR_RESPONSE);
        await dialog.getByTestId("dialog-save-button").click();

        await expectToastAndClose(page, SERVER_ERROR_TOAST);
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText(
          "The user 'Laura Rivera' isn't a member.",
        );

        await dialog.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toHaveCount(0);

        await expect(
          page.getByTestId("room-members-select-all-checkbox").locator("input"),
        ).toBeChecked();
        for (const index of [0, 1, 2]) {
          await expect(
            page.getByTestId("room-member-item").nth(index).locator("input"),
          ).toBeChecked();
        }
      });
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page
            .getByTestId("room-members-select-all-checkbox")
            .locator("input")
            .click();
          await page.getByTestId("room-members-bulk-edit-button").click();
          await expect(
            page.getByTestId("room-members-bulk-edit-dialog"),
          ).toBeVisible();
          await page.getByTestId("dialog-save-button").click();
        },
        "PUT",
        "api/v1/rooms/abc-def-123/member/bulk",
        "members",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "PUT", BULK_URL, ROOM_NOT_FOUND_RESPONSE);

      await page.getByTestId("room-members-select-all-checkbox").click();
      await page.getByTestId("room-members-bulk-edit-button").click();
      await expect(
        page.getByTestId("room-members-bulk-edit-dialog"),
      ).toBeVisible();
      await page.getByTestId("dialog-save-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("bulk delete", () => {
    test("hides the delete button and dialog if no member is selected", async ({
      page,
    }) => {
      await expect(
        page.getByTestId("room-members-bulk-delete-button"),
      ).toHaveCount(0);
      await expect(
        page.getByTestId("room-members-bulk-delete-dialog"),
      ).toHaveCount(0);
    });

    test("opens the dialog for one selected member", async ({ page }) => {
      const items = page.getByTestId("room-member-item");
      await expect(items.nth(0).locator("input")).not.toBeChecked();
      await items.nth(0).locator("input").click();

      await expect(items.nth(0).locator("input")).toBeChecked();
      await expect(items.nth(1).locator("input")).not.toBeChecked();
      await expect(items.nth(2).locator("input")).not.toBeChecked();

      const dialog = page.getByTestId("room-members-bulk-delete-dialog");
      await expect(dialog).toHaveCount(0);
      await page.getByTestId("room-members-bulk-delete-button").click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'rooms.members.modals.remove.title_bulk_{"count":1,"n":1}',
      );
      await expect(dialog).toContainText(
        'rooms.members.modals.remove.confirm_bulk_{"count":1,"n":1}',
      );
    });

    test("deletes one member", async ({ page }) => {
      await page
        .getByTestId("room-member-item")
        .nth(0)
        .locator("input")
        .click();
      await page.getByTestId("room-members-bulk-delete-button").click();

      const dialog = page.getByTestId("room-members-bulk-delete-dialog");
      await expect(dialog).toBeVisible();

      const bulkDelete = await mockMethod(page, "DELETE", BULK_URL, {
        status: 204,
        hold: true,
      });
      await mockMembers(page, (members) => {
        members.data = members.data.slice(1, 3);
        setMemberTotal(members, 2);
      });

      await expect(dialog.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await dialog.getByTestId("dialog-continue-button").click();

      // Loading state
      await expect(dialog.getByTestId("dialog-cancel-button")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
        "app.no",
      );
      await expect(dialog.getByTestId("dialog-continue-button")).toBeDisabled();

      bulkDelete.release();

      expect((await nthRequest(bulkDelete)).postDataJSON()).toEqual({
        users: [5],
      });

      await expect(dialog).toHaveCount(0);
      await expect(
        page.getByTestId("room-members-bulk-delete-button"),
      ).toHaveCount(0);
      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
    });

    test("deletes several members", async ({ page }) => {
      // Only two members left
      await mockMembers(page, (members) => {
        members.data = members.data.slice(1, 3);
        setMemberTotal(members, 2);
      });
      await page.getByTestId("room-members-reload-button").click();

      const items = page.getByTestId("room-member-item");
      await expect(items).toHaveCount(2);

      await items.nth(0).locator("input").click();
      await items.nth(1).locator("input").click();
      await expect(
        page.getByTestId("room-members-select-all-checkbox").locator("input"),
      ).toBeChecked();

      const dialog = page.getByTestId("room-members-bulk-delete-dialog");
      await expect(dialog).toHaveCount(0);
      await page.getByTestId("room-members-bulk-delete-button").click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'rooms.members.modals.remove.title_bulk_{"count":2,"n":2}',
      );
      await expect(dialog).toContainText(
        'rooms.members.modals.remove.confirm_bulk_{"count":2,"n":2}',
      );

      const bulkDelete = await mockMethod(page, "DELETE", BULK_URL, {
        status: 204,
      });
      await mockMembers(page, (members) => {
        members.data = [];
        setMemberTotal(members, 0);
      });

      await expect(dialog.getByTestId("dialog-continue-button")).toHaveText(
        "app.yes",
      );
      await dialog.getByTestId("dialog-continue-button").click();

      expect((await nthRequest(bulkDelete)).postDataJSON()).toEqual({
        users: [6, 7],
      });

      await expect(dialog).toHaveCount(0);
      await expect(
        page.getByTestId("room-members-bulk-delete-button"),
      ).toHaveCount(0);
      await expect(items).toHaveCount(0);
      await expect(page.getByText("rooms.members.nodata")).toBeVisible();
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await page.getByTestId("room-members-select-all-checkbox").click();
        await page.getByTestId("room-members-bulk-delete-button").click();
        await expect(
          page.getByTestId("room-members-bulk-delete-dialog"),
        ).toBeVisible();
      });

      test("shows the validation error if a user is not a member", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-bulk-delete-dialog");
        await mockMethod(page, "DELETE", BULK_URL, USER_NOT_A_MEMBER_RESPONSE);

        await dialog.getByTestId("dialog-continue-button").click();

        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          "The user 'Laura Rivera' isn't a member.",
        );
      });

      test("shows the server error and keeps the selection after closing the dialog", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-bulk-delete-dialog");
        await mockMethod(page, "DELETE", BULK_URL, USER_NOT_A_MEMBER_RESPONSE);
        await dialog.getByTestId("dialog-continue-button").click();
        await expect(dialog).toContainText(
          "The user 'Laura Rivera' isn't a member.",
        );

        await mockMethod(page, "DELETE", BULK_URL, SERVER_ERROR_RESPONSE);
        await dialog.getByTestId("dialog-continue-button").click();

        await expectToastAndClose(page, SERVER_ERROR_TOAST);
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText(
          "The user 'Laura Rivera' isn't a member.",
        );

        await dialog.getByTestId("dialog-cancel-button").click();
        await expect(dialog).toHaveCount(0);

        await expect(
          page.getByTestId("room-members-select-all-checkbox").locator("input"),
        ).toBeChecked();
        for (const index of [0, 1, 2]) {
          await expect(
            page.getByTestId("room-member-item").nth(index).locator("input"),
          ).toBeChecked();
        }
      });
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page
            .getByTestId("room-members-select-all-checkbox")
            .locator("input")
            .click();
          await page.getByTestId("room-members-bulk-delete-button").click();
          await expect(
            page.getByTestId("room-members-bulk-delete-dialog"),
          ).toBeVisible();
          await page.getByTestId("dialog-continue-button").click();
        },
        "DELETE",
        "api/v1/rooms/abc-def-123/member/bulk",
        "members",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "DELETE", BULK_URL, ROOM_NOT_FOUND_RESPONSE);

      await page.getByTestId("room-members-select-all-checkbox").click();
      await page.getByTestId("room-members-bulk-delete-button").click();
      await expect(
        page.getByTestId("room-members-bulk-delete-dialog"),
      ).toBeVisible();
      await page.getByTestId("dialog-continue-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });

  test.describe("bulk import", () => {
    test("opens the dialog from the add menu", async ({ page }) => {
      await expect(page.locator("#overlay_menu")).toHaveCount(0);

      await page.getByTestId("room-members-add-button").click();
      await expect(page.locator("#overlay_menu")).toBeVisible();

      await expect(
        page.getByTestId("room-members-bulk-import-dialog"),
      ).toHaveCount(0);
      await expect(page.locator("#overlay_menu_1")).toHaveText(
        "rooms.members.bulk_import_users",
      );
      await page.locator("#overlay_menu_1").click();

      const dialog = page.getByTestId("room-members-bulk-import-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("rooms.members.bulk_import_users");
      await expect(dialog.getByTestId("dialog-continue-button")).toHaveText(
        "rooms.members.modals.add.add",
      );
      await expect(dialog.locator("#user-emails")).toHaveValue("");
      await expect(dialog.locator("#user-emails")).toHaveAttribute(
        "placeholder",
        "rooms.members.modals.bulk_import.list_placeholder",
      );

      for (const [group, role, id, value] of [
        ["participant", "participant", "participant", "1"],
        ["moderator", "moderator", "moderator", "2"],
        ["co-owner", "co_owner", "co_owner", "3"],
      ]) {
        const roleGroup = dialog.getByTestId(`${group}-role-group`);
        await expect(roleGroup).toContainText(`rooms.roles.${role}`);
        await expect(roleGroup.locator(`#${id}-role`)).not.toBeChecked();
        await expect(roleGroup.locator(`#${id}-role`)).toHaveValue(value);
      }
    });

    test("imports valid users", async ({ page }) => {
      await openBulkImportDialog(page);
      const dialog = page.getByTestId("room-members-bulk-import-dialog");

      await dialog
        .locator("#user-emails")
        .fill("LauraWRivera@domain.tld\nLauraMWalter@domain.tld");
      await dialog.locator("#moderator-role").click();

      const bulkImport = await mockMethod(page, "POST", BULK_URL, {
        status: 204,
        hold: true,
      });
      await mockMembers(page, (members) => {
        members.data = [members.data[0], LAURA_WALTER];
        members.data[0].role = 2;
        setMemberTotal(members, 2);
      });

      await dialog.getByTestId("dialog-continue-button").click();

      // Loading state
      await expect(dialog.locator("#participant-role")).toBeDisabled();
      await expect(dialog.locator("#moderator-role")).toBeDisabled();
      await expect(dialog.locator("#co_owner-role")).toBeDisabled();
      await expect(dialog.getByTestId("dialog-continue-button")).toBeDisabled();
      await expect(dialog.locator("#user-emails")).toBeDisabled();

      bulkImport.release();

      expect((await nthRequest(bulkImport)).postDataJSON()).toEqual({
        role: 2,
        user_emails: ["laurawrivera@domain.tld", "lauramwalter@domain.tld"],
      });

      const lists = dialog.getByTestId("room-members-bulk-import-list");
      await expect(lists).toContainText(
        "rooms.members.modals.bulk_import.imported_users",
      );
      const listItems = dialog.getByTestId(
        "room-members-bulk-import-list-item",
      );
      await expect(listItems).toHaveCount(2);
      await expect(listItems.nth(0)).toHaveText("laurawrivera@domain.tld");
      await expect(listItems.nth(0).locator("button")).toBeDisabled();
      await expect(listItems.nth(1)).toHaveText("lauramwalter@domain.tld");
      await expect(listItems.nth(1).locator("button")).toBeDisabled();

      await expect(
        dialog.getByTestId("room-members-copy-and-close-button"),
      ).toHaveCount(0);

      await expect(dialog.getByTestId("dialog-close-button")).toHaveText(
        "app.close",
      );
      await dialog.getByTestId("dialog-close-button").click();

      await expect(dialog).toHaveCount(0);
      await expect(page.getByTestId("room-member-item")).toHaveCount(2);
    });

    test("keeps the selected role and clears the emails when the dialog is opened again", async ({
      page,
    }) => {
      await openBulkImportDialog(page);
      const dialog = page.getByTestId("room-members-bulk-import-dialog");

      await dialog.locator("#user-emails").fill("LauraWRivera@domain.tld");
      await dialog.locator("#moderator-role").click();

      const bulkImport = await mockMethod(page, "POST", BULK_URL, {
        status: 204,
      });
      await dialog.getByTestId("dialog-continue-button").click();
      await nthRequest(bulkImport);
      await dialog.getByTestId("dialog-close-button").click();
      await expect(dialog).toHaveCount(0);

      await openBulkImportDialog(page);
      await expect(dialog.locator("#user-emails")).toHaveValue("");
      await expect(dialog.locator("#moderator-role")).toBeChecked();
    });

    test.describe("valid and invalid users", () => {
      const EMAILS =
        "\n\n\nJuanMWalter@domain.tld\ntammyglaw@do  main  .tld\n\nnotAn\tE  ma il\ninvalidemail@domain.tld\n\n\n";

      let dialog;
      let bulkImport;

      test.beforeEach(async ({ page }) => {
        await openBulkImportDialog(page);
        dialog = page.getByTestId("room-members-bulk-import-dialog");

        await dialog.locator("#user-emails").fill(EMAILS);
        await dialog.locator("#co_owner-role").click();

        bulkImport = await mockMethod(page, "POST", BULK_URL, {
          status: 422,
          json: {
            errors: {
              "user_emails.2": ["notanemail must be a valid email address."],
              "user_emails.3": ["No user was found with this e-mail"],
            },
          },
        });

        await dialog.getByTestId("dialog-continue-button").click();
      });

      test("sends the normalized emails and keeps the text when going back", async () => {
        expect((await nthRequest(bulkImport)).postDataJSON()).toEqual({
          role: 3,
          user_emails: [
            "juanmwalter@domain.tld",
            "tammyglaw@domain.tld",
            "notanemail",
            "invalidemail@domain.tld",
          ],
        });

        await expect(dialog.getByTestId("dialog-back-button")).toHaveText(
          "app.back",
        );
        await dialog.getByTestId("dialog-back-button").click();
        await expect(dialog.locator("#user-emails")).toHaveValue(EMAILS);
      });

      test("shows the users that can and cannot be imported", async () => {
        const lists = dialog.getByTestId("room-members-bulk-import-list");
        await expect(lists).toHaveCount(2);

        await expect(lists.nth(0)).toContainText(
          "rooms.members.modals.bulk_import.can_import_users",
        );
        const importable = lists
          .nth(0)
          .getByTestId("room-members-bulk-import-list-item");
        await expect(importable).toHaveCount(2);
        await expect(importable.nth(0)).toHaveText("juanmwalter@domain.tld");
        await expect(importable.nth(0).locator("button")).toBeDisabled();
        await expect(importable.nth(1)).toHaveText("tammyglaw@domain.tld");
        await expect(importable.nth(1).locator("button")).toBeDisabled();

        await expect(lists.nth(1)).toContainText(
          "rooms.members.modals.bulk_import.cannot_import_users",
        );
        const invalid = lists
          .nth(1)
          .getByTestId("room-members-bulk-import-list-item");
        await expect(invalid).toHaveCount(2);
        await expectErrorDetails(
          invalid.nth(0),
          "notanemail",
          "notanemail must be a valid email address.",
        );
        await expectErrorDetails(
          invalid.nth(1),
          "invalidemail@domain.tld",
          "No user was found with this e-mail",
        );

        await expect(dialog).toContainText(
          "rooms.members.modals.bulk_import.import_importable_question",
        );
      });

      test.describe("import the importable users", () => {
        test.use({ permissions: ["clipboard-read", "clipboard-write"] });

        test.beforeEach(async ({ page }) => {
          await expect(
            dialog.getByTestId("room-members-bulk-import-list"),
          ).toHaveCount(2);

          bulkImport = await mockMethod(page, "POST", BULK_URL, {
            status: 204,
          });
          await mockMembers(page, (members) => {
            members.data[0].role = 2;
            members.data[1].role = 3;
            members.data.push(LAURA_WALTER);
            setMemberTotal(members, 4);
          });

          await expect(dialog.getByTestId("dialog-continue-button")).toHaveText(
            'rooms.members.modals.bulk_import.import_importable_button_{"count":2,"n":2}',
          );
          await dialog.getByTestId("dialog-continue-button").click();
        });

        test("shows the imported and not imported users", async () => {
          expect((await nthRequest(bulkImport)).postDataJSON()).toEqual({
            role: 3,
            user_emails: ["juanmwalter@domain.tld", "tammyglaw@domain.tld"],
          });

          const lists = dialog.getByTestId("room-members-bulk-import-list");
          await expect(lists).toHaveCount(2);

          await expect(lists.nth(0)).toContainText(
            "rooms.members.modals.bulk_import.imported_users",
          );
          const imported = lists
            .nth(0)
            .getByTestId("room-members-bulk-import-list-item");
          await expect(imported).toHaveCount(2);
          await expect(imported.nth(0)).toHaveText("juanmwalter@domain.tld");
          await expect(imported.nth(0).locator("button")).toBeDisabled();
          await expect(imported.nth(1)).toHaveText("tammyglaw@domain.tld");
          await expect(imported.nth(1).locator("button")).toBeDisabled();

          await expect(lists.nth(1)).toContainText(
            "rooms.members.modals.bulk_import.could_not_import_users",
          );
          const invalid = lists
            .nth(1)
            .getByTestId("room-members-bulk-import-list-item");
          await expect(invalid).toHaveCount(2);
          await expectErrorDetails(
            invalid.nth(0),
            "notanemail",
            "notanemail must be a valid email address.",
          );
          await expectErrorDetails(
            invalid.nth(1),
            "invalidemail@domain.tld",
            "No user was found with this e-mail",
          );

          await expect(dialog.getByTestId("dialog-close-button")).toHaveText(
            "app.close",
          );
        });

        test("copies the invalid users and closes the dialog", async ({
          page,
        }) => {
          await nthRequest(bulkImport);

          const copyButton = dialog.getByTestId(
            "room-members-copy-and-close-button",
          );
          await expect(copyButton).toHaveText(
            'rooms.members.modals.bulk_import.copy_and_close_{"count":2,"n":2}',
          );
          await copyButton.click();

          expect(
            await page.evaluate(() => navigator.clipboard.readText()),
          ).toBe("notanemail\ninvalidemail@domain.tld");

          await expect(dialog).toHaveCount(0);
          await expectToastAndClose(
            page,
            'rooms.members.modals.bulk_import.copied_invalid_users_{"count":2,"n":2}',
          );
          await expect(page.getByTestId("room-member-item")).toHaveCount(4);
        });
      });
    });

    test.describe("only invalid users", () => {
      let dialog;
      let bulkImport;

      test.beforeEach(async ({ page }) => {
        await openBulkImportDialog(page);
        dialog = page.getByTestId("room-members-bulk-import-dialog");

        await dialog
          .locator("#user-emails")
          .fill("invalidEmail@domain.tld\nnotAnEmail");
        await dialog.locator("#participant-role").click();

        bulkImport = await mockMethod(page, "POST", BULK_URL, {
          status: 422,
          json: {
            errors: {
              "user_emails.0": ["No user was found with this e-mail"],
              "user_emails.1": ["notanemail must be a valid email adress."],
            },
          },
        });

        await dialog.getByTestId("dialog-continue-button").click();
      });

      test("sends the normalized emails and keeps the text when going back", async () => {
        expect((await nthRequest(bulkImport)).postDataJSON()).toEqual({
          role: 1,
          user_emails: ["invalidemail@domain.tld", "notanemail"],
        });

        await expect(dialog.getByTestId("dialog-back-button")).toHaveText(
          "app.back",
        );
        await dialog.getByTestId("dialog-back-button").click();
        await expect(dialog.locator("#user-emails")).toHaveValue(
          "invalidEmail@domain.tld\nnotAnEmail",
        );
      });

      test("shows only the users that cannot be imported", async () => {
        const lists = dialog.getByTestId("room-members-bulk-import-list");
        await expect(lists).toHaveCount(1);
        await expect(lists.nth(0)).toContainText(
          "rooms.members.modals.bulk_import.cannot_import_users",
        );

        const invalid = lists
          .nth(0)
          .getByTestId("room-members-bulk-import-list-item");
        await expect(invalid).toHaveCount(2);
        await expectErrorDetails(
          invalid.nth(0),
          "invalidemail@domain.tld",
          "No user was found with this e-mail",
        );
        await expectErrorDetails(
          invalid.nth(1),
          "notanemail",
          "notanemail must be a valid email adress.",
        );

        // No button to import the valid users
        await expect(dialog.getByTestId("dialog-continue-button")).toHaveCount(
          0,
        );
      });

      test("imports a valid user after going back", async ({ page }) => {
        await expect(
          dialog.getByTestId("room-members-bulk-import-list"),
        ).toHaveCount(1);

        await dialog.getByTestId("dialog-back-button").click();
        await dialog.locator("#user-emails").clear();
        await dialog.locator("#user-emails").fill("maxdoe@domain.tld");

        bulkImport = await mockMethod(page, "POST", BULK_URL, { status: 204 });
        await mockMembers(page, (members) => {
          members.data[0].role = 2;
          members.data[1].role = 3;
          members.data.unshift({
            id: 2,
            firstname: "Max",
            lastname: "Doe",
            email: "maxdoe@domain.tld",
            role: 1,
            image: null,
          });
          members.data.push(LAURA_WALTER);
          setMemberTotal(members, 5);
        });

        await dialog.getByTestId("dialog-continue-button").click();

        expect((await nthRequest(bulkImport)).postDataJSON()).toEqual({
          role: 1,
          user_emails: ["maxdoe@domain.tld"],
        });

        const lists = dialog.getByTestId("room-members-bulk-import-list");
        await expect(lists).toHaveCount(1);
        await expect(lists.nth(0)).toContainText(
          "rooms.members.modals.bulk_import.imported_users",
        );
        const imported = lists
          .nth(0)
          .getByTestId("room-members-bulk-import-list-item");
        await expect(imported).toHaveCount(1);
        await expect(imported.nth(0)).toHaveText("maxdoe@domain.tld");
        await expect(imported.nth(0).locator("button")).toBeDisabled();

        await expect(dialog.getByTestId("dialog-close-button")).toHaveText(
          "app.close",
        );
        await dialog.getByTestId("dialog-close-button").click();

        await expect(dialog).toHaveCount(0);
        await expect(page.getByTestId("room-member-item")).toHaveCount(5);
      });
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await openBulkImportDialog(page);
      });

      test("shows the validation error for the emails", async ({ page }) => {
        const dialog = page.getByTestId("room-members-bulk-import-dialog");
        await dialog.locator("#user-emails").fill("\n");
        await mockMethod(page, "POST", BULK_URL, {
          status: 422,
          json: {
            message: "The user emails field is required.",
            errors: { user_emails: ["The user emails field is required."] },
          },
        });

        await dialog.getByTestId("dialog-continue-button").click();

        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(
          "The user emails field is required.",
        );
      });

      test("replaces the previous validation error", async ({ page }) => {
        const dialog = page.getByTestId("room-members-bulk-import-dialog");
        await dialog.locator("#user-emails").fill("\n");
        await mockMethod(page, "POST", BULK_URL, {
          status: 422,
          json: {
            message: "The user emails field is required.",
            errors: { user_emails: ["The user emails field is required."] },
          },
        });
        await dialog.getByTestId("dialog-continue-button").click();
        await expect(dialog).toContainText(
          "The user emails field is required.",
        );

        await dialog.locator("#user-emails").fill("\nlaurawrivera@domain.tld");
        await mockMethod(page, "POST", BULK_URL, {
          status: 422,
          json: {
            message: "The selected role is invalid.",
            errors: { role: ["The selected role is invalid."] },
          },
        });
        await dialog.getByTestId("dialog-continue-button").click();

        await expect(dialog).toContainText("The selected role is invalid.");
        await expect(dialog).not.toContainText(
          "The user emails field is required.",
        );
      });

      test("shows the server error and keeps the entered emails", async ({
        page,
      }) => {
        const dialog = page.getByTestId("room-members-bulk-import-dialog");
        await dialog.locator("#user-emails").fill("\nlaurawrivera@domain.tld");
        await mockMethod(page, "POST", BULK_URL, {
          status: 422,
          json: {
            message: "The selected role is invalid.",
            errors: { role: ["The selected role is invalid."] },
          },
        });
        await dialog.getByTestId("dialog-continue-button").click();
        await expect(dialog).toContainText("The selected role is invalid.");

        await mockMethod(page, "POST", BULK_URL, SERVER_ERROR_RESPONSE);
        await dialog.getByTestId("dialog-continue-button").click();

        await expectToastAndClose(page, SERVER_ERROR_TOAST);
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toContainText("The selected role is invalid.");
        await expect(dialog.locator("#user-emails")).toHaveValue(
          "\nlaurawrivera@domain.tld",
        );

        await dialog.getByTestId("dialog-header-close-button").click();
        await expect(dialog).toHaveCount(0);
      });
    });

    test("handles auth errors", async ({ page }) => {
      await checkRoomAuthErrors(
        page,
        async (page) => {
          await page.getByTestId("room-members-add-button").click();
          await expect(page.locator("#overlay_menu_1")).toHaveText(
            "rooms.members.bulk_import_users",
          );
          await page.locator("#overlay_menu_1").click();
          await expect(
            page.getByTestId("room-members-bulk-import-dialog"),
          ).toBeVisible();
          await page.locator("#user-emails").fill("\n");
          await page.getByTestId("dialog-continue-button").click();
        },
        "POST",
        "api/v1/rooms/abc-def-123/member/bulk",
        "members",
      );
    });

    test("redirects to the room index page if the room is not found", async ({
      page,
    }) => {
      await interceptRoomIndexRequests(page);
      await mockMethod(page, "POST", BULK_URL, ROOM_NOT_FOUND_RESPONSE);

      await openBulkImportDialog(page);
      await page.locator("#user-emails").fill("\n");
      await page.getByTestId("dialog-continue-button").click();

      await expect(page).toHaveURL((url) => url.pathname === "/rooms");
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });
  });
});
