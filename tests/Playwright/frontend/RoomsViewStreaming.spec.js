import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";

const ROOM_PATH = "/rooms/abc-def-123";
const ROOM_URL = "**/api/v1/rooms/abc-def-123";
const STATUS_URL = "**/api/v1/rooms/abc-def-123/streaming/status";

const RUNNING_MEETING = {
  start: "2023-08-21T08:18:28.000000Z",
  end: null,
};

const ENDED_MEETING = {
  start: "2023-08-21T08:18:28.000000Z",
  end: "2023-08-21T08:20:00.000000Z",
};

const SERVER_ERROR_TOAST = [
  'app.flash.server_error.message_{"message":"Internal Server Error"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

/**
 * Serve the room with streaming enabled in the room type.
 */
async function mockRoom(page, mutate = () => {}) {
  const room = readFixture("room.json");
  room.data.type.features.streaming.enabled = true;
  room.data.last_meeting = RUNNING_MEETING;
  mutate(room.data);
  await page.route(ROOM_URL, (route) => route.fulfill({ json: room }));
}

/**
 * Serve the streaming status.
 */
async function mockStatus(page, data) {
  await page.route(STATUS_URL, (route) =>
    route.fulfill({
      json: {
        data: {
          enabled_for_current_meeting: true,
          status: null,
          fps: null,
          ...data,
        },
      },
    }),
  );
}

/**
 * Check which action buttons are enabled.
 */
async function expectButtons(page, { start, stop, pause, resume }) {
  for (const [name, enabled] of Object.entries({
    start,
    stop,
    pause,
    resume,
  })) {
    const button = page.getByTestId(`streaming-${name}-button`);
    if (enabled) {
      await expect(button).toBeEnabled();
    } else {
      await expect(button).toBeDisabled();
    }
  }
}

const ALL_DISABLED = {
  start: false,
  stop: false,
  pause: false,
  resume: false,
};

test.use({ authenticated: true });

test.describe("Rooms view streaming", () => {
  test.beforeEach(async ({ page, config }) => {
    config.data.general.hide_disabled_features = true;
    config.data.streaming.enabled = true;

    await mockRoom(page);
    await mockStatus(page, {});
  });

  test.describe("buttons and status", () => {
    test("no running meeting, room was never started", async ({ page }) => {
      await mockRoom(page, (room) => {
        room.last_meeting = null;
      });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.no_running_meeting",
      );
      await expectButtons(page, ALL_DISABLED);
    });

    test("no running meeting, meeting ended", async ({ page }) => {
      await mockRoom(page, (room) => {
        room.last_meeting = ENDED_MEETING;
      });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.no_running_meeting",
      );
      await expectButtons(page, ALL_DISABLED);
    });

    test("running meeting, streaming disabled", async ({ page }) => {
      await mockStatus(page, { enabled_for_current_meeting: false });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.not_enabled_for_running_meeting",
      );
      await expectButtons(page, ALL_DISABLED);
    });

    test("running meeting, streaming not started yet", async ({ page }) => {
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expectButtons(page, { ...ALL_DISABLED, start: true });
      await expect(page.getByTestId("streaming-status")).toBeHidden();
    });

    const statuses = [
      {
        status: "starting",
        buttons: ALL_DISABLED,
      },
      {
        status: "running",
        buttons: { ...ALL_DISABLED, stop: true, pause: true },
      },
      {
        status: "paused",
        buttons: { ...ALL_DISABLED, stop: true, resume: true },
      },
      {
        status: "stopped",
        buttons: { ...ALL_DISABLED, start: true },
      },
      {
        status: "failed",
        buttons: { ...ALL_DISABLED, start: true },
      },
    ];

    for (const { status, buttons } of statuses) {
      test(`status ${status}`, async ({ page }) => {
        await mockStatus(page, { status, fps: 30 });
        await page.goto(ROOM_PATH);
        await page.locator("#tab-streaming").click();

        await expect(page.getByTestId("streaming-status")).toContainText(
          `rooms.streaming.${status}`,
        );
        await expectButtons(page, buttons);
      });
    }
  });

  test.describe("fps counter", () => {
    test("fps counter is shown", async ({ page, config }) => {
      config.data.streaming.show_fps = true;
      await mockStatus(page, { enabled_for_current_meeting: false, fps: 30 });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-fps-counter")).toContainText(
        'rooms.streaming.fps_{"fps":30}',
      );
    });

    test("fps counter is hidden if disabled in the global config", async ({
      page,
      config,
    }) => {
      config.data.streaming.show_fps = false;
      await mockStatus(page, { enabled_for_current_meeting: false, fps: 30 });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toBeVisible();
      await expect(page.getByTestId("streaming-fps-counter")).toBeHidden();
    });
  });

  test.describe("actions", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();
      await expectButtons(page, { ...ALL_DISABLED, start: true });
    });

    test("start streaming", async ({ page }) => {
      await page.route("**/api/v1/rooms/abc-def-123/streaming/start", (route) =>
        route.fulfill({
          json: {
            data: {
              enabled_for_current_meeting: true,
              status: "queued",
              fps: null,
            },
          },
        }),
      );
      await page.getByTestId("streaming-start-button").click();

      await expectButtons(page, { ...ALL_DISABLED, stop: true });
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.queued",
      );
    });

    test("start streaming fails", async ({ page }) => {
      await page.route("**/api/v1/rooms/abc-def-123/streaming/start", (route) =>
        route.fulfill({
          json: {
            data: {
              enabled_for_current_meeting: true,
              status: "failed",
              fps: null,
            },
          },
        }),
      );
      await page.getByTestId("streaming-start-button").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.failed",
      );
      await expectButtons(page, { ...ALL_DISABLED, start: true });
    });

    test("reload status after starting", async ({ page }) => {
      await page.route("**/api/v1/rooms/abc-def-123/streaming/start", (route) =>
        route.fulfill({
          json: {
            data: {
              enabled_for_current_meeting: true,
              status: "queued",
              fps: null,
            },
          },
        }),
      );
      await page.getByTestId("streaming-start-button").click();
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.queued",
      );

      // queued -> starting
      await mockStatus(page, { status: "starting" });
      const startingRequest = page.waitForRequest(STATUS_URL);
      await page.getByTestId("streaming-reload-button").click();
      await startingRequest;
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.starting",
      );
      await expectButtons(page, ALL_DISABLED);

      // starting -> running
      await mockStatus(page, { status: "running", fps: 30 });
      const runningRequest = page.waitForRequest(STATUS_URL);
      await page.getByTestId("streaming-reload-button").click();
      await runningRequest;
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.running",
      );
      await expectButtons(page, { ...ALL_DISABLED, stop: true, pause: true });
    });

    test.describe("running streaming", () => {
      test.beforeEach(async ({ page }) => {
        await mockStatus(page, { status: "running", fps: 30 });
        await page.getByTestId("streaming-reload-button").click();
        await expectButtons(page, { ...ALL_DISABLED, stop: true, pause: true });
      });

      test("pause streaming", async ({ page }) => {
        await page.route(
          "**/api/v1/rooms/abc-def-123/streaming/pause",
          (route) =>
            route.fulfill({
              json: {
                data: {
                  enabled_for_current_meeting: true,
                  status: "pausing",
                  fps: "30",
                },
              },
            }),
        );
        await page.getByTestId("streaming-pause-button").click();

        await expectButtons(page, { ...ALL_DISABLED, stop: true });
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.pausing",
        );
      });

      test("stop streaming", async ({ page }) => {
        await page.route(
          "**/api/v1/rooms/abc-def-123/streaming/stop",
          (route) =>
            route.fulfill({
              json: {
                data: {
                  enabled_for_current_meeting: true,
                  status: "stopping",
                  fps: 30,
                },
              },
            }),
        );
        await page.getByTestId("streaming-stop-button").click();

        await expectButtons(page, ALL_DISABLED);
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.stopping",
        );
      });

      test("reload status after stopping", async ({ page }) => {
        await page.route(
          "**/api/v1/rooms/abc-def-123/streaming/stop",
          (route) =>
            route.fulfill({
              json: {
                data: {
                  enabled_for_current_meeting: true,
                  status: "stopping",
                  fps: 30,
                },
              },
            }),
        );
        await page.getByTestId("streaming-stop-button").click();
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.stopping",
        );

        await mockStatus(page, { status: "stopped" });
        const statusRequest = page.waitForRequest(STATUS_URL);
        await page.getByTestId("streaming-reload-button").click();
        await statusRequest;

        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.stopped",
        );
        await expectButtons(page, { ...ALL_DISABLED, start: true });
      });
    });

    test.describe("paused streaming", () => {
      test.beforeEach(async ({ page }) => {
        await mockStatus(page, { status: "paused", fps: 30 });
        await page.getByTestId("streaming-reload-button").click();
        await expectButtons(page, {
          ...ALL_DISABLED,
          stop: true,
          resume: true,
        });
      });

      test("resume streaming", async ({ page }) => {
        await page.route(
          "**/api/v1/rooms/abc-def-123/streaming/resume",
          (route) =>
            route.fulfill({
              json: {
                data: {
                  enabled_for_current_meeting: true,
                  status: "resuming",
                  fps: 30,
                },
              },
            }),
        );
        await page.getByTestId("streaming-resume-button").click();

        await expectButtons(page, { ...ALL_DISABLED, stop: true });
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.resuming",
        );
      });

      test("reload status after resuming", async ({ page }) => {
        await page.route(
          "**/api/v1/rooms/abc-def-123/streaming/resume",
          (route) =>
            route.fulfill({
              json: {
                data: {
                  enabled_for_current_meeting: true,
                  status: "resuming",
                  fps: 30,
                },
              },
            }),
        );
        await page.getByTestId("streaming-resume-button").click();
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.resuming",
        );

        await mockStatus(page, { status: "running", fps: 30 });
        const statusRequest = page.waitForRequest(STATUS_URL);
        await page.getByTestId("streaming-reload-button").click();
        await statusRequest;

        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.running",
        );
        await expectButtons(page, { ...ALL_DISABLED, stop: true, pause: true });
      });
    });
  });

  test.describe("permissions", () => {
    test.beforeEach(async ({ page }) => {
      await mockStatus(page, { status: "running", fps: 30 });
    });

    test("co-owner sees buttons and status", async ({ page }) => {
      await mockRoom(page, (room) => {
        room.owner = { id: 2, name: "Max Doe" };
        room.is_member = true;
        room.is_co_owner = true;
      });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-start-button")).toBeVisible();
      await expect(page.getByTestId("streaming-stop-button")).toBeVisible();
      await expect(page.getByTestId("streaming-pause-button")).toBeVisible();
      await expect(page.getByTestId("streaming-resume-button")).toBeVisible();
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.running",
      );
    });

    test("rooms.viewAll sees the status only", async ({
      page,
      currentUser,
    }) => {
      currentUser.data.permissions = ["rooms.viewAll"];
      await mockRoom(page, (room) => {
        room.owner = { id: 2, name: "Max Doe" };
        room.current_user.permissions = ["rooms.viewAll"];
      });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.running",
      );
      await expect(page.getByTestId("streaming-start-button")).toBeHidden();
      await expect(page.getByTestId("streaming-stop-button")).toBeHidden();
      await expect(page.getByTestId("streaming-pause-button")).toBeHidden();
      await expect(page.getByTestId("streaming-resume-button")).toBeHidden();
    });

    test("rooms.manage sees buttons and status", async ({
      page,
      currentUser,
    }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUser.data.permissions = permissions;
      await mockRoom(page, (room) => {
        room.owner = { id: 2, name: "Max Doe" };
        room.current_user.permissions = permissions;
      });
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-start-button")).toBeVisible();
      await expect(page.getByTestId("streaming-stop-button")).toBeVisible();
      await expect(page.getByTestId("streaming-pause-button")).toBeVisible();
      await expect(page.getByTestId("streaming-resume-button")).toBeVisible();
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.running",
      );
    });
  });

  test("auto reloading", async ({ page, config }) => {
    config.data.streaming.refresh_interval = 30;
    await mockStatus(page, { status: "queued", fps: 30 });

    await page.clock.install();
    const firstRequest = page.waitForRequest(STATUS_URL);
    await page.goto(ROOM_PATH);
    await page.locator("#tab-streaming").click();
    await firstRequest;
    await expect(page.getByTestId("streaming-status")).toContainText(
      "rooms.streaming.queued",
    );

    await mockStatus(page, { status: "running", fps: 30 });
    const secondRequest = page.waitForRequest(STATUS_URL);
    await page.clock.runFor(30000);
    await secondRequest;

    await expect(page.getByTestId("streaming-status")).toContainText(
      "rooms.streaming.running",
    );
  });

  test.describe("error handling", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROOM_PATH);
      await page.locator("#tab-streaming").click();
      await expectButtons(page, { ...ALL_DISABLED, start: true });
    });

    test("general error on reload", async ({ page }) => {
      await page.route(STATUS_URL, (route) =>
        route.fulfill({
          status: 500,
          json: { message: "Internal Server Error" },
        }),
      );
      await page.getByTestId("streaming-reload-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("general error on start streaming", async ({ page }) => {
      await page.route("**/api/v1/rooms/abc-def-123/streaming/start", (route) =>
        route.fulfill({
          status: 500,
          json: { message: "Internal Server Error" },
        }),
      );
      await page.getByTestId("streaming-start-button").click();

      await expectToastAndClose(page, SERVER_ERROR_TOAST);
    });

    test("streaming not enabled for current meeting", async ({ page }) => {
      await page.route("**/api/v1/rooms/abc-def-123/streaming/start", (route) =>
        route.fulfill({
          status: 412,
          json: {
            message: "Streaming is not enabled for the current meeting.",
          },
        }),
      );
      await mockStatus(page, { enabled_for_current_meeting: false });
      const statusRequest = page.waitForRequest(STATUS_URL);
      await page.getByTestId("streaming-start-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Streaming is not enabled for the current meeting."}',
        'app.flash.server_error.error_code_{"statusCode":412}',
      ]);

      // Status is reloaded
      await statusRequest;
      await expectButtons(page, ALL_DISABLED);
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.not_enabled_for_running_meeting",
      );
    });

    test("meeting not running", async ({ page }) => {
      await page.route("**/api/v1/rooms/abc-def-123/streaming/start", (route) =>
        route.fulfill({
          status: 460,
          json: { message: "The meeting is not running." },
        }),
      );
      await mockRoom(page, (room) => {
        room.last_meeting = ENDED_MEETING;
      });
      const roomRequest = page.waitForRequest(
        (request) =>
          request.method() === "GET" &&
          new URL(request.url()).pathname === "/api/v1/rooms/abc-def-123",
      );
      await page.getByTestId("streaming-start-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"The meeting is not running."}',
        'app.flash.server_error.error_code_{"statusCode":460}',
      ]);

      // Room is reloaded
      await roomRequest;
      await expectButtons(page, ALL_DISABLED);
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.no_running_meeting",
      );
    });

    test("room not found on reload", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      await page.route(STATUS_URL, (route) =>
        route.fulfill({
          status: 404,
          json: {
            message: "model_not_found",
            model: "room",
            ids: ["abc-def-123"],
          },
        }),
      );
      await page.getByTestId("streaming-reload-button").click();

      // Redirect to the room index page and error message is shown
      await expect(page).toHaveURL(/\/rooms$/);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });
});
