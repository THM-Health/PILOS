import { readFileSync } from "node:fs";
import { test, expect } from "../support/test.js";
import { interceptRoomFilesRequest } from "../support/mocks.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const ROOM_PATH = "/rooms/abc-def-123";
const ROOM_URL = "**/api/v1/rooms/abc-def-123*";
const NAME_CHECK_URL = "**/api/v1/participantName/check";
const RUNNING_SINCE =
  'rooms.index.room_component.running_since_{"date":"08/21/2023, 04:18"}';

const TABS = [
  "description",
  "members",
  "tokens",
  "files",
  "recordings",
  "history",
  "settings",
];
const GUEST_TABS = ["files", "recordings"];

function mockRoom(page, mutate = () => {}, options = {}) {
  const room = JSON.parse(
    readFileSync("tests/Playwright/fixtures/room.json", "utf8"),
  );
  mutate(room.data);
  return mockMethod(page, "GET", ROOM_URL, {
    status: 200,
    json: room,
    ...options,
  });
}

function asGuest(room) {
  room.allow_membership = true;
  room.current_user = null;
}

function asMeetingTwo(room) {
  asGuest(room);
  room.name = "Meeting Two";
  room.owner.id = 2;
  room.owner.name = "Max Doe";
  room.last_meeting = { start: "2023-08-21T08:18:28.000000Z", end: null };
  room.description = "<p>Test</p>";
  room.access_code = null;
}

/**
 * Check which room tabs are shown, all others have to be absent
 */
async function expectTabs(page, visibleTabs) {
  for (const tab of TABS) {
    const locator = page.locator(`#tab-${tab}`);
    if (visibleTabs.includes(tab)) {
      await expect(locator).toBeVisible();
    } else {
      await expect(locator).toHaveCount(0);
    }
  }
}

/**
 * Check the room header and the buttons of a guest that has entered the room
 */
async function expectGuestRoomView(page) {
  await expect(page.getByTestId("room-access-overlay")).toBeHidden();
  await expect(page.getByText("Meeting One")).toBeVisible();
  await expect(page.getByText("John Doe")).toBeVisible();
  await expect(
    page.getByText("rooms.index.room_component.never_started"),
  ).toBeVisible();

  await expect(page.getByText("rooms.name_in_video_conference")).toBeVisible();
  await expect(page.getByText("Laura Rivera")).toBeVisible();
  await expect(
    page.getByTestId("change-participant-name-button"),
  ).toBeVisible();

  await expect(page.getByTestId("reload-room-button")).toBeVisible();
  await expect(page.getByTestId("room-join-membership-button")).toHaveCount(0);
  await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
  await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
  await expect(page.getByTestId("room-share-button")).toHaveCount(0);

  await expectTabs(page, GUEST_TABS);
  await expect(page.getByText("rooms.files.title")).toBeVisible();
}

/**
 * Check the access overlay of a guest: header, login button and the empty participant name field
 */
async function expectGuestAccessOverlay(page, name, owner, runningState) {
  const overlay = page.getByTestId("room-access-overlay");
  await expect(overlay).toBeVisible();

  await expect(overlay.getByText(name)).toBeVisible();
  await expect(overlay.getByText(owner)).toBeVisible();
  await expect(overlay.getByText(runningState)).toBeVisible();

  const loginButton = overlay.getByTestId("room-login-as-user-button");
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toHaveText("auth.offer_login");
  await expect(loginButton).toHaveAttribute(
    "href",
    "/login?redirect=/rooms/abc-def-123",
  );

  const nameField = overlay.getByTestId("participant-name-field");
  await expect(nameField).toBeVisible();
  await expect(nameField.getByText("rooms.first_and_lastname")).toBeVisible();
  await expect(nameField.locator("#participant-name")).toBeVisible();
  await expect(nameField.locator("#participant-name")).toHaveValue("");
  await expect(
    nameField.getByText("rooms.remember_participant_name"),
  ).toBeVisible();
  await expect(
    nameField.locator("#remember-participant-name"),
  ).not.toBeChecked();

  await expect(overlay.getByTestId("access-code-field")).toHaveCount(0);
}

async function expectGuestNameStorage(page, value) {
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
    )
    .toBe(value);
}

