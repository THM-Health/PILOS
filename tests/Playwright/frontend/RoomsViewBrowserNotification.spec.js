import { readFileSync } from "node:fs";
import {
  test,
  expect,
  expectToastAndClose,
  stubNotification,
} from "../support/test.js";

const ROOM_PATH = "/rooms/abc-def-123";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const MEETING_RUNNING = { start: "2023-08-21T08:18:28.000000Z", end: null };
const MEETING_ENDED = {
  start: "2023-08-21T08:18:28.000000Z",
  end: "2023-08-21T09:18:28.000000Z",
};

/**
 * Fake `Notification`, `Audio` and `window.focus` that record what the app did with them (replaces the
 * notification faker and the cy.stub calls). The state is available as `window.__browserApis`.
 * @param {import("@playwright/test").Page} page
 * @param {{throwOnConstruct?: boolean}} options
 */
async function stubBrowserApis(page, { throwOnConstruct = false } = {}) {
  await page.addInitScript((throwOnConstruct) => {
    const state = {
      notifications: [],
      closed: [],
      listeners: [],
      handlers: [],
      audios: [],
      plays: 0,
      focus: 0,
    };
    window.__browserApis = state;
    window.focus = () => state.focus++;
    window.Audio = class {
      constructor(...args) {
        state.audios.push(args);
      }
      play() {
        state.plays++;
      }
    };
    window.Notification = class {
      static permission = "granted";
      constructor(...args) {
        state.notifications.push(args);
        if (throwOnConstruct) {
          throw new TypeError("test");
        }
        this.index = state.notifications.length - 1;
        state.handlers[this.index] = {};
      }
      close() {
        state.closed.push(this.index);
      }
      addEventListener(event, callback) {
        state.listeners.push([this.index, event]);
        state.handlers[this.index][event] = callback;
      }
    };
  }, throwOnConstruct);
  return () => page.evaluate(() => window.__browserApis);
}

