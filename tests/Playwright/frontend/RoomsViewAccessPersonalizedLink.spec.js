import { test } from "../support/fixtures/roomsAccess.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { expectAuthToken, expectNoAuthToken } from "../support/room.js";
import { mockMethod, nthRequest } from "../support/utils.js";

test.beforeEach(async ({ page, roomAuth }) => {
  await interceptRoomFilesRequest(page);
  roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };
});

test.describe("guest with personalized link", () => {
  test.beforeEach(async ({ room }) => {
    room.data.username = "Laura Rivera";
    room.data.allow_membership = true;
    room.data.is_member = true;
    room.data.current_user = null;
  });

  test("shows loading spinner until the room auth request is answered", async ({
    page,
  }) => {
    const auth = await mockMethod(
      page,
      "POST",
      "**/api/v1/rooms/abc-def-123/auth*",
      {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 1 } },
        hold: true,
      },
    );

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    auth.release();

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-loading-spinner")).toBeHidden();
  });

  test("authenticates with the link from the hash and loads the room with the token", async ({
    page,
    roomAuth,
    roomRequests,
  }) => {
    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");
  });

  test("stores the link in the sessionStorage and removes it from the url", async ({
    page,
  }) => {
    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    await expect(page).toHaveURL(
      (url) => !url.href.includes("#personalizedLink"),
    );
  });

  test("shows the room as participant", async ({ page }) => {
    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of [
      "description",
      "members",
      "tokens",
      "history",
      "settings",
    ]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.files.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test("shows the room as moderator", async ({
    page,
    room,
    roomAuth,
    roomRequests,
  }) => {
    room.data.is_moderator = true;

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    await expect(page).toHaveURL(
      (url) => !url.href.includes("#personalizedLink"),
    );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of [
      "description",
      "members",
      "tokens",
      "history",
      "settings",
    ]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.files.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test("authenticates with the link from the legacy route", async ({
    page,
    roomAuth,
    roomRequests,
  }) => {
    await page.goto(
      "/rooms/abc-def-123/xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    // The link is neither visible as hash nor as path
    await expect(page).toHaveURL(
      (url) => !url.href.includes("#personalizedLink"),
    );

    await expect(page).toHaveURL(
      (url) =>
        !url.href.includes(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        ),
    );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of [
      "description",
      "members",
      "tokens",
      "history",
      "settings",
    ]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.files.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test("reuses the link from the sessionStorage after a reload", async ({
    page,
    roomAuth,
    roomRequests,
  }) => {
    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();

    await page.reload();

    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
    await expect(page.getByTestId("reload-room-button")).toBeVisible();
    await expect(page.getByTestId("room-join-membership-button")).toHaveCount(
      0,
    );
    await expect(page.getByTestId("room-end-membership-button")).toHaveCount(0);
    await expect(page.getByTestId("room-favorites-button")).toHaveCount(0);
    await expect(page.locator("#tab-files")).toBeVisible();
    await expect(page.locator("#tab-recordings")).toBeVisible();
    for (const tab of [
      "description",
      "members",
      "tokens",
      "history",
      "settings",
    ]) {
      await expect(page.locator(`#tab-${tab}`)).toHaveCount(0);
    }
    await expect(page.getByText("rooms.files.title")).toBeVisible();
    await expect(page.getByTestId("room-share-button")).toHaveCount(0);
  });

  test("reload button with an invalid link clears the link and shows an error", async ({
    page,
    roomAuth,
  }) => {
    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();

    roomAuth.status = 401;
    roomAuth.json = { message: "invalid_personalized_link" };
    const room = await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
      status: 401,
      json: { message: "invalid_auth_token" },
    });

    await page.getByTestId("reload-room-button").click();

    expectAuthToken(await nthRequest(room), "1");
    await nthRequest(roomAuth, 2);
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);

    await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
    await expect(
      page.getByText("rooms.invalid_personalized_link").first(),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("reload button with an invalid token clears the link and shows an error", async ({
    page,
    roomAuth,
  }) => {
    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    const room = await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
      status: 401,
      json: { message: "invalid_auth_token" },
    });
    roomAuth.status = 401;
    roomAuth.json = { message: "invalid_personalized_link" };

    await page.getByTestId("reload-room-button").click();

    expectAuthToken(await nthRequest(room), "1");
    await nthRequest(roomAuth, 2);
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);

    await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
    await expect(
      page.getByText("rooms.invalid_personalized_link").first(),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("reload button shows the guests only error if the room is no longer accessible", async ({
    page,
  }) => {
    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();
    await expect(
      page.getByText("rooms.index.room_component.never_started"),
    ).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    const room = await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
      status: 420,
      json: { message: "guests_only" },
    });

    await page.getByTestId("reload-room-button").click();

    await nthRequest(room);
    await expectToastAndClose(page, "app.flash.guests_only");
    await expect(page).toHaveURL((url) => !url.href.includes("/rooms"));
  });
});

test.describe("room auth request errors", () => {
  test("invalid personalized link (401) clears the link and shows an error", async ({
    page,
    roomAuth,
  }) => {
    roomAuth.status = 401;
    roomAuth.json = { message: "invalid_personalized_link" };

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);

    await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
    await expect(
      page.getByText("rooms.invalid_personalized_link").first(),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("validation error (422) clears the link and shows an error", async ({
    page,
    roomAuth,
  }) => {
    roomAuth.status = 422;
    roomAuth.json = {
      message: "The Access token field is required.",
      errors: {
        personalized_link_token: ["The Access token field is required."],
      },
    };

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);

    await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
    await expect(
      page.getByText("rooms.invalid_personalized_link").first(),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("guests only error (420) redirects away from the room", async ({
    page,
    roomAuth,
  }) => {
    roomAuth.status = 420;
    roomAuth.json = { message: "guests_only" };

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    await expectToastAndClose(page, "app.flash.guests_only");
    await expect(page).toHaveURL((url) => !url.href.includes("/rooms"));

    await expect(page).toHaveURL(
      (url) => !url.href.includes("rooms/abc-def-123"),
    );
  });

  test("room not found (404) redirects to the 404 page", async ({
    page,
    roomAuth,
  }) => {
    roomAuth.status = 404;
    roomAuth.json = {
      message: "model_not_found",
      model: "room",
      ids: ["abc-def-123"],
    };

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    await expect(page).toHaveURL((url) => url.href.includes("/404"));

    await expect(page).toHaveURL(
      (url) => !url.href.includes("rooms/abc-def-123"),
    );

    await expectToastAndClose(page, [
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });

  test.describe("server error (500)", () => {
    test.beforeEach(async ({ page, room, roomAuth }) => {
      room.data.username = "Laura Rivera";
      room.data.allow_membership = true;
      room.data.is_member = true;
      room.data.current_user = null;
      roomAuth.status = 500;
      roomAuth.json = { message: "Test" };

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
      expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
        personalized_link_token:
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
    });

    test("shows an error and a reload button", async ({ page }) => {
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("reload-button")).toBeVisible();
      await expect(page).toHaveURL(
        (url) => !url.href.includes("#personalizedLink"),
      );
    });

    test("keeps the error after a reload and reuses the link from the sessionStorage", async ({
      page,
      roomAuth,
    }) => {
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("reload-button")).toBeVisible();

      await page.reload();

      expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
        personalized_link_token:
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });

      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("reload-button")).toBeVisible();
    });

    test("reload button sends the auth request again and loads the room", async ({
      page,
      roomAuth,
      roomRequests,
    }) => {
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("reload-button")).toBeVisible();

      roomAuth.status = 201;
      roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };

      await page.getByTestId("reload-button").click();

      expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
        personalized_link_token:
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });

      expectAuthToken(await nthRequest(roomRequests), "1");
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );

      await expect(page.getByText("Meeting One").first()).toBeVisible();
      await expect(page.getByText("John Doe").first()).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();
    });
  });
});

