import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { test as userControllerTest } from "../support/fixtures/userController.js";
import { test as roomStreamingControllerTest } from "../support/fixtures/roomStreamingController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import { mockApiRequest, modelNotFound } from "../support/utils.js";

const test = mergeTests(
  roomControllerTest,
  roomFileControllerTest,
  roomTypeControllerTest,
  userControllerTest,
  roomStreamingControllerTest,
);
test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" });
test.use({ roomTypesFixtureName: "roomTypesWithSettings.json" });

test.use({ authenticated: true });

test.describe("Rooms view streaming", () => {
  test.beforeEach(async ({ configResponse, roomResponse }) => {
    configResponse.data.general.hide_disabled_features = true;
    configResponse.data.streaming.enabled = true;

    roomResponse.data.type.features.streaming.enabled = true;
    roomResponse.data.last_meeting = {
      start: "2023-08-21T08:18:28.000000Z",
      end: null,
    };
  });

  test.describe("buttons and status", () => {
    test("no running meeting, room was never started", async ({
      page,
      roomResponse,
    }) => {
      roomResponse.data.last_meeting = null;

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.no_running_meeting",
      );
      for (const button of ["start", "stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
    });

    test("no running meeting, meeting ended", async ({
      page,
      roomResponse,
    }) => {
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T08:20:00.000000Z",
      };

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.no_running_meeting",
      );
      for (const button of ["start", "stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
    });

    test("running meeting, streaming disabled", async ({
      page,
      roomStreamingStatusResponse,
    }) => {
      roomStreamingStatusResponse.data.enabled_for_current_meeting = false;

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.not_enabled_for_running_meeting",
      );
      for (const button of ["start", "stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
    });

    test("running meeting, streaming not started yet", async ({ page }) => {
      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-start-button")).toBeEnabled();
      for (const button of ["stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
      await expect(page.getByTestId("streaming-status")).toBeHidden();
    });

    for (const { status, enabledButtons } of [
      { status: "starting", enabledButtons: [] },
      { status: "running", enabledButtons: ["stop", "pause"] },
      { status: "paused", enabledButtons: ["stop", "resume"] },
      { status: "stopped", enabledButtons: ["start"] },
      { status: "failed", enabledButtons: ["start"] },
    ]) {
      test(`status ${status}`, async ({
        page,
        roomStreamingStatusResponse,
      }) => {
        Object.assign(roomStreamingStatusResponse.data, { status, fps: 30 });

        await page.goto("/rooms/abc-def-123");
        await page.locator("#tab-streaming").click();

        await expect(page.getByTestId("streaming-status")).toContainText(
          `rooms.streaming.${status}`,
        );
        for (const button of ["start", "stop", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeEnabled({ enabled: enabledButtons.includes(button) });
        }
      });
    }
  });

  test.describe("fps counter", () => {
    test("fps counter is shown", async ({
      page,
      configResponse,
      roomStreamingStatusResponse,
    }) => {
      configResponse.data.streaming.show_fps = true;
      Object.assign(roomStreamingStatusResponse.data, {
        enabled_for_current_meeting: false,
        fps: 30,
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-fps-counter")).toContainText(
        'rooms.streaming.fps_{"fps":30}',
      );
    });

    test("fps counter is hidden if disabled in the global config", async ({
      page,
      configResponse,
      roomStreamingStatusResponse,
    }) => {
      configResponse.data.streaming.show_fps = false;
      Object.assign(roomStreamingStatusResponse.data, {
        enabled_for_current_meeting: false,
        fps: 30,
      });

      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();

      await expect(page.getByTestId("streaming-status")).toBeVisible();
      await expect(page.getByTestId("streaming-fps-counter")).toBeHidden();
    });
  });

  test.describe("actions", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();
      await expect(page.getByTestId("streaming-start-button")).toBeEnabled();
      for (const button of ["stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
    });

    test("start streaming", async ({ page }) => {
      await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/start", {
        json: {
          data: {
            enabled_for_current_meeting: true,
            status: "queued",
            fps: null,
          },
        },
      });
      await page.getByTestId("streaming-start-button").click();

      await expect(page.getByTestId("streaming-stop-button")).toBeEnabled();
      for (const button of ["start", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.queued",
      );
    });

    test("start streaming fails", async ({ page }) => {
      await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/start", {
        json: {
          data: {
            enabled_for_current_meeting: true,
            status: "failed",
            fps: null,
          },
        },
      });
      await page.getByTestId("streaming-start-button").click();

      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.failed",
      );
      await expect(page.getByTestId("streaming-start-button")).toBeEnabled();
      for (const button of ["stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
    });

    test("reload status after starting", async ({
      page,
      roomStreamingStatusResponse,
    }) => {
      await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/start", {
        json: {
          data: {
            enabled_for_current_meeting: true,
            status: "queued",
            fps: null,
          },
        },
      });
      await page.getByTestId("streaming-start-button").click();
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.queued",
      );

      // queued -> starting
      roomStreamingStatusResponse.data.status = "starting";
      const startingRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/streaming/status",
      );
      await page.getByTestId("streaming-reload-button").click();
      await startingRequest;
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.starting",
      );
      for (const button of ["start", "stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }

      // starting -> running
      Object.assign(roomStreamingStatusResponse.data, {
        status: "running",
        fps: 30,
      });
      const runningRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/streaming/status",
      );
      await page.getByTestId("streaming-reload-button").click();
      await runningRequest;
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.running",
      );
      for (const button of ["start", "stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeEnabled({ enabled: ["stop", "pause"].includes(button) });
      }
    });

    test.describe("running streaming", () => {
      test.beforeEach(async ({ page, roomStreamingStatusResponse }) => {
        Object.assign(roomStreamingStatusResponse.data, {
          status: "running",
          fps: 30,
        });
        await page.getByTestId("streaming-reload-button").click();
        for (const button of ["start", "stop", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeEnabled({ enabled: ["stop", "pause"].includes(button) });
        }
      });

      test("pause streaming", async ({ page }) => {
        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/streaming/pause",
          {
            json: {
              data: {
                enabled_for_current_meeting: true,
                status: "pausing",
                fps: "30",
              },
            },
          },
        );
        await page.getByTestId("streaming-pause-button").click();

        await expect(page.getByTestId("streaming-stop-button")).toBeEnabled();
        for (const button of ["start", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeDisabled();
        }
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.pausing",
        );
      });

      test("stop streaming", async ({ page }) => {
        await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/stop", {
          json: {
            data: {
              enabled_for_current_meeting: true,
              status: "stopping",
              fps: 30,
            },
          },
        });
        await page.getByTestId("streaming-stop-button").click();

        for (const button of ["start", "stop", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeDisabled();
        }
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.stopping",
        );
      });

      test("reload status after stopping", async ({
        page,
        roomStreamingStatusResponse,
      }) => {
        await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/stop", {
          json: {
            data: {
              enabled_for_current_meeting: true,
              status: "stopping",
              fps: 30,
            },
          },
        });
        await page.getByTestId("streaming-stop-button").click();
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.stopping",
        );

        roomStreamingStatusResponse.data.status = "stopped";
        const statusRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/streaming/status",
        );
        await page.getByTestId("streaming-reload-button").click();
        await statusRequest;

        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.stopped",
        );
        await expect(page.getByTestId("streaming-start-button")).toBeEnabled();
        for (const button of ["stop", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeDisabled();
        }
      });
    });

    test.describe("paused streaming", () => {
      test.beforeEach(async ({ page, roomStreamingStatusResponse }) => {
        Object.assign(roomStreamingStatusResponse.data, {
          status: "paused",
          fps: 30,
        });
        await page.getByTestId("streaming-reload-button").click();
        for (const button of ["start", "stop", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeEnabled({ enabled: ["stop", "resume"].includes(button) });
        }
      });

      test("resume streaming", async ({ page }) => {
        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/streaming/resume",
          {
            json: {
              data: {
                enabled_for_current_meeting: true,
                status: "resuming",
                fps: 30,
              },
            },
          },
        );
        await page.getByTestId("streaming-resume-button").click();

        await expect(page.getByTestId("streaming-stop-button")).toBeEnabled();
        for (const button of ["start", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeDisabled();
        }
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.resuming",
        );
      });

      test("reload status after resuming", async ({
        page,
        roomStreamingStatusResponse,
      }) => {
        await mockApiRequest(
          page,
          "POST",
          "rooms/abc-def-123/streaming/resume",
          {
            json: {
              data: {
                enabled_for_current_meeting: true,
                status: "resuming",
                fps: 30,
              },
            },
          },
        );
        await page.getByTestId("streaming-resume-button").click();
        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.resuming",
        );

        Object.assign(roomStreamingStatusResponse.data, {
          status: "running",
          fps: 30,
        });
        const statusRequest = page.waitForRequest(
          "**/api/v1/rooms/abc-def-123/streaming/status",
        );
        await page.getByTestId("streaming-reload-button").click();
        await statusRequest;

        await expect(page.getByTestId("streaming-status")).toContainText(
          "rooms.streaming.running",
        );
        for (const button of ["start", "stop", "pause", "resume"]) {
          await expect(
            page.getByTestId(`streaming-${button}-button`),
          ).toBeEnabled({ enabled: ["stop", "pause"].includes(button) });
        }
      });
    });
  });

  test.describe("permissions", () => {
    test.beforeEach(async ({ roomStreamingStatusResponse }) => {
      Object.assign(roomStreamingStatusResponse.data, {
        status: "running",
        fps: 30,
      });
    });

    test("co-owner sees buttons and status", async ({ page, roomResponse }) => {
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.is_member = true;
      roomResponse.data.is_co_owner = true;

      await page.goto("/rooms/abc-def-123");
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
      currentUserResponse,
      roomResponse,
    }) => {
      currentUserResponse.data.permissions = ["rooms.viewAll"];
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = ["rooms.viewAll"];

      await page.goto("/rooms/abc-def-123");
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
      currentUserResponse,
      roomResponse,
    }) => {
      const permissions = ["rooms.create", "rooms.viewAll", "rooms.manage"];
      currentUserResponse.data.permissions = permissions;
      roomResponse.data.owner = { id: 2, name: "Max Doe" };
      roomResponse.data.current_user.permissions = permissions;

      await page.goto("/rooms/abc-def-123");
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

  test("auto reloading", async ({
    page,
    configResponse,
    roomStreamingStatusResponse,
  }) => {
    configResponse.data.streaming.refresh_interval = 30;
    Object.assign(roomStreamingStatusResponse.data, {
      status: "queued",
      fps: 30,
    });

    await page.clock.install();
    const firstRequest = page.waitForRequest(
      "**/api/v1/rooms/abc-def-123/streaming/status",
    );
    await page.goto("/rooms/abc-def-123");
    await page.locator("#tab-streaming").click();
    await firstRequest;
    await expect(page.getByTestId("streaming-status")).toContainText(
      "rooms.streaming.queued",
    );

    Object.assign(roomStreamingStatusResponse.data, {
      status: "running",
      fps: 30,
    });
    const secondRequest = page.waitForRequest(
      "**/api/v1/rooms/abc-def-123/streaming/status",
    );
    await page.clock.runFor(30000);
    await secondRequest;

    await expect(page.getByTestId("streaming-status")).toContainText(
      "rooms.streaming.running",
    );
  });

  test.describe("error handling", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/rooms/abc-def-123");
      await page.locator("#tab-streaming").click();
      await expect(page.getByTestId("streaming-start-button")).toBeEnabled();
      for (const button of ["stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
    });

    test("general error on reload", async ({ page }) => {
      await mockApiRequest(page, "GET", "rooms/abc-def-123/streaming/status", {
        status: 500,
        json: { message: "Internal Server Error" },
      });
      await page.getByTestId("streaming-reload-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Internal Server Error"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("general error on start streaming", async ({ page }) => {
      await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/start", {
        status: 500,
        json: { message: "Internal Server Error" },
      });
      await page.getByTestId("streaming-start-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Internal Server Error"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
    });

    test("streaming not enabled for current meeting", async ({
      page,
      roomStreamingStatusResponse,
    }) => {
      await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/start", {
        status: 412,
        json: {
          message: "Streaming is not enabled for the current meeting.",
        },
      });
      roomStreamingStatusResponse.data.enabled_for_current_meeting = false;
      const statusRequest = page.waitForRequest(
        "**/api/v1/rooms/abc-def-123/streaming/status",
      );
      await page.getByTestId("streaming-start-button").click();

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Streaming is not enabled for the current meeting."}',
        'app.flash.server_error.error_code_{"statusCode":412}',
      ]);

      // Status is reloaded
      await statusRequest;
      for (const button of ["start", "stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.not_enabled_for_running_meeting",
      );
    });

    test("meeting not running", async ({ page, roomResponse }) => {
      await mockApiRequest(page, "POST", "rooms/abc-def-123/streaming/start", {
        status: 460,
        json: { message: "The meeting is not running." },
      });
      roomResponse.data.last_meeting = {
        start: "2023-08-21T08:18:28.000000Z",
        end: "2023-08-21T08:20:00.000000Z",
      };
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
      for (const button of ["start", "stop", "pause", "resume"]) {
        await expect(
          page.getByTestId(`streaming-${button}-button`),
        ).toBeDisabled();
      }
      await expect(page.getByTestId("streaming-status")).toContainText(
        "rooms.streaming.no_running_meeting",
      );
    });

    test("room not found on reload", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      await mockApiRequest(
        page,
        "GET",
        "rooms/abc-def-123/streaming/status",
        modelNotFound("room", ["abc-def-123"]),
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
