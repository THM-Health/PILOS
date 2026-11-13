import { test as base } from "../test.js";
import { mockApiRequest, readFixture } from "../utils.js";

/** [test id of the field, keys of the validation errors that are shown inside of it] */
const fieldErrorKeys = [
  ["room-type-name-field", ["name"]],
  ["description-field", ["description"]],
  ["color-field", ["color"]],
  ["server-pool-field", ["server_pool"]],
  ["max-participants-field", ["max_participants"]],
  ["max-duration-field", ["max_duration"]],
  ["create-parameters-field", ["create_parameters"]],
  ["join-parameters-field", ["join_parameters"]],
  ["role-field", ["roles"]],
  [
    "has-access-code-field",
    ["has_access_code_default", "has_access_code_enforced"],
  ],
  ["allow-guests-field", ["allow_guests_default", "allow_guests_enforced"]],
  [
    "everyone-can-start-field",
    ["everyone_can_start_default", "everyone_can_start_enforced"],
  ],
  ["mute-on-start-field", ["mute_on_start_default", "mute_on_start_enforced"]],
  ["lobby-field", ["lobby_default", "lobby_enforced"]],
  [
    "record-attendance-field",
    ["record_attendance_default", "record_attendance_enforced"],
  ],
  ["record-field", ["record_default", "record_enforced"]],
  [
    "auto-start-recording-field",
    ["auto_start_recording_default", "auto_start_recording_enforced"],
  ],
  [
    "disable-cam-field",
    ["lock_settings_disable_cam_default", "lock_settings_disable_cam_enforced"],
  ],
  [
    "webcams-only-for-moderator-field",
    [
      "webcams_only_for_moderator_default",
      "webcams_only_for_moderator_enforced",
    ],
  ],
  [
    "disable-mic-field",
    ["lock_settings_disable_mic_default", "lock_settings_disable_mic_enforced"],
  ],
  [
    "disable-public-chat-field",
    [
      "lock_settings_disable_public_chat_default",
      "lock_settings_disable_public_chat_enforced",
    ],
  ],
  [
    "disable-private-chat-field",
    [
      "lock_settings_disable_private_chat_default",
      "lock_settings_disable_private_chat_enforced",
    ],
  ],
  [
    "disable-note-field",
    [
      "lock_settings_disable_note_default",
      "lock_settings_disable_note_enforced",
    ],
  ],
  [
    "hide-user-list-field",
    [
      "lock_settings_hide_user_list_default",
      "lock_settings_hide_user_list_enforced",
    ],
  ],
  [
    "allow-membership-field",
    ["allow_membership_default", "allow_membership_enforced"],
  ],
  ["default-role-field", ["default_role_default", "default_role_enforced"]],
  ["visibility-field", ["visibility_default", "visibility_enforced"]],
];

const requiredMessage = (key) =>
  `The ${key.replaceAll("_", " ")} field is required.`;

/**
 * Mocks of the `RoomTypeController`, automatic fixtures served in every test.
 *
 * - `roomTypesFixtureName` (option): fixture file of the room types, `roomTypesWithSettings.json` for the room types
 *   with default room settings and features (shown in the room type change dialog of a room).
 * - `getRoomTypesApiMock`: the room types (GET /api/v1/roomTypes) with `{ requests, status, json }`, `json` is the
 *   fixture of `roomTypesFixtureName`. `respondWithSettings()` answers with the room types with default room settings
 *   and features.
 * - `roomTypeResponse`: the room type with the id 3 (GET /api/v1/roomTypes/3)
 * - `roomTypeFieldsAfterEditingEverySetting`: fields of the room type that are changed when every setting of the form is changed (edit page)
 * - `roomTypeValidationErrorsResponse`: response body of a 422 when every field of the room type form is invalid,
 *   `roomTypeErrorFieldMessages` are the test ids of the fields with the messages that are shown inside of them
 */
