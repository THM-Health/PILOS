import {
  unauthorized,
  validationErrors,
  serverError,
  forbidden,
  modelNotFound,
} from "../support/utils.js";
import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as participantNameCheckTest } from "../support/fixtures/participantNameCheck.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import {
  setValidRememberedParticipantName,
  expectAuthToken,
  expectNoAuthToken,
} from "../support/room.js";

const test = mergeTests(roomControllerTest, participantNameCheckTest);

test.beforeEach(async ({ page }) => {
  await interceptRoomFilesRequest(page);
});

test.describe("logged in user", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ roomResponse }) => {
    roomResponse.data.owner = { id: 2, name: "Max Doe" };
    roomResponse.data.description = "<p>Test</p>";
    roomResponse.data.allow_membership = true;
  });

  test("shows the access overlay", async ({ page, roomResponse }) => {
    roomResponse.data.authenticated = false;
    await page.goto("/rooms/abc-def-123");

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Max Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByTestId("room-login-as-user-button"),
    ).toHaveCount(0);
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByTestId("participant-name-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");
  });

  test("login with access code", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    roomResponse.data.authenticated = false;
    await page.goto("/rooms/abc-def-123");

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Max Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByTestId("room-login-as-user-button"),
    ).toHaveCount(0);
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByTestId("participant-name-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");

    await page.locator("#access-code").fill("123456789");

    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 0 } },
      hold: true,
    });
    roomResponse.data.authenticated = true;

    await page.getByTestId("room-login-button").click();

    // Check loading
    await expect(page.locator("#access-code")).toBeDisabled();
    await expect(page.getByTestId("reload-room-button")).toBeDisabled();
    await expect(page.getByTestId("room-login-button")).toBeDisabled();
    await postRoomAuthRequestsAfterChange.waitForRequest();
    postRoomAuthApiMock.release();

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest(2));

    await expect(page.locator("#tab-description")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByText("Meeting One")).toBeVisible();
    await expect(page.getByText("Max Doe")).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("123456789");
  });

  test("reload with access code in sessionStorage", async ({
    page,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    await page.addInitScript(() =>
      window.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789"),
    );

    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest());

    await expect(page.locator("#tab-description")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByText("Meeting One")).toBeVisible();
    await expect(page.getByText("Max Doe")).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);

    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
  });

  test("reload with access code in hash", async ({
    page,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    await page.goto("/rooms/abc-def-123#accessCode=123456789");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest());

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("123456789");
    // The access code is removed from the hash
    await expect(page).toHaveURL((url) => !url.href.includes("#accessCode"));

    await expect(page.locator("#tab-description")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByText("Meeting One")).toBeVisible();
    await expect(page.getByText("Max Doe")).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test("login with access code after reload without stored access code", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    roomResponse.data.authenticated = false;
    await page.goto("/rooms/abc-def-123");

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await page.locator("#access-code").fill("123456789");

    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 200,
      json: { data: { id: "roomAuthToken", type: 0 } },
    });
    roomResponse.data.authenticated = true;

    await page.getByTestId("room-login-button").click();

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest(2));

    await expect(page.locator("#tab-description")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByText("Meeting One")).toBeVisible();
    await expect(page.getByText("Max Doe")).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test("invalid access code when reloading the room", async ({
    page,
    roomResponse,
    getRoomApiMock,
  }) => {
    await page.addInitScript(() =>
      window.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789"),
    );
    await page.goto("/rooms/abc-def-123");
    await expect(page.locator("#tab-description")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByText("Meeting One")).toBeVisible();
    await expect(page.getByText("Max Doe")).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);

    // The request with the room auth token is rejected, the room is reloaded without it
    const getRoomRequestsAfterChange1 = getRoomApiMock.respondWith(
      unauthorized("invalid_auth_token", { hold: true }),
    );
    await page.getByTestId("reload-room-button").click();
    await getRoomRequestsAfterChange1.waitForRequest();

    roomResponse.data.authenticated = false;
    const getRoomRequestsAfterChange2 = getRoomApiMock.respondWith({
      json: roomResponse,
    });
    getRoomApiMock.release();

    expectAuthToken(await getRoomRequestsAfterChange1.waitForRequest());
    expectNoAuthToken(await getRoomRequestsAfterChange2.waitForRequest());

    await expectToastAndClose(page, "rooms.flash.access_code_invalid");
    await expect(
      page.getByText("rooms.flash.access_code_invalid"),
    ).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("access code not needed anymore", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    roomResponse.data.authenticated = false;
    await page.goto("/rooms/abc-def-123");

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await page.locator("#access-code").fill("123456789");

    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 204,
    });

    roomResponse.data.authenticated = true;
    roomResponse.data.is_member = true;

    await page.getByTestId("room-login-button").click();

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectNoAuthToken(await getRoomApiMock.waitForRequest(2));

    await expect(page.locator("#tab-description")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByText("Meeting One")).toBeVisible();
    await expect(page.getByText("Max Doe")).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    await expect(page.getByTestId("room-end-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test("legacy access code", async ({
    page,
    roomResponse,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    roomResponse.data.authenticated = false;
    roomResponse.data.legacy_code = true;
    await page.goto("/rooms/abc-def-123");

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Max Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByTestId("room-login-as-user-button"),
    ).toHaveCount(0);
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByTestId("participant-name-field"),
    ).toHaveCount(0);
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");

    await page.locator("#access-code").fill("012abc");

    roomResponse.data.authenticated = true;
    roomResponse.data.legacy_code = false;

    await page.getByTestId("room-login-button").click();

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        access_code: "012abc",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest(2));

    await expect(page.locator("#tab-description")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByText("Meeting One")).toBeVisible();
    await expect(page.getByText("Max Doe")).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-favorites-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test.describe("auth errors", () => {
    test.beforeEach(async ({ page, roomResponse }) => {
      roomResponse.data.authenticated = false;
      await page.goto("/rooms/abc-def-123");
      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page.getByTestId("room-access-overlay").getByText("Meeting One"),
      ).toBeVisible();
      await expect(
        page.getByTestId("room-access-overlay").getByText("Max Doe"),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByTestId("room-login-as-user-button"),
      ).toHaveCount(0);
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByTestId("participant-name-field"),
      ).toHaveCount(0);
      await expect(page.getByTestId("access-code-field")).toBeVisible();
      await expect(
        page.getByTestId("access-code-field").getByText("rooms.access_code"),
      ).toBeVisible();
      await expect(page.locator("#access-code")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("");
    });

    test("validation error", async ({ page, postRoomAuthApiMock }) => {
      const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
        validationErrors(
          { access_code: ["The Access code field is required."] },
          "The Access code field is required.",
        ),
      );

      await page.getByTestId("room-login-button").click();
      await postRoomAuthRequestsAfterChange.waitForRequest();

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe(null);
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByText("The Access code field is required."),
      ).toBeVisible();
    });

    test("invalid access code", async ({
      page,
      getRoomApiMock,
      postRoomAuthApiMock,
    }) => {
      const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
        unauthorized("invalid_code"),
      );

      await page.locator("#access-code").fill("987654321");
      await page.getByTestId("room-login-button").click();

      await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
        json: {
          access_code: "987654321",
          type: 0,
        },
      });
      await getRoomApiMock.waitForRequest(2);

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe(null);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("987-654-321");
    });

    test("invalid access code in sessionStorage", async ({
      page,
      getRoomApiMock,
      postRoomAuthApiMock,
    }) => {
      const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
        unauthorized("invalid_code"),
      );

      await page.addInitScript(() =>
        window.sessionStorage.setItem(
          "roomAccessCode_abc-def-123",
          "987654321",
        ),
      );

      await page.goto("/rooms/abc-def-123");

      await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
        json: {
          access_code: "987654321",
          type: 0,
        },
      });
      await getRoomApiMock.waitForRequest(2);

      // The invalid access code in the session storage is cleared
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe(null);
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("987-654-321");
    });

    test("rate limit", async ({ page, postRoomAuthApiMock }) => {
      const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
        status: 429,
        json: { limit: "room_auth", retry_after: 5 },
      });

      // Take control of the time to check the countdown
      await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
      await page.goto("/rooms/abc-def-123");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page.getByTestId("room-access-overlay").getByText("Meeting One"),
      ).toBeVisible();
      await expect(
        page.getByTestId("room-access-overlay").getByText("Max Doe"),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByTestId("room-login-as-user-button"),
      ).toHaveCount(0);
      await expect(
        page
          .getByTestId("room-access-overlay")
          .getByTestId("participant-name-field"),
      ).toHaveCount(0);
      await expect(page.getByTestId("access-code-field")).toBeVisible();
      await expect(
        page.getByTestId("access-code-field").getByText("rooms.access_code"),
      ).toBeVisible();
      await expect(page.locator("#access-code")).toBeVisible();
      await expect(page.locator("#access-code")).toHaveValue("");

      await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));

      await page.locator("#access-code").fill("987654321");
      await page.getByTestId("room-login-button").click();

      await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
        json: {
          access_code: "987654321",
          type: 0,
        },
      });
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe(null);

      // Check if input and buttons are disabled
      await expect(page.locator("#access-code")).toBeDisabled();
      await expect(page.getByTestId("room-login-button")).toBeDisabled();
      await expect(page.getByTestId("reload-room-button")).toBeDisabled();

      // Check countdown
      for (let i = 5; i > 0; i--) {
        await expect(
          page.getByText(`rooms.auth_throttled_{"count":${i},"n":${i}}`),
        ).toBeVisible();
        await page.clock.runFor(1000);
      }

      // The toast animations need the time to run again
      await page.clock.resume();
      await expectToastAndClose(page, "app.flash.too_many_requests");

      // Check if input and buttons are enabled again
      await expect(page.locator("#access-code")).toBeEnabled();
      await expect(page.getByTestId("room-login-button")).toBeEnabled();
      await expect(page.getByTestId("reload-room-button")).toBeEnabled();
    });

    test("server error", async ({ page, postRoomAuthApiMock }) => {
      const postRoomAuthRequestsAfterChange =
        postRoomAuthApiMock.respondWith(serverError());

      await page.getByTestId("room-login-button").click();
      await postRoomAuthRequestsAfterChange.waitForRequest();

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe(null);
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that access overlay is still shown and not disabled
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toBeEnabled();
      await expect(page.getByTestId("room-login-button")).toBeEnabled();
    });

    test("guests not allowed", async ({ page, postRoomAuthApiMock }) => {
      const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
        forbidden("guests_not_allowed"),
      );

      await page.getByTestId("room-login-button").click();
      await postRoomAuthRequestsAfterChange.waitForRequest();

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe(null);
      await expect(
        page.getByText("rooms.only_used_by_authenticated_users"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    });

    test("room not found", async ({ page, postRoomAuthApiMock }) => {
      await interceptRoomIndexRequests(page);
      const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
        modelNotFound("room", ["abc-def-123"]),
      );

      await page.getByTestId("room-login-button").click();
      await postRoomAuthRequestsAfterChange.waitForRequest();

      // Check that redirect to room index page worked
      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/rooms") &&
          !url.pathname.includes("/rooms/abc-def-123"),
      );
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });

  test.describe("room request errors", () => {
    test.beforeEach(async ({ page, roomResponse }) => {
      roomResponse.data.authenticated = false;
      await page.goto("/rooms/abc-def-123");
      await expect(page).toHaveTitle("Meeting One - PILOS Test");
      await page.locator("#access-code").fill("123456789");
    });

    test("invalid auth token after login", async ({
      page,
      postRoomAuthApiMock,
      roomResponse,
      getRoomApiMock,
    }) => {
      const getRoomRequestsAfterChange1 = getRoomApiMock.respondWith(
        unauthorized("invalid_auth_token", { hold: true }),
      );

      await page.getByTestId("room-login-button").click();

      await expect(postRoomAuthApiMock).toHaveReceivedRequest({
        json: {
          access_code: "123456789",
          type: 0,
        },
      });
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe("123456789");

      await getRoomRequestsAfterChange1.waitForRequest();
      // The room is reloaded without the auth token
      const getRoomRequestsAfterChange2 = getRoomApiMock.respondWith({
        json: roomResponse,
      });
      getRoomApiMock.release();

      expectAuthToken(await getRoomRequestsAfterChange1.waitForRequest());
      expectNoAuthToken(await getRoomRequestsAfterChange2.waitForRequest());

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe("123456789");
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    });

    test("server error after login", async ({
      page,
      postRoomAuthApiMock,
      getRoomApiMock,
    }) => {
      const getRoomRequestsAfterChange =
        getRoomApiMock.respondWith(serverError());

      await page.getByTestId("room-login-button").click();

      await expect(postRoomAuthApiMock).toHaveReceivedRequest({
        json: {
          access_code: "123456789",
          type: 0,
        },
      });
      expectAuthToken(await getRoomRequestsAfterChange.waitForRequest());
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe("123456789");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that access code overlay is still shown and not disabled
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(page.locator("#access-code")).toBeEnabled();
      await expect(page.getByTestId("room-login-button")).toBeEnabled();
    });
  });

  test.describe("reload room with access code", () => {
    test.beforeEach(async ({ page, roomResponse, getRoomApiMock }) => {
      // Login with the access code, the room is authenticated afterwards
      roomResponse.data.authenticated = false;
      await page.goto("/rooms/abc-def-123");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await page.locator("#access-code").fill("123456789");

      roomResponse.data.authenticated = true;
      await page.getByTestId("room-login-button").click();

      await getRoomApiMock.waitForRequest(2);
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe("123456789");
      await expect(page.getByTestId("room-access-overlay")).toBeHidden();
      await expect(page.getByTestId("reload-room-button")).toBeEnabled();
    });

    test("invalid auth token", async ({
      page,
      roomResponse,
      getRoomApiMock,
    }) => {
      const getRoomRequestsAfterChange1 = getRoomApiMock.respondWith(
        unauthorized("invalid_auth_token", { hold: true }),
      );
      await page.getByTestId("reload-room-button").click();
      await getRoomRequestsAfterChange1.waitForRequest();

      roomResponse.data.authenticated = false;
      const getRoomRequestsAfterChange2 = getRoomApiMock.respondWith({
        json: roomResponse,
      });
      getRoomApiMock.release();

      // The first request has the access code, the second request (reload room) not
      expectAuthToken(await getRoomRequestsAfterChange1.waitForRequest());
      expectNoAuthToken(await getRoomRequestsAfterChange2.waitForRequest());

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe("123456789");
      await expectToastAndClose(page, "rooms.flash.access_code_invalid");
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toBeVisible();
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    });

    test("access code required again", async ({
      page,
      roomResponse,
      getRoomApiMock,
    }) => {
      roomResponse.data.authenticated = false;
      await page.getByTestId("reload-room-button").click();

      expectAuthToken(await getRoomApiMock.waitForRequest(3));

      // The saved access code is reset
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
          ),
        )
        .toBe(null);
      await expectToastAndClose(page, "rooms.require_access_code");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();
      await expect(
        page.getByText("rooms.flash.access_code_invalid"),
      ).toHaveCount(0);
      await expect(page.locator("#access-code")).toHaveValue("");
    });
  });

  test("member with saved access code needs the code again after reload", async ({
    page,
    roomResponse,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    await page.addInitScript(() =>
      window.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789"),
    );
    roomResponse.data.is_member = true;

    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest());
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("123456789");

    await expect(page.getByTestId("room-end-membership-button")).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );

    // A later reload requires the access code and resets the saved access parameters
    roomResponse.data.authenticated = false;
    roomResponse.data.is_member = false;
    await page.getByTestId("reload-room-button").click();

    expectAuthToken(await getRoomApiMock.waitForRequest(2));
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe(null);
    await expectToastAndClose(page, "rooms.require_access_code");
    await expect(page.getByText("rooms.flash.access_code_invalid")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");
  });
});

