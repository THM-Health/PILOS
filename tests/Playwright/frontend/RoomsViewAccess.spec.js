import { test } from "../support/fixtures/roomsAccess.js";
import { expect } from "../support/test.js";
import { interceptRoomFilesRequest } from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.describe("Rooms View access", () => {
  test.beforeEach(async ({ page }) => {
    await interceptRoomFilesRequest(page);
  });

  test.describe("guest", () => {
    test.beforeEach(async ({ room }) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
    });

    test("shows access overlay with login button and participant name field", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123");

      await expect(page).toHaveTitle("Meeting One - PILOS Test");

      const overlay = page.getByTestId("room-access-overlay");
      await expect(overlay).toBeVisible();

      await expect(overlay.getByText("Meeting One")).toBeVisible();
      await expect(overlay.getByText("John Doe")).toBeVisible();
      await expect(
        overlay.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();

      const loginButton = overlay.getByTestId("room-login-as-user-button");
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toHaveText("auth.offer_login");
      await expect(loginButton).toHaveAttribute(
        "href",
        "/login?redirect=/rooms/abc-def-123",
      );

      const nameField = overlay.getByTestId("participant-name-field");
      await expect(nameField).toBeVisible();
      await expect(
        nameField.getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(nameField.locator("#participant-name")).toBeVisible();
      await expect(nameField.locator("#participant-name")).toHaveValue("");
      await expect(
        nameField.getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        nameField.locator("#remember-participant-name"),
      ).not.toBeChecked();

      await expect(overlay.getByTestId("access-code-field")).toHaveCount(0);
      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
    });

    test("disables login button while the participant name is checked", async ({
      page,
    }) => {
      const check = await mockMethod(
        page,
        "POST",
        "**/api/v1/participantName/check",
        { status: 204, hold: true },
      );
      await page.goto("/rooms/abc-def-123");

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();

      await expect(page.getByTestId("room-login-button")).toBeDisabled();
      const request = await nthRequest(check);
      expect(request.postDataJSON()).toEqual({ name: "Laura Rivera" });
      check.release();

      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    });

    test("enters the room as guest without remembering the name", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123");

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();

      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByText("Meeting One")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();

      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();
      await expect(
        page.getByTestId("change-participant-name-button"),
      ).toBeVisible();

      await expect(page.getByTestId("reload-room-button")).toBeVisible();
      await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-end-membership-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
      await expect(page.getByTestId("room-share-button")).toHaveCount(0);

      await expect(page.locator("#tab-files")).toBeVisible();
      await expect(page.locator("#tab-recordings")).toBeVisible();
      for (const tab of [
        "description",
        "members",
        "tokens",
        "history",
        "settings",
      ]) {
        await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
      }
      await expect(page.getByText("rooms.files.title")).toBeVisible();

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);
    });

    test("enters the room as guest and remembers the name", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123");

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.locator("#remember-participant-name").check();
      await page.getByTestId("room-login-button").click();

      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByText("Meeting One")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();

      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();
      await expect(
        page.getByTestId("change-participant-name-button"),
      ).toBeVisible();

      await expect(page.getByTestId("reload-room-button")).toBeVisible();
      await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-end-membership-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
      await expect(page.getByTestId("room-share-button")).toHaveCount(0);

      await expect(page.locator("#tab-files")).toBeVisible();
      await expect(page.locator("#tab-recordings")).toBeVisible();
      for (const tab of [
        "description",
        "members",
        "tokens",
        "history",
        "settings",
      ]) {
        await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
      }
      await expect(page.getByText("rooms.files.title")).toBeVisible();

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe("Laura Rivera");
    });

    test("stays in the room after reload with remembered name", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123");

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.locator("#remember-participant-name").check();
      await page.getByTestId("room-login-button").click();
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByText("Laura Rivera")).toBeVisible();

      await page.reload();

      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByText("Meeting One")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();

      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();
      await expect(
        page.getByTestId("change-participant-name-button"),
      ).toBeVisible();

      await expect(page.getByTestId("reload-room-button")).toBeVisible();
      await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-end-membership-button")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
      await expect(page.getByTestId("room-share-button")).toHaveCount(0);

      await expect(page.locator("#tab-files")).toBeVisible();
      await expect(page.locator("#tab-recordings")).toBeVisible();
      for (const tab of [
        "description",
        "members",
        "tokens",
        "history",
        "settings",
      ]) {
        await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
      }
      await expect(page.getByText("rooms.files.title")).toBeVisible();

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe("Laura Rivera");
    });

    test("reloads the room as guest", async ({ page, room }) => {
      await page.goto("/rooms/abc-def-123");
      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByText("Laura Rivera")).toBeVisible();

      room.data.name = "Meeting Two";
      room.data.owner.id = 2;
      room.data.owner.name = "Max Doe";
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.description = "<p>Test</p>";
      room.data.access_code = null;
      const reload = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123*",
        { json: room, hold: true },
      );

      await page.getByTestId("reload-room-button").click();
      await expect(page.getByTestId("reload-room-button")).toBeDisabled();
      await nthRequest(reload);
      reload.release();

      await expect(page).toHaveTitle("Meeting Two - PILOS Test");
      await expect(page.getByText("Meeting Two")).toBeVisible();
      await expect(page.getByText("Max Doe")).toBeVisible();
      await expect(
        page.getByText(
          'rooms.index.room_component.running_since_{"date":"08/21/2023, 04:18"}',
        ),
      ).toBeVisible();
      for (const tab of ["description", "files", "recordings"]) {
        await expect(page.locator(`#tab-${tab}`)).toBeVisible();
      }
      for (const tab of ["members", "tokens", "history", "settings"]) {
        await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
      }
    });

    test("shows access overlay again after page reload without remembered name", async ({
      page,
      room,
    }) => {
      await page.goto("/rooms/abc-def-123");
      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByText("Laura Rivera")).toBeVisible();

      room.data.name = "Meeting Two";
      room.data.owner.id = 2;
      room.data.owner.name = "Max Doe";
      room.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      room.data.description = "<p>Test</p>";
      room.data.access_code = null;

      await page.reload();

      await expect(page).toHaveTitle("Meeting Two - PILOS Test");

      const overlay = page.getByTestId("room-access-overlay");
      await expect(overlay).toBeVisible();

      await expect(overlay.getByText("Meeting Two")).toBeVisible();
      await expect(overlay.getByText("Max Doe")).toBeVisible();
      await expect(
        overlay.getByText(
          'rooms.index.room_component.running_since_{"date":"08/21/2023, 04:18"}',
        ),
      ).toBeVisible();

      const loginButton = overlay.getByTestId("room-login-as-user-button");
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toHaveText("auth.offer_login");
      await expect(loginButton).toHaveAttribute(
        "href",
        "/login?redirect=/rooms/abc-def-123",
      );

      const nameField = overlay.getByTestId("participant-name-field");
      await expect(nameField).toBeVisible();
      await expect(
        nameField.getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(nameField.locator("#participant-name")).toBeVisible();
      await expect(nameField.locator("#participant-name")).toHaveValue("");
      await expect(
        nameField.getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        nameField.locator("#remember-participant-name"),
      ).not.toBeChecked();

      await expect(overlay.getByTestId("access-code-field")).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);
    });
  });

  test.describe("logged in status change", () => {
    test.use({ authenticated: true });

    test.beforeEach(async ({ page, room }) => {
      room.data.allow_membership = true;
      await page.goto("/rooms/abc-def-123");
      for (const tab of [
        "description",
        "members",
        "tokens",
        "files",
        "recordings",
        "history",
        "settings",
      ]) {
        await expect(page.locator(`#tab-${tab}`)).toBeVisible();
      }
    });

    test("logged in user becomes guest and has to enter a name", async ({
      page,
      room,
      nameCheck,
    }) => {
      room.data.current_user = null;
      await page.getByTestId("reload-room-button").click();

      const overlay = page.getByTestId("room-access-overlay");
      await expect(overlay).toBeVisible();
      await expect(
        overlay.getByTestId("room-login-as-user-button"),
      ).toBeVisible();
      await expect(overlay.getByTestId("access-code-field")).toHaveCount(0);

      await overlay.locator("#participant-name").fill("Max Doe");
      await overlay.getByTestId("room-login-button").click();

      const request = await nthRequest(nameCheck);
      expect(request.postDataJSON()).toEqual({ name: "Max Doe" });
      await expect(overlay).toBeHidden();
      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);
      await expect(page.locator("#tab-files")).toBeVisible();
      await expect(page.locator("#tab-recordings")).toBeVisible();
      for (const tab of [
        "description",
        "members",
        "tokens",
        "history",
        "settings",
      ]) {
        await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
      }
    });

    test("logged in user becomes co-owner and gets all tabs", async ({
      page,
      room,
    }) => {
      room.data.is_member = true;
      room.data.is_co_owner = true;
      room.data.current_user = {
        id: 2,
        firstname: "Max",
        lastname: "Doe",
        user_locale: "en",
        permissions: ["rooms.create"],
        model_name: "User",
        room_limit: -1,
      };
      await page.getByTestId("reload-room-button").click();

      for (const tab of [
        "description",
        "members",
        "tokens",
        "files",
        "recordings",
        "history",
        "settings",
      ]) {
        await expect(page.locator(`#tab-${tab}`)).toBeVisible();
      }
    });
  });
});