test.describe("room request errors", () => {
  test.beforeEach(async ({ room }) => {
    room.data.username = "Laura Rivera";
    room.data.allow_membership = true;
    room.data.is_member = true;
    room.data.current_user = null;
  });

  test("invalid auth token (401) requests a new auth token, an invalid link shows an error", async ({
    page,
    roomAuth,
  }) => {
    const room = await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
      status: 401,
      json: { message: "invalid_auth_token" },
      hold: true,
    });

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    // The second auth request (after the invalid token) is held, then answered with an invalid link
    const secondAuth = await mockMethod(
      page,
      "POST",
      "**/api/v1/rooms/abc-def-123/auth*",
      {
        status: 401,
        json: { message: "invalid_personalized_link" },
        hold: true,
      },
    );
    room.release();

    expectAuthToken(await nthRequest(room), "1");
    expect((await nthRequest(secondAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
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

    secondAuth.release();

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);

    await expectToastAndClose(page, "rooms.flash.personalized_link_invalid");
    await expect(
      page.getByText("rooms.invalid_personalized_link").first(),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("guests only error (420) redirects away from the room", async ({
    page,
    roomAuth,
  }) => {
    const room = await mockMethod(page, "GET", "**/api/v1/rooms/abc-def-123*", {
      status: 420,
      json: { message: "guests_only" },
    });

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(room), "1");
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );

    await expectToastAndClose(page, "app.flash.guests_only");
    await expect(page).toHaveURL((url) => !url.href.includes("/rooms"));

    await expect(page).toHaveURL(
      (url) => !url.href.includes("rooms/abc-def-123"),
    );
  });

  test.describe("server error (500)", () => {
    test.beforeEach(async ({ page, roomAuth }) => {
      const room = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123*",
        { status: 500, json: { message: "Test" } },
      );

      await page.goto(
        "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      );
      expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      });

      expectAuthToken(await nthRequest(room), "1");
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );
    });

    test("shows an error and a reload button", async ({ page }) => {
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("reload-button")).toBeVisible();
    });

    test("reload button requests the room again with the same auth token", async ({
      page,
      room,
    }) => {
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);
      await expect(page.getByTestId("reload-button")).toBeVisible();

      const differentAuth = await mockMethod(
        page,
        "POST",
        "**/api/v1/rooms/abc-def-123/auth*",
        { status: 201, json: { data: { id: "differentToken", type: 1 } } },
      );
      const newRoom = await mockMethod(
        page,
        "GET",
        "**/api/v1/rooms/abc-def-123*",
        { json: room },
      );

      await page.getByTestId("reload-button").click();

      expectAuthToken(await nthRequest(newRoom), "1");
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
          ),
        )
        .toBe(
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        );

      await expect(page.getByText("Meeting One").first()).toBeVisible();
      await expect(page.getByText("John Doe").first()).toBeVisible();
      await expect(
        page.getByText("rooms.index.room_component.never_started"),
      ).toBeVisible();

      // The auth request was not sent again
      expect(differentAuth.requests).toHaveLength(0);
    });
  });
});

test.describe("authenticated user", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ room }) => {
    room.data.owner = { id: 2, name: "Max Doe" };
    room.data.is_member = true;
    room.data.is_moderator = true;
    room.data.allow_membership = true;
  });

  test("visiting with a personalized link in the hash redirects away from the room", async ({
    page,
    roomRequests,
  }) => {
    await interceptRoomIndexRequests(page);

    await page.goto(
      "/rooms/abc-def-123#personalizedLink=xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
    );

    await expectToastAndClose(page, "app.flash.guests_only");
    await expect(page).toHaveURL((url) => !url.href.includes("/rooms"));

    expect(roomRequests.requests).toHaveLength(0);
  });

  test("a personalized link in the sessionStorage is ignored and cleared", async ({
    page,
    roomAuth,
    roomRequests,
  }) => {
    await page.addInitScript(() =>
      window.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      ),
    );

    await page.goto("/rooms/abc-def-123");

    // Room is requested without auth token
    expectNoAuthToken(await nthRequest(roomRequests));

    await expect(page.getByText("Meeting One").first()).toBeVisible();

    // No participant name is shown
    await expect(page.getByText("rooms.name_in_video_conference")).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);

    expect(roomAuth.requests).toHaveLength(0);
  });
});
