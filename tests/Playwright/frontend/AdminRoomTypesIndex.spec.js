import { mergeTests } from "@playwright/test";
import { test as roomTypeControllerTest } from "../support/fixtures/roomTypeController.js";
import { test as serverPoolControllerTest } from "../support/fixtures/serverPoolController.js";
import { test as roleControllerTest } from "../support/fixtures/roleController.js";
import { expect, expectToastAndClose } from "../support/test.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { expectAdminBreadcrumbs } from "../support/admin.js";
import {
  holdApiRequest,
  expectActivePage,
  mockApiRequest,
  serverError,
} from "../support/utils.js";

const test = mergeTests(
  roomTypeControllerTest,
  serverPoolControllerTest,
  roleControllerTest,
);

test.describe("Admin room types index", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ currentUserResponse }) => {
    currentUserResponse.data.permissions = ["admin.view"];
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/room_types");
  });

  test.describe("load room types", () => {
    test("loading state", async ({ page, getRoomTypesApiMock }) => {
      const release = await holdApiRequest(page, "roomTypes*", {
        json: getRoomTypesApiMock.json,
      });

      await page.goto("/admin/room_types");

      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();

      const search = page.getByTestId("room-type-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(page.getByTestId("room-types-add-button")).toHaveCount(0);
      await expect(page.getByTestId("overlay")).toBeVisible();

      const response = page.waitForResponse("**/api/v1/roomTypes*");
      release();
      await response;

      // Check that loading is over
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("room-types-add-button")).toHaveCount(0);
      await expect(page.getByTestId("room-type-item")).toHaveCount(2);
    });

    test("breadcrumb", async ({ page }) => {
      await page.goto("/admin/room_types");

      await expectAdminBreadcrumbs(page, "admin.breadcrumbs.room_types.index");
    });

    test("table headers and room types", async ({ page }) => {
      await page.goto("/admin/room_types");

      const headers = page.getByTestId("room-type-header-cell");
      await expect(headers).toHaveCount(1);
      await expect(headers.nth(0)).toHaveText("app.model_name");

      const items = page.getByTestId("room-type-item");
      await expect(items).toContainText(["Exam", "Lecture"]);
      await expect(
        items.nth(0).getByTestId("room-type-item-cell").nth(0),
      ).toHaveText("Exam");
      await expect(
        items.nth(1).getByTestId("room-type-item-cell").nth(0),
      ).toHaveText("Lecture");
    });

    test("no data", async ({ page, getRoomTypesApiMock }) => {
      getRoomTypesApiMock.json.data = [];

      await page.goto("/admin/room_types");

      await expect(page.getByText("admin.room_types.no_data")).toBeVisible();
      await expect(page.getByTestId("room-type-item")).toHaveCount(0);
    });
  });

  test.describe("load room types errors", () => {
    test("server error shows toast and overlay", async ({ page }) => {
      await mockApiRequest(page, "GET", "roomTypes*", serverError());

      await page.goto("/admin/room_types");

      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      // Check that overlay is shown and the components are not disabled
      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("room-type-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();

      const retryButton = page.getByTestId("loading-retry-button");
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toHaveText("app.reload");
    });

    test("reload after error", async ({ page, getRoomTypesApiMock }) => {
      await mockApiRequest(page, "GET", "roomTypes*", serverError());
      await page.goto("/admin/room_types");
      await expectToastAndClose(page, [
        'app.flash.server_error.message_{"message":"Test"}',
        'app.flash.server_error.error_code_{"statusCode":500}',
      ]);

      await mockApiRequest(page, "GET", "roomTypes*", {
        json: getRoomTypesApiMock.json,
      });

      const request = page.waitForRequest("**/api/v1/roomTypes*");
      await page.getByTestId("loading-retry-button").click();
      await request;

      // Check that overlay is not shown anymore
      await expect(page.getByTestId("overlay")).toBeHidden();
      await expect(page.getByTestId("loading-retry-button")).toHaveCount(0);

      await expect(page.getByTestId("room-type-item")).toContainText([
        "Exam",
        "Lecture",
      ]);
    });

    test("unauthenticated redirects to login", async ({ page }) => {
      await mockApiRequest(page, "GET", "roomTypes*", { status: 401 });

      await page.goto("/admin/room_types");

      await expectLoginRedirect(page, "/admin/room_types");
    });
  });

  test.describe("room type search and sorting", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/room_types");
      await expect(page.getByTestId("room-type-item")).toContainText([
        "Exam",
        "Lecture",
      ]);
    });

    test("pagination", async ({ page }) => {
      await expect(page.getByTestId("paginator-page")).toHaveCount(2);
      await expectActivePage(page, 0);

      // there are two paginator components (first one for small devices, second one for larger devices)
      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectActivePage(page, 1);
      await expect(page.getByTestId("room-type-item")).toContainText([
        "Meeting",
        "Seminar",
      ]);
    });

    test("search without results", async ({ page }) => {
      const search = page.getByTestId("room-type-search");
      await search.locator("input").fill("Search without results");
      await search.locator("button").click();

      await expect(page.getByTestId("room-type-item")).toHaveCount(0);
      await expect(
        page.getByText("admin.room_types.no_data_filtered"),
      ).toBeVisible();
    });

    test("search by clicking the button resets the page", async ({ page }) => {
      await page.getByTestId("paginator-next-button").nth(1).click();
      await expectActivePage(page, 1);

      const search = page.getByTestId("room-type-search");
      await search.locator("input").fill("Exam");
      await search.locator("button").click();

      await expect(page.getByTestId("room-type-item")).toContainText(["Exam"]);
      await expect(page.getByTestId("paginator-page")).toHaveCount(1);
      await expectActivePage(page, 0);
    });

    test("search by pressing enter", async ({ page }) => {
      const search = page.getByTestId("room-type-search");
      await search.locator("input").fill("e");
      await search.locator("input").press("Enter");

      await expect(page.getByTestId("room-type-item")).toContainText([
        "Exam",
        "Lecture",
      ]);
      await expect(page.getByTestId("paginator-page")).toHaveCount(2);
      await expectActivePage(page, 0);

      await page.getByTestId("paginator-next-button").nth(1).click();

      await expectActivePage(page, 1);
      await expect(page.getByTestId("room-type-item")).toContainText([
        "Meeting",
        "Seminar",
      ]);
    });

    test("change sort order resets the page", async ({ page }) => {
      await page.getByTestId("paginator-next-button").nth(1).click();
      await expectActivePage(page, 1);
      await expect(page.getByTestId("room-type-item")).toContainText([
        "Meeting",
        "Seminar",
      ]);

      await page.getByTestId("room-type-header-cell").nth(0).click();

      await expect(page.getByTestId("room-type-item")).toContainText([
        "Seminar",
        "Meeting",
      ]);
      await expect(page.getByTestId("paginator-page")).toHaveCount(2);
      await expectActivePage(page, 0);
    });
  });

  test.describe("button visibility", () => {
    const permissionCases = [
      {
        name: "view permission",
        permissions: ["admin.view", "roomTypes.view"],
        add: false,
        edit: false,
        delete: false,
      },
      {
        name: "update permission",
        permissions: [
          "admin.view",
          "roles.viewAny",
          "serverPools.viewAny",
          "roomTypes.view",
          "roomTypes.update",
        ],
        add: false,
        edit: true,
        delete: false,
      },
      {
        name: "add permission",
        permissions: [
          "admin.view",
          "roles.viewAny",
          "serverPools.viewAny",
          "roomTypes.view",
          "roomTypes.update",
          "roomTypes.create",
        ],
        add: true,
        edit: true,
        delete: false,
      },
      {
        name: "delete permission",
        permissions: [
          "admin.view",
          "roles.viewAny",
          "serverPools.viewAny",
          "roomTypes.view",
          "roomTypes.update",
          "roomTypes.create",
          "roomTypes.delete",
        ],
        add: true,
        edit: true,
        delete: true,
      },
    ];

    for (const permissionCase of permissionCases) {
      test(`with ${permissionCase.name}`, async ({
        page,
        currentUserResponse,
      }) => {
        currentUserResponse.data.permissions = permissionCase.permissions;

        await page.goto("/admin/room_types");

        await expect(page.getByTestId("room-type-item")).toContainText([
          "Exam",
          "Lecture",
        ]);

        const addButton = page.getByTestId("room-types-add-button");
        if (permissionCase.add) {
          await expect(addButton).toBeVisible();
          await expect(addButton).toHaveAttribute(
            "href",
            "/admin/room_types/new",
          );
        } else {
          await expect(addButton).toHaveCount(0);
        }

        for (const [index, id] of [3, 1].entries()) {
          const item = page.getByTestId("room-type-item").nth(index);

          const viewButton = item.getByTestId("room-types-view-button");
          await expect(viewButton).toBeVisible();
          await expect(viewButton).toHaveAttribute(
            "href",
            `/admin/room_types/${id}`,
          );

          const editButton = item.getByTestId("room-types-edit-button");
          if (permissionCase.edit) {
            await expect(editButton).toBeVisible();
            await expect(editButton).toHaveAttribute(
              "href",
              `/admin/room_types/${id}/edit`,
            );
          } else {
            await expect(editButton).toHaveCount(0);
          }

          const deleteButton = item.getByTestId("room-types-delete-button");
          if (permissionCase.delete) {
            await expect(deleteButton).toBeVisible();
          } else {
            await expect(deleteButton).toHaveCount(0);
          }
        }
      });
    }
  });

  test.describe("loading state during reload", () => {
    let deleteRoomTypeApiMock;

    test.beforeEach(async ({ page, currentUserResponse }) => {
      currentUserResponse.data.permissions = [
        "admin.view",
        "roles.viewAny",
        "serverPools.viewAny",
        "roomTypes.view",
        "roomTypes.update",
        "roomTypes.create",
        "roomTypes.delete",
      ];
      deleteRoomTypeApiMock = await mockApiRequest(
        page,
        "DELETE",
        "roomTypes/3",
        {
          status: 204,
        },
      );

      await page.goto("/admin/room_types");
      await expect(page.getByTestId("room-type-item")).toContainText([
        "Exam",
        "Lecture",
      ]);

      // Trigger reload by deleting a room type
      const replacementRequest = page.waitForRequest("**/api/v1/roomTypes*");
      await page
        .getByTestId("room-type-item")
        .nth(0)
        .getByTestId("room-types-delete-button")
        .click();
      await replacementRequest;
    });

    test("components are disabled while reloading", async ({
      page,
      getRoomTypesApiMock,
    }) => {
      const release = await holdApiRequest(page, "roomTypes*", {
        json: getRoomTypesApiMock.json,
      });

      await page
        .getByTestId("room-types-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();

      await deleteRoomTypeApiMock.waitForRequest();
      await expect(page.getByTestId("overlay")).toBeVisible();
      const search = page.getByTestId("room-type-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeDisabled();
      await expect(search.locator("button")).toBeDisabled();
      await expect(page.getByTestId("room-types-add-button")).toBeEnabled();

      const item = page.getByTestId("room-type-item").nth(0);
      await expect(
        item.locator('button[data-test="room-types-view-button"]'),
      ).toBeDisabled();
      await expect(
        item.locator('button[data-test="room-types-edit-button"]'),
      ).toBeDisabled();
      await expect(item.getByTestId("room-types-delete-button")).toBeDisabled();

      release();

      await expect(page.getByTestId("overlay")).toBeHidden();
    });

    test("components are enabled after reloading", async ({ page }) => {
      const reloadRequest = page.waitForResponse("**/api/v1/roomTypes*");
      await page
        .getByTestId("room-types-delete-dialog")
        .getByTestId("dialog-continue-button")
        .click();
      await reloadRequest;
      await deleteRoomTypeApiMock.waitForRequest();

      await expect(page.getByTestId("overlay")).toBeHidden();
      const search = page.getByTestId("room-type-search");
      await expect(search.locator("input")).toBeVisible();
      await expect(search.locator("button")).toBeVisible();
      await expect(search.locator("input")).toBeEnabled();
      await expect(search.locator("button")).toBeEnabled();
      await expect(page.getByTestId("room-types-add-button")).toBeEnabled();

      const item = page.getByTestId("room-type-item").nth(0);
      await expect(
        item.locator('a[data-test="room-types-view-button"]'),
      ).toHaveAttribute("href", "/admin/room_types/3");
      await expect(
        item.locator('a[data-test="room-types-edit-button"]'),
      ).toHaveAttribute("href", "/admin/room_types/3/edit");
      await expect(item.getByTestId("room-types-delete-button")).toBeEnabled();
    });
  });
});
