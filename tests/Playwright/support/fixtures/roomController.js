import { test as base } from "../test.js";
import {
  createRequestRecorder,
  mockApiList,
  mockApiRequest,
  readFixture,
} from "../utils.js";

/**
 * Mocks of the endpoints of the `RoomController`, all of them are automatic fixtures, served in every test. Change the
 * objects before the page requests them (before `page.goto()` or the action that reloads them). Tests that need
 * another response change the answer of the mock with `respondWith()`, `respondWithDefault()` goes back to the
 * default.
 *
 * - `roomResponse`: the room "abc-def-123", the current user is the owner, `roomResponse.data` is the room itself.
 *   `getRoomApiMock` is the mock of GET /api/v1/rooms/abc-def-123 that serves it.
 * - `postRoomAuthApiMock`: `{ requests }` of the room auth request (POST /api/v1/rooms/abc-def-123/auth), by default a
 *   successful login with the room auth token of type 0.
 * - `postRoomJoinOrStartApiMock`: `{ requests }` of the default response of joining or starting a meeting
 *   (POST /api/v1/rooms/abc-def-123/join and /start), a redirect to `roomJoinOrStartRedirectUrl`.
 * - `roomJoinOrStartRedirectUrl`: the URL the default response of joining or starting a meeting redirects to.
 * - `roomJoinOrStartRequestBodyWithoutConsent`: the request body of joining or starting a meeting without any consent.
 * - `optionsRoomJoinOrStartApiMock`: the requirements of joining or starting a meeting (OPTIONS /api/v1/rooms/abc-def-123/join and
 *   /start). `{ requests, status, features, error }`: `features` are the enabled features (recording,
 *   attendance_recording, streaming, all disabled by default), `error` is the response body that is served instead of
 *   the features if it is set (together with `status`).
 * - `roomMeetingsResponse`: the meeting history of the room, answered by the list mock `getRoomMeetingsApiMock`
 *   (GET /api/v1/rooms/abc-def-123/meetings, see `mockApiList`).
 * - `roomSettingsResponse`: the settings of the room (GET /api/v1/rooms/abc-def-123/settings)
 * - `roomsResponse`: the room list, answered by the list mock `getRoomsApiMock` (GET /api/v1/rooms, see `mockApiList`).
 */
export const test = base.extend({
  roomResponse: async ({}, use) => {
    await use(readFixture("room.json"));
  },
  getRoomApiMock: [
    async ({ page, roomResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "rooms/abc-def-123*", () => ({
          json: roomResponse,
        })),
      );
    },
    { auto: true },
  ],
  postRoomAuthApiMock: [
    async ({ page }, use) => {
      await use(
        await mockApiRequest(page, "POST", "rooms/abc-def-123/auth*", {
          status: 201,
          json: { data: { id: "roomAuthToken", type: 0 } },
        }),
      );
    },
    { auto: true },
  ],
  roomJoinOrStartRedirectUrl: async ({}, use) => {
    await use(
      "https://thm-health.github.io/PILOS-Redirect_Test_Pages/bigbluebutton?foo=a&bar=b",
    );
  },
  roomJoinOrStartRequestBodyWithoutConsent: async ({}, use) => {
    await use({
      name: null,
      consent_record_attendance: false,
      consent_record: false,
      consent_record_video: false,
      consent_streaming: false,
      dark_mode: false,
    });
  },
  postRoomJoinOrStartApiMock: [
    async ({ page, roomJoinOrStartRedirectUrl }, use) => {
      await use(
        await mockApiRequest(page, "POST", "rooms/abc-def-123/{join,start}*", {
          status: 200,
          json: { url: roomJoinOrStartRedirectUrl },
        }),
      );
    },
    { auto: true },
  ],
  optionsRoomJoinOrStartApiMock: [
    async ({ page }, use) => {
      const optionsRoomJoinOrStartApiMock = {
        ...createRequestRecorder(),
        status: 200,
        features: {
          recording: false,
          attendance_recording: false,
          streaming: false,
        },
        error: undefined,
      };
      await mockApiRequest(
        page,
        "OPTIONS",
        "rooms/abc-def-123/{join,start}*",
        () => ({
          status: optionsRoomJoinOrStartApiMock.status,
          json: optionsRoomJoinOrStartApiMock.error ?? {
            data: { features: optionsRoomJoinOrStartApiMock.features },
          },
        }),
        {
          onRequest: (request) =>
            optionsRoomJoinOrStartApiMock.requests.push(request),
        },
      );
      await use(optionsRoomJoinOrStartApiMock);
    },
    { auto: true },
  ],
  roomMeetingsResponse: async ({}, use) => {
    await use(readFixture("roomHistory.json"));
  },
  getRoomMeetingsApiMock: [
    async ({ page, roomMeetingsResponse }, use) => {
      await use(
        await mockApiList(
          page,
          "rooms/abc-def-123/meetings*",
          roomMeetingsResponse,
        ),
      );
    },
    { auto: true },
  ],
  roomSettingsResponse: async ({}, use) => {
    const roomSettingsResponse = readFixture("roomSettings.json");
    await use(roomSettingsResponse);
  },
  getRoomSettingsApiMock: [
    async ({ page, roomSettingsResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "rooms/abc-def-123/settings", () => ({
          json: roomSettingsResponse,
        })),
      );
    },
    { auto: true },
  ],
  roomsResponse: async ({}, use) => {
    await use(readFixture("rooms.json"));
  },
  getRoomsApiMock: [
    async ({ page, roomsResponse }, use) => {
      await use(await mockApiList(page, "rooms*", roomsResponse));
    },
    { auto: true },
  ],
});
