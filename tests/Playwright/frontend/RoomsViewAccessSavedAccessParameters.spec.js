import {
  validationErrors,
  unauthorized,
  serverError,
  forbidden,
  modelNotFound,
  errorResponse,
} from "../support/utils.js";
import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as participantNameCheckTest } from "../support/fixtures/participantNameCheck.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { expectAuthToken } from "../support/room.js";

const test = mergeTests(roomControllerTest, participantNameCheckTest);

test.beforeEach(async ({ page }) => {
  await interceptRoomFilesRequest(page);
});

test.describe("saved access parameter priority", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });
  });

  test("personalized link from hash wins over all saved access parameters", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 200,
      json: { data: { id: "roomAuthToken", type: 1 } },
    });

    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.is_member = true;
    roomResponse.data.username = "Max Doe";

    await page.addInitScript(
      (items) => {
        if (!window.localStorage.getItem("pw_session_seeded")) {
          window.localStorage.setItem("pw_session_seeded", "1");
          for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value);
          }
        }
      },
      {
        "roomAccessCode_abc-def-123": "123456789",
        "roomPersonalizedLink_abc-def-123":
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      },
    );

    await page.goto(
      "/rooms/abc-def-123#accessCode=987654321&personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
    );

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    await expect(page.getByTestId("room-access-overlay")).toBeHidden();

    // The saved access code is not touched, the personalized link is updated to the value from the hash
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("123456789");

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    // The competing access code hash was removed
    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));
  });

  test("removed access code hash cannot win on a later reload", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 200,
      json: { data: { id: "roomAuthToken", type: 1 } },
    });

    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.is_member = true;
    roomResponse.data.username = "Max Doe";

    await page.addInitScript(
      (items) => {
        if (!window.localStorage.getItem("pw_session_seeded")) {
          window.localStorage.setItem("pw_session_seeded", "1");
          for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value);
          }
        }
      },
      {
        "roomAccessCode_abc-def-123": "123456789",
        "roomPersonalizedLink_abc-def-123":
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      },
    );

    await page.goto(
      "/rooms/abc-def-123#accessCode=987654321&personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
    );
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));

    // Reset to previous value and reload without hash
    await page.evaluate(() =>
      window.sessionStorage.setItem(
        "roomPersonalizedLink_abc-def-123",
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      ),
    );
    await page.reload();

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest(
      {
        json: {
          personalized_link_token:
            "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
          type: 1,
        },
      },
      { nth: 2 },
    );

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });

  test("access code from hash wins over saved access parameters", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 200,
      json: { data: { id: "roomAuthToken", type: 0 } },
    });
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    await page.addInitScript(
      (items) => {
        if (!window.localStorage.getItem("pw_session_seeded")) {
          window.localStorage.setItem("pw_session_seeded", "1");
          for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value);
          }
        }
      },
      {
        "roomAccessCode_abc-def-123": "123456789",
        "roomPersonalizedLink_abc-def-123":
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      },
    );

    await page.goto("/rooms/abc-def-123#accessCode=987654321");

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "987654321",
        type: 0,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "0");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(page.getByText("Max Doe")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();

    // The access code in the session storage is updated and the personalized link is removed
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("987654321");

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);
  });

  test("saved access code is used on reload without hash", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 200,
      json: { data: { id: "roomAuthToken", type: 0 } },
    });
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    await page.addInitScript(
      (items) => {
        if (!window.localStorage.getItem("pw_session_seeded")) {
          window.localStorage.setItem("pw_session_seeded", "1");
          for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value);
          }
        }
      },
      { "roomAccessCode_abc-def-123": "987654321" },
    );

    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "987654321",
        type: 0,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "0");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(page.getByText("Max Doe")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();
  });
});

test.describe("hash change with no saved access parameters", () => {
  test.beforeEach(async ({ page, roomResponse }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });

    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.authenticated = false;

    await page.goto("/rooms/abc-def-123");

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("access code in hash", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 0 } },
      hold: true,
    });
    roomResponse.data.description = "<p>Test</p>";
    roomResponse.data.authenticated = true;

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    // Check loading state
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    postRoomAuthApiMock.release();

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "987654321",
        type: 0,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "0");

    // Check that url was cleared and access code was saved to sessionStorage
    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("987654321");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();
  });

  test("personalized link in hash", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 1 } },
      hold: true,
    });
    roomResponse.data.authenticated = true;
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.is_member = true;
    roomResponse.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    // Check loading state
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    postRoomAuthApiMock.release();

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "1");

    // Check that url was cleared and personalized link was saved to sessionStorage
    await expect(page).toHaveURL(
      (url) => !url.href.includes("personalizedLink"),
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });

  test("personalized link and access code in hash", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 1 } },
    });

    roomResponse.data.authenticated = true;
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.is_member = true;
    roomResponse.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "1");

    // Check that url was cleared and personalized link was saved to sessionStorage
    await expect(page).toHaveURL(
      (url) => !url.href.includes("personalizedLink"),
    );

    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });
});

