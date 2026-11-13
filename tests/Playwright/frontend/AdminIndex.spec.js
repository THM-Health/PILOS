import { test, expect, expectToastAndClose } from "../support/test.js";
import { testVisitWithoutCurrentUser } from "../support/general.js";
import {
  interceptAdminSettingsRequest,
  interceptAdminUsersIndexRequests,
  interceptAdminRolesIndexRequests,
  interceptAdminRoomTypesIndexRequests,
  interceptAdminServersIndexRequests,
  interceptAdminServerPoolsIndexRequests,
  interceptAdminStreamingIndexRequests,
} from "../support/mocks.js";

test.use({ authenticated: true });

test.beforeEach(async ({ currentUserResponse }) => {
  currentUserResponse.data.permissions = ["admin.view"];
});

test("visit with user that is not logged in", async ({ page }) => {
  await testVisitWithoutCurrentUser(page, "/admin");
});

test("visit without permission to view admin pages", async ({
  page,
  currentUserResponse,
}) => {
  currentUserResponse.data.permissions = [];

  await page.goto("/admin");

  // Check if the welcome page is shown
  await expect(page).not.toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "home.title",
  );
  await expectToastAndClose(page, "app.flash.unauthorized");
});

test("check admin index with all permissions", async ({
  page,
  currentUserResponse,
}) => {
  currentUserResponse.data.permissions = [
    "admin.view",
    "settings.viewAny",
    "roles.viewAny",
    "users.viewAny",
    "serverPools.viewAny",
    "servers.viewAny",
    "streaming.viewAny",
  ];

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const settingsTile = page.getByTestId("admin-settings-link");
  await expect(settingsTile).toBeVisible();
  await expect(settingsTile).toHaveAttribute("href", "/admin/settings");
  await expect(settingsTile).toContainText("admin.settings.title");
  await expect(settingsTile).toContainText("admin.settings.tile_description");
  const usersTile = page.getByTestId("admin-users-link");
  await expect(usersTile).toBeVisible();
  await expect(usersTile).toHaveAttribute("href", "/admin/users");
  await expect(usersTile).toContainText("app.users");
  await expect(usersTile).toContainText("admin.users.tile_description");
  const rolesTile = page.getByTestId("admin-roles-link");
  await expect(rolesTile).toBeVisible();
  await expect(rolesTile).toHaveAttribute("href", "/admin/roles");
  await expect(rolesTile).toContainText("app.roles");
  await expect(rolesTile).toContainText("admin.roles.tile_description");
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  const serversTile = page.getByTestId("admin-servers-link");
  await expect(serversTile).toBeVisible();
  await expect(serversTile).toHaveAttribute("href", "/admin/servers");
  await expect(serversTile).toContainText("app.servers");
  await expect(serversTile).toContainText("admin.servers.tile_description");
  const serverPoolsTile = page.getByTestId("admin-server-pools-link");
  await expect(serverPoolsTile).toBeVisible();
  await expect(serverPoolsTile).toHaveAttribute("href", "/admin/server_pools");
  await expect(serverPoolsTile).toContainText("app.server_pools");
  await expect(serverPoolsTile).toContainText(
    "admin.server_pools.tile_description",
  );

  // Check streaming card is visible, but the link is disabled
  const streamingTile = page.getByTestId("admin-streaming-link");
  await expect(streamingTile).toBeVisible();
  await expect(streamingTile).toHaveAttribute("href", "/admin");
  await expect(streamingTile).toContainText("app.streaming");
  await expect(streamingTile).toContainText("admin.streaming.tile_description");
});

test("only room types are shown with the admin view permission", async ({
  page,
}) => {
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of [
    "settings",
    "users",
    "roles",
    "servers",
    "server-pools",
    "streaming",
  ]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }
});

test("open admin settings", async ({ page, currentUserResponse }) => {
  currentUserResponse.data.permissions = ["admin.view", "settings.viewAny"];
  await interceptAdminSettingsRequest(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const settingsTile = page.getByTestId("admin-settings-link");
  await expect(settingsTile).toBeVisible();
  await expect(settingsTile).toHaveAttribute("href", "/admin/settings");
  await expect(settingsTile).toContainText("admin.settings.title");
  await expect(settingsTile).toContainText("admin.settings.tile_description");
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of [
    "users",
    "roles",
    "servers",
    "server-pools",
    "streaming",
  ]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }

  await page.getByTestId("admin-settings-link").click();

  await expect(page).toHaveURL(/\/admin\/settings/);
});

