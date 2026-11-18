import { test, expect, loginAs } from "../support/system.js";

const BBB_TIMEOUT = 30000;

// Lobby setting index of the radio buttons in the room settings, and whether the BBB lobby (guest message) is shown
// to a role afterwards
const lobbyModes = [
  {
    name: "Lobby disabled",
    index: 0,
    user: "audioModal",
    moderator: "audioModal",
    guest: "audioModal",
  },
  {
    name: "Lobby enabled",
    index: 1,
    user: "guestMessage",
    moderator: "audioModal",
    guest: "guestMessage",
  },
  {
    name: "Lobby enabled for guests only",
    index: 2,
    user: "audioModal",
    moderator: "audioModal",
    guest: "guestMessage",
  },
];

/**
 * Starts the meeting as the logged in room owner and waits until the owner has joined the BBB server.
 * @param {import("@playwright/test").Page} page
 */
async function startMeetingAsOwner(page) {
  await page.getByTestId("room-start-button").click();
  await expect(page.getByTestId("audioModal")).toBeVisible({
    timeout: BBB_TIMEOUT,
  });
}

/**
 * Drops the session of the current user (logout) and opens the room as another user or as guest (name is null).
 * @param {import("@playwright/test").Page} page
 * @param {string|null} name
 */
async function openRoomAsAnotherUser(page, name) {
  await page.context().clearCookies();
  if (name) {
    await loginAs(page, name);
  } else {
    // guest: remember a guest name so no name has to be entered
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.setItem("pilos_guest_name", "John Doe"),
    );
  }
  await page.goto("/rooms/abc-def-123");
}

for (const mode of lobbyModes) {
  test.describe(mode.name, () => {
    test.beforeEach(async ({ page }) => {
      // Login as owner of the room and configure the lobby
      await loginAs(page, "daniel");
      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-settings").click();
      await page.getByTestId("clear-access-code-button").click();
      await page.locator("#room-setting-allow_guests").click();
      await page.locator(`#room-setting-lobby-${mode.index}`).click();

      const saveResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/rooms/abc-def-123") &&
          response.request().method() === "PUT",
      );
      await page.getByTestId("room-settings-save-button").click();
      expect((await saveResponse).ok()).toBe(true);
    });

    test("join as owner", async ({ page }) => {
      await startMeetingAsOwner(page);
    });

    test("join as user", async ({ page }) => {
      await startMeetingAsOwner(page);
      await openRoomAsAnotherUser(page, "hoyt");

      await page.getByTestId("room-join-button").click();
      await expect(page.getByTestId(mode.user)).toBeVisible({
        timeout: BBB_TIMEOUT,
      });
    });

    test("join as moderator", async ({ page }) => {
      await startMeetingAsOwner(page);
      await openRoomAsAnotherUser(page, "william");

      await page.getByTestId("room-join-button").click();
      await expect(page.getByTestId(mode.moderator)).toBeVisible({
        timeout: BBB_TIMEOUT,
      });
    });

    test("join as guest", async ({ page }) => {
      await startMeetingAsOwner(page);
      await openRoomAsAnotherUser(page, null);

      await page.getByTestId("room-join-button").click();
      await expect(page.getByTestId(mode.guest)).toBeVisible({
        timeout: BBB_TIMEOUT,
      });
    });
  });
}
