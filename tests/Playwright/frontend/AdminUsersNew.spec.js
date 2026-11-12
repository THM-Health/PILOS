import { readFileSync } from "node:fs";
import { test, expect, expectToastAndClose } from "../support/test.js";
import {
  expectAdminBreadcrumbs,
  expectMultiselectOptions,
} from "../support/admin.js";
import { interceptAdminUsersNewRequests } from "../support/mocks.js";
import {
  testVisitWithoutCurrentUser,
  expectLoginRedirect,
} from "../support/general.js";
import { mockMethod, nthRequest } from "../support/utils.js";

const readFixture = (name) =>
  JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));

const ROLES_URL = "**/api/v1/roles*";
const TIMEZONES_URL = "**/api/v1/getTimezones";
const USERS_URL = "**/api/v1/users";
const NO_ROLES_TEXT = "admin.roles.no_data";

const serverErrorToast = [
  'app.flash.server_error.message_{"message":"Test"}',
  'app.flash.server_error.error_code_{"statusCode":500}',
];

const secondRolesPage = {
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
};

const defaultPermissions = [
  "admin.view",
  "users.viewAny",
  "users.view",
  "users.update",
  "users.create",
  "users.delete",
  "roles.viewAny",
];

test.use({ authenticated: true });

test.describe("Admin users new", () => {
  test.beforeEach(async ({ page, currentUser, config }) => {
    currentUser.data.permissions = [...defaultPermissions];
    config.data.auth.local = true;
    await interceptAdminUsersNewRequests(page);
  });

  test("visit with user that is not logged in", async ({ page }) => {
    await testVisitWithoutCurrentUser(page, "/admin/users/new");
  });

  test("visit with user without permission to add new users", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.permissions = [
      "admin.view",
      "users.viewAny",
      "users.view",
      "users.update",
      "roles.viewAny",
    ];

    await page.goto("/admin/users/new");

    await expectToastAndClose(page, "app.flash.unauthorized");

    // Check if the welcome page is shown
    await expect(page.locator("h1")).toContainText("home.title");
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test("visit with local auth disabled", async ({ page, config }) => {
    config.data.auth = {};

    await page.goto("/admin/users/new");

    await expect(page).toHaveURL(/\/404/);
    await expect(page).not.toHaveURL(/\/admin\/users\/new/);
  });

  test.describe("form", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/new");
      await expect(
        page.getByText("rooms.settings.general.title"),
      ).toBeVisible();
    });

    test("initial state", async ({ page }) => {
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.users.index",
        "admin.breadcrumbs.users.new",
      );

      const firstname = page.getByTestId("firstname-field");
      await expect(firstname).toContainText("app.firstname");
      await expect(firstname.locator("#firstname")).toHaveValue("");

      const lastname = page.getByTestId("lastname-field");
      await expect(lastname).toContainText("app.lastname");
      await expect(lastname.locator("#lastname")).toHaveValue("");

      const email = page.getByTestId("email-field");
      await expect(email).toContainText("app.email");
      await expect(email.locator("#email")).toHaveValue("");

      const locale = page.getByTestId("locale-field");
      await expect(locale).toContainText("admin.users.user_locale");
      await expect(locale.getByTestId("locale-dropdown")).toHaveText("English");

      const timezone = page.getByTestId("timezone-field");
      await expect(timezone).toContainText("admin.users.timezone");
      await expect(timezone.getByTestId("timezone-dropdown")).toHaveText("UTC");

      const roles = page.getByTestId("role-field");
      await expect(roles).toContainText("app.roles");
      await expect(roles.locator(".multiselect__tags")).toContainText(
        "admin.roles.select_roles",
      );
      await expect(roles.getByTestId("role-chip")).toHaveCount(0);

      const generatePassword = page.getByTestId("generate-password-field");
      await expect(generatePassword).toContainText(
        "admin.users.generate_password",
      );
      await expect(generatePassword).toContainText(
        "admin.users.generate_password_description",
      );
      await expect(
        generatePassword.locator("#generate_password"),
      ).not.toBeChecked();

      const password = page.getByTestId("new-password-field");
      await expect(password).toContainText("auth.new_password");
      await expect(password.locator("#new_password")).toHaveValue("");

      const passwordConfirmation = page.getByTestId(
        "new-password-confirmation-field",
      );
      await expect(passwordConfirmation).toContainText(
        "auth.new_password_confirmation",
      );
      await expect(
        passwordConfirmation.locator("#new_password_confirmation"),
      ).toHaveValue("");
    });

    test("breadcrumbs stay the same while typing", async ({ page }) => {
      await page.locator("#firstname").fill("Max");
      await page.locator("#lastname").fill("Doe");

      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.users.index",
        "admin.breadcrumbs.users.new",
      );
    });

    test("change locale", async ({ page }) => {
      await expect(page.getByTestId("locale-dropdown-items")).toHaveCount(0);
      await page.getByTestId("locale-dropdown").click();

      const items = page.getByTestId("locale-dropdown-items");
      await expect(items).toBeVisible();
      const options = items.getByTestId("locale-dropdown-option");
      await expect(options).toHaveText(["Deutsch", "English", "Français"]);
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

      await options.nth(0).click();

      await expect(items).toHaveCount(0);
      await expect(page.getByTestId("locale-dropdown")).toHaveText("Deutsch");
    });

    test("change timezone", async ({ page }) => {
      await expect(page.getByTestId("timezone-dropdown-items")).toHaveCount(0);
      await page.getByTestId("timezone-dropdown").click();

      const items = page.getByTestId("timezone-dropdown-items");
      await expect(items).toBeVisible();
      const options = items.getByTestId("timezone-dropdown-option");
      await expect(options).toHaveText([
        "America/New_York",
        "Australia/Sydney",
        "Europe/Berlin",
        "UTC",
      ]);
      await expect(options.nth(3)).toHaveAttribute("aria-selected", "true");

      await options.nth(2).click();

      await expect(items).toHaveCount(0);
      await expect(page.getByTestId("timezone-dropdown")).toHaveText(
        "Europe/Berlin",
      );
    });

    test("select and remove roles", async ({ page }) => {
      await expect(page.locator(".multiselect__content")).toHaveCount(0);
      await page
        .getByTestId("role-dropdown")
        .locator(".multiselect__tags")
        .click();

      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();
      await expectMultiselectOptions(
        content,
        ["Superuser", "Staff", "Students"],
        NO_ROLES_TEXT,
      );
      await expect(
        content.locator(".multiselect__option").first(),
      ).toContainText("admin.roles.superuser");

      const options = content.locator(".multiselect__option");
      const chips = page.getByTestId("role-dropdown").getByTestId("role-chip");

      await options.nth(1).click();
      await expect(content).toBeVisible();
      await expect(chips).toHaveCount(1);
      await expect(chips.nth(0)).toHaveText("Staff");
      // Cannot be removed
      await expect(chips.nth(0).getByTestId("remove-role-button")).toHaveCount(
        0,
      );

      await options.nth(2).click();
      await expect(content).toBeVisible();
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Staff");
      await expect(
        chips.nth(0).getByTestId("remove-role-button"),
      ).toBeVisible();
      await expect(chips.nth(1)).toContainText("Students");

      await chips.nth(1).getByTestId("remove-role-button").click();

      // Dialog is closed
      await expect(content).toHaveCount(0);
      await expect(chips).toHaveCount(1);
      await expect(chips.nth(0)).toContainText("Staff");
    });

    test("generate password toggles the password fields", async ({ page }) => {
      await expect(page.getByTestId("new-password-field")).toBeVisible();
      await expect(
        page.getByTestId("new-password-confirmation-field"),
      ).toBeVisible();

      await page.locator("#generate_password").click();

      await expect(page.locator("#generate_password")).toBeChecked();
      await expect(page.getByTestId("new-password-field")).toHaveCount(0);
      await expect(
        page.getByTestId("new-password-confirmation-field"),
      ).toHaveCount(0);
    });
  });

  test.describe("save", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/new");
      await expect(
        page.getByText("rooms.settings.general.title"),
      ).toBeVisible();
    });

    test("add new user with custom password and 1 role", async ({ page }) => {
      await page.locator("#firstname").fill("Max");
      await page.locator("#lastname").fill("Doe");
      await page.locator("#email").fill("maxdoe@domain.tld");

      await page.getByTestId("locale-dropdown").click();
      await page.getByTestId("locale-dropdown-option").nth(0).click();

      await page.getByTestId("timezone-dropdown").click();
      await page.getByTestId("timezone-dropdown-option").nth(2).click();

      await page
        .getByTestId("role-dropdown")
        .locator(".multiselect__tags")
        .click();
      await page.locator(".multiselect__option").nth(1).click();
      await page
        .getByTestId("role-dropdown")
        .locator(".multiselect__select")
        .click();
      await expect(page.locator(".multiselect__content")).toHaveCount(0);

      await page.locator("#new_password").fill("Password!123");
      await page.locator("#new_password_confirmation").fill("Password!123");

      const user = readFixture("userDataUser.json");
      user.data.id = 20;
      user.data.firstname = "Max";
      user.data.lastname = "Doe";
      user.data.email = "maxdoe@domain.tld";
      user.data.roles = [{ id: 2, name: "Staff" }];
      user.data.locale = "de";
      user.data.timezone = "Europe/Berlin";

      const newUser = await mockMethod(page, "POST", USERS_URL, {
        status: 201,
        json: user,
      });
      await mockMethod(page, "GET", "**/api/v1/users/20", { json: user });

      await page.getByTestId("users-new-save-button").click();

      expect((await nthRequest(newUser)).postDataJSON()).toEqual({
        firstname: "Max",
        lastname: "Doe",
        email: "maxdoe@domain.tld",
        user_locale: "de",
        timezone: "Europe/Berlin",
        roles: [2],
        generate_password: false,
        new_password: "Password!123",
        new_password_confirmation: "Password!123",
      });

      await expect(page).toHaveURL(/\/admin\/users\/20/);
      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expectAdminBreadcrumbs(
        page,
        "admin.breadcrumbs.users.index",
        'admin.breadcrumbs.users.view_{"firstname":"Max","lastname":"Doe"}',
      );
    });

    test("loading state while saving", async ({ page }) => {
      const user = readFixture("userDataUser.json");
      user.data.id = 20;

      const newUser = await mockMethod(page, "POST", USERS_URL, {
        status: 201,
        json: user,
        hold: true,
      });
      await mockMethod(page, "GET", "**/api/v1/users/20", { json: user });

      await expect(page.getByTestId("overlay")).toHaveCount(0);
      await expect(page.getByTestId("users-new-save-button")).toHaveText(
        "app.save",
      );
      await page.getByTestId("users-new-save-button").click();

      await expect(page.getByTestId("overlay")).toBeVisible();
      await expect(page.locator("#firstname")).toBeDisabled();
      await expect(page.locator("#lastname")).toBeDisabled();
      await expect(page.locator("#email")).toBeDisabled();
      await expect(
        page.getByTestId("locale-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(
        page.getByTestId("timezone-dropdown").locator(".p-select-label"),
      ).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.locator("#generate_password")).toBeDisabled();
      await expect(page.locator("#new_password")).toBeDisabled();
      await expect(page.locator("#new_password_confirmation")).toBeDisabled();
      await expect(page.getByTestId("users-new-save-button")).toBeDisabled();

      newUser.release();

      await expect(page).toHaveURL(/\/admin\/users\/20/);
    });

    test("add new user with generated password and several roles", async ({
      page,
    }) => {
      await page.locator("#firstname").fill("Max");
      await page.locator("#lastname").fill("Doe");
      await page.locator("#email").fill("maxdoe@domain.tld");

      await expect(page.getByTestId("locale-dropdown")).toHaveText("English");
      await expect(page.getByTestId("timezone-dropdown")).toHaveText("UTC");

      await page
        .getByTestId("role-dropdown")
        .locator(".multiselect__tags")
        .click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      // Switch to next page
      await mockMethod(page, "GET", ROLES_URL, { json: secondRolesPage });
      await content.getByTestId("next-page-button").click();

      await expectMultiselectOptions(
        content,
        ["Dean", "Faculty", "Manager"],
        NO_ROLES_TEXT,
      );

      await content.locator(".multiselect__option").nth(0).click();
      await content.locator(".multiselect__option").nth(2).click();

      const chips = page.getByTestId("role-dropdown").getByTestId("role-chip");
      await expect(content).toBeVisible();
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(0)).toContainText("Dean");
      await expect(
        chips.nth(0).getByTestId("remove-role-button"),
      ).toBeVisible();
      await expect(chips.nth(1)).toContainText("Manager");
      await expect(
        chips.nth(1).getByTestId("remove-role-button"),
      ).toBeVisible();

      // Close dialog
      await page.locator(".multiselect__select").click();
      await expect(content).toHaveCount(0);

      await page.locator("#generate_password").click();

      const user = readFixture("userDataUser.json");
      user.data.id = 20;
      user.data.roles = [
        { id: 4, name: "Dean" },
        { id: 6, name: "Manager" },
      ];
      const newUser = await mockMethod(page, "POST", USERS_URL, {
        status: 201,
        json: user,
      });
      await mockMethod(page, "GET", "**/api/v1/users/20", { json: user });

      await page.getByTestId("users-new-save-button").click();

      expect((await nthRequest(newUser)).postDataJSON()).toEqual({
        firstname: "Max",
        lastname: "Doe",
        email: "maxdoe@domain.tld",
        user_locale: "en",
        timezone: "UTC",
        roles: [4, 6],
        generate_password: true,
      });

      await expect(page).toHaveURL(/\/admin\/users\/20/);
    });

    test("roles pagination and loading state", async ({ page }) => {
      await page
        .getByTestId("role-dropdown")
        .locator(".multiselect__tags")
        .click();
      const content = page.locator(".multiselect__content");
      await expect(content).toBeVisible();

      const previous = content.getByTestId("previous-page-button");
      const next = content.getByTestId("next-page-button");
      await expect(previous).toContainText("app.previous_page");
      await expect(previous).toBeDisabled();
      await expect(next).toContainText("app.next_page");
      await expect(next).toBeEnabled();

      const rolesRequest = await mockMethod(page, "GET", ROLES_URL, {
        json: secondRolesPage,
        hold: true,
      });

      await next.click();

      // Check loading
      await expect(previous).toBeDisabled();
      await expect(next).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-new-save-button")).toBeDisabled();

      rolesRequest.release();
      await nthRequest(rolesRequest);

      await expect(previous).toBeEnabled();
      await expect(next).toBeDisabled();
      await expectMultiselectOptions(
        content,
        ["Dean", "Faculty", "Manager"],
        NO_ROLES_TEXT,
      );
    });
  });

  test.describe("save errors", () => {
    const errorMessages = {
      "firstname-field": "The Firstname field is required.",
      "lastname-field": "The Lastname field is required.",
      "email-field": "The Email field is required.",
      "locale-field": "The user locale field is required.",
      "timezone-field": "The timezone field is required.",
      "role-field": "The Roles field is required.",
      "generate-password-field": "The generate password field is required.",
      "new-password-field":
        "The New password field is required when generate password is false.",
      "new-password-confirmation-field":
        "The new password confirmation field is required.",
    };

    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users/new");
      await expect(page.getByTestId("locale-dropdown")).toHaveText("English");
      await expect(page.getByTestId("timezone-dropdown")).toHaveText("UTC");

      await page.locator("#firstname").fill("Max");
      await page.locator("#lastname").fill("Doe");
      await page.locator("#email").fill("maxdoe@domain.tld");
      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await page.locator(".multiselect__option").nth(0).click();
      await page.locator(".multiselect__select").click();
      await expect(page.locator(".multiselect__content")).toHaveCount(0);
      await page.locator("#new_password").fill("Password!123");
      await page.locator("#new_password_confirmation").fill("Password!123");
    });

    test("422 error shows messages at the fields", async ({ page }) => {
      const newUser = await mockMethod(page, "POST", USERS_URL, {
        status: 422,
        json: {
          message: "The Firstname field is required. (and 8 more errors)",
          errors: {
            firstname: ["The Firstname field is required."],
            lastname: ["The Lastname field is required."],
            email: ["The Email field is required."],
            user_locale: ["The user locale field is required."],
            timezone: ["The timezone field is required."],
            roles: ["The Roles field is required."],
            generate_password: ["The generate password field is required."],
            new_password: [errorMessages["new-password-field"]],
            new_password_confirmation: [
              errorMessages["new-password-confirmation-field"],
            ],
          },
        },
      });

      await page.getByTestId("users-new-save-button").click();
      await nthRequest(newUser);

      await expectToastAndClose(
        page,
        "The Firstname field is required. (and 8 more errors)",
      );

      for (const [field, message] of Object.entries(errorMessages)) {
        await expect(page.getByTestId(field)).toContainText(message);
      }
    });

    test("500 error hides the 422 error messages", async ({ page }) => {
      const validationError = await mockMethod(page, "POST", USERS_URL, {
        status: 422,
        json: {
          message: "The Firstname field is required.",
          errors: {
            firstname: ["The Firstname field is required."],
            lastname: ["The Lastname field is required."],
            email: ["The Email field is required."],
            user_locale: ["The user locale field is required."],
            timezone: ["The timezone field is required."],
            roles: ["The Roles field is required."],
            generate_password: ["The generate password field is required."],
            new_password: [errorMessages["new-password-field"]],
            new_password_confirmation: [
              errorMessages["new-password-confirmation-field"],
            ],
          },
        },
      });
      await page.getByTestId("users-new-save-button").click();
      await nthRequest(validationError);
      await expectToastAndClose(page, "The Firstname field is required.");
      await expect(page.getByTestId("firstname-field")).toContainText(
        errorMessages["firstname-field"],
      );

      const serverError = await mockMethod(page, "POST", USERS_URL, {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("users-new-save-button").click();
      await nthRequest(serverError);

      await expectToastAndClose(page, serverErrorToast);

      for (const [field, message] of Object.entries(errorMessages)) {
        await expect(page.getByTestId(field)).not.toContainText(message);
      }
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockMethod(page, "POST", USERS_URL, { status: 401 });

      await page.getByTestId("users-new-save-button").click();

      await expectLoginRedirect(page, "/admin/users/new");
    });
  });

  test.describe("load timezones errors", () => {
    test("500 error and reload", async ({ page }) => {
      const timezones = await mockMethod(page, "GET", TIMEZONES_URL, {
        status: 500,
        json: { message: "Test" },
        hold: true,
      });

      await page.goto("/admin/users/new");

      // Check loading
      await expect(page.getByTestId("users-new-save-button")).toBeDisabled();
      const dropdownLabel = page
        .getByTestId("timezone-dropdown")
        .locator(".p-select-label");
      await expect(dropdownLabel).toHaveAttribute("aria-disabled", "true");

      timezones.release();
      await nthRequest(timezones);

      await expectToastAndClose(page, serverErrorToast);

      await expect(page.getByTestId("timezone-dropdown")).toHaveText(
        "admin.users.timezone",
      );
      await expect(dropdownLabel).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("users-new-save-button")).toBeDisabled();

      // Reload timezones without errors
      const reloaded = await mockMethod(page, "GET", TIMEZONES_URL, {
        json: readFixture("timezones.json"),
      });
      await page.getByTestId("timezone-reload-button").click();
      await nthRequest(reloaded);

      await expect(page.getByTestId("users-new-save-button")).toBeEnabled();
      await expect(page.getByTestId("timezone-dropdown")).toHaveText("UTC");
      await expect(dropdownLabel).not.toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("timezone-reload-button")).toHaveCount(0);

      await page.getByTestId("timezone-dropdown").click();
      await expect(page.getByTestId("timezone-dropdown-option")).toHaveCount(4);
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockMethod(page, "GET", TIMEZONES_URL, { status: 401 });

      await page.goto("/admin/users/new");

      await expectLoginRedirect(page, "/admin/users/new");
    });
  });

  test("superuser role is disabled for users that are not superusers", async ({
    page,
    currentUser,
  }) => {
    currentUser.data.superuser = false;
    currentUser.data.permissions = defaultPermissions.filter(
      (permission) => permission !== "users.delete",
    );

    await page.goto("/admin/users/new");
    await page.getByTestId("role-dropdown").click();

    const content = page.locator(".multiselect__content");
    await expect(content).toBeVisible();
    await expectMultiselectOptions(
      content,
      ["Superuser", "Staff", "Students"],
      NO_ROLES_TEXT,
    );

    const options = content.locator(".multiselect__option");
    await expect(options.nth(0)).toContainText("admin.roles.superuser");
    await expect(options.nth(0)).not.toContainText("admin.roles.automatic");
    await expect(options.nth(0)).toHaveClass(/multiselect__option--disabled/);

    for (const [index, name] of ["Staff", "Students"].entries()) {
      const option = options.nth(index + 1);
      await expect(option).toContainText(name);
      await expect(option).not.toContainText("admin.roles.superuser");
      await expect(option).not.toContainText("admin.roles.automatic");
      await expect(option).not.toHaveClass(/multiselect__option--disabled/);
    }
    await expect(options.nth(1)).not.toHaveClass(
      /multiselect__option--selected/,
    );
  });

  test.describe("load roles errors", () => {
    test("500 error and reload", async ({ page }) => {
      const roles = await mockMethod(page, "GET", ROLES_URL, {
        status: 500,
        json: { message: "Test" },
        hold: true,
      });

      await page.goto("/admin/users/new");

      // Check loading
      await expect(page.getByTestId("users-new-save-button")).toBeDisabled();
      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );

      roles.release();
      await nthRequest(roles);

      await expectToastAndClose(page, serverErrorToast);

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-new-save-button")).toBeDisabled();

      // Reload roles without errors
      const reloaded = await mockMethod(page, "GET", ROLES_URL, {
        json: readFixture("roles.json"),
      });
      await page.getByTestId("roles-reload-button").click();
      await nthRequest(reloaded);

      await expect(page.getByTestId("role-dropdown")).not.toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("users-new-save-button")).toBeEnabled();
      await expect(page.getByTestId("roles-reload-button")).toHaveCount(0);

      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();
      await expect(page.locator(".multiselect__option")).toHaveCount(5);
    });

    test("500 error when switching pages", async ({ page }) => {
      await page.goto("/admin/users/new");
      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      const roles = await mockMethod(page, "GET", ROLES_URL, {
        status: 500,
        json: { message: "Test" },
      });
      await page.getByTestId("next-page-button").click();
      await nthRequest(roles);

      await expectToastAndClose(page, serverErrorToast);

      await expect(page.getByTestId("role-dropdown")).toHaveClass(
        /multiselect--disabled/,
      );
      await expect(page.getByTestId("roles-reload-button")).toBeVisible();
      await expect(page.getByTestId("users-new-save-button")).toBeDisabled();
    });

    test("401 error redirects to login", async ({ page }) => {
      await mockMethod(page, "GET", ROLES_URL, { status: 401 });

      await page.goto("/admin/users/new");

      await expectLoginRedirect(page, "/admin/users/new");
    });

    test("401 error when switching pages redirects to login", async ({
      page,
    }) => {
      await page.goto("/admin/users/new");
      await page.getByTestId("role-dropdown").click();
      await expect(page.locator(".multiselect__content")).toBeVisible();

      await mockMethod(page, "GET", ROLES_URL, { status: 401 });
      await page.getByTestId("next-page-button").click();

      await expectLoginRedirect(page, "/admin/users/new");
    });
  });
});