test("open admin users", async ({ page, currentUserResponse }) => {
  currentUserResponse.data.permissions = [
    "admin.view",
    "users.viewAny",
    "roles.viewAny",
  ];
  await interceptAdminUsersIndexRequests(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const usersTile = page.getByTestId("admin-users-link");
  await expect(usersTile).toBeVisible();
  await expect(usersTile).toHaveAttribute("href", "/admin/users");
  await expect(usersTile).toContainText("app.users");
  await expect(usersTile).toContainText("admin.users.tile_description");
  const rolesTile = page.getByTestId("admin-roles-link");
  await expect(rolesTile).toBeVisible();
  await expect(rolesTile).toHaveAttribute("href", "/admin/roles");
  await expect(rolesTile).toContainText("app.roles");
  await expect(rolesTile).toContainText("admin.roles.tile_description");
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of ["settings", "servers", "server-pools"]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }

  await page.getByTestId("admin-users-link").click();

  await expect(page).toHaveURL(/\/admin\/users/);
});

test("open admin roles", async ({ page, currentUserResponse }) => {
  currentUserResponse.data.permissions = ["admin.view", "roles.viewAny"];
  await interceptAdminRolesIndexRequests(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const rolesTile = page.getByTestId("admin-roles-link");
  await expect(rolesTile).toBeVisible();
  await expect(rolesTile).toHaveAttribute("href", "/admin/roles");
  await expect(rolesTile).toContainText("app.roles");
  await expect(rolesTile).toContainText("admin.roles.tile_description");
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of ["settings", "users", "servers", "server-pools"]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }

  await page.getByTestId("admin-roles-link").click();

  await expect(page).toHaveURL(/\/admin\/roles/);
});

test("open admin room types", async ({ page }) => {
  await interceptAdminRoomTypesIndexRequests(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of [
    "settings",
    "users",
    "roles",
    "servers",
    "server-pools",
  ]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }

  await page.getByTestId("admin-room-types-link").click();

  await expect(page).toHaveURL(/\/admin\/room_types/);
});

test("open admin servers", async ({ page, currentUserResponse }) => {
  currentUserResponse.data.permissions = ["admin.view", "servers.viewAny"];
  await interceptAdminServersIndexRequests(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const serversTile = page.getByTestId("admin-servers-link");
  await expect(serversTile).toBeVisible();
  await expect(serversTile).toHaveAttribute("href", "/admin/servers");
  await expect(serversTile).toContainText("app.servers");
  await expect(serversTile).toContainText("admin.servers.tile_description");
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of ["settings", "users", "roles", "server-pools"]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }

  await page.getByTestId("admin-servers-link").click();

  await expect(page).toHaveURL(/\/admin\/servers/);
});

test("open admin server pools", async ({ page, currentUserResponse }) => {
  currentUserResponse.data.permissions = ["admin.view", "serverPools.viewAny"];
  await interceptAdminServerPoolsIndexRequests(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const serverPoolsTile = page.getByTestId("admin-server-pools-link");
  await expect(serverPoolsTile).toBeVisible();
  await expect(serverPoolsTile).toHaveAttribute("href", "/admin/server_pools");
  await expect(serverPoolsTile).toContainText("app.server_pools");
  await expect(serverPoolsTile).toContainText(
    "admin.server_pools.tile_description",
  );
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of ["settings", "users", "roles", "servers"]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }

  await page.getByTestId("admin-server-pools-link").click();

  await expect(page).toHaveURL(/\/admin\/server_pools/);
});

test("open admin streaming", async ({
  page,
  configResponse,
  currentUserResponse,
}) => {
  configResponse.data.streaming.enabled = true;
  currentUserResponse.data.permissions = ["admin.view", "streaming.viewAny"];
  await interceptAdminStreamingIndexRequests(page);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
  const streamingTile = page.getByTestId("admin-streaming-link");
  await expect(streamingTile).toBeVisible();
  await expect(streamingTile).toHaveAttribute(
    "href",
    "/admin/streaming_settings",
  );
  await expect(streamingTile).toContainText("app.streaming");
  await expect(streamingTile).toContainText("admin.streaming.tile_description");
  const roomTypesTile = page.getByTestId("admin-room-types-link");
  await expect(roomTypesTile).toBeVisible();
  await expect(roomTypesTile).toHaveAttribute("href", "/admin/room_types");
  await expect(roomTypesTile).toContainText("app.room_types");
  await expect(roomTypesTile).toContainText(
    "admin.room_types.tile_description",
  );
  for (const name of [
    "settings",
    "users",
    "roles",
    "servers",
    "server-pools",
  ]) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }

  await page.getByTestId("admin-streaming-link").click();

  await expect(page).toHaveURL(/\/admin\/streaming_settings/);
});
