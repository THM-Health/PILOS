import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { expectAuthToken, expectNoAuthToken } from "../support/room.js";
import { mockMethod } from "../support/utils.js";

const ROOM_PATH = "/rooms/abc-def-123";
const ROOM_URL = "**/api/v1/rooms/abc-def-123*";

const OWNER = { id: 2, name: "Max Doe" };

const SERVER_ERROR_TOAST = (message, statusCode = 500) => [
  `app.flash.server_error.message_{"message":"${message}"}`,
  `app.flash.server_error.error_code_{"statusCode":${statusCode}}`,
];
const MODEL_NOT_FOUND_TOAST = [
  'app.flash.model_not_found.title_{"model":"app.model.room"}',
  'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
];
const MODEL_NOT_FOUND_BODY = {
  message: "model_not_found",
  model: "room",
  ids: ["abc-def-123"],
};

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

function mockRoom(page, changes = {}) {
  const room = readFixture("room.json");
  if (typeof changes === "function") {
    changes(room.data);
  } else {
    Object.assign(room.data, changes);
  }
  return mockMethod(page, "GET", ROOM_URL, { status: 200, json: room });
}

function mockRoomError(page, status, json) {
  return mockMethod(page, "GET", ROOM_URL, { status, json });
}

function mockMembership(page, method, response) {
  return mockMethod(
    page,
    method,
    "**/api/v1/rooms/abc-def-123/membership*",
    response,
  );
}

function mockFavorites(page, method, response) {
  return mockMethod(
    page,
    method,
    "**/api/v1/rooms/abc-def-123/favorites*",
    response,
  );
}

async function nextRequest(mock, countBefore = 0) {
  await expect.poll(() => mock.requests.length).toBeGreaterThan(countBefore);
  return mock.requests[countBefore];
}

async function expectUrlPath(page, { includes, excludes }) {
  await expect(page).toHaveURL(
    (url) => url.href.includes(includes) && !url.href.includes(excludes),
  );
}

async function expectRedirectedToRoomIndex(page) {
  await expectUrlPath(page, {
    includes: "/rooms",
    excludes: "rooms/abc-def-123",
  });
  await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
}

async function expectStayedOnRoomPage(page) {
  await expectUrlPath(page, {
    includes: "/rooms/abc-def-123",
    excludes: "/login",
  });
}

async function loginWithAccessCode(page, roomChanges = {}) {
  await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  await page.locator("#access-code").fill("123456789");

  const auth = await mockMethod(
    page,
    "POST",
    "**/api/v1/rooms/abc-def-123/auth*",
    {
      status: 201,
      json: { data: { id: "roomAuthToken", type: 0 } },
    },
  );
  const room = await mockRoom(page, roomChanges);

  await page.getByTestId("room-login-button").click();

  await nextRequest(auth);
  await nextRequest(room);
  return { room, auth };
}

async function visitAndLoginWithAccessCode(page, roomChanges) {
  await mockRoom(page, {
    owner: OWNER,
    authenticated: false,
    description: "<p>Test</p>",
    allow_membership: true,
  });
  await page.goto(ROOM_PATH);
  return loginWithAccessCode(page, roomChanges);
}

const SHARE_ROOM_NAME = 'Meeting One <script>alert("XSS")</script>';

async function readClipboard(page) {
  return page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const read = async (type) =>
      item.types.includes(type) ? (await item.getType(type)).text() : null;
    return {
      types: item.types,
      text: await read("text/plain"),
      html: await read("text/html"),
      readText: await navigator.clipboard.readText(),
    };
  });
}

