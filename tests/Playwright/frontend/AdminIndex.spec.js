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

const tiles = {
  settings: {
    href: "/admin/settings",
    texts: ["admin.settings.title", "admin.settings.tile_description"],
  },
  users: {
    href: "/admin/users",
    texts: ["app.users", "admin.users.tile_description"],
  },
  roles: {
    href: "/admin/roles",
    texts: ["app.roles", "admin.roles.tile_description"],
  },
  "room-types": {
    href: "/admin/room_types",
    texts: ["app.room_types", "admin.room_types.tile_description"],
  },
  servers: {
    href: "/admin/servers",
    texts: ["app.servers", "admin.servers.tile_description"],
  },
  "server-pools": {
    href: "/admin/server_pools",
    texts: ["app.server_pools", "admin.server_pools.tile_description"],
  },
  streaming: {
    href: "/admin/streaming_settings",
    texts: ["app.streaming", "admin.streaming.tile_description"],
  },
};

/**
 * Check that the tile is visible with the expected link and texts
 * @param {import("@playwright/test").Page} page
 * @param {string} name
 * @param {string} [href]
 */
async function expectTile(page, name, href = tiles[name].href) {
  const link = page.getByTestId(`admin-${name}-link`);
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", href);
  for (const text of tiles[name].texts) {
    await expect(link).toContainText(text);
  }
}

/**
 * Check that the tiles are not rendered (the page has to be rendered already)
 * @param {import("@playwright/test").Page} page
 * @param {string[]} names
 */
async function expectNoTiles(page, names) {
  for (const name of names) {
    await expect(page.getByTestId(`admin-${name}-link`)).toHaveCount(0);
  }
}

async function expectAdminHeader(page) {
  await expect(
    page.getByRole("heading", { name: "admin.title" }),
  ).toBeVisible();
  await expect(page.getByText("admin.overview", { exact: true })).toBeVisible();
  await expect(page.getByText("admin.overview_description")).toBeVisible();
}

test.beforeEach(async ({ currentUser }) => {
  currentUser.data.permissions = ["admin.view"];
});

test("visit with user that is not logged in", async ({ page }) => {
  await testVisitWithoutCurrentUser(page, "/admin");
});

test("visit without permission to view admin pages", async ({
  page,
  currentUser,
}) => {
  currentUser.data.permissions = [];

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
  currentUser,
}) => {
  currentUser.data.permissions = [
    "admin.view",
    "settings.viewAny",
    "roles.viewAny",
    "users.viewAny",
    "serverPools.viewAny",
    "servers.viewAny",
    "streaming.viewAny",
  ];

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "settings");
  await expectTile(page, "users");
  await expectTile(page, "roles");
  await expectTile(page, "room-types");
  await expectTile(page, "servers");
  await expectTile(page, "server-pools");

  // Check streaming card is visible, but the link is disabled
  await expectTile(page, "streaming", "/admin");
});

test("only room types are shown with the admin view permission", async ({
  page,
}) => {
  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "room-types");
  await expectNoTiles(page, [
    "settings",
    "users",
    "roles",
    "servers",
    "server-pools",
    "streaming",
  ]);
});

test("open admin settings", async ({ page, currentUser }) => {
  currentUser.data.permissions = ["admin.view", "settings.viewAny"];
  await interceptAdminSettingsRequest(page);

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "settings");
  await expectTile(page, "room-types");
  await expectNoTiles(page, [
    "users",
    "roles",
    "servers",
    "server-pools",
    "streaming",
  ]);

  await page.getByTestId("admin-settings-link").click();

  await expect(page).toHaveURL(/\/admin\/settings/);
});

test("open admin users", async ({ page, currentUser }) => {
  currentUser.data.permissions = [
    "admin.view",
    "users.viewAny",
    "roles.viewAny",
  ];
  await interceptAdminUsersIndexRequests(page);

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "users");
  await expectTile(page, "roles");
  await expectTile(page, "room-types");
  await expectNoTiles(page, ["settings", "servers", "server-pools"]);

  await page.getByTestId("admin-users-link").click();

  await expect(page).toHaveURL(/\/admin\/users/);
});

test("open admin roles", async ({ page, currentUser }) => {
  currentUser.data.permissions = ["admin.view", "roles.viewAny"];
  await interceptAdminRolesIndexRequests(page);

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "roles");
  await expectTile(page, "room-types");
  await expectNoTiles(page, ["settings", "users", "servers", "server-pools"]);

  await page.getByTestId("admin-roles-link").click();

  await expect(page).toHaveURL(/\/admin\/roles/);
});

test("open admin room types", async ({ page }) => {
  await interceptAdminRoomTypesIndexRequests(page);

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "room-types");
  await expectNoTiles(page, [
    "settings",
    "users",
    "roles",
    "servers",
    "server-pools",
  ]);

  await page.getByTestId("admin-room-types-link").click();

  await expect(page).toHaveURL(/\/admin\/room_types/);
});

test("open admin servers", async ({ page, currentUser }) => {
  currentUser.data.permissions = ["admin.view", "servers.viewAny"];
  await interceptAdminServersIndexRequests(page);

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "servers");
  await expectTile(page, "room-types");
  await expectNoTiles(page, ["settings", "users", "roles", "server-pools"]);

  await page.getByTestId("admin-servers-link").click();

  await expect(page).toHaveURL(/\/admin\/servers/);
});

test("open admin server pools", async ({ page, currentUser }) => {
  currentUser.data.permissions = ["admin.view", "serverPools.viewAny"];
  await interceptAdminServerPoolsIndexRequests(page);

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "server-pools");
  await expectTile(page, "room-types");
  await expectNoTiles(page, ["settings", "users", "roles", "servers"]);

  await page.getByTestId("admin-server-pools-link").click();

  await expect(page).toHaveURL(/\/admin\/server_pools/);
});

test("open admin streaming", async ({ page, config, currentUser }) => {
  config.data.streaming.enabled = true;
  currentUser.data.permissions = ["admin.view", "streaming.viewAny"];
  await interceptAdminStreamingIndexRequests(page);

  await page.goto("/admin");

  await expectAdminHeader(page);
  await expectTile(page, "streaming");
  await expectTile(page, "room-types");
  await expectNoTiles(page, [
    "settings",
    "users",
    "roles",
    "servers",
    "server-pools",
  ]);

  await page.getByTestId("admin-streaming-link").click();

  await expect(page).toHaveURL(/\/admin\/streaming_settings/);
});
