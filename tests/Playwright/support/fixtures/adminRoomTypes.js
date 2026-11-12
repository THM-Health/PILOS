import { test as base } from "../test.js";
import { readFixture } from "../utils.js";

/**
 * Serves a GET request of the given url with the (mutable) body, other methods fall through to the next route.
 * @param {import("@playwright/test").Page} page
 * @param {string} url
 * @param {object} body
 */
async function serveGet(page, url, body) {
  await page.route(url, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: body })
      : route.fallback(),
  );
}

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
 * Fixtures of the admin room types pages (list, single room type, and the server pools and roles that the room type
 * form loads). They are mocked for every test. A test changes the object before `page.goto()` (or before the action
 * that triggers the request) and the route serves the current state.
 */
export const test = base.extend({
  roomTypes: [
    // mockApp: the routes must be registered after the fallback that blocks unmocked requests
    // eslint-disable-next-line no-unused-vars
    async ({ page, mockApp }, use) => {
      const roomTypes = readFixture("roomTypes.json");
      await serveGet(page, "**/api/v1/roomTypes*", roomTypes);
      await use(roomTypes);
    },
    { auto: true },
  ],

  roomType: [
    // mockApp: the routes must be registered after the fallback that blocks unmocked requests
    // eslint-disable-next-line no-unused-vars
    async ({ page, mockApp }, use) => {
      const roomType = readFixture("roomType.json");
      await serveGet(page, "**/api/v1/roomTypes/3", roomType);
      await use(roomType);
    },
    { auto: true },
  ],

  serverPools: [
    // mockApp: the routes must be registered after the fallback that blocks unmocked requests
    // eslint-disable-next-line no-unused-vars
    async ({ page, mockApp }, use) => {
      const serverPools = readFixture("serverPools.json");
      await serveGet(page, "**/api/v1/serverPools*", serverPools);
      await use(serverPools);
    },
    { auto: true },
  ],

  roles: [
    // mockApp: the routes must be registered after the fallback that blocks unmocked requests
    // eslint-disable-next-line no-unused-vars
    async ({ page, mockApp }, use) => {
      const roles = readFixture("roles.json");
      await serveGet(page, "**/api/v1/roles*", roles);
      await use(roles);
    },
    { auto: true },
  ],

  /** Second page of the roles (the fixture roles are the first page). */
  rolesSecondPage: async ({}, use) => {
    await use({
      data: [
        {
          id: 4,
          name: "Dean",
          default: false,
          updated_at: "2021-01-08T15:51:08.000000Z",
          model_name: "Role",
          room_limit: 20,
        },
        {
          id: 5,
          name: "Faculty",
          default: false,
          updated_at: "2021-03-19T09:12:44.000000Z",
          model_name: "Role",
          room_limit: 20,
        },
        {
          id: 6,
          name: "Manager",
          default: false,
          updated_at: "2021-05-22T11:55:21.000000Z",
          model_name: "Role",
          room_limit: -1,
        },
      ],
      meta: {
        current_page: 2,
        from: 4,
        last_page: 2,
        per_page: 3,
        to: 6,
        total: 6,
      },
    });
  },

  /** First of two pages of the server pools (the fixture server pools are one page). */
  serverPoolsFirstPage: async ({}, use) => {
    const serverPools = readFixture("serverPools.json");
    serverPools.data = serverPools.data.slice(0, 1);
    serverPools.meta.last_page = 2;
    serverPools.meta.per_page = 1;
    serverPools.meta.to = 1;
    await use(serverPools);
  },

  /** Fields of the room type that are changed when every setting of the form is changed (edit page). */
  editedRoomType: async ({}, use) => {
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
  validationErrors: async ({}, use) => {
    await use(
      Object.fromEntries(
        fieldErrorKeys
          .flatMap(([, keys]) => keys)
          .map((key) => [key, [requiredMessage(key)]]),
      ),
    );
  },

  /** [test id of the field, messages that are shown inside of it] for the errors of `validationErrors`. */
  errorFields: async ({}, use) => {
    await use(
      fieldErrorKeys.map(([testId, keys]) => [
        testId,
        keys.map(requiredMessage),
      ]),
    );
  },
});

export { expect, expectToastAndClose } from "../test.js";