export const test = base.extend({
  roomTypesFixtureName: ["roomTypes.json", { option: true }],
  getRoomTypesApiMock: [
    async ({ page, roomTypesFixtureName }, use) => {
      const getRoomTypesApiMock = {
        status: 200,
        json: readFixture(roomTypesFixtureName),
        respondWithSettings() {
          getRoomTypesApiMock.json = readFixture("roomTypesWithSettings.json");
        },
      };
      Object.assign(
        getRoomTypesApiMock,
        await mockApiRequest(page, "GET", "roomTypes*", () => ({
          status: getRoomTypesApiMock.status,
          json: getRoomTypesApiMock.json,
        })),
      );
      await use(getRoomTypesApiMock);
    },
    { auto: true },
  ],

  roomTypeResponse: async ({}, use) => {
    const roomTypeResponse = readFixture("roomType.json");
    await use(roomTypeResponse);
  },
  getRoomTypeApiMock: [
    async ({ page, roomTypeResponse }, use) => {
      await use(
        await mockApiRequest(page, "GET", "roomTypes/3", () => ({
          json: roomTypeResponse,
        })),
      );
    },
    { auto: true },
  ],

  /** Fields of the room type that are changed when every setting of the form is changed (edit page). */
  roomTypeFieldsAfterEditingEverySetting: async ({}, use) => {
    await use({
      name: "Exam 01",
      description: "New room type description for room type Exam 01",
      color: "#ef4444",
      server_pool: {
        id: 2,
        name: "Production",
        description: "Pool for production",
        servers_count: 1,
        model_name: "ServerPool",
        updated_at: "2020-12-21T13:43:21.000000Z",
      },
      max_participants: 50,
      max_duration: 60,
      create_parameters: "meetingLayout=PRESENTATION_FOCUS",
      join_parameters: "enforceLayout=PRESENTATION_ONLY",
      restrict: false,
      roles: [],
      mute_on_start_default: false,
      mute_on_start_enforced: false,
      lock_settings_disable_cam_default: true,
      lock_settings_disable_cam_enforced: true,
      webcams_only_for_moderator_default: false,
      webcams_only_for_moderator_enforced: true,
      lock_settings_disable_mic_default: true,
      lock_settings_disable_mic_enforced: false,
      lock_settings_disable_private_chat_default: true,
      lock_settings_disable_private_chat_enforced: true,
      lock_settings_disable_public_chat_default: false,
      lock_settings_disable_public_chat_enforced: true,
      lock_settings_disable_note_default: false,
      lock_settings_disable_note_enforced: false,
      lock_settings_hide_user_list_default: false,
      lock_settings_hide_user_list_enforced: true,
      everyone_can_start_default: true,
      everyone_can_start_enforced: true,
      allow_membership_default: true,
      allow_membership_enforced: false,
      allow_guests_default: false,
      allow_guests_enforced: false,
      default_role_default: 2,
      default_role_enforced: true,
      lobby_default: 0,
      lobby_enforced: false,
      visibility_default: 0,
      visibility_enforced: true,
      record_attendance_default: true,
      record_attendance_enforced: true,
      record_default: true,
      record_enforced: true,
      auto_start_recording_default: true,
      auto_start_recording_enforced: true,
      has_access_code_default: false,
      has_access_code_enforced: true,
    });
  },

  /** Response body of a 422 when every field of the room type form is invalid. */
  roomTypeValidationErrorsResponse: async ({}, use) => {
    await use(
      Object.fromEntries(
        fieldErrorKeys
          .flatMap(([, keys]) => keys)
          .map((key) => [key, [requiredMessage(key)]]),
      ),
    );
  },

  /** [test id of the field, messages that are shown inside of it] for the errors of `roomTypeValidationErrorsResponse`. */
  roomTypeErrorFieldMessages: async ({}, use) => {
    await use(
      fieldErrorKeys.map(([testId, keys]) => [
        testId,
        keys.map(requiredMessage),
      ]),
    );
  },
});
