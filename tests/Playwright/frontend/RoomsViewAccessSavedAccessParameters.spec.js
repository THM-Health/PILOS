import { test } from "../support/fixtures/roomsAccess.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  interceptRoomFilesRequest,
  interceptRoomIndexRequests,
} from "../support/mocks.js";
import { expectAuthToken } from "../support/room.js";
import { mockMethod, nthRequest } from "../support/utils.js";

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    roomAuth.status = 200;
    roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };

    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.is_member = true;
    room.data.username = "Max Doe";

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

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    roomAuth.status = 200;
    roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };

    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.is_member = true;
    room.data.username = "Max Doe";

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

    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    roomAuth.status = 200;
    room.data.allow_membership = true;
    room.data.current_user = null;
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

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      access_code: "987654321",
      type: 0,
    });

    expectAuthToken(await nthRequest(roomRequests), "0");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    roomAuth.status = 200;
    room.data.allow_membership = true;
    room.data.current_user = null;
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

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      access_code: "987654321",
      type: 0,
    });

    expectAuthToken(await nthRequest(roomRequests), "0");

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
  test.beforeEach(async ({ page, room }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pilos_guest_name", "Laura Rivera");
    });

    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.authenticated = false;

    await page.goto("/rooms/abc-def-123");

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("access code in hash", async ({ page, room, roomRequests }) => {
    const auth = await mockMethod(
      page,
      "POST",
      "**/api/v1/rooms/abc-def-123/auth*",
      {
        status: 201,
        json: { data: { id: "roomAuthToken", type: 0 } },
        hold: true,
      },
    );
    room.data.description = "<p>Test</p>";
    room.data.authenticated = true;

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    // Check loading state
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    auth.release();

    expect((await nthRequest(auth, 1)).postDataJSON()).toEqual({
      access_code: "987654321",
      type: 0,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "0");

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

  test("personalized link in hash", async ({ page, room, roomRequests }) => {
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
    room.data.authenticated = true;
    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.is_member = true;
    room.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    // Check loading state
    await expect(page.getByTestId("room-loading-spinner")).toBeVisible();
    auth.release();

    expect((await nthRequest(auth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };

    room.data.authenticated = true;
    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.is_member = true;
    room.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      access_code: "987654321",
      type: 0,
    });

    expectAuthToken(await nthRequest(roomRequests), "0");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();

    await nthRequest(roomAuth);

    await page.evaluate(() => {
      window.location.hash = "accessCode=123456789";
    });

    await expect.poll(() => roomAuth.requests.length).toBe(2);
    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      access_code: "123456789",
      type: 0,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "0");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();

    await nthRequest(roomAuth);

    roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };

    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.is_member = true;
    room.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      personalized_link_token:
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.description = "<p>Test</p>";

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Laura Rivera", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toBeVisible();

    await nthRequest(roomAuth);

    roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };

    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.is_member = true;
    room.data.username = "Max Doe";

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      personalized_link_token:
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");

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
  test.beforeEach(async ({ page, room, roomAuth }) => {
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

    roomAuth.json = { data: { id: "roomAuthToken", type: 1 } };

    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.is_member = true;
    room.data.username = "Max Doe";
  });

  test("saved personalized link is used", async ({
    page,
    roomAuth,
    roomRequests,
  }) => {
    await page.goto("/rooms/abc-def-123");

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    await page.goto("/rooms/abc-def-123");

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    roomAuth.json = { data: { id: "roomAuthToken", type: 0 } };

    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.description = "<p>Test</p>";
    room.data.is_member = false;
    delete room.data.username;

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      access_code: "987654321",
      type: 0,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "0");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    await page.goto("/rooms/abc-def-123");

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    room.data.username = "Angela Jones";
    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx";
    });

    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      personalized_link_token:
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");

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
    room,
    roomAuth,
    roomRequests,
  }) => {
    await page.goto("/rooms/abc-def-123");

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests), "1");

    await expect(page.getByText("Meeting One").first()).toBeVisible();
    await expect(
      page.getByText("rooms.name_in_video_conference"),
    ).toBeVisible();
    await expect(page.getByText("Max Doe", { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("change-participant-name-button"),
    ).toHaveCount(0);

    room.data.username = "Angela Jones";
    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx&accessCode=987654321";
    });

    expect((await nthRequest(roomAuth, 2)).postDataJSON()).toEqual({
      personalized_link_token:
        "RQPyP56Fcg2gWNLSWEgEABAfENfEbJRPly2ZPWP56FcBghsHsHfBH4Atn1z22UFkSltkBEAgWFpof23fW65UgPFn3tzft1syMcTVveCDWx",
      type: 1,
    });

    expectAuthToken(await nthRequest(roomRequests, 2), "1");

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

  test.beforeEach(async ({ page, room }) => {
    room.data.owner = { id: 2, name: "Max Doe" };
    room.data.authenticated = false;
    room.data.description = "<p>Test</p>";
    room.data.allow_membership = true;

    await page.goto("/rooms/abc-def-123");

    await expect(page).toHaveTitle("Meeting One - PILOS Test");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("422 error", async ({ page, roomAuth, roomRequests }) => {
    roomAuth.status = 422;
    roomAuth.json = {
      message: "The Access code field is required.",
      errors: { access_code: ["The Access code field is required."] },
    };

    await page.evaluate(() => {
      window.location.hash = "accessCode=123456789";
    });

    await nthRequest(roomAuth);
    await nthRequest(roomRequests, 2);
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

  test("invalid code error", async ({ page, roomAuth, roomRequests }) => {
    roomAuth.status = 401;
    roomAuth.json = { message: "invalid_code" };

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      access_code: "987654321",
      type: 0,
    });

    await nthRequest(roomRequests, 2);
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

  test("rate limit error", async ({ page, roomAuth, roomRequests }) => {
    roomAuth.status = 429;
    roomAuth.json = { limit: "room_auth", retry_after: 5 };

    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      access_code: "987654321",
      type: 0,
    });

    await nthRequest(roomRequests, 2);
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

  test("server error", async ({ page, roomAuth }) => {
    roomAuth.status = 500;
    roomAuth.json = { message: "Test" };

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    await nthRequest(roomAuth);
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

  test("guests not allowed error", async ({ page, roomAuth }) => {
    roomAuth.status = 403;
    roomAuth.json = { message: "guests_not_allowed" };

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
    roomAuth,
  }) => {
    await interceptRoomIndexRequests(page);
    roomAuth.status = 404;
    roomAuth.json = {
      message: "model_not_found",
      model: "room",
      ids: ["abc-def-123"],
    };

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    await nthRequest(roomAuth);

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
  test("room not found error", async ({ page, room, roomAuth, nameCheck }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("pilos_guest_name", "Angela Jones");
    });

    room.data.current_user = null;
    room.data.authenticated = false;
    roomAuth.status = 404;
    roomAuth.json = {
      message: "model_not_found",
      model: "room",
      ids: ["abc-def-123"],
    };

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();

    await page.evaluate(() => {
      window.location.hash = "accessCode=987654321";
    });

    await nthRequest(nameCheck);
    await nthRequest(roomAuth);

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
  test.beforeEach(async ({ page, room }) => {
    room.data.allow_membership = true;
    room.data.current_user = null;
    room.data.authenticated = false;

    await page.goto("/rooms/abc-def-123");
    await expect(page.getByTestId("room-access-overlay")).toBeVisible();
  });

  test("invalid personalized link (401)", async ({ page, roomAuth }) => {
    roomAuth.status = 401;
    roomAuth.json = { message: "invalid_personalized_link" };

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E401evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

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
      page.getByText("rooms.invalid_personalized_link"),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("invalid personalized link (422)", async ({ page, roomAuth }) => {
    roomAuth.status = 422;
    roomAuth.json = {
      message: "The Access token field is required.",
      errors: {
        personalized_link_token: ["The Access token field is required."],
      },
    };

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E422evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

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
      page.getByText("rooms.invalid_personalized_link"),
    ).toBeVisible();
    await expect(page).toHaveURL((url) =>
      url.href.includes("/rooms/abc-def-123/invalid_personalized_link"),
    );
  });

  test("guests only error", async ({ page, roomAuth }) => {
    roomAuth.status = 420;
    roomAuth.json = { message: "guests_only" };

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E420evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

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
  });

  test("server error", async ({ page, roomAuth }) => {
    roomAuth.status = 500;
    roomAuth.json = { message: "Test" };

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E500evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

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

    await expectToastAndClose(page, [
      'app.flash.server_error.message_{"message":"Test"}',
      'app.flash.server_error.error_code_{"statusCode":500}',
    ]);
    await expect(page.getByTestId("reload-button")).toBeVisible();
  });

  test("room not found error", async ({ page, roomAuth }) => {
    roomAuth.status = 404;
    roomAuth.json = {
      message: "model_not_found",
      model: "room",
      ids: ["abc-def-123"],
    };

    await page.evaluate(() => {
      window.location.hash =
        "personalizedLink=E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR&accessCode=987654321";
    });

    expect((await nthRequest(roomAuth, 1)).postDataJSON()).toEqual({
      personalized_link_token:
        "E404evVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR",
      type: 1,
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