test.describe("hash change with saved access code", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });

    await page.addInitScript(
      (items) => {
        if (!window.localStorage.getItem("pw_session_seeded")) {
          window.localStorage.setItem("pw_session_seeded", "1");
          for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value);
          }
        }
      },
      { "roomAccessCode_abc-def-123": "987654321" },
    );
  });

  test("saved access code is used", async ({
    page,
    roomResponse,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        access_code: "987654321",
        type: 0,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "0");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();
  });

  test("different access code in hash", async ({
    page,
    roomResponse,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();

    await postRoomAuthApiMock.waitForRequest();

    await page.evaluate(() => {
      window.location.hash = "accessCode=123456789";
    });

    await expect.poll(() => postRoomAuthApiMock.requests.length).toBe(2);
    await expect(postRoomAuthApiMock).toHaveReceivedRequest(
      {
        json: {
          access_code: "123456789",
          type: 0,
        },
      },
      { nth: 2 },
    );

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "0");

    // Check that url was cleared and access code was updated in sessionStorage
    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("123456789");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();
  });

  test("personalized link in hash", async ({
    page,
    roomResponse,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();

    await postRoomAuthApiMock.waitForRequest();

    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 1 } },
    });
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.is_member = true;
    roomResponse.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "1");

    await expect(page).toHaveURL(
      (url) => !url.href.includes("personalizedLink"),
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });

  test("personalized link and access code in hash", async ({
    page,
    roomResponse,
    postRoomAuthApiMock,
    getRoomApiMock,
  }) => {
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();

    await postRoomAuthApiMock.waitForRequest();

    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 1 } },
    });
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.is_member = true;
    roomResponse.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "1");

    await expect(page).toHaveURL(
      (url) => !url.href.includes("personalizedLink"),
    );

    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });
});

test.describe("hash change with saved personalized link", () => {
  test.beforeEach(async ({ page, roomResponse, postRoomAuthApiMock }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });

    await page.addInitScript(
      (items) => {
        if (!window.localStorage.getItem("pw_session_seeded")) {
          window.localStorage.setItem("pw_session_seeded", "1");
          for (const [key, value] of Object.entries(items)) {
            window.sessionStorage.setItem(key, value);
          }
        }
      },
      {
        "roomPersonalizedLink_abc-def-123":
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      },
    );

    postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 1 } },
    });

    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.is_member = true;
    roomResponse.data.username = "Max Doe";
  });

  test("saved personalized link is used", async ({
    page,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });

  test("access code in hash", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 201,
      json: { data: { id: "roomAuthToken", type: 0 } },
    });
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.description = "<p>Test</p>";
    roomResponse.data.is_member = false;
    delete roomResponse.data.username;

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        access_code: "987654321",
        type: 0,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "0");

    // Check that url was cleared and sessionStorage was updated
    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("987654321");

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(null);

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(page.getByText("Max Doe")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();
  });

  test("different personalized link in hash", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    roomResponse.data.username = "Angela Jones";
    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    await expect(postRoomAuthApiMock).toHaveReceivedRequest(
      {
        json: {
          personalized_link_token:
            "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
          type: 1,
        },
      },
      { nth: 2 },
    );

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "1");

    // Check that url was cleared and personalized link was updated in sessionStorage
    await expect(page).toHaveURL(
      (url) => !url.href.includes("personalizedLink"),
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Angela Jones", { exact: true })).toBeVisible();
    await expect(page.getByText("Max Doe")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });

  test("different personalized link and access code in hash", async ({
    page,
    roomResponse,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    await page.goto("/rooms/abc-def-123");

    await expect(postRoomAuthApiMock).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
    });

    expectAuthToken(await getRoomApiMock.waitForRequest(), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    roomResponse.data.username = "Angela Jones";
    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    await expect(postRoomAuthApiMock).toHaveReceivedRequest(
      {
        json: {
          personalized_link_token:
            "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
          type: 1,
        },
      },
      { nth: 2 },
    );

    expectAuthToken(await getRoomApiMock.waitForRequest(2), "1");

    // Check that url was cleared, the access code was not saved and the personalized link was updated
    await expect(page).toHaveURL(
      (url) => !url.href.includes("personalizedLink"),
    );

    await expect(page).toHaveURL((url) => !url.href.includes("accessCode"));

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe(null);

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomPersonalizedLink_abc-def-123"),
        ),
      )
      .toBe(
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      );

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Angela Jones", { exact: true })).toBeVisible();
    await expect(page.getByText("Laura Rivera")).toHaveCount(0);
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);
  });
});