test.describe("guest", () => {
  test.beforeEach(async ({ roomResponse }) => {
    roomResponse.data.description = "<p>Test</p>";
    roomResponse.data.current_user = null;
    roomResponse.data.allow_membership = true;
    roomResponse.data.authenticated = false;
  });

  test("shows the access overlay", async ({ page, roomResponse }) => {
    roomResponse.data.description = null;
    await page.goto("/rooms/abc-def-123");

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("John Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toHaveText(
      "auth.offer_login",
    );
    await expect(page.getByTestId("room-login-as-user-button")).toHaveAttribute(
      "href",
      "/login?redirect=/rooms/abc-def-123",
    );
    await expect(page.getByTestId("participant-name-field")).toBeVisible();
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.first_and_lastname"),
    ).toBeVisible();
    await expect(page.locator("#participant-name")).toBeVisible();
    await expect(page.locator("#participant-name")).toHaveValue("");
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.remember_participant_name"),
    ).toBeVisible();
    await expect(page.locator("#remember-participant-name")).not.toBeChecked();
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");
  });

  test("login with name and access code", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postParticipantNameCheckApiMock,
    postRoomAuthApiMock,
  }) => {
    await page.goto("/rooms/abc-def-123");

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("John Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toHaveText(
      "auth.offer_login",
    );
    await expect(page.getByTestId("room-login-as-user-button")).toHaveAttribute(
      "href",
      "/login?redirect=/rooms/abc-def-123",
    );
    await expect(page.getByTestId("participant-name-field")).toBeVisible();
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.first_and_lastname"),
    ).toBeVisible();
    await expect(page.locator("#participant-name")).toBeVisible();
    await expect(page.locator("#participant-name")).toHaveValue("");
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.remember_participant_name"),
    ).toBeVisible();
    await expect(page.locator("#remember-participant-name")).not.toBeChecked();
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");

    await page.locator("#participant-name").fill("Laura Rivera");
    await page.locator("#access-code").fill("123456789");

    const postParticipantNameCheckRequestsAfterChange =
      postParticipantNameCheckApiMock.respondWith({ status: 204, hold: true });
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 0 } },
      hold: true,
    });
    roomResponse.data.authenticated = true;

    await page.getByTestId("room-login-button").click();

    // Check loading while participant name is validated
    await expect(page.locator("#participant-name")).toBeDisabled();
    await expect(page.locator("#remember-participant-name")).toBeDisabled();
    await expect(page.locator("#access-code")).toBeDisabled();
    await expect(page.getByTestId("room-login-button")).toBeDisabled();
    await postParticipantNameCheckRequestsAfterChange.waitForRequest();
    postParticipantNameCheckApiMock.release();

    await expect(
      postParticipantNameCheckRequestsAfterChange,
    ).toHaveReceivedRequest({
      json: {
        name: "Laura Rivera",
      },
    });

    // Check loading while room access code is validated
    await postRoomAuthRequestsAfterChange.waitForRequest();
    await expect(page.locator("#participant-name")).toBeDisabled();
    await expect(page.locator("#remember-participant-name")).toBeDisabled();
    await expect(page.locator("#access-code")).toBeDisabled();
    await expect(page.getByTestId("reload-room-button")).toBeDisabled();
    await expect(page.getByTestId("room-login-button")).toBeDisabled();
    postRoomAuthApiMock.release();

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest(2));

    await expect(page.locator("#tab-description")).toBeVisible();
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
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("123456789");
    // The name was not remembered
    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
      )
      .toBe(null);
  });

  test("reload with access code in hash", async ({ page }) => {
    await page.goto("/rooms/abc-def-123#accessCode=123456789");

    // The access code is prefilled
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("John Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toHaveText(
      "auth.offer_login",
    );
    await expect(page.getByTestId("room-login-as-user-button")).toHaveAttribute(
      "href",
      "/login?redirect=/rooms/abc-def-123",
    );
    await expect(page.getByTestId("participant-name-field")).toBeVisible();
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.first_and_lastname"),
    ).toBeVisible();
    await expect(page.locator("#participant-name")).toBeVisible();
    await expect(page.locator("#participant-name")).toHaveValue("");
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.remember_participant_name"),
    ).toBeVisible();
    await expect(page.locator("#remember-participant-name")).not.toBeChecked();
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("123-456-789");

    await expect(page.locator("#access-code")).toHaveValue("123-456-789");
  });

  test("reload with access code in sessionStorage", async ({ page }) => {
    await page.addInitScript(() =>
      window.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789"),
    );
    await page.goto("/rooms/abc-def-123");

    // The access code is prefilled
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("John Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toHaveText(
      "auth.offer_login",
    );
    await expect(page.getByTestId("room-login-as-user-button")).toHaveAttribute(
      "href",
      "/login?redirect=/rooms/abc-def-123",
    );
    await expect(page.getByTestId("participant-name-field")).toBeVisible();
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.first_and_lastname"),
    ).toBeVisible();
    await expect(page.locator("#participant-name")).toBeVisible();
    await expect(page.locator("#participant-name")).toHaveValue("");
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.remember_participant_name"),
    ).toBeVisible();
    await expect(page.locator("#remember-participant-name")).not.toBeChecked();
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("123-456-789");

    await expect(page.locator("#access-code")).toHaveValue("123-456-789");
  });

  test("reload with remembered guest name", async ({
    page,
    postParticipantNameCheckApiMock,
  }) => {
    const postParticipantNameCheckRequestsAfterChange =
      postParticipantNameCheckApiMock.respondWith({ status: 204, hold: true });
    await page.addInitScript(() =>
      window.localStorage.setItem("pilos_guest_name", "Laura Rivera"),
    );

    await page.goto("/rooms/abc-def-123");

    // Check loading
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    await postParticipantNameCheckRequestsAfterChange.waitForRequest();
    postParticipantNameCheckApiMock.release();

    // The guest name is prefilled
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("Meeting One"),
    ).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").getByText("John Doe"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toBeVisible();
    await expect(page.getByTestId("room-login-as-user-button")).toHaveText(
      "auth.offer_login",
    );
    await expect(page.getByTestId("room-login-as-user-button")).toHaveAttribute(
      "href",
      "/login?redirect=/rooms/abc-def-123",
    );
    await expect(page.getByTestId("participant-name-field")).toBeVisible();
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.first_and_lastname"),
    ).toBeVisible();
    await expect(page.locator("#participant-name")).toBeVisible();
    await expect(page.locator("#participant-name")).toHaveValue("Laura Rivera");
    await expect(
      page
        .getByTestId("participant-name-field")
        .getByText("rooms.remember_participant_name"),
    ).toBeVisible();
    await expect(page.locator("#remember-participant-name")).toBeChecked();
    await expect(page.getByTestId("access-code-field")).toBeVisible();
    await expect(
      page.getByTestId("access-code-field").getByText("rooms.access_code"),
    ).toBeVisible();
    await expect(page.locator("#access-code")).toBeVisible();
    await expect(page.locator("#access-code")).toHaveValue("");
  });

  test("reload with remembered guest name and access code in sessionStorage", async ({
    page,
    roomResponse,
    postRoomAuthApiMock,
    getRoomApiMock,
    postParticipantNameCheckApiMock,
  }) => {
    await setValidRememberedParticipantName(page, "Laura Rivera");
    await page.addInitScript(() =>
      window.sessionStorage.setItem("roomAccessCode_abc-def-123", "123456789"),
    );
    const postParticipantNameCheckRequestsAfterChange =
      postParticipantNameCheckApiMock.respondWith({ status: 204 });
    roomResponse.data.authenticated = true;

    await page.goto("/rooms/abc-def-123");

    await postParticipantNameCheckRequestsAfterChange.waitForRequest();
    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        access_code: "123456789",
        type: 0,
      },
    });
    expectAuthToken(await getRoomApiMock.waitForRequest());

    await expect(page.locator("#tab-description")).toBeVisible();
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
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of ["members", "tokens", "history", "settings"]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.description.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);

    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
  });

  test.describe("auth errors", () => {
    test("room not found", async ({
      page,
      postParticipantNameCheckApiMock,
      postRoomAuthApiMock,
    }) => {
      await page.goto("/rooms/abc-def-123");
      await expect(page.getByTestId("room-access-overlay")).toBeVisible();

      await page.locator("#participant-name").fill("Max Doe");

      const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
        modelNotFound("room", ["abc-def-123"]),
      );

      await page.getByTestId("room-login-button").click();

      await postParticipantNameCheckApiMock.waitForRequest();
      await postRoomAuthRequestsAfterChange.waitForRequest();

      // Check that redirect to 404 page worked
      await expect(page).toHaveURL(
        (url) =>
          url.pathname.includes("/404") &&
          !url.pathname.includes("/rooms/abc-def-123"),
      );
      await expect
        .poll(() =>
          page.evaluate(() => window.localStorage.getItem("pilos_guest_name")),
        )
        .toBe(null);
      await expectToastAndClose(page, [
        'app.flash.model_not_found.title_{"model":"app.model.room"}',
        'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
      ]);
    });
  });
});