const escapeHtml = (text) =>
  text.replaceAll("<", "&lt;").replaceAll(">", "&gt;");

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
        room: {
          owner: OWNER,
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
        room: {
          owner: OWNER,
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
        room: {
          owner: OWNER,
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
        room: {
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
        room: (data) => {
          data.owner = OWNER;
          data.allow_membership = true;
          data.current_user.permissions = ["rooms.viewAll"];
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
        test.beforeEach(async ({ page, currentUser }) => {
          if (role.permissions) {
            currentUser.data.permissions = role.permissions;
          }
          await mockRoom(page, role.room);
          await page.goto(ROOM_PATH);
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

  test("room view with invalid tab hash", async ({ page }) => {
    await mockRoom(page, {
      short_description: "Room short description",
      allow_membership: true,
    });

    await page.goto(ROOM_PATH + "#tab=invalid");

    // Check that description tab is shown
    await expect(
      page.getByText("rooms.description.title").first(),
    ).toBeVisible();

    // Check that invalid tab hash is cleared
    await expectUrlPath(page, {
      includes: "/rooms/abc-def-123",
      excludes: "tab=invalid",
    });
  });

  test.describe("streaming tab", () => {
    test.beforeEach(async ({ config, currentUser }) => {
      config.data.general.hide_disabled_features = true;
      config.data.streaming.enabled = true;
      currentUser.data.permissions = ["rooms.viewAll"];
    });

    const mockStreamingRoom = (page, enabled) =>
      mockRoom(page, (data) => {
        data.owner = OWNER;
        data.type.features.streaming.enabled = enabled;
        data.allow_membership = true;
        data.current_user.permissions = ["rooms.viewAll"];
      });

    test("enabled", async ({ page }) => {
      await mockStreamingRoom(page, true);
      await page.goto(ROOM_PATH);

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      const tab = page.locator("#tab-streaming");
      await expect(tab).toBeVisible();
      await expect(tab).toHaveAttribute("data-feature-disabled", "false");
    });

    test("disabled and hidden", async ({ page }) => {
      await mockStreamingRoom(page, false);
      await page.goto(ROOM_PATH);

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.locator("#tab-files")).toBeVisible();
      await expect(page.locator("#tab-streaming")).toHaveCount(0);
    });

    test("disabled for the room type and shown", async ({ page, config }) => {
      config.data.general.hide_disabled_features = false;
      await mockStreamingRoom(page, false);
      await page.goto(ROOM_PATH);

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

    test("disabled system wide and shown", async ({ page, config }) => {
      config.data.general.hide_disabled_features = false;
      config.data.streaming.enabled = false;
      await mockStreamingRoom(page, false);
      await page.goto(ROOM_PATH);

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

    const SHARE_ROOM = {
      name: SHARE_ROOM_NAME,
      short_description: "Room short description",
      allow_membership: true,
      legacy_code: false,
      access_code: "508307005",
    };

    async function openShare(page) {
      await page.getByTestId("room-share-button").click();
      await expect(page.locator("#invitationLink")).toBeVisible();
    }

    function invitationMessage(roomName, link, code) {
      const room = `rooms.invitation.room_${JSON.stringify({ roomname: roomName, platform: "PILOS Test" })}`;
      return {
        text:
          `${room}\nrooms.invitation.link: ${link}` +
          (code ? `\nrooms.invitation.code: ${code}` : ""),
        html:
          `<p>${escapeHtml(room)}<br>rooms.invitation.link: <a href="${link}">${link}</a>` +
          (code ? `<br>rooms.invitation.code: ${code}` : "") +
          "</p>",
      };
    }

    async function expectCopiedMessage(page, roomName, link, code) {
      await openShare(page);
      await page.getByTestId("room-copy-invitation-button").click();
      await expectToastAndClose(page, "rooms.invitation.copied_message");

      const expected = invitationMessage(roomName, link, code);
      const clipboard = await readClipboard(page);
      expect(clipboard.readText).toBe(expected.text);
      expect(clipboard.types).toContain("text/plain");
      expect(clipboard.types).toContain("text/html");
      expect(clipboard.text).toBe(expected.text);
      expect(clipboard.html).toContain(expected.html);
    }

    async function expectCopiedLink(page, link) {
      await openShare(page);
      await page.getByTestId("room-invitation-copy-link-button").click();
      await expectToastAndClose(page, "rooms.invitation.copied_url");

      const clipboard = await readClipboard(page);
      expect(clipboard.readText).toBe(link);
      expect(clipboard.types).toContain("text/plain");
      expect(clipboard.types).toContain("text/html");
      expect(clipboard.text).toBe(link);
      expect(clipboard.html).toContain(`<a href="${link}">${link}</a>`);
    }

    async function expectCopiedCode(page, code) {
      await openShare(page);
      await page.getByTestId("room-invitation-copy-code-button").click();
      await expectToastAndClose(page, "rooms.invitation.copied_code");

      expect((await readClipboard(page)).readText).toBe(code);
    }

    test.describe("with access code", () => {
      let link;

      test.beforeEach(async ({ page, baseURL }) => {
        link = `${baseURL}/rooms/abc-def-123#accessCode=508307005`;
        await mockRoom(page, SHARE_ROOM);
        await page.goto(ROOM_PATH);
        await expect(page).toHaveTitle(`${SHARE_ROOM_NAME} - PILOS Test`);
      });

      test("shows link and code", async ({ page }) => {
        await openShare(page);
        await expect(page.locator("#invitationLink")).toHaveValue(link);
        await expect(page.locator("#invitationCode")).toHaveValue(
          "508-307-005",
        );
      });

      test("copy invitation message", async ({ page }) => {
        await expectCopiedMessage(page, SHARE_ROOM_NAME, link, "508-307-005");
      });

      test("copy room link", async ({ page }) => {
        await expectCopiedLink(page, link);
      });

      test("copy room access code", async ({ page }) => {
        await expectCopiedCode(page, "508-307-005");
      });
    });

    for (const code of ["012345", "012abc"]) {
      test.describe(`with legacy access code ${code}`, () => {
        let link;

        test.beforeEach(async ({ page, baseURL }) => {
          link = `${baseURL}/rooms/abc-def-123#accessCode=${code}`;
          await mockRoom(page, {
            short_description: "Room short description",
            allow_membership: true,
            legacy_code: true,
            access_code: code,
          });
          await page.goto(ROOM_PATH);
          await expect(page.getByTestId("reload-room-button")).toBeVisible();
        });

        test("shows link and code", async ({ page }) => {
          await openShare(page);
          await expect(page.locator("#invitationLink")).toHaveValue(link);
          await expect(page.locator("#invitationCode")).toHaveValue(code);
        });

        test("copy invitation message", async ({ page }) => {
          await openShare(page);
          await page.getByTestId("room-copy-invitation-button").click();
          await expectToastAndClose(page, "rooms.invitation.copied_message");
          expect((await readClipboard(page)).readText).toBe(
            invitationMessage("Meeting One", link, code).text,
          );
        });

        test("copy room access code", async ({ page }) => {
          await expectCopiedCode(page, code);
        });
      });
    }

    test.describe("without access code", () => {
      let link;

      test.beforeEach(async ({ page, baseURL }) => {
        link = `${baseURL}/rooms/abc-def-123`;
        await mockRoom(page, {
          short_description: "Room short description",
          allow_membership: true,
          legacy_code: false,
          access_code: null,
        });
        await page.goto(ROOM_PATH);
        await expect(page.getByTestId("reload-room-button")).toBeVisible();
      });

      test("shows link but no code", async ({ page }) => {
        await openShare(page);
        await expect(page.locator("#invitationLink")).toHaveValue(link);
        await expect(page.locator("#invitationCode")).toHaveCount(0);
      });

      test("copy invitation message", async ({ page }) => {
        await expectCopiedMessage(page, "Meeting One", link, null);
      });

      test("copy room access code is not available", async ({ page }) => {
        await openShare(page);
        await expect(
          page.getByTestId("room-copy-invitation-button"),
        ).toBeVisible();
        await expect(
          page.getByTestId("room-invitation-copy-code-button"),
        ).toHaveCount(0);
      });

      test("focus handling of the popover", async ({ page }) => {
        const shareButton = page.getByTestId("room-share-button");
        await openShare(page);

        // Focus on close button
        await page.keyboard.press("Tab");
        const closeButton = page.getByTestId("popover-close-button");
        await expect(closeButton).toBeFocused();
        await closeButton.click();
        await expect(page.locator("#invitationLink")).toBeHidden();

        // Focus should be back on the share button
        await expect(shareButton).toBeFocused();
      });
    });
  });

  test.describe("membership", () => {
    test("join membership", async ({ page }) => {
      const { room: roomAfterLogin } = await visitAndLoginWithAccessCode(page, {
        owner: OWNER,
        description: "<p>Test</p>",
        allow_membership: true,
      });
      expect(roomAfterLogin.requests.length).toBeGreaterThan(0);

      const join = await mockMembership(page, "POST", {
        status: 204,
        hold: true,
      });
      const room = await mockRoom(page, {
        owner: OWNER,
        description: "<p>Test</p>",
        allow_membership: true,
        is_member: true,
      });

      const joinButton = page.getByTestId("room-join-membership-button");
      await expect(joinButton).toBeVisible();
      await expect(page.getByTestId("room-end-membership-button")).toHaveCount(
        0,
      );
      await joinButton.click();
      await expect(joinButton).toBeDisabled();
      join.release();

      expectAuthToken(await nextRequest(join));
      expectNoAuthToken(await nextRequest(room));

      await expect(joinButton).toHaveCount(0);
      await expect(
        page.getByTestId("room-end-membership-button"),
      ).toBeVisible();
    });

    test("end membership", async ({ page }) => {
      await visitAndLoginWithAccessCode(page, {
        owner: OWNER,
        description: "<p>Test</p>",
        allow_membership: true,
      });

      // join the room, afterwards the access code is not sent anymore
      const join = await mockMembership(page, "POST", { status: 204 });
      const memberRoom = await mockRoom(page, {
        owner: OWNER,
        description: "<p>Test</p>",
        allow_membership: true,
        is_member: true,
      });
      await page.getByTestId("room-join-membership-button").click();
      await nextRequest(join);
      await nextRequest(memberRoom);
      await expect(
        page.getByTestId("room-end-membership-button"),
      ).toBeVisible();

      const end = await mockMembership(page, "DELETE", {
        status: 204,
        hold: true,
      });
      const room = await mockRoom(page, {
        owner: OWNER,
        authenticated: false,
        description: "<p>Test</p>",
        allow_membership: true,
      });

      await page.getByTestId("room-end-membership-button").click();
      await expect(page.getByTestId("end-membership-dialog")).toBeVisible();
      const continueButton = page.getByTestId("dialog-continue-button");
      await continueButton.click();
      await expect(continueButton).toBeDisabled();
      end.release();

      expectNoAuthToken(await nextRequest(end));
      expectNoAuthToken(await nextRequest(room));

      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("123-456-789");

      // Check that no error message is shown even though room request returned authenticated false again
      await expect(page.locator(".p-toast-message")).toHaveCount(0);
    });

    test.describe("join membership errors", () => {
      test.beforeEach(async ({ page }) => {
        await mockRoom(page, {
          owner: OWNER,
          description: "<p>Test</p>",
          allow_membership: true,
        });
        await page.goto(ROOM_PATH);
        await expect(
          page.getByTestId("room-join-membership-button"),
        ).toBeVisible();
      });

      test("general error", async ({ page }) => {
        // use the access code flow to check that the token is sent
        await mockRoom(page, {
          owner: OWNER,
          authenticated: false,
          description: "<p>Test</p>",
          allow_membership: true,
        });
        await page.reload();
        await loginWithAccessCode(page, {
          owner: OWNER,
          description: "<p>Test</p>",
          allow_membership: true,
        });

        const join = await mockMembership(page, "POST", {
          status: 500,
          json: { message: "Test join membership error" },
        });
        await page.getByTestId("room-join-membership-button").click();

        expectAuthToken(await nextRequest(join));
        await expectToastAndClose(
          page,
          SERVER_ERROR_TOAST("Test join membership error"),
        );
      });

      test("invalid access code", async ({ page }) => {
        await mockRoom(page, {
          owner: OWNER,
          authenticated: false,
          description: "<p>Test</p>",
          allow_membership: true,
        });
        await page.reload();
        const { auth } = await loginWithAccessCode(page, {
          owner: OWNER,
          description: "<p>Test</p>",
          allow_membership: true,
        });

        const join = await mockMembership(page, "POST", {
          status: 401,
          json: { message: "invalid_auth_token" },
        });
        const room = await mockRoom(page, {
          owner: OWNER,
          authenticated: false,
          description: "<p>Test</p>",
          allow_membership: true,
        });
        await page.getByTestId("room-join-membership-button").click();

        // access code is still set in the membership request, but reset in the following room request
        expectAuthToken(await nextRequest(join));
        expectNoAuthToken(await nextRequest(room));

        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
        await expectToastAndClose(page, "rooms.flash.access_code_invalid");
        await expect(
          page.getByText("rooms.flash.access_code_invalid"),
        ).toBeVisible();

        // Login with the access code is possible again
        const reloadedRoom = await mockRoom(page, {
          owner: OWNER,
          description: "<p>Test</p>",
          allow_membership: true,
        });
        await page.getByTestId("room-login-button").click();
        await nextRequest(auth, 1);
        await nextRequest(reloadedRoom);
        await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      });

      test("membership not available", async ({ page }) => {
        const join = await mockMembership(page, "POST", {
          status: 403,
          json: {
            message:
              "Membership failed! Membership for this room is currently not available.",
          },
        });
        const room = await mockRoom(page, {
          owner: OWNER,
          description: "<p>Test</p>",
        });
        await page.getByTestId("room-join-membership-button").click();

        await nextRequest(join);
        await nextRequest(room);

        await expectToastAndClose(
          page,
          SERVER_ERROR_TOAST(
            "Membership failed! Membership for this room is currently not available.",
            403,
          ),
        );
        await expect(
          page.getByTestId("room-join-membership-button"),
        ).toHaveCount(0);
      });

      test("unauthenticated", async ({ page }) => {
        const join = await mockMembership(page, "POST", { status: 401 });
        const room = await mockRoom(page, {
          current_user: null,
          description: "<p>Test</p>",
        });
        await page.getByTestId("room-join-membership-button").click();

        await nextRequest(join);
        await nextRequest(room);

        await expectStayedOnRoomPage(page);
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const join = await mockMembership(page, "POST", {
          status: 404,
          json: MODEL_NOT_FOUND_BODY,
        });
        await page.getByTestId("room-join-membership-button").click();

        await nextRequest(join);
        await expectRedirectedToRoomIndex(page);
      });
    });

    test.describe("end membership errors", () => {
      test.beforeEach(async ({ page }) => {
        await mockRoom(page, {
          owner: OWNER,
          description: "<p>Test</p>",
          allow_membership: true,
          is_member: true,
        });
        await page.goto(ROOM_PATH);
        await page.getByTestId("room-end-membership-button").click();
        await expect(page.getByTestId("end-membership-dialog")).toBeVisible();
      });

      test("general error", async ({ page }) => {
        const end = await mockMembership(page, "DELETE", {
          status: 500,
          json: { message: "Test end membership error" },
        });
        await page.getByTestId("dialog-continue-button").click();

        expectNoAuthToken(await nextRequest(end));
        await expectToastAndClose(
          page,
          SERVER_ERROR_TOAST("Test end membership error"),
        );

        // Close end membership dialog
        await expect(page.getByTestId("end-membership-dialog")).toBeVisible();
        await page.getByTestId("dialog-cancel-button").click();
        await expect(page.getByTestId("end-membership-dialog")).toBeHidden();
      });

      test("unauthenticated", async ({ page }) => {
        const end = await mockMembership(page, "DELETE", { status: 401 });
        const room = await mockRoom(page, {
          current_user: null,
          authenticated: false,
          allow_membership: true,
          description: "<p>Test</p>",
        });
        await page.getByTestId("dialog-continue-button").click();

        expectNoAuthToken(await nextRequest(end));
        await nextRequest(room);

        await expectStayedOnRoomPage(page);
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();

        // Check that access code overlay is shown
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const end = await mockMembership(page, "DELETE", {
          status: 404,
          json: MODEL_NOT_FOUND_BODY,
        });
        await page.getByTestId("dialog-continue-button").click();

        await nextRequest(end);
        await expectRedirectedToRoomIndex(page);
      });
    });
  });

  test.describe("favorites button", () => {
    const FAVORITE_ROOM = {
      owner: OWNER,
      description: "<p>Test</p>",
      allow_membership: true,
    };
    const ADD_LABEL = 'rooms.favorites.add_for_{"room":"Meeting One"}';
    const REMOVE_LABEL = 'rooms.favorites.remove_for_{"room":"Meeting One"}';

    test("add room to favorites", async ({ page }) => {
      const initialRoom = await mockRoom(page, FAVORITE_ROOM);
      await page.goto(ROOM_PATH);
      await nextRequest(initialRoom);

      const add = await mockFavorites(page, "POST", {
        status: 204,
        hold: true,
      });
      const room = await mockRoom(page, {
        ...FAVORITE_ROOM,
        is_favorite: true,
      });

      const button = page.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute("aria-label", ADD_LABEL);
      await button.click();
      await expect(button).toBeDisabled();
      add.release();

      await nextRequest(add);
      await nextRequest(room);

      await expect(button).toHaveAttribute("aria-label", REMOVE_LABEL);
    });

    test("remove room from favorites", async ({ page }) => {
      const initialRoom = await mockRoom(page, {
        ...FAVORITE_ROOM,
        is_favorite: true,
      });
      await page.goto(ROOM_PATH);
      await nextRequest(initialRoom);

      const remove = await mockFavorites(page, "DELETE", {
        status: 204,
        hold: true,
      });
      const room = await mockRoom(page, FAVORITE_ROOM);

      const button = page.getByTestId("room-favorites-button");
      await expect(button).toHaveAttribute("aria-label", REMOVE_LABEL);
      await button.click();
      await expect(button).toBeDisabled();
      remove.release();

      await nextRequest(remove);
      await nextRequest(room);

      await expect(button).toHaveAttribute("aria-label", ADD_LABEL);
    });

    test.describe("errors when adding", () => {
      test.beforeEach(async ({ page }) => {
        await mockRoom(page, FAVORITE_ROOM);
        await page.goto(ROOM_PATH);
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          ADD_LABEL,
        );
      });

      test("general error", async ({ page }) => {
        const add = await mockFavorites(page, "POST", {
          status: 500,
          json: { message: "Test add favorite error" },
        });
        const room = await mockRoom(page, FAVORITE_ROOM);
        await page.getByTestId("room-favorites-button").click();

        await nextRequest(add);
        await nextRequest(room);

        // Check that error message is shown and button stayed the same
        await expectToastAndClose(
          page,
          SERVER_ERROR_TOAST("Test add favorite error"),
        );
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          ADD_LABEL,
        );
      });

      test("unauthenticated", async ({ page }) => {
        const add = await mockFavorites(page, "POST", { status: 401 });
        const room = await mockRoom(page, {
          current_user: null,
          description: "<p>Test</p>",
        });
        await page.getByTestId("room-favorites-button").click();

        await nextRequest(add);
        await nextRequest(room);

        await expectStayedOnRoomPage(page);
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const add = await mockFavorites(page, "POST", {
          status: 404,
          json: MODEL_NOT_FOUND_BODY,
        });
        await page.getByTestId("room-favorites-button").click();

        await nextRequest(add);
        await expectRedirectedToRoomIndex(page);
      });
    });

    test.describe("errors when removing", () => {
      const FAVORITE = { ...FAVORITE_ROOM, is_favorite: true };

      test.beforeEach(async ({ page }) => {
        await mockRoom(page, FAVORITE);
        await page.goto(ROOM_PATH);
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          REMOVE_LABEL,
        );
      });

      test("general error", async ({ page }) => {
        const remove = await mockFavorites(page, "DELETE", {
          status: 500,
          json: { message: "Test remove favorite error" },
        });
        const room = await mockRoom(page, FAVORITE);
        await page.getByTestId("room-favorites-button").click();

        await nextRequest(remove);
        await nextRequest(room);

        // Check that error message is shown and button stayed the same
        await expectToastAndClose(
          page,
          SERVER_ERROR_TOAST("Test remove favorite error"),
        );
        await expect(page.getByTestId("room-favorites-button")).toHaveAttribute(
          "aria-label",
          REMOVE_LABEL,
        );
      });

      test("unauthenticated", async ({ page }) => {
        const remove = await mockFavorites(page, "DELETE", { status: 401 });
        const room = await mockRoom(page, {
          current_user: null,
          authenticated: false,
          allow_membership: true,
          description: "<p>Test</p>",
        });
        await page.getByTestId("room-favorites-button").click();

        await nextRequest(remove);
        await nextRequest(room);

        await expectStayedOnRoomPage(page);
        await expectToastAndClose(page, "app.flash.unauthenticated");
        await expect(page.getByText("auth.login").first()).toBeVisible();

        // Check that access code overlay is shown
        await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        const remove = await mockFavorites(page, "DELETE", {
          status: 404,
          json: MODEL_NOT_FOUND_BODY,
        });
        await page.getByTestId("room-favorites-button").click();

        await nextRequest(remove);
        await expectRedirectedToRoomIndex(page);
      });
    });
  });

  test("visit with guest forbidden", async ({ page }) => {
    await mockRoomError(page, 403, { message: "guests_not_allowed" });
    await page.goto(ROOM_PATH);

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
      await mockRoomError(page, 500, { message: "Test" });
      await page.goto(ROOM_PATH);
      await expectToastAndClose(page, SERVER_ERROR_TOAST("Test"));
    });

    test("shows the overlay", async ({ page }) => {
      await expect(page.getByTestId("no-room-overlay")).toBeVisible();
    });

    test("reload without error", async ({ page }) => {
      await expect(page.getByTestId("no-room-overlay")).toBeVisible();

      const room = await mockRoom(page);
      const reloadButton = page.getByTestId("reload-button").first();
      await expect(reloadButton).toHaveText("app.reload");
      await reloadButton.click();

      await nextRequest(room);
      await expect(page.getByText("Meeting One").first()).toBeVisible();

      // Check that overlay is hidden
      await expect(page.getByTestId("no-room-overlay")).toHaveCount(0);
    });
  });

  test("visit with room not found as logged in user", async ({ page }) => {
    await interceptRoomIndexRequests(page);
    await mockRoomError(page, 404, MODEL_NOT_FOUND_BODY);

    await page.goto(ROOM_PATH);

    // Check redirect to room index page
    await expectRedirectedToRoomIndex(page);
  });

  test.describe("as guest", () => {
    test.use({ authenticated: false });

    test("visit with room not found", async ({ page }) => {
      await mockRoomError(page, 404, MODEL_NOT_FOUND_BODY);

      await page.goto(ROOM_PATH);

      // Check redirect to 404 page
      await expectUrlPath(page, {
        includes: "/404",
        excludes: "/rooms/abc-def-123",
      });
      await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
    });

    test("auto-reload", async ({ page, config }) => {
      config.data.room.refresh_rate = 60;
      const room = await mockRoom(page, {
        allow_membership: true,
        current_user: null,
      });

      await page.clock.install();
      await page.goto(ROOM_PATH);
      await nextRequest(room);
      await expect(page.getByText("Meeting One").first()).toBeVisible();

      // Wait more than 60 seconds (due to reload randomness) for a auto-reload
      await page.clock.runFor(100000);
      await expect.poll(() => room.requests.length).toBe(2);
    });

    test("auto-reload disabled on error", async ({ page, config }) => {
      config.data.room.refresh_rate = 60;
      const room = await mockRoomError(page, 403, {
        message: "guests_not_allowed",
      });

      await page.clock.install();
      await page.goto(ROOM_PATH);
      await nextRequest(room);

      // Check that the error message is shown
      await expect(
        page.getByText("rooms.only_used_by_authenticated_users").first(),
      ).toBeVisible();

      // Wait more than 60 seconds (due to reload randomness) for no auto-reload
      await page.clock.runFor(100000);
      expect(room.requests).toHaveLength(1);
    });

    test.describe("reload with errors", () => {
      test.beforeEach(async ({ page }) => {
        await mockRoom(page, { allow_membership: true, current_user: null });
        await page.goto(ROOM_PATH);
        await expect(page.getByText("Meeting One").first()).toBeVisible();
      });

      test("general error", async ({ page }) => {
        const room = await mockRoomError(page, 500, { message: "Test" });
        await page.getByTestId("reload-room-button").click();

        await nextRequest(room);
        await expectToastAndClose(page, SERVER_ERROR_TOAST("Test"));
      });

      test("guests forbidden", async ({ page }) => {
        const room = await mockRoomError(page, 403, {
          message: "guests_not_allowed",
        });
        await page.getByTestId("reload-room-button").click();

        await nextRequest(room);
        await expect(
          page.getByText("rooms.only_used_by_authenticated_users").first(),
        ).toBeVisible();
      });

      test("room not found", async ({ page }) => {
        const room = await mockRoomError(page, 404, MODEL_NOT_FOUND_BODY);
        await page.getByTestId("reload-room-button").click();

        await nextRequest(room);

        // Check redirect to 404 page worked
        await expectUrlPath(page, {
          includes: "/404",
          excludes: "/rooms/abc-def-123",
        });
        await expectToastAndClose(page, MODEL_NOT_FOUND_TOAST);
      });
    });

    test("displays meeting ended reason", async ({ page }) => {
      const room = await mockRoom(page, {
        allow_membership: true,
        current_user: null,
      });

      await page.goto(ROOM_PATH + "?reason=Meeting+ended+by+John+Doe");
      await nextRequest(room);

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

    test("displays bbb error messages", async ({ page }) => {
      const room = await mockRoom(page, {
        allow_membership: true,
        current_user: null,
      });

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
      await page.goto(`${ROOM_PATH}?errors=${errors}`);
      await nextRequest(room);

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
    test("redirects to the room index", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      await mockRoom(page, { allow_membership: true });
      await page.goto(ROOM_PATH);
      await expect(page.getByText("Meeting One").first()).toBeVisible();

      const room = await mockRoomError(page, 404, MODEL_NOT_FOUND_BODY);
      await page.getByTestId("reload-room-button").click();

      await nextRequest(room);

      // Check redirect to room index page worked
      await expectRedirectedToRoomIndex(page);
    });
  });

  test("hide room owner if not provided", async ({ page }) => {
    await mockRoom(page, (data) => {
      delete data.owner;
    });

    await page.goto(ROOM_PATH);

    // room itself will be loaded
    await expect(page.getByText("Meeting One").first()).toBeVisible();

    // room should not contain owner name
    await expect(page.getByText("John Doe")).toHaveCount(0);
  });
});