test.describe("hash change with access code errors", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, roomResponse }) => {
    roomResponse.data.owner = { id: 2, name: "Max Doe" };
    roomResponse.data.authenticated = false;
    roomResponse.data.description = "<p>Test</p>";
    roomResponse.data.allow_membership = true;

    await page.goto("/rooms/abc-def-123");

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("422 error", async ({ page, getRoomApiMock, postRoomAuthApiMock }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      validationErrors(
        { access_code: ["The Access code field is required."] },
        "The Access code field is required.",
      ),
    );

    await page.evaluate(() => {
      window.location.hash = "accessCode=123456789";
    });

    await postRoomAuthRequestsAfterChange.waitForRequest();
    await getRoomApiMock.waitForRequest(2);
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe(null);

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page
        .getByTestId("room-access-overlay")
        .getByText("The Access code field is required."),
    ).toBeVisible();
  });

  test("invalid code error", async ({
    page,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      unauthorized("invalid_code"),
    );

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

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

    // Check if error message is shown
    await expectToastAndClose(page, "rooms.flash.access_code_invalid");
    await expect(
      page.getByText("rooms.flash.access_code_invalid"),
    ).toBeVisible();

    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
    await expect(
      page.getByTestId("room-access-overlay").locator("#access-code"),
    ).toHaveValue("987-654-321");
  });

  test("rate limit error", async ({
    page,
    getRoomApiMock,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith({
      status: 429,
      json: { limit: "room_auth", retry_after: 5 },
    });

    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

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
      .toBe("987654321");

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

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    await postRoomAuthRequestsAfterChange.waitForRequest();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("987654321");

    await expectToastAndClose(page, [
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);
    await expect(page.getByTestId("reload-button")).toBeVisible();
  });

  test("guests not allowed error", async ({ page, postRoomAuthApiMock }) => {
    postRoomAuthApiMock.respondWith(forbidden("guests_not_allowed"));

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    await expect(
      page.getByText("rooms.only_used_by_authenticated_users"),
    ).toBeVisible();
    await expect(page.getByTestId("room-access-overlay")).toBeHidden();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.sessionStorage.getItem("roomAccessCode_abc-def-123"),
        ),
      )
      .toBe("987654321");
  });

  test("room not found error as authenticated user", async ({
    page,
    postRoomAuthApiMock,
  }) => {
    await interceptRoomIndexRequests(page);
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      modelNotFound("room", ["abc-def-123"]),
    );

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

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

test.describe("hash change with access code errors as guest", () => {
  test("room not found error", async ({
    page,
    roomResponse,
    postParticipantNameCheckApiMock,
    postRoomAuthApiMock,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pilos_guest_name", "Angela Jones");
    });

    roomResponse.data.current_user = null;
    roomResponse.data.authenticated = false;
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      modelNotFound("room", ["abc-def-123"]),
    );

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    await postParticipantNameCheckApiMock.waitForRequest();
    await postRoomAuthRequestsAfterChange.waitForRequest();

    // Check that redirect to 404 page worked
    await expect(page).toHaveURL((url) => url.href.includes("/404"));

    await expect(page).toHaveURL(
      (url) => !url.href.includes("/rooms/abc-def-123"),
    );

    await expectToastAndClose(page, [
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });
});

test.describe("hash change with personalized link errors", () => {
  test.beforeEach(async ({ page, roomResponse }) => {
    roomResponse.data.allow_membership = true;
    roomResponse.data.current_user = null;
    roomResponse.data.authenticated = false;

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("invalid personalized link (401)", async ({
    page,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      unauthorized("invalid_personalized_link"),
    );

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
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
      page.getByText("rooms.invalid_personalized_link"),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("invalid personalized link (422)", async ({
    page,
    postRoomAuthApiMock,
  }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      validationErrors(
        {
          personalized_link_token: ["The Access token field is required."],
        },
        "The Access token field is required.",
      ),
    );

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
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
      page.getByText("rooms.invalid_personalized_link"),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("guests only error", async ({ page, postRoomAuthApiMock }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      errorResponse(420, "guests_only"),
    );

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
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
  });

  test("server error", async ({ page, postRoomAuthApiMock }) => {
    const postRoomAuthRequestsAfterChange =
      postRoomAuthApiMock.respondWith(serverError());

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
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

  test("room not found error", async ({ page, postRoomAuthApiMock }) => {
    const postRoomAuthRequestsAfterChange = postRoomAuthApiMock.respondWith(
      modelNotFound("room", ["abc-def-123"]),
    );

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    await expect(postRoomAuthRequestsAfterChange).toHaveReceivedRequest({
      json: {
        personalized_link_token:
          "E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
        type: 1,
      },
    });

    // Check that redirect to 404 page worked and error message is shown
    await expect(page).toHaveURL((url) => url.href.includes("/404"));

    await expect(page).toHaveURL(
      (url) => !url.href.includes("rooms/abc-def-123"),
    );

    await expectToastAndClose(page, [
      'app.flash.model_not_found.title_{"model":"app.model.room"}',
      'app.flash.model_not_found.details_{"ids":"abc-def-123"}',
    ]);
  });
});
