import { test } from "../support/fixtures/roomsAccess.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomFilesRequest } from "../support/mocks.js";
import { setValidRememberedParticipantName } from "../support/room.js";
import { mockMethod, nthRequest, queryOf } from "../support/utils.js";

test.describe("Rooms View access participant name", () => {
  test.beforeEach(async ({ page }) => {
    await interceptRoomFilesRequest(page);
  });

  test.describe("participant name errors (guest)", () => {
    test.beforeEach(async ({ room }) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
    });

    test("shows participant name field without access code field", async ({
      page,
    }) => {
      await page.goto("/rooms/abc-def-123");

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        page.getByTestId("participant-name-field").locator("#participant-name"),
      ).toBeVisible();
      await expect(
        page.getByTestId("participant-name-field").locator("#participant-name"),
      ).toHaveValue("");
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).not.toBeChecked();

      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
      await expect(page.getByTestId("access-code-field")).toHaveCount(0);
    });

    test("shows validation error of the participant name", async ({
      page,
      nameCheck,
    }) => {
      nameCheck.status = 422;
      nameCheck.json = {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      };
      await page.goto("/rooms/abc-def-123");

      await page
        .locator("#participant-name")
        .fill('<script>alert("HI");</script>');
      await page.getByTestId("room-login-button").click();

      const request = await nthRequest(nameCheck);
      expect(request.postDataJSON()).toEqual({
        name: '<script>alert("HI");</script>',
      });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText(
            'Name contains the following non-permitted characters: <>";',
          ),
      ).toBeVisible();
    });

    test("shows error toast if the participant name check fails", async ({
      page,
      nameCheck,
    }) => {
      nameCheck.status = 500;
      nameCheck.json = { message: "Test" };
      await page.goto("/rooms/abc-def-123");

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();

      const request = await nthRequest(nameCheck);
      expect(request.postDataJSON()).toEqual({ name: "Laura Rivera" });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("shows participant name and access code field if the room requires an access code", async ({
      page,
      room,
    }) => {
      room.data.authenticated = false;
      await page.goto("/rooms/abc-def-123");

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        page.getByTestId("participant-name-field").locator("#participant-name"),
      ).toBeVisible();
      await expect(
        page.getByTestId("participant-name-field").locator("#participant-name"),
      ).toHaveValue("");
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).not.toBeChecked();

      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
      await expect(page.getByTestId("access-code-field")).toBeVisible();
    });

    test("does not send the access code and shows only the name error if the room requires an access code", async ({
      page,
      room,
      nameCheck,
      roomAuth,
    }) => {
      room.data.authenticated = false;
      nameCheck.status = 422;
      nameCheck.json = {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      };
      roomAuth.status = 422;
      roomAuth.json = {
        message: "The Access code field is required.",
        errors: { access_code: ["The Access code field is required."] },
      };
      await page.goto("/rooms/abc-def-123");
      await expect(page.getByTestId("access-code-field")).toBeVisible();

      await page
        .locator("#participant-name")
        .fill('<script>alert("HI");</script>');
      await page.getByTestId("room-login-button").click();

      const request = await nthRequest(nameCheck);
      expect(request.postDataJSON()).toEqual({
        name: '<script>alert("HI");</script>',
      });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText(
            'Name contains the following non-permitted characters: <>";',
          ),
      ).toBeVisible();

      // room auth request was not sent and the access code error is not shown
      expect(roomAuth.requests).toHaveLength(0);
      await expect(
        page
          .getByTestId("access-code-field")
          .getByText("The Access code field is required."),
      ).toHaveCount(0);
    });
  });

  test.describe("remembered participant name (guest)", () => {
    test("shows error and clears an invalid remembered participant name", async ({
      page,
      room,
      nameCheck,
    }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem(
          "pilos_guest_name",
          '<script>alert("HI");</script>',
        );
      });
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;
      nameCheck.status = 422;
      nameCheck.json = {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      };
      await page.goto("/rooms/abc-def-123");

      const request = await nthRequest(nameCheck);
      expect(request.postDataJSON()).toEqual({
        name: '<script>alert("HI");</script>',
      });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page.getByTestId("participant-name-field").locator("#participant-name"),
      ).toHaveValue('<script>alert("HI");</script>');
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText(
            'Name contains the following non-permitted characters: <>";',
          ),
      ).toBeVisible();

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);
    });

    test("does not use an access code from the url if the remembered participant name is invalid", async ({
      page,
      room,
      roomRequests,
      nameCheck,
      roomAuth,
    }) => {
      // Seed the name only for the first load, the hash change reloads the page
      await page.addInitScript(() => {
        if (!window.sessionStorage.getItem("seeded")) {
          window.sessionStorage.setItem("seeded", "1");
          window.localStorage.setItem(
            "pilos_guest_name",
            '<script>alert("HI");</script>',
          );
        }
      });
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;
      nameCheck.status = 422;
      nameCheck.json = {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      };
      await page.goto("/rooms/abc-def-123");
      await expect(
        page
          .getByTestId("participant-name-field")
          .getByText(
            'Name contains the following non-permitted characters: <>";',
          ),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);

      const roomRequestsBefore = roomRequests.requests.length;

      // Reinitialize with an access code
      await page.evaluate(() => {
        window.location.hash = "accessCode=123456789";
      });

      await nthRequest(roomRequests, roomRequestsBefore + 1);
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#participant-name")).toHaveValue("");
      await expect(page.locator("#access-code")).toHaveValue("123-456-789");
      expect(roomAuth.requests).toHaveLength(0);
    });

    test("keeps a valid remembered participant name if the check fails with a server error", async ({
      page,
      room,
      nameCheck,
    }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
      });
      room.data.allow_membership = true;
      room.data.current_user = null;
      room.data.authenticated = false;
      nameCheck.status = 500;
      nameCheck.json = { message: "Test" };
      await page.goto("/rooms/abc-def-123");

      const request = await nthRequest(nameCheck);
      expect(request.postDataJSON()).toEqual({ name: "Laura Rivera" });

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page.getByTestId("participant-name-field").locator("#participant-name"),
      ).toHaveValue("Laura Rivera");
      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe("Laura Rivera");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("logs in with the remembered participant name and the access code from the url", async ({
      page,
      room,
      roomRequests,
      nameCheck,
      roomAuth,
    }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
      });
      room.data.allow_membership = true;
      room.data.current_user = null;
      // The room is authenticated as soon as the request carries the room auth token
      await page.route("**/api/v1/rooms/abc-def-123*", (route) => {
        if (route.request().method() !== "GET") {
          return route.fallback();
        }
        roomRequests.requests.push(route.request());
        room.data.authenticated = "room_auth_token" in queryOf(route.request());
        return route.fulfill({ json: room });
      });

      await page.goto("/rooms/abc-def-123#accessCode=123456789");

      expect((await nthRequest(nameCheck)).postDataJSON()).toEqual({
        name: "Laura Rivera",
      });
      expect((await nthRequest(roomAuth)).postDataJSON()).toEqual({
        access_code: "123456789",
        type: 0,
      });

      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();

      const authenticatedRequest = roomRequests.requests.find(
        (request) => "room_auth_token" in queryOf(request),
      );
      expect(queryOf(authenticatedRequest)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "0",
      });
    });

    test.describe("after logout", () => {
      test.use({ authenticated: true });

      test("asks for the access code and restores the remembered participant name", async ({
        page,
        room,
        roomRequests,
      }) => {
        await page.addInitScript(() => {
          window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
        });
        await page.goto("/rooms/abc-def-123");
        await expect(page.getByTestId("reload-room-button")).toBeVisible();

        const check = await mockMethod(
          page,
          "POST",
          "**/api/v1/participantName/check",
          { status: 204, hold: true },
        );
        room.data.allow_membership = true;
        room.data.current_user = null;
        room.data.authenticated = false;

        await page.getByTestId("reload-room-button").click();
        await nthRequest(roomRequests, 2);

        await expectToastAndClose(page, "rooms.require_access_code");

        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        const name = page.locator("#participant-name");
        await expect(name).toHaveValue("");
        await expect(name).toBeDisabled();

        check.release();

        expect((await nthRequest(check)).postDataJSON()).toEqual({
          name: "Laura Rivera",
        });
        await expect(name).toHaveValue("Laura Rivera");
        await expect(name).toBeEnabled();
        await expect(page.locator("#remember-participant-name")).toBeChecked();
        await expect(page.getByTestId("access-code-field")).toBeVisible();
      });
    });
  });

  test.describe("change participant name (guest)", () => {
    test.beforeEach(async ({ page, room }) => {
      room.data.allow_membership = true;
      room.data.current_user = null;
      await page.goto("/rooms/abc-def-123");

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();

      await page.locator("#participant-name").fill("Laura Rivera");
    });

    test("shows loading state while the participant name is checked", async ({
      page,
    }) => {
      const check = await mockMethod(
        page,
        "POST",
        "**/api/v1/participantName/check",
        { status: 204, hold: true },
      );

      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
      await page.getByTestId("room-login-button").click();

      const overlay = page.getByTestId("room-access-overlay");
      await expect(overlay).toBeVisible();
      await expect(overlay.getByTestId("room-login-button")).toBeDisabled();

      check.release();
      await nthRequest(check);

      await expect(overlay).toBeHidden();
    });

    test.describe("after login", () => {
      test.beforeEach(async ({ page, nameCheck }) => {
        await page.getByTestId("room-login-button").click();
        await nthRequest(nameCheck);
        await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      });

      test("shows the room with the participant name without remembering it", async ({
        page,
      }) => {
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

        await expect
          .poll(() =>
            page.evaluate(() =>
              window.localStorage.getItem("pilos_guest_name"),
            ),
          )
          .toBe(null);

        await expect(
          page.getByTestId("room-change-participant-name-dialog"),
        ).toHaveCount(0);
      });

      test("opens the change participant name dialog", async ({ page }) => {
        await expect(
          page.getByTestId("change-participant-name-button"),
        ).toHaveText("rooms.change_participant_name");
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText("rooms.change_participant_name");
        await expect(
          dialog.getByTestId("participant-name-field"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.first_and_lastname"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toHaveValue("Laura Rivera");
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.remember_participant_name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#remember-participant-name"),
        ).not.toBeChecked();

        await expect(dialog.getByTestId("dialog-cancel-button")).toBeVisible();
        await expect(dialog.getByTestId("dialog-cancel-button")).toHaveText(
          "app.cancel",
        );
        await expect(dialog.getByTestId("dialog-save-button")).toBeVisible();
        await expect(dialog.getByTestId("dialog-save-button")).toHaveText(
          "app.save",
        );
      });

      test("keeps the participant name if the dialog is cancelled", async ({
        page,
      }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await dialog.locator("#participant-name").fill("Max Doe");
        await dialog.getByTestId("dialog-cancel-button").click();

        await expect(dialog).toBeHidden();
        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(() =>
              window.localStorage.getItem("pilos_guest_name"),
            ),
          )
          .toBe(null);

        // The changed value is discarded
        await page.getByTestId("change-participant-name-button").click();
        await expect(dialog.locator("#participant-name")).toHaveValue(
          "Laura Rivera",
        );
      });

      test("changes the participant name", async ({ page, nameCheck }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await dialog.locator("#participant-name").fill("Max Doe");
        await dialog.getByTestId("dialog-save-button").click();

        expect((await nthRequest(nameCheck, 2)).postDataJSON()).toEqual({
          name: "Max Doe",
        });
        await expect(dialog).toBeHidden();

        await expect
          .poll(() =>
            page.evaluate(() =>
              window.localStorage.getItem("pilos_guest_name"),
            ),
          )
          .toBe(null);

        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Max Doe")).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toHaveCount(0);

        // The dialog is prefilled with the current name
        await page.getByTestId("change-participant-name-button").click();
        await expect(
          dialog.getByTestId("participant-name-field"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.first_and_lastname"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toHaveValue("Max Doe");
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.remember_participant_name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#remember-participant-name"),
        ).not.toBeChecked();
      });

      test("remembers the participant name", async ({ page, nameCheck }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await expect(
          dialog.getByTestId("participant-name-field"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.first_and_lastname"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toHaveValue("Laura Rivera");
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.remember_participant_name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#remember-participant-name"),
        ).not.toBeChecked();

        await dialog.locator("#remember-participant-name").check();
        await dialog.getByTestId("dialog-save-button").click();

        await nthRequest(nameCheck, 2);
        await expect(dialog).toBeHidden();

        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(() =>
              window.localStorage.getItem("pilos_guest_name"),
            ),
          )
          .toBe("Laura Rivera");

        // The dialog shows the remembered state
        await page.getByTestId("change-participant-name-button").click();
        await expect(
          dialog.getByTestId("participant-name-field"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.first_and_lastname"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toHaveValue("Laura Rivera");
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.remember_participant_name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#remember-participant-name"),
        ).toBeChecked();
      });

      test("forgets the remembered participant name", async ({
        page,
        nameCheck,
      }) => {
        await page.getByTestId("change-participant-name-button").click();

        const dialog = page.getByTestId("room-change-participant-name-dialog");
        await dialog.locator("#remember-participant-name").check();
        await dialog.getByTestId("dialog-save-button").click();
        await nthRequest(nameCheck, 2);
        await expect(dialog).toBeHidden();
        await expect
          .poll(() =>
            page.evaluate(() =>
              window.localStorage.getItem("pilos_guest_name"),
            ),
          )
          .toBe("Laura Rivera");

        await page.getByTestId("change-participant-name-button").click();
        await expect(
          dialog.getByTestId("participant-name-field"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.first_and_lastname"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toHaveValue("Laura Rivera");
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.remember_participant_name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#remember-participant-name"),
        ).toBeChecked();

        await dialog.locator("#remember-participant-name").uncheck();
        await dialog.getByTestId("dialog-save-button").click();

        await nthRequest(nameCheck, 3);
        await expect(dialog).toBeHidden();

        await expect
          .poll(() =>
            page.evaluate(() =>
              window.localStorage.getItem("pilos_guest_name"),
            ),
          )
          .toBe(null);

        await expect(
          page.getByText("rooms.name_in_video_conference"),
        ).toBeVisible();
        await expect(page.getByText("Laura Rivera")).toBeVisible();

        await page.getByTestId("change-participant-name-button").click();
        await expect(
          dialog.getByTestId("participant-name-field"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.first_and_lastname"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#participant-name"),
        ).toHaveValue("Laura Rivera");
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .getByText("rooms.remember_participant_name"),
        ).toBeVisible();
        await expect(
          dialog
            .getByTestId("participant-name-field")
            .locator("#remember-participant-name"),
        ).not.toBeChecked();
      });
    });
  });

  test.describe("remembered participant name is used to join (guest)", () => {
    test.beforeEach(async ({ page, room }) => {
      await setValidRememberedParticipantName(page, "Laura Rivera");
      room.data.allow_membership = true;
      room.data.current_user = null;
      await page.goto("/rooms/abc-def-123");
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
    });

    test("shows the room with the remembered participant name", async ({
      page,
    }) => {
      await expect(
        page.getByTestId("room-change-participant-name-dialog"),
      ).toHaveCount(0);
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toHaveValue("Laura Rivera");
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).toBeChecked();
    });

    test("changes the remembered participant name", async ({ page }) => {
      const check = await mockMethod(
        page,
        "POST",
        "**/api/v1/participantName/check",
        { status: 204 },
      );
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expect(dialog.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toHaveValue("Laura Rivera");
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).toBeChecked();

      await dialog.locator("#participant-name").fill("Max Doe");
      await dialog.getByTestId("dialog-save-button").click();

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: "Max Doe",
      });
      await expect(dialog).toBeHidden();

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe("Max Doe");

      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Max Doe")).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toHaveCount(0);

      // The dialog is prefilled with the current name
      await page.getByTestId("change-participant-name-button").click();
      await expect(dialog.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toHaveValue("Max Doe");
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).toBeChecked();
    });

    test("forgets the remembered participant name", async ({ page }) => {
      const check = await mockMethod(
        page,
        "POST",
        "**/api/v1/participantName/check",
        { status: 204 },
      );
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expect(dialog.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toHaveValue("Laura Rivera");
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).toBeChecked();

      await dialog.locator("#remember-participant-name").uncheck();
      await dialog.getByTestId("dialog-save-button").click();

      await nthRequest(check);
      await expect(dialog).toBeHidden();

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);

      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();

      await page.getByTestId("change-participant-name-button").click();
      await expect(dialog.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toHaveValue("Laura Rivera");
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).not.toBeChecked();
    });

    test("shows validation error and keeps the participant name if the change is invalid", async ({
      page,
    }) => {
      const check = await mockMethod(
        page,
        "POST",
        "**/api/v1/participantName/check",
        {
          status: 422,
          json: {
            errors: {
              name: [
                'Name contains the following non-permitted characters: <>";',
              ],
            },
          },
        },
      );
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expect(dialog.getByTestId("participant-name-field")).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.first_and_lastname"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#participant-name"),
      ).toHaveValue("Laura Rivera");
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText("rooms.remember_participant_name"),
      ).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .locator("#remember-participant-name"),
      ).toBeChecked();

      await dialog
        .locator("#participant-name")
        .fill('<script>alert("HI");</script>');
      await dialog.getByTestId("dialog-save-button").click();

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: '<script>alert("HI");</script>',
      });

      // The dialog stays open and shows the error
      await expect(dialog).toBeVisible();
      await expect(
        dialog
          .getByTestId("participant-name-field")
          .getByText(
            'Name contains the following non-permitted characters: <>";',
          ),
      ).toBeVisible();

      await dialog.getByTestId("dialog-cancel-button").click();
      await expect(dialog).toBeHidden();

      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Laura Rivera")).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe("Laura Rivera");

      // The dialog shows the current participant name again
      await page.getByTestId("change-participant-name-button").click();
      await expect(dialog.locator("#participant-name")).toHaveValue(
        "Laura Rivera",
      );
      await expect(dialog.locator("#remember-participant-name")).toBeChecked();
    });

    test("shows error toast and keeps the dialog open if the check fails", async ({
      page,
    }) => {
      const check = await mockMethod(
        page,
        "POST",
        "**/api/v1/participantName/check",
        { status: 500, json: { message: "Test" } },
      );
      await page.getByTestId("change-participant-name-button").click();

      const dialog = page.getByTestId("room-change-participant-name-dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByTestId("dialog-save-button").click();

      expect((await nthRequest(check)).postDataJSON()).toEqual({
        name: "Laura Rivera",
      });

      await expect(dialog).toBeVisible();
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });
  });

  test.describe("personalized link", () => {
    test.beforeEach(async ({ page, room, roomAuth }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
      });
      room.data.username = "Max Doe";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;
      roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };
    });

    test("ignores an invalid remembered participant name and clears it", async ({
      page,
      roomRequests,
      nameCheck,
      roomAuth,
    }) => {
      nameCheck.status = 422;
      nameCheck.json = {
        errors: {
          name: ['Name contains the following non-permitted characters: <>";'],
        },
      };

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      expect((await nthRequest(nameCheck)).postDataJSON()).toEqual({
        name: "Laura Rivera",
      });
      expect((await nthRequest(roomAuth)).postDataJSON()).toEqual({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });

      // The room is requested with the room auth token
      await expect
        .poll(() =>
          roomRequests.requests.some(
            (request) => queryOf(request).room_auth_token === "roomAuthToken",
          ),
        )
        .toBe(true);
      const request = roomRequests.requests.find(
        (request) => queryOf(request).room_auth_token === "roomAuthToken",
      );
      expect(queryOf(request)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );

      // The personalized link is removed from the url
      await expect(page).toHaveURL(
        (url) => !url.hash.includes("personalizedLink"),
      );

      // The participant name of the personalized link is shown and can not be changed
      await expect(page.getByText("Meeting One")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Max Doe")).toBeVisible();
      await expect(
        page.getByTestId("change-participant-name-button"),
      ).toHaveCount(0);

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);
    });

    test("keeps the remembered participant name and shows an error toast if the check fails", async ({
      page,
      roomRequests,
      nameCheck,
      roomAuth,
    }) => {
      nameCheck.status = 500;
      nameCheck.json = { message: "Test" };

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

      expect((await nthRequest(nameCheck)).postDataJSON()).toEqual({
        name: "Laura Rivera",
      });
      expect((await nthRequest(roomAuth)).postDataJSON()).toEqual({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });

      // The room is requested with the room auth token
      await expect
        .poll(() =>
          roomRequests.requests.some(
            (request) => queryOf(request).room_auth_token === "roomAuthToken",
          ),
        )
        .toBe(true);
      const request = roomRequests.requests.find(
        (request) => queryOf(request).room_auth_token === "roomAuthToken",
      );
      expect(queryOf(request)).toMatchObject({
        room_auth_token: "roomAuthToken",
        room_auth_token_type: "1",
      });

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );

      // The personalized link is removed from the url
      await expect(page).toHaveURL(
        (url) => !url.hash.includes("personalizedLink"),
      );

      // The participant name of the personalized link is shown and can not be changed
      await expect(page.getByText("Meeting One")).toBeVisible();
      await expect(page.getByText("John Doe")).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();
      await expect(
        page.getByText("rooms.name_in_video_conference"),
      ).toBeVisible();
      await expect(page.getByText("Max Doe")).toBeVisible();
      await expect(
        page.getByTestId("change-participant-name-button"),
      ).toHaveCount(0);

      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe("Laura Rivera");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });
  });
});