test.describe("Rooms View access", () => {
  test.beforeEach(async ({ page }) => {
    await interceptRoomFilesRequest(page);
  });

  test.describe("guest", () => {
    test.beforeEach(async ({ page }) => {
      await mockRoom(page, asGuest);
      await mockMethod(page, "POST", NAME_CHECK_URL, { status: 204 });
    });

    test("shows access overlay with login button and participant name field", async ({
      page,
    }) => {
      await page.goto(ROOM_PATH);

      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expectGuestAccessOverlay(
        page,
        "Meeting One",
        "John Doe",
        "rooms.index.room_component.never_started",
      );
      await expect(page.getByTestId("room-login-button")).toHaveText(
        "rooms.continue_as_guest",
      );
    });

    test("disables login button while the participant name is checked", async ({
      page,
    }) => {
      const check = await mockMethod(page, "POST", NAME_CHECK_URL, {
        status: 204,
        hold: true,
      });
      await page.goto(ROOM_PATH);

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
      await page.goto(ROOM_PATH);

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();

      await expectGuestRoomView(page);
      await expectGuestNameStorage(page, null);
    });

    test("enters the room as guest and remembers the name", async ({
      page,
    }) => {
      await page.goto(ROOM_PATH);

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.locator("#remember-participant-name").check();
      await page.getByTestId("room-login-button").click();

      await expectGuestRoomView(page);
      await expectGuestNameStorage(page, "Laura Rivera");
    });

    test("stays in the room after reload with remembered name", async ({
      page,
    }) => {
      await page.goto(ROOM_PATH);

      await page.locator("#participant-name").fill("Laura Rivera");
      await page.locator("#remember-participant-name").check();
      await page.getByTestId("room-login-button").click();
      await expectGuestRoomView(page);

      await page.reload();

      await expectGuestRoomView(page);
      await expectGuestNameStorage(page, "Laura Rivera");
    });

    test("reloads the room as guest", async ({ page }) => {
      await page.goto(ROOM_PATH);
      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();
      await expectGuestRoomView(page);

      const reload = await mockRoom(page, asMeetingTwo, { hold: true });
      await page.getByTestId("reload-room-button").click();
      await expect(page.getByTestId("reload-room-button")).toBeDisabled();
      await nthRequest(reload);
      reload.release();

      await expect(page).toHaveTitle("Meeting Two - PILOS Test");
      await expect(page.getByText("Meeting Two")).toBeVisible();
      await expect(page.getByText("Max Doe")).toBeVisible();
      await expect(page.getByText(RUNNING_SINCE)).toBeVisible();
      await expectTabs(page, ["description", ...GUEST_TABS]);
    });

    test("shows access overlay again after page reload without remembered name", async ({
      page,
    }) => {
      await page.goto(ROOM_PATH);
      await page.locator("#participant-name").fill("Laura Rivera");
      await page.getByTestId("room-login-button").click();
      await expectGuestRoomView(page);

      await mockRoom(page, asMeetingTwo);
      await page.reload();

      await expect(page).toHaveTitle("Meeting Two - PILOS Test");
      await expectGuestAccessOverlay(
        page,
        "Meeting Two",
        "Max Doe",
        RUNNING_SINCE,
      );
      await expectGuestNameStorage(page, null);
    });
  });

  test.describe("logged in status change", () => {
    test.use({ authenticated: true });

    test.beforeEach(async ({ page }) => {
      await mockRoom(page, (room) => {
        room.allow_membership = true;
      });
      await page.goto(ROOM_PATH);
      await expectTabs(page, TABS);
    });

    test("logged in user becomes guest and has to enter a name", async ({
      page,
    }) => {
      await mockRoom(page, asGuest);
      const check = await mockMethod(page, "POST", NAME_CHECK_URL, {
        status: 204,
      });
      await page.getByTestId("reload-room-button").click();

      const overlay = page.getByTestId("room-access-overlay");
      await expect(overlay).toBeVisible();
      await expect(
        overlay.getByTestId("room-login-as-user-button"),
      ).toBeVisible();
      await expect(overlay.getByTestId("access-code-field")).toHaveCount(0);

      await overlay.locator("#participant-name").fill("Max Doe");
      await overlay.getByTestId("room-login-button").click();

      const request = await nthRequest(check);
      expect(request.postDataJSON()).toEqual({ name: "Max Doe" });
      await expect(overlay).toBeHidden();
      await expectGuestNameStorage(page, null);
      await expectTabs(page, GUEST_TABS);
    });

    test("logged in user becomes co-owner and gets all tabs", async ({
      page,
    }) => {
      await mockRoom(page, (room) => {
        room.allow_membership = true;
        room.is_member = true;
        room.is_co_owner = true;
        room.current_user = {
          id: 2,
          firstname: "Max",
          lastname: "Doe",
          user_locale: "en",
          permissions: ["rooms.create"],
          model_name: "User",
          room_limit: -1,
        };
      });
      await page.getByTestId("reload-room-button").click();

      await expectTabs(page, TABS);
    });
  });
});
