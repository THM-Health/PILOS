import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as browserApisTest } from "../support/fixtures/browserApis.js";
import {
  expect,
  expectToastAndClose,
  stubNotification,
} from "../support/test.js";

const test = mergeTests(roomControllerTest, browserApisTest);

test.describe("Rooms view browser notification", () => {
  test.use({ authenticated: true });

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
    await page.goto("/rooms/abc-def-123");
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
    await page.goto("/rooms/abc-def-123");

    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.__constructed))
      .toEqual([[""]]);
    await expect(page.getByTestId("room-notification-button")).toHaveCount(0);
  });

  test.describe("running state changes", () => {
    test.beforeEach(async ({ page, configResponse }) => {
      configResponse.data.theme.favicon = "favicon.ico";
      // Fixed date, only Date is faked (timers keep running)
      await page.clock.setFixedTime(new Date(Date.UTC(2017, 1, 1)));
    });

    test("notification is shown when room changes from not running to running", async ({
      page,
      roomResponse,
      stubBrowserApis,
    }) => {
      const getState = await stubBrowserApis();
      await page.goto("/rooms/abc-def-123");

      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);

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
      roomResponse,
      stubBrowserApis,
    }) => {
      const getState = await stubBrowserApis();
      await page.goto("/rooms/abc-def-123");
      await page.getByTestId("room-notification-button").click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);
      await expect.poll(async () => (await getState()).plays).toBe(1);

      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T09:18:28.000000Z",
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);

      await expect.poll(async () => (await getState()).closed).toEqual([0]);
    });

    test("new notification is shown when room starts running again and clicking it focuses the window", async ({
      page,
      roomResponse,
      stubBrowserApis,
    }) => {
      const getState = await stubBrowserApis();
      await page.goto("/rooms/abc-def-123");
      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);
      await expect.poll(async () => (await getState()).plays).toBe(1);
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T09:18:28.000000Z",
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);
      await expect.poll(async () => (await getState()).closed).toEqual([0]);

      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);
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

    test("notifications can be disabled", async ({
      page,
      roomResponse,
      stubBrowserApis,
    }) => {
      await stubBrowserApis();
      await page.goto("/rooms/abc-def-123");
      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);
      await expect(button).toHaveCount(0);
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T09:18:28.000000Z",
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);

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
      roomResponse,
      stubBrowserApis,
    }) => {
      const getState = await stubBrowserApis({ throwOnConstruct: true });
      await page.goto("/rooms/abc-def-123");
      const button = page.getByTestId("room-notification-button");
      await button.click();
      await expectToastAndClose(page, "rooms.notification.enabled");

      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: null,
      };
      await Promise.all([
        page.waitForResponse("**/api/v1/rooms/abc-def-123"),
        page.getByTestId("reload-room-button").click(),
      ]);

      await expectToastAndClose(page, "rooms.notification.browser_support");
      await expect(button).toHaveCount(0);
      expect((await getState()).notifications).toHaveLength(1);
    });
  });
});
