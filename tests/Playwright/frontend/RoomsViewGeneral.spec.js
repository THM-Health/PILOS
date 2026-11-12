import { expect, expectToastAndClose } from "../support/test.js";
import { test } from "../support/fixtures/roomsGeneralMisc.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { expectAuthToken, expectNoAuthToken } from "../support/room.js";
import { mockMethod, nthRequest, readFixture } from "../support/utils.js";

test.describe("Room View general", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await interceptRoomFilesRequest(page);
  });

  test.describe("room view by role", () => {
    const ALL_TABS = [
      "description",
      "members",
      "tokens",
      "files",
      "recordings",
      "history",
      "settings",
    ];
    const MEMBER_TABS = ["files", "recordings"];

    const ROLES = [
      {
        name: "member",
        roomData: {
          owner: { id: 2, name: "Max Doe" },
          last_meeting: {
            start: "2023-08-21T08:18:28.000000Z",
            end: "2023-08-21T08:20:28.000000Z",
          },
          allow_membership: true,
          is_member: true,
        },
        owner: "Max Doe",
        meetingText:
          'rooms.index.room_component.last_ran_till_{"date":"08/21/2023, 10:20"}',
        canEndMembership: true,
        canJoinMembership: false,
        tabs: MEMBER_TABS,
        content: "rooms.files.title",
        canShare: false,
      },
      {
        name: "moderator",
        roomData: {
          owner: { id: 2, name: "Max Doe" },
          allow_membership: true,
          is_member: true,
          is_moderator: true,
        },
        owner: "Max Doe",
        meetingText: "rooms.index.room_component.never_started",
        canEndMembership: true,
        canJoinMembership: false,
        tabs: MEMBER_TABS,
        content: "rooms.files.title",
        canShare: true,
      },
      {
        name: "co-owner",
        roomData: {
          owner: { id: 2, name: "Max Doe" },
          last_meeting: { start: "2023-08-21T08:18:28.000000Z", end: null },
          allow_membership: true,
          is_member: true,
          is_co_owner: true,
        },
        owner: "Max Doe",
        meetingText:
          'rooms.index.room_component.running_since_{"date":"08/21/2023, 10:18"}',
        canEndMembership: true,
        canJoinMembership: false,
        tabs: ALL_TABS,
        content: "rooms.description.title",
        canShare: true,
      },
      {
        name: "owner",
        roomData: {
          short_description: "Room short description",
          allow_membership: true,
        },
        owner: "John Doe",
        shortDescription: "Room short description",
        meetingText: "rooms.index.room_component.never_started",
        canEndMembership: false,
        canJoinMembership: false,
        tabs: ALL_TABS,
        content: "rooms.description.title",
        canShare: true,
      },
      {
        name: "user with rooms.viewAll permission",
        permissions: ["rooms.viewAll"],
        roomData: {
          owner: { id: 2, name: "Max Doe" },
          allow_membership: true,
        },
        owner: "Max Doe",
        meetingText: "rooms.index.room_component.never_started",
        canEndMembership: false,
        canJoinMembership: true,
        tabs: ALL_TABS,
        content: "rooms.description.title",
        canShare: true,
      },
    ];

    for (const role of ROLES) {
      test.describe(role.name, () => {
        test.beforeEach(async ({ page, room, currentUser }) => {
          if (role.permissions) {
            currentUser.data.permissions = role.permissions;
            room.data.current_user.permissions = role.permissions;
          }
          Object.assign(room.data, role.roomData);
          await page.goto("/rooms/abc-def-123");
          await expect(page.getByTestId("reload-room-button")).toBeVisible();
        });

        test("shows the room header", async ({ page }) => {
          await expect(page).toHaveTitle("Meeting One - PILOS Test");
          await expect(page.getByText("Meeting One").first()).toBeVisible();
          await expect(page.getByText(role.owner).first()).toBeVisible();
          if (role.shortDescription) {
            await expect(page.getByText(role.shortDescription)).toBeVisible();
          }
          await expect(page.getByText(role.meetingText)).toBeVisible();
        });

        test("hides the participant name", async ({ page }) => {
          await expect(page.getByTestId("participant-name-field")).toHaveCount(
            0,
          );
          await expect(
            page.getByText("rooms.name_in_video_conference"),
          ).toHaveCount(0);
          await expect(
            page.getByTestId("change-participant-name-button"),
          ).toHaveCount(0);
        });

        test("shows the buttons", async ({ page }) => {
          await expect(page.getByTestId("reload-room-button")).toBeVisible();
          await expect(page.getByTestId("room-favorites-button")).toBeVisible();

          const join = page.getByTestId("room-join-membership-button");
          if (role.canJoinMembership) {
            await expect(join).toBeVisible();
          } else {
            await expect(join).toHaveCount(0);
          }

          const end = page.getByTestId("room-end-membership-button");
          if (role.canEndMembership) {
            await expect(end).toBeVisible();
          } else {
            await expect(end).toHaveCount(0);
          }

          const share = page.getByTestId("room-share-button");
          if (role.canShare) {
            await expect(share).toBeAttached();
          } else {
            await expect(share).toHaveCount(0);
          }
        });

        test("shows the tabs", async ({ page }) => {
          for (const tab of ALL_TABS) {
            const tabLocator = page.locator(`#tab-${tab}`);
            if (role.tabs.includes(tab)) {
              await expect(tabLocator).toBeVisible();
            } else {
              await expect(tabLocator).toHaveCount(0);
            }
          }
          await expect(page.getByText(role.content).first()).toBeVisible();
        });
      });
    }
  });

  test("room view with invalid tab hash", async ({ page, room }) => {
    room.data.short_description = "Room short description";
    room.data.allow_membership = true;

    await page.goto("/rooms/abc-def-123#tab=invalid");

    // Check that description tab is shown
    await expect(
      page.getByText("rooms.description.title").first(),
    ).toBeVisible();

    // Check that invalid tab hash is cleared
    await expect(page).toHaveURL(
      (url) =>
        url.href.includes("/rooms/abc-def-123") &&
        !url.href.includes("tab=invalid"),
    );
  });

  test.describe("streaming tab", () => {
    test.beforeEach(async ({ config, currentUser, room }) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;
      currentUser.data.permissions = ["rooms.viewAll"];
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.allow_membership = true;
      room.data.current_user.permissions = ["rooms.viewAll"];
    });

    test("enabled", async ({ page, room }) => {
      room.data.type.features.streaming.enabled = true;
      await page.goto("/rooms/abc-def-123");

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      const tab = page.locator("#tab-streaming");
      await expect(tab).toBeVisible();
      await expect(tab).toHaveAttribute("data-feature-disabled", "false");
    });

    test("disabled and hidden", async ({ page, room }) => {
      room.data.type.features.streaming.enabled = false;
      await page.goto("/rooms/abc-def-123");

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.locator("#tab-files")).toBeVisible();
      await expect(page.locator("#tab-streaming")).toHaveCount(0);
    });

    test("disabled for the room type and shown", async ({
      page,
      config,
      room,
    }) => {
      config.data.general.hide_disabled_features = false;
      room.data.type.features.streaming.enabled = false;
      await page.goto("/rooms/abc-def-123");

      const tab = page.locator("#tab-streaming");
      await expect(tab).toBeAttached();
      await expect(tab).toHaveAttribute("data-feature-disabled", "true");

      const dialog = page.getByTestId("room-feature-disabled-dialog");
      await expect(dialog).toHaveCount(0);

      await tab.click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'rooms.feature_disabled_roomtype_{"name":"rooms.streaming.title"}',
      );
      await dialog.getByTestId("dialog-close-button").click();
      await expect(dialog).toBeHidden();
    });

    test("disabled system wide and shown", async ({ page, config, room }) => {
      config.data.general.hide_disabled_features = false;
      config.data.streaming.enabled = false;
      room.data.type.features.streaming.enabled = false;
      await page.goto("/rooms/abc-def-123");

      const tab = page.locator("#tab-streaming");
      await expect(tab).toBeAttached();
      await expect(tab).toHaveAttribute("data-feature-disabled", "true");

      const dialog = page.getByTestId("room-feature-disabled-dialog");
      await expect(dialog).toHaveCount(0);

      await tab.click();

      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        'rooms.feature_disabled_system_{"name":"rooms.streaming.title"}',
      );
      await dialog.getByTestId("dialog-close-button").click();
      await expect(dialog).toBeHidden();
    });
  });

  test.describe("share room", () => {
    test.use({ permissions: ["clipboard-read", "clipboard-write"] });

    test.describe("with access code", () => {
      test.beforeEach(async ({ page, room }) => {
        room.data.name = 'Meeting One <script>alert("XSS")</script>';
        room.data.short_description = "Room short description";
        room.data.allow_membership = true;
        room.data.legacy_code = false;
        room.data.access_code = "508307005";
        await page.goto("/rooms/abc-def-123");
        await expect(page).toHaveTitle(
          'Meeting One <script>alert("XSS")</script> - PILOS Test',
        );
        await page.getByTestId("room-share-button").click();
        await expect(page.locator("#invitationLink")).toBeVisible();
      });

      test("shows link and code", async ({ page, baseURL }) => {
        await expect(page.locator("#invitationLink")).toHaveValue(
          `${baseURL}/rooms/abc-def-123#accessCode=508307005`,
        );
        await expect(page.locator("#invitationCode")).toHaveValue(
          "508-307-005",
        );
      });

      test("copy invitation message", async ({
        page,
        baseURL,
        readClipboard,
      }) => {
        const link = `${baseURL}/rooms/abc-def-123#accessCode=508307005`;
        await page.getByTestId("room-copy-invitation-button").click();
        await expectToastAndClose(page, "rooms.invitation.copied_message");

        const message =
          'rooms.invitation.room_{"roomname":"Meeting One <script>alert(\\"XSS\\")</script>","platform":"PILOS Test"}';
        const expectedText = `${message}\nrooms.invitation.link: ${link}\nrooms.invitation.code: 508-307-005`;
        const expectedHtml = `<p>${message.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}<br>rooms.invitation.link: <a href="${link}">${link}</a><br>rooms.invitation.code: 508-307-005</p>`;
        const clipboard = await readClipboard();
        expect(clipboard.readText).toBe(expectedText);
        expect(clipboard.types).toContain("text/plain");
        expect(clipboard.types).toContain("text/html");
        expect(clipboard.text).toBe(expectedText);
        expect(clipboard.html).toContain(expectedHtml);
      });

      test("copy room link", async ({ page, baseURL, readClipboard }) => {
        const link = `${baseURL}/rooms/abc-def-123#accessCode=508307005`;
        await page.getByTestId("room-invitation-copy-link-button").click();
        await expectToastAndClose(page, "rooms.invitation.copied_url");

        const clipboard = await readClipboard();
        expect(clipboard.readText).toBe(link);
        expect(clipboard.types).toContain("text/plain");
        expect(clipboard.types).toContain("text/html");
        expect(clipboard.text).toBe(link);
        expect(clipboard.html).toContain(`<a href="${link}">${link}</a>`);
      });

      test("copy room access code", async ({ page, readClipboard }) => {
        await page.getByTestId("room-invitation-copy-code-button").click();
        await expectToastAndClose(page, "rooms.invitation.copied_code");

        expect((await readClipboard()).readText).toBe("508-307-005");
      });
    });

    for (const code of ["012345", "012abc"]) {
      test.describe(`with legacy access code ${code}`, () => {
        test.beforeEach(async ({ page, room }) => {
          room.data.short_description = "Room short description";
          room.data.allow_membership = true;
          room.data.legacy_code = true;
          room.data.access_code = code;
          await page.goto("/rooms/abc-def-123");
          await expect(page.getByTestId("reload-room-button")).toBeVisible();
          await page.getByTestId("room-share-button").click();
          await expect(page.locator("#invitationLink")).toBeVisible();
        });

        test("shows link and code", async ({ page, baseURL }) => {
          await expect(page.locator("#invitationLink")).toHaveValue(
            `${baseURL}/rooms/abc-def-123#accessCode=${code}`,
          );
          await expect(page.locator("#invitationCode")).toHaveValue(code);
        });

        test("copy invitation message", async ({
          page,
          baseURL,
          readClipboard,
        }) => {
          await page.getByTestId("room-copy-invitation-button").click();
          await expectToastAndClose(page, "rooms.invitation.copied_message");
          expect((await readClipboard()).readText).toBe(
            'rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}\n' +
              `rooms.invitation.link: ${baseURL}/rooms/abc-def-123#accessCode=${code}\n` +
              `rooms.invitation.code: ${code}`,
          );
        });

        test("copy room access code", async ({ page, readClipboard }) => {
          await page.getByTestId("room-invitation-copy-code-button").click();
          await expectToastAndClose(page, "rooms.invitation.copied_code");

          expect((await readClipboard()).readText).toBe(code);
        });
      });
    }

    test.describe("without access code", () => {
      test.beforeEach(async ({ page, room }) => {
        room.data.short_description = "Room short description";
        room.data.allow_membership = true;
        room.data.legacy_code = false;
        room.data.access_code = null;
        await page.goto("/rooms/abc-def-123");
        await expect(page.getByTestId("reload-room-button")).toBeVisible();
        await page.getByTestId("room-share-button").click();
        await expect(page.locator("#invitationLink")).toBeVisible();
      });

      test("shows link but no code", async ({ page, baseURL }) => {
        await expect(page.locator("#invitationLink")).toHaveValue(
          `${baseURL}/rooms/abc-def-123`,
        );
        await expect(page.locator("#invitationCode")).toHaveCount(0);
      });

      test("copy invitation message", async ({
        page,
        baseURL,
        readClipboard,
      }) => {
        const link = `${baseURL}/rooms/abc-def-123`;
        await page.getByTestId("room-copy-invitation-button").click();
        await expectToastAndClose(page, "rooms.invitation.copied_message");

        const message =
          'rooms.invitation.room_{"roomname":"Meeting One","platform":"PILOS Test"}';
        const expectedText = `${message}\nrooms.invitation.link: ${link}`;
        const expectedHtml = `<p>${message}<br>rooms.invitation.link: <a href="${link}">${link}</a></p>`;
        const clipboard = await readClipboard();
        expect(clipboard.readText).toBe(expectedText);
        expect(clipboard.types).toContain("text/plain");
        expect(clipboard.types).toContain("text/html");
        expect(clipboard.text).toBe(expectedText);
        expect(clipboard.html).toContain(expectedHtml);
      });

      test("copy room access code is not available", async ({ page }) => {
        await expect(
          page.getByTestId("room-copy-invitation-button"),
        ).toBeVisible();
        await expect(
          page.getByTestId("room-invitation-copy-code-button"),
        ).toHaveCount(0);
      });

      test("focus handling of the popover", async ({ page }) => {
        // Focus on close button
        await page.keyboard.press("Tab");
        const closeButton = page.getByTestId("popover-close-button");
        await expect(closeButton).toBeFocused();
        await closeButton.click();
        await expect(page.locator("#invitationLink")).toBeHidden();

        // Focus should be back on the share button
        await expect(page.getByTestId("room-share-button")).toBeFocused();
      });
    });
  });

  test.describe("membership", () => {
    test.beforeEach(async ({ room }) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
    });

    test("join membership", async ({ page, room, roomAuth }) => {
      room.data.authenticated = false;
      await page.goto("/rooms/abc-def-123");

      // Login with the access code
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await page.locator("#access-code").fill("123456789");
      room.data.authenticated = true;
      const loginRoomRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123*",
      );
      await page.getByTestId("room-login-button").click();
      await nthRequest(roomAuth);
      await loginRoomRequest;

      const join = await mockMethod(
        page,
        "POST",
        "**/api/v1/rooms/abc-def-123/membership*",
        { status: 204, hold: true },
      );
      room.data.is_member = true;

      const joinButton = page.getByTestId("room-join-membership-button");
      await expect(joinButton).toBeVisible();
      await expect(page.getByTestId("room-end-membership-button")).toHaveCount(
        0,
      );
      const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
      await joinButton.click();
      await expect(joinButton).toBeDisabled();
      join.release();

      expectAuthToken(await nthRequest(join));
      expectNoAuthToken(await roomRequest);

      await expect(joinButton).toHaveCount(0);
      await expect(
        page.getByTestId("room-end-membership-button"),
      ).toBeVisible();
    });

    test("end membership", async ({ page, room, roomAuth }) => {
      room.data.authenticated = false;
      await page.goto("/rooms/abc-def-123");

      // Login with the access code
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await page.locator("#access-code").fill("123456789");
      room.data.authenticated = true;
      const loginRoomRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123*",
      );
      await page.getByTestId("room-login-button").click();
      await nthRequest(roomAuth);
      await loginRoomRequest;

      // join the room, afterwards the access code is not sent anymore
      const join = await mockMethod(
        page,
        "POST",
        "**/api/v1/rooms/abc-def-123/membership*",
        { status: 204 },
      );
      room.data.is_member = true;
      const memberRoomRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123*",
      );
      await page.getByTestId("room-join-membership-button").click();
      await nthRequest(join);
      await memberRoomRequest;
      await expect(
        page.getByTestId("room-end-membership-button"),
      ).toBeVisible();

      const end = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/membership*",
        { status: 204, hold: true },
      );
      room.data.is_member = false;
      room.data.authenticated = false;

      await page.getByTestId("room-end-membership-button").click();
      await expect(page.getByTestId("end-membership-dialog")).toBeVisible();
      const continueButton = page.getByTestId("dialog-continue-button");
      const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
      await continueButton.click();
      await expect(continueButton).toBeDisabled();
      end.release();

      expectNoAuthToken(await nthRequest(end));
      expectNoAuthToken(await roomRequest);

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("123-456-789");

      // Check that no error message is shown even though room request returned authenticated false again
      await expect(page.locator(".p-toast-message")).toHaveCount(0);
    });

    test.describe("join membership errors", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123");
        await expect(
          page.getByTestId("room-join-membership-button"),
        ).toBeVisible();
      });

      test("general error", async ({ page, room, roomAuth }) => {
        // use the access code flow to check that the token is sent
        room.data.authenticated = false;
        await page.reload();
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await page.locator("#access-code").fill("123456789");
        room.data.authenticated = true;
        const loginRoomRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123*",
        );
        await page.getByTestId("room-login-button").click();
        await nthRequest(roomAuth);
        await loginRoomRequest;

        const join = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/membership*",
          { status: 500, json: { message: "Test join membership error" } },
        );
        await page.getByTestId("room-join-membership-button").click();

        expectAuthToken(await nthRequest(join));
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test join membership error"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("invalid access code", async ({ page, room, roomAuth }) => {
        room.data.authenticated = false;
        await page.reload();
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await page.locator("#access-code").fill("123456789");
        room.data.authenticated = true;
        const loginRoomRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123*",
        );
        await page.getByTestId("room-login-button").click();
        await nthRequest(roomAuth);
        await loginRoomRequest;

        const join = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/membership*",
          { status: 401, json: { message: "invalid_auth_token" } },
        );
        room.data.authenticated = false;
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("room-join-membership-button").click();

        // access code is still set in the membership request, but reset in the following room request
        expectAuthToken(await nthRequest(join));
        expectNoAuthToken(await roomRequest);

        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await expectToastAndClose(page, "rooms.flash.access_code_invalid");
        await expect(
          page.getByText("rooms.flash.access_code_invalid"),
        ).toBeVisible();

        // Login with the access code is possible again
        room.data.authenticated = true;
        const reloadedRoomRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123*",
        );
        await page.getByTestId("room-login-button").click();
        await nthRequest(roomAuth, 2);
        await reloadedRoomRequest;
        await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      });

      test("membership not available", async ({ page, room }) => {
        const join = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/membership*",
          {
            status: 403,
            json: {
              message:
                "Membership failed! Membership for this room is currently not available.",
            },
          },
        );
        room.data.allow_membership = false;
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("room-join-membership-button").click();

        await nthRequest(join);
        await roomRequest;

        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Membership failed! Membership for this room is currently not available."}',
          'app.flash.server_error.error_code_{"statusCode":403}',
        ]);
        await expect(
          page.getByTestId("room-join-membership-button"),
        ).toHaveCount(0);
      });

      test("unauthenticated", async ({ page, room }) => {
        const join = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/membership*",
          { status: 401 },
        );
        room.data = {
          ...readFixture("room.json").data,
          current_user: null,
          description: "<p>Test</p>",
        };
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("room-join-membership-button").click();

        await nthRequest(join);
        await roomRequest;

        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms/abc-def-123") &&
            !url.href.includes("/login"),
        );
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const join = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/membership*",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );
        await page.getByTestId("room-join-membership-button").click();

        await nthRequest(join);
        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms") &&
            !url.href.includes("rooms/abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });

    test.describe("end membership errors", () => {
      test.beforeEach(async ({ page, room }) => {
        room.data.is_member = true;
        await page.goto("/rooms/abc-def-123");
        await page.getByTestId("room-end-membership-button").click();
        await expect(page.getByTestId("end-membership-dialog")).toBeVisible();
      });

      test("general error", async ({ page }) => {
        const end = await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/membership*",
          { status: 500, json: { message: "Test end membership error" } },
        );
        await page.getByTestId("dialog-continue-button").click();

        expectNoAuthToken(await nthRequest(end));
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test end membership error"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);

        // Close end membership dialog
        await expect(page.getByTestId("end-membership-dialog")).toBeVisible();
        await page.getByTestId("dialog-cancel-button").click();
        await expect(page.getByTestId("end-membership-dialog")).toBeHidden();
      });

      test("unauthenticated", async ({ page, room }) => {
        const end = await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/membership*",
          { status: 401 },
        );
        room.data = {
          ...readFixture("room.json").data,
          current_user: null,
          authenticated: false,
          allow_membership: true,
          description: "<p>Test</p>",
        };
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("dialog-continue-button").click();

        expectNoAuthToken(await nthRequest(end));
        await roomRequest;

        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms/abc-def-123") &&
            !url.href.includes("/login"),
        );
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();

        // Check that access code overlay is shown
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const end = await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/membership*",
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

        await nthRequest(end);
        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms") &&
            !url.href.includes("rooms/abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test.describe("favorites button", () => {
    test.beforeEach(async ({ room }) => {
      room.data.owner = { id: 2, name: "Max Doe" };
      room.data.description = "<p>Test</p>";
      room.data.allow_membership = true;
    });

    test("add room to favorites", async ({ page, room, roomRequests }) => {
      await page.goto("/rooms/abc-def-123");
      await nthRequest(roomRequests);

      const add = await mockMethod(
        page,
        "POST",
        "**/api/v1/rooms/abc-def-123/favorites*",
        { status: 204, hold: true },
      );
      room.data.is_favorite = true;

      const button = page.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting One"}',
      );
      const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
      await button.click();
      await expect(button).toBeDisabled();
      add.release();

      await nthRequest(add);
      await roomRequest;

      await expect(button).toHaveAttribute(
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting One"}',
      );
    });

    test("remove room from favorites", async ({ page, room, roomRequests }) => {
      room.data.is_favorite = true;
      await page.goto("/rooms/abc-def-123");
      await nthRequest(roomRequests);

      const remove = await mockMethod(
        page,
        "DELETE",
        "**/api/v1/rooms/abc-def-123/favorites*",
        { status: 204, hold: true },
      );
      room.data.is_favorite = false;

      const button = page.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute(
        "aria-label",
        'rooms.favorites.remove_for_{"room":"Meeting One"}',
      );
      const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
      await button.click();
      await expect(button).toBeDisabled();
      remove.release();

      await nthRequest(remove);
      await roomRequest;

      await expect(button).toHaveAttribute(
        "aria-label",
        'rooms.favorites.add_for_{"room":"Meeting One"}',
      );
    });

    test.describe("errors when adding", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/rooms/abc-def-123");
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          'rooms.favorites.add_for_{"room":"Meeting One"}',
        );
      });

      test("general error", async ({ page }) => {
        const add = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/favorites*",
          { status: 500, json: { message: "Test add favorite error" } },
        );
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("room-favorites-button").click();

        await nthRequest(add);
        await roomRequest;

        // Check that error message is shown and button stayed the same
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test add favorite error"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          'rooms.favorites.add_for_{"room":"Meeting One"}',
        );
      });

      test("unauthenticated", async ({ page, room }) => {
        const add = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/favorites*",
          { status: 401 },
        );
        room.data = {
          ...readFixture("room.json").data,
          current_user: null,
          description: "<p>Test</p>",
        };
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("room-favorites-button").click();

        await nthRequest(add);
        await roomRequest;

        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms/abc-def-123") &&
            !url.href.includes("/login"),
        );
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const add = await mockMethod(
          page,
          "POST",
          "**/api/v1/rooms/abc-def-123/favorites*",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );
        await page.getByTestId("room-favorites-button").click();

        await nthRequest(add);
        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms") &&
            !url.href.includes("rooms/abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });

    test.describe("errors when removing", () => {
      test.beforeEach(async ({ page, room }) => {
        room.data.is_favorite = true;
        await page.goto("/rooms/abc-def-123");
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          'rooms.favorites.remove_for_{"room":"Meeting One"}',
        );
      });

      test("general error", async ({ page }) => {
        const remove = await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/favorites*",
          { status: 500, json: { message: "Test remove favorite error" } },
        );
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("room-favorites-button").click();

        await nthRequest(remove);
        await roomRequest;

        // Check that error message is shown and button stayed the same
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test remove favorite error"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          'rooms.favorites.remove_for_{"room":"Meeting One"}',
        );
      });

      test("unauthenticated", async ({ page, room }) => {
        const remove = await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/favorites*",
          { status: 401 },
        );
        room.data = {
          ...readFixture("room.json").data,
          current_user: null,
          authenticated: false,
          allow_membership: true,
          description: "<p>Test</p>",
        };
        const roomRequest = page.waitForRequest("**/api/v1/rooms/abc-def-123*");
        await page.getByTestId("room-favorites-button").click();

        await nthRequest(remove);
        await roomRequest;

        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms/abc-def-123") &&
            !url.href.includes("/login"),
        );
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();

        // Check that access code overlay is shown
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const remove = await mockMethod(
          page,
          "DELETE",
          "**/api/v1/rooms/abc-def-123/favorites*",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );
        await page.getByTestId("room-favorites-button").click();

        await nthRequest(remove);
        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/rooms") &&
            !url.href.includes("rooms/abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });
  });

  test("visit with guest forbidden", async ({ page }) => {
    await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
      status: 403,
      json: { message: "guests_not_allowed" },
    });
    await page.goto("/rooms/abc-def-123");

    // Check that the error message is shown
    await expect(
      page.getByText("rooms.only_used_by_authenticated_users").first(),
    ).toBeVisible();

    // Get login button and check if redirect is correctly set
    await expect(
      page.locator('a[data-test="login-room-button"]'),
    ).toHaveAttribute("href", "/login?redirect=/rooms/abc-def-123");
  });

  test.describe("visit with general error", () => {
    test.beforeEach(async ({ page }) => {
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
        status: 500,
        json: { message: "Test" },
      });
      await page.goto("/rooms/abc-def-123");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("shows the overlay", async ({ page }) => {
      await expect(page.getByTestId("no-room-overlay")).toBeVisible();
    });

    test("reload without error", async ({ page, room }) => {
      await expect(page.getByTestId("no-room-overlay")).toBeVisible();

      const roomMock = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123*",
        { status: 200, json: room },
      );
      const reloadButton = page.getByTestId("reload-button").first();
      await expect(reloadButton).toHaveText("app.reload");
      await reloadButton.click();

      await nthRequest(roomMock);
      await expect(page.getByText("Meeting One").first()).toBeVisible();

      // Check that overlay is hidden
      await expect(page.getByTestId("no-room-overlay")).toHaveCount(0);
    });
  });

  test("visit with room not found as logged in user", async ({ page }) => {
    await interceptRoomIndexRequests(page);
    await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
      status: 404,
      json: { message: "model_not_found", model: "room", ids: ["abc-def-123"] },
    });

    await page.goto("/rooms/abc-def-123");

    // Check redirect to room index page
    await expect(page).toHaveURL(
      (url) =>
        url.href.includes("/rooms") && !url.href.includes("rooms/abc-def-123"),
    );
    await expectToastAndClose(page, [
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  test.describe("as guest", () => {
    test.use({ authenticated: false });

    test("visit with room not found", async ({ page }) => {
      await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
        status: 404,
        json: {
          message: "model_not_found",
          model: "room",
          ids: ["abc-def-123"],
        },
      });

      await page.goto("/rooms/abc-def-123");

      // Check redirect to 404 page
      await expect(page).toHaveURL(
        (url) =>
          url.href.includes("/404") && !url.href.includes("/rooms/abc-def-123"),
      );
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });

    test("auto-reload", async ({ page, config, room, roomRequests }) => {
      config.data.room.refresh_rate = 60;
      room.data.allow_membership = true;
      room.data.current_user = null;

      await page.clock.install();
      await page.goto("/rooms/abc-def-123");
      await nthRequest(roomRequests);
      await expect(page.getByText("Meeting One").first()).toBeVisible();

      // Wait more than 60 seconds (due to reload randomness) for a auto-reload
      await page.clock.runFor(100000);
      await expect.poll(() => roomRequests.requests.length).toBe(2);
    });

    test("auto-reload disabled on error", async ({ page, config }) => {
      config.data.room.refresh_rate = 60;
      const roomMock = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123*",
        { status: 403, json: { message: "guests_not_allowed" } },
      );

      await page.clock.install();
      await page.goto("/rooms/abc-def-123");
      await nthRequest(roomMock);

      // Check that the error message is shown
      await expect(
        page.getByText("rooms.only_used_by_authenticated_users").first(),
      ).toBeVisible();

      // Wait more than 60 seconds (due to reload randomness) for no auto-reload
      await page.clock.runFor(100000);
      expect(roomMock.requests).toHaveLength(1);
    });

    test.describe("reload with errors", () => {
      test.beforeEach(async ({ page, room }) => {
        room.data.allow_membership = true;
        room.data.current_user = null;
        await page.goto("/rooms/abc-def-123");
        await expect(page.getByText("Meeting One").first()).toBeVisible();
      });

      test("general error", async ({ page }) => {
        const roomMock = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123*",
          { status: 500, json: { message: "Test" } },
        );
        await page.getByTestId("reload-room-button").click();

        await nthRequest(roomMock);
        await expectToastAndClose(page, [
          'app.flash.server_error.message_{"message":"Test"}',
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
      });

      test("guests forbidden", async ({ page }) => {
        const roomMock = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123*",
          { status: 403, json: { message: "guests_not_allowed" } },
        );
        await page.getByTestId("reload-room-button").click();

        await nthRequest(roomMock);
        await expect(
          page.getByText("rooms.only_used_by_authenticated_users").first(),
        ).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        const roomMock = await mockMethod(
          page,
          "GET",
          "**/api/v1/rooms/abc-def-123*",
          {
            status: 404,
            json: {
              message: "model_not_found",
              model: "room",
              ids: ["abc-def-123"],
            },
          },
        );
        await page.getByTestId("reload-room-button").click();

        await nthRequest(roomMock);

        // Check redirect to 404 page worked
        await expect(page).toHaveURL(
          (url) =>
            url.href.includes("/404") &&
            !url.href.includes("/rooms/abc-def-123"),
        );
        await expectToastAndClose(page, [
          'app.flash.model_not_found.title_{"model":"app.model.room"}',
          'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
        ]);
      });
    });

    test("displays meeting ended reason", async ({
      page,
      room,
      roomRequests,
    }) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      await page.goto("/rooms/abc-def-123?reason=Meeting+ended+by+John+Doe");
      await nthRequest(roomRequests);

      // Reason message should be shown
      const reason = page.getByTestId("room-meeting-ended-reason");
      await expect(reason).toBeVisible();
      await expect(reason).toHaveText("Meeting ended by John Doe");

      // Close reason message
      await reason.getByRole("button").click();

      // Check that reason message is removed
      await expect(reason).toHaveCount(0);

      // Check reason message is removed from URL
      await expect(page).toHaveURL((url) => !url.href.includes("reason"));
    });

    test("displays bbb error messages", async ({
      page,
      room,
      roomRequests,
    }) => {
      room.data.allow_membership = true;
      room.data.current_user = null;

      const locale = readFixture("en.json");
      locale.data = {
        rooms: {
          bbb_error_message: {
            guestDeniedAccess: "Guest access denied",
            maxParticipantsReached: "Maximum participants reached",
          },
        },
      };
      await page.route("**/api/v1/locale/en", (route) =>
        route.fulfill({ json: locale }),
      );

      // Simulate BBB errors
      const errors = encodeURIComponent(
        JSON.stringify([
          { key: "guestDeniedAccess" },
          { key: "maxParticipantsReached" },
          { key: "unknown_error" },
        ]),
      );
      await page.goto(`/rooms/abc-def-123?errors=${errors}`);
      await nthRequest(roomRequests);

      // Check only two error messages are shown
      const bbbErrors = page.getByTestId("room-meeting-bbb-error");
      await expect(bbbErrors).toHaveCount(2);
      await expect(bbbErrors.nth(0)).toContainText("Guest access denied");
      await expect(bbbErrors.nth(1)).toContainText(
        "Maximum participants reached",
      );

      // Close first error message
      await bbbErrors.nth(0).getByRole("button").click();

      // Check only one error message is shown
      await expect(bbbErrors).toHaveCount(1);
      await expect(bbbErrors.nth(0)).toContainText(
        "Maximum participants reached",
      );

      // Check url is updated (closed and invalid error removed)
      await expect(page).toHaveURL((url) =>
        url.href.includes("[{%22key%22:%22maxParticipantsReached%22}]"),
      );

      // Close last error message
      await bbbErrors.nth(0).getByRole("button").click();

      // Check no error messages are shown
      await expect(bbbErrors).toHaveCount(0);

      // Check url is updated (no errors)
      await expect(page).toHaveURL((url) => !url.href.includes("errors"));
    });
  });

  test.describe("reload with room not found as authenticated user", () => {
    test("redirects to the room index", async ({ page, room }) => {
      await interceptRoomIndexRequests(page);
      room.data.allow_membership = true;
      await page.goto("/rooms/abc-def-123");
      await expect(page.getByText("Meeting One").first()).toBeVisible();

      const roomMock = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123*",
        {
          status: 404,
          json: {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          },
        },
      );
      await page.getByTestId("reload-room-button").click();

      await nthRequest(roomMock);

      // Check redirect to room index page worked
      await expect(page).toHaveURL(
        (url) =>
          url.href.includes("/rooms") &&
          !url.href.includes("rooms/abc-def-123"),
      );
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test("hide room owner if not provided", async ({ page, room }) => {
    delete room.data.owner;

    await page.goto("/rooms/abc-def-123");

    // room itself will be loaded
    await expect(page.getByText("Meeting One").first()).toBeVisible();

    // room should not contain owner name
    await expect(page.getByText("John Doe")).toHaveCount(0);
  });
});