test.describe("Rooms view browser notification", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/rooms/abc-def-123", (route) =>
      route.fulfill({ path: "tests/Playwright/fixtures/room.json" }),
    );
  });

  test("enable notifications with granted permission", async ({ page }) => {
    await stubNotification(page, { permission: "granted" });
    await page.goto("/rooms/abc-def-123");

    const button = page.getByTestId("room-notification-button");
    await expect(button).toHaveAttribute(
      "aria-label",
      "rooms.notification.enable",
    );
    await button.click();

    await expectToastAndClose(page, "rooms.notification.enabled");
    await expect(button).toHaveAttribute(
      "aria-label",
      "rooms.notification.disable",
    );
  });

  test("enable notifications with denied permission", async ({ page }) => {
    await stubNotification(page, { permission: "denied" });
    await page.goto("/rooms/abc-def-123");

    const button = page.getByTestId("room-notification-button");
    await button.click();

    await expectToastAndClose(page, "rooms.notification.denied");
    await expect(button).toHaveAttribute(
      "aria-label",
      "rooms.notification.enable",
    );
  });

  test("enable notification with default permission, but granted on request", async ({
    page,
  }) => {
    const getState = await stubNotification(page, {
      permission: "default",
      requestPermissionResult: "granted",
    });
    await page.goto("/rooms/abc-def-123");

    // Test notification is created once with "" and closed
    await expect
      .poll(async () => (await getState()).constructed)
      .toEqual([[""]]);
    await expect.poll(async () => (await getState()).closed).toBe(1);

    const button = page.getByTestId("room-notification-button");
    await expect(button).toHaveAttribute(
      "aria-label",
      "rooms.notification.enable",
    );
    await button.click();

    await expect.poll(async () => (await getState()).requestPermission).toBe(1);
    await expectToastAndClose(page, "rooms.notification.enabled");
    await expect(button).toHaveAttribute(
      "aria-label",
      "rooms.notification.disable",
    );
  });

  test("enable notification with default permission, but denied on request", async ({
    page,
  }) => {
    const getState = await stubNotification(page, {
      permission: "default",
      requestPermissionResult: "denied",
    });
    await page.goto(ROOM_PATH);

    // Test notification is created once with "" and closed
    await expect
      .poll(async () => (await getState()).constructed)
      .toEqual([[""]]);
    await expect.poll(async () => (await getState()).closed).toBe(1);

    const button = page.getByTestId("room-notification-button");
    await expect(button).toHaveAttribute(
      "aria-label",
      "rooms.notification.enable",
    );
    await button.click();

    await expect.poll(async () => (await getState()).requestPermission).toBe(1);
    await expectToastAndClose(page, "rooms.notification.denied");
    await expect(button).toHaveAttribute(
      "aria-label",
      "rooms.notification.enable",
    );
  });

  test("hide enable button if not supported by browser", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.Notification;
    });
    const roomResponse = page.waitForResponse("**/api/v1/rooms/abc-def-123");
    await page.goto(ROOM_PATH);
    await roomResponse;

    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-notification-button")).toHaveCount(0);
  });

  test("hide enable button if not fully supported", async ({ page }) => {
    await page.addInitScript(() => {
      window.__constructed = [];
      window.Notification = class {
        static permission = "default";
        constructor(...args) {
          window.__constructed.push(args);
          throw new TypeError("test");
        }
      };
    });
    await page.goto(ROOM_PATH);

    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.__constructed))
      .toEqual([[""]]);
    await expect(page.getByTestId("room-notification-button")).toHaveCount(0);
  });

  test.describe("running state changes", () => {
    let room;

    /**
     * Serve the room with the given meeting state and reload it via the reload button.
     */
    const reloadRoom = async (page, lastMeeting) => {
      room.data.last_meeting = lastMeeting;
      const response = page.waitForResponse("**/api/v1/rooms/abc-def-123");
      await page.getByTestId("reload-room-button").click();
      await response;
    };

    test.beforeEach(async ({ page, config }) => {
      config.data.theme.favicon = "favicon.ico";
      room = readFixture("room.json");
      // Latest registered route wins, serve the mutable room
      await page.route("**/api/v1/rooms/abc-def-123", (route) =>
        route.fulfill({ json: room }),
      );

      // Fixed date, only Date is faked (timers keep running)
      await page.clock.setFixedTime(new Date(Date.UTC(2017, 1, 1)));
    });

    test("notification is shown when room changes from not running to running", async ({
      page,
    }) => {
      const getState = await stubBrowserApis(page);
      await page.goto(ROOM_PATH);

      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      await reloadRoom(page, MEETING_RUNNING);

      // Enable button is hidden while the room is running
      await expect(button).toHaveCount(0);

      await expect
        .poll(async () => (await getState()).notifications)
        .toEqual([
          [
            "Meeting One",
            {
              body: 'rooms.notification.body_{"time":"01:00"}',
              icon: "favicon.ico",
            },
          ],
        ]);
      const state = await getState();
      expect(state.listeners).toEqual([[0, "click"]]);
      expect(state.audios).toHaveLength(1);
      expect(state.audios[0][0]).toMatch(/\.mp3/);
      expect(state.audios[0][0]).toMatch(/notification/);
      expect(state.plays).toBe(1);
    });

    test("notification is closed when room changes from running to not running", async ({
      page,
    }) => {
      const getState = await stubBrowserApis(page);
      await page.goto(ROOM_PATH);
      await page.getByTestId("room-notification-button").click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      await reloadRoom(page, MEETING_RUNNING);
      await expect.poll(async () => (await getState()).plays).toBe(1);

      await reloadRoom(page, MEETING_ENDED);

      await expect.poll(async () => (await getState()).closed).toEqual([0]);
    });

    test("new notification is shown when room starts running again and clicking it focuses the window", async ({
      page,
    }) => {
      const getState = await stubBrowserApis(page);
      await page.goto(ROOM_PATH);
      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      await reloadRoom(page, MEETING_RUNNING);
      await expect.poll(async () => (await getState()).plays).toBe(1);
      await reloadRoom(page, MEETING_ENDED);
      await expect.poll(async () => (await getState()).closed).toEqual([0]);

      await reloadRoom(page, MEETING_RUNNING);
      await expect(button).toHaveCount(0);

      await expect
        .poll(async () => (await getState()).notifications)
        .toEqual([
          [
            "Meeting One",
            {
              body: 'rooms.notification.body_{"time":"01:00"}',
              icon: "favicon.ico",
            },
          ],
          [
            "Meeting One",
            {
              body: 'rooms.notification.body_{"time":"01:00"}',
              icon: "favicon.ico",
            },
          ],
        ]);
      let state = await getState();
      expect(state.listeners).toEqual([
        [0, "click"],
        [1, "click"],
      ]);
      expect(state.audios).toHaveLength(2);
      for (const [audio] of state.audios) {
        expect(audio).toMatch(/\.mp3/);
        expect(audio).toMatch(/notification/);
      }
      expect(state.plays).toBe(2);

      // Simulate a click on the second notification
      await page.evaluate(() => window.__browserApis.handlers[1].click());

      // Window is focused and the notification is closed (correct function set with addEventListener)
      await expect.poll(async () => (await getState()).focus).toBe(1);
      state = await getState();
      expect(state.closed).toEqual([0, 1]);
    });

    test("notifications can be disabled", async ({ page }) => {
      await stubBrowserApis(page);
      await page.goto(ROOM_PATH);
      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      await reloadRoom(page, MEETING_RUNNING);
      await expect(button).toHaveCount(0);
      await reloadRoom(page, MEETING_ENDED);

      // Disable notifications
      await button.click();
      await expectToastAndClose(page, "rooms.notification.disabled");
      await expect(button).toHaveAttribute(
        "aria-label",
        "rooms.notification.enable",
      );
    });

    test("error on creating notification hides the button and shows an error", async ({
      page,
    }) => {
      const getState = await stubBrowserApis(page, { throwOnConstruct: true });
      await page.goto(ROOM_PATH);
      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      await reloadRoom(page, MEETING_RUNNING);

      await expectToastAndClose(page, "rooms.notification.browser_support");
      await expect(button).toHaveCount(0);
      expect((await getState()).notifications).toHaveLength(1);
    });
  });
});
