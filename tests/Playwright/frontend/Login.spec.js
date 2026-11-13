import { test } from "../support/fixtures/authGeneral.js";
import { expect, expectToastAndClose } from "../support/test.js";
import { interceptRoomIndexRequests } from "../support/mocks.js";
import { mockApiRequest, validationErrors } from "../support/utils.js";

test.describe("Login tabs", () => {
  test("hide ldap login if disabled", async ({ page, configResponse }) => {
    configResponse.data.auth.local = true;
    configResponse.data.auth.ldap = false;

    await page.goto("/login");

    await expect(page.getByTestId("login-tab-button-local")).toBeVisible();
    await expect(page.getByTestId("login-tab-button-ldap")).toBeHidden();
  });

  test("hide local login if disabled", async ({ page, configResponse }) => {
    configResponse.data.auth.local = false;
    configResponse.data.auth.ldap = true;

    await page.goto("/login");

    await expect(page.getByTestId("login-tab-button-ldap")).toBeVisible();
    await expect(page.getByTestId("login-tab-button-local")).toBeHidden();
  });

  test("hide shibboleth login if disabled", async ({
    page,
    configResponse,
  }) => {
    configResponse.data.auth.local = true;
    configResponse.data.auth.shibboleth = false;

    await page.goto("/login");

    await expect(page.getByTestId("login-tab-button-local")).toBeVisible();
    await expect(page.getByTestId("login-tab-button-shibboleth")).toBeHidden();
  });

  test("hide oidc login if disabled", async ({ page, configResponse }) => {
    configResponse.data.auth.local = true;
    configResponse.data.auth.oidc = false;

    await page.goto("/login");

    await expect(page.getByTestId("login-tab-button-local")).toBeVisible();
    await expect(page.getByTestId("login-tab-button-oidc")).toBeHidden();
  });
});

for (const form of [
  {
    name: "ldap",
    loginPath: "login/ldap",
    userField: "username-field",
    userLabel: "auth.ldap.username",
    userInput: "#ldap-username",
    passwordInput: "#ldap-password",
    userKey: "username",
    userValue: "user",
    wrongCredentials: "These credentials do not match our records.",
  },
  {
    name: "local",
    loginPath: "login/local",
    userField: "email-field",
    userLabel: "app.email",
    userInput: "#local-email",
    passwordInput: "#local-password",
    userKey: "email",
    userValue: "john.doe@domain.tld",
    wrongCredentials: "Password or Email wrong!",
  },
]) {
  test.describe(`Login ${form.name}`, () => {
    test.beforeEach(async ({ page, configResponse }) => {
      configResponse.data.auth[form.name] = true;
      configResponse.data.user.password_change_allowed = false;

      await page.goto("/login");
      await page.getByTestId(`login-tab-button-${form.name}`).click();
    });

    test("shows empty fields and login button", async ({ page }) => {
      const user = page.getByTestId(form.userField);
      await expect(user).toBeVisible();
      await expect(user).toContainText(form.userLabel);
      await expect(user.locator(form.userInput)).toHaveValue("");

      const password = page.getByTestId("password-field");
      await expect(password).toBeVisible();
      await expect(password).toContainText("auth.password");
      await expect(password.locator(form.passwordInput)).toHaveValue("");

      await expect(page.getByTestId("login-button")).toHaveText("auth.login");
    });

    test("shows loading state while the login request is pending", async ({
      page,
      currentUserResponse,
    }) => {
      const postLoginApiMock = await mockApiRequest(
        page,
        "POST",
        form.loginPath,
        {
          status: 200,
          hold: true,
        },
      );
      await page.route("**/api/v1/currentUser", (route) =>
        route.fulfill({ json: currentUserResponse }),
      );
      await interceptRoomIndexRequests(page);

      await page.locator(form.userInput).fill(form.userValue);
      await page.locator(form.passwordInput).fill("password");
      const cookieRequest = page.waitForRequest("**/sanctum/csrf-cookie");
      await page.getByTestId("login-button").click();

      await expect(page.locator(form.userInput)).toBeDisabled();
      await expect(page.locator(form.passwordInput)).toBeDisabled();
      await expect(page.getByTestId("login-button")).toBeDisabled();
      await expect(page.getByTestId("login-button")).toHaveClass(
        /p-button-loading/,
      );

      await cookieRequest;
      postLoginApiMock.release();
      await expectToastAndClose(page, "auth.flash.login");
    });

    test("sends credentials and csrf token", async ({
      page,
      currentUserResponse,
    }) => {
      await page.route(`**/api/v1/${form.loginPath}`, (route) =>
        route.fulfill({ status: 200 }),
      );
      await page.route("**/api/v1/currentUser", (route) =>
        route.fulfill({ json: currentUserResponse }),
      );
      await interceptRoomIndexRequests(page);

      await page.locator(form.userInput).fill(form.userValue);
      await page.locator(form.passwordInput).fill("password");
      const loginRequest = page.waitForRequest(`**/api/v1/${form.loginPath}`);
      await page.getByTestId("login-button").click();

      const request = await loginRequest;
      expect(request.postDataJSON()).toEqual({
        [form.userKey]: form.userValue,
        password: "password",
      });
      expect(await request.headerValue("x-xsrf-token")).toBe("test-csrf");

      await expectToastAndClose(page, "auth.flash.login");
    });

    test("redirects to the room index after login", async ({
      page,
      currentUserResponse,
    }) => {
      await page.route(`**/api/v1/${form.loginPath}`, (route) =>
        route.fulfill({ status: 200 }),
      );
      await page.route("**/api/v1/currentUser", (route) =>
        route.fulfill({ json: currentUserResponse }),
      );
      await interceptRoomIndexRequests(page);

      await page.locator(form.userInput).fill(form.userValue);
      await page.locator(form.passwordInput).fill("password");
      await page.getByTestId("login-button").click();

      await expectToastAndClose(page, "auth.flash.login");
      await expect(page).toHaveURL(/\/rooms/);
      await expect(page).not.toHaveURL(/\/login/);
    });

    test.describe("errors", () => {
      test.beforeEach(async ({ page }) => {
        await page.locator(form.userInput).fill(form.userValue);
        await page.locator(form.passwordInput).fill("password");
      });

      test("shows 422 error on the field and marks it invalid", async ({
        page,
      }) => {
        await mockApiRequest(page, "POST", form.loginPath, {
          status: 422,
          json: {
            message: form.wrongCredentials,
            errors: { [form.userKey]: [form.wrongCredentials] },
          },
        });
        await page.getByTestId("login-button").click();

        await expect(page.getByTestId(form.userField)).toContainText(
          form.wrongCredentials,
        );
        await expect(page.locator(form.userInput)).toHaveAttribute(
          "aria-invalid",
          "true",
        );
      });

      test("replaces 422 errors of previous attempt", async ({ page }) => {
        await mockApiRequest(page, "POST", form.loginPath, {
          status: 422,
          json: {
            message: form.wrongCredentials,
            errors: { [form.userKey]: [form.wrongCredentials] },
          },
        });
        await page.getByTestId("login-button").click();
        await expect(page.getByTestId(form.userField)).toContainText(
          form.wrongCredentials,
        );

        await mockApiRequest(
          page,
          "POST",
          form.loginPath,
          validationErrors(
            { password: ["The Password field is required."] },
            "The Password field is required",
          ),
        );
        await page.getByTestId("login-button").click();

        const password = page.getByTestId("password-field");
        await expect(password).toContainText("The Password field is required.");
        await expect(page.locator(form.passwordInput)).toHaveAttribute(
          "aria-invalid",
          "true",
        );

        // Previous error is removed
        await expect(page.getByTestId(form.userField)).toBeVisible();
        await expect(page.getByTestId(form.userField)).not.toContainText(
          form.wrongCredentials,
        );
        await expect(page.locator(form.userInput)).not.toHaveAttribute(
          "aria-invalid",
        );
      });

      test("shows throttle error and hides 422 errors", async ({ page }) => {
        await mockApiRequest(page, "POST", form.loginPath, {
          status: 422,
          json: {
            message: form.wrongCredentials,
            errors: { [form.userKey]: [form.wrongCredentials] },
          },
        });
        await page.getByTestId("login-button").click();
        await expect(page.getByText(form.wrongCredentials)).toBeVisible();

        await mockApiRequest(
          page,
          "POST",
          form.loginPath,
          validationErrors(
            { password: ["The Password field is required."] },
            "The Password field is required",
          ),
        );
        await page.getByTestId("login-button").click();
        await expect(
          page.getByText("The Password field is required."),
        ).toBeVisible();

        await mockApiRequest(page, "POST", form.loginPath, {
          status: 429,
          headers: { "Retry-After": "59" },
          json: { message: "Too Many Attempts." },
        });
        await page.getByTestId("login-button").click();

        await expect(
          page.getByText('auth.throttle_{"count":59,"n":59}'),
        ).toBeVisible();
        await expect(page.getByText(form.wrongCredentials)).toBeHidden();
        await expect(
          page.getByText("The Password field is required."),
        ).toBeHidden();
        await expect(page.locator(form.passwordInput)).not.toHaveAttribute(
          "aria-invalid",
        );
      });

      test("shows server error toast and hides throttle error", async ({
        page,
      }) => {
        await mockApiRequest(page, "POST", form.loginPath, {
          status: 429,
          headers: { "Retry-After": "59" },
          json: { message: "Too Many Attempts." },
        });
        await page.getByTestId("login-button").click();
        await expect(
          page.getByText('auth.throttle_{"count":59,"n":59}'),
        ).toBeVisible();

        await mockApiRequest(page, "POST", form.loginPath, { status: 500 });
        await page.getByTestId("login-button").click();

        await expectToastAndClose(page, [
          "app.flash.server_error.empty_message",
          'app.flash.server_error.error_code_{"statusCode":500}',
        ]);
        await expect(
          page.getByText('auth.throttle_{"count":59,"n":59}'),
        ).toBeHidden();
      });

      test("shows guests only toast and leaves login page for 420", async ({
        page,
      }) => {
        await mockApiRequest(page, "POST", form.loginPath, { status: 420 });
        await interceptRoomIndexRequests(page);
        await page.getByTestId("login-button").click();

        await expectToastAndClose(page, "app.flash.guests_only");
        await expect(page).not.toHaveURL(/\/login/);
      });
    });
  });

  test.describe(`Login ${form.name} with redirect query`, () => {
    test("redirects to the requested page after login", async ({
      page,
      configResponse,
      currentUserResponse,
    }) => {
      configResponse.data.auth[form.name] = true;
      await page.route(`**/api/v1/${form.loginPath}`, (route) =>
        route.fulfill({ status: 200 }),
      );

      // Visit page that can only be visited by logged in users
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login\?redirect=\/admin/);

      // User that has the permission to show the admin page
      currentUserResponse.data.permissions = ["admin.view"];
      await page.route("**/api/v1/currentUser", (route) =>
        route.fulfill({ json: currentUserResponse }),
      );
      await interceptRoomIndexRequests(page);

      await page.getByTestId(`login-tab-button-${form.name}`).click();
      await page.locator(form.userInput).fill(form.userValue);
      await page.locator(form.passwordInput).fill("password");
      const loginRequest = page.waitForRequest(`**/api/v1/${form.loginPath}`);
      await page.getByTestId("login-button").click();
      await loginRequest;

      await expectToastAndClose(page, "auth.flash.login");
      await expect(page).toHaveURL((url) => url.pathname === "/admin");
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
}

test.describe("Login local forgot password", () => {
  test.beforeEach(async ({ page, configResponse }) => {
    configResponse.data.auth.local = true;

    await page.goto("/login");
    await page.getByTestId("login-tab-button-local").click();
  });

  test("shows enabled fields and forgot password link", async ({ page }) => {
    await expect(page.locator("#local-email")).toBeVisible();
    await expect(page.locator("#local-email")).toBeEnabled();
    await expect(page.locator("#local-password")).toBeVisible();
    await expect(page.locator("#local-password")).toBeEnabled();
    await expect(page.getByTestId("login-button")).toBeVisible();
    await expect(page.getByTestId("login-button")).toBeEnabled();

    const forgot = page.getByTestId("forgot-password-button");
    await expect(forgot).toBeVisible();
    await expect(forgot).toBeEnabled();
    await expect(forgot).toHaveText("auth.forgot_password");
  });

  test("opens the forgot password page", async ({ page }) => {
    await page.getByTestId("forgot-password-button").click();

    await expect(page).toHaveURL(/\/forgot_password/);
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("Login local without password change", () => {
  test("hides forgot password link if password change is not allowed", async ({
    page,
    configResponse,
  }) => {
    configResponse.data.auth.local = true;
    configResponse.data.user.password_change_allowed = false;

    await page.goto("/login");
    await page.getByTestId("login-tab-button-local").click();

    await expect(page.locator("#local-email")).toBeVisible();
    await expect(page.getByTestId("forgot-password-button")).toBeHidden();
  });
});

test.describe("Login with already logged in user", () => {
  test.use({ authenticated: true });

  test.beforeEach(async ({ page, currentUserResponse }) => {
    currentUserResponse.data.permissions = ["admin.view"];
    await interceptRoomIndexRequests(page);
  });

  test("redirects to the room index", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/rooms/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("redirects to the redirect query", async ({ page }) => {
    await page.goto("/login?redirect=/admin");

    await expect(page).toHaveURL((url) => url.pathname === "/admin");
    await expect(page).not.toHaveURL(/\/login/);
  });
});

for (const provider of ["shibboleth", "oidc"]) {
  test.describe(`Login ${provider}`, () => {
    test.beforeEach(async ({ configResponse }) => {
      configResponse.data.auth[provider] = true;
    });

    test("shows redirect button", async ({ page }) => {
      await page.goto("/login");
      await page.getByTestId(`login-tab-button-${provider}`).click();

      const button = page.getByTestId("login-button");
      await expect(button).toContainText(`auth.${provider}.redirect`);
      await expect(button).toHaveAttribute(
        "href",
        `/auth/${provider}/redirect`,
      );
    });

    test("shows redirect button with redirect query", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/login\?redirect=\/admin/);

      await page.getByTestId(`login-tab-button-${provider}`).click();

      const button = page.getByTestId("login-button");
      await expect(button).toContainText(`auth.${provider}.redirect`);
      await expect(button).toHaveAttribute(
        "href",
        `/auth/${provider}/redirect?redirect=%2Fadmin`,
      );
    });

    test.describe("external login callback", () => {
      test.use({ authenticated: true });

      test("redirects to the room index", async ({ page }) => {
        await interceptRoomIndexRequests(page);
        await page.goto("/external_login");

        await expectToastAndClose(page, "auth.flash.login");
        await expect(page).toHaveURL(/\/rooms/);
        await expect(page).not.toHaveURL(/\/login/);
      });

      test("redirects to the redirect query", async ({
        page,
        currentUserResponse,
      }) => {
        currentUserResponse.data.permissions = ["admin.view"];
        await page.goto("/external_login?redirect=/admin");

        await expect(page).toHaveURL((url) => url.pathname === "/admin");
        await expect(page).not.toHaveURL(/\/login/);
        // Admin page is shown (loading is finished)
        await expect(
          page.getByRole("heading", { name: "admin.title" }),
        ).toBeVisible();
        await expectToastAndClose(page, "auth.flash.login");
      });
    });
  });
}

test.describe("External login callback", () => {
  test.describe("guest", () => {
    for (const error of [
      "missing_attributes",
      "shibboleth_session_duplicate_exception",
      "invalid_request",
      "openid_connect_network_exception",
      "openid_connect_exception",
    ]) {
      test(`shows error ${error}`, async ({ page }) => {
        await page.goto(`/external_login?error=${error}`);

        await expect(page.getByText("auth.error.login_failed")).toBeVisible();
        await expect(page.getByText(`auth.error.${error}`)).toBeVisible();

        const button = page.getByTestId("login-button");
        await expect(button).toBeVisible();
        await expect(button).toHaveText("auth.login");
        await expect(button).toHaveAttribute("href", "/login");
        await expect(page.locator('a[data-test="login-button"]')).toBeVisible();
      });
    }
  });

  test.describe("already logged in user", () => {
    test.use({ authenticated: true });

    test("redirects to the room index despite error", async ({ page }) => {
      await interceptRoomIndexRequests(page);
      await page.goto("/external_login?error=invalid_request");

      await expect(page).toHaveURL(/\/rooms/);
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe("no_message", () => {
    test.use({ authenticated: true });

    test("redirects without login toast", async ({
      page,
      currentUserResponse,
    }) => {
      currentUserResponse.data.permissions = ["admin.view"];
      await page.goto("/external_login?no_message=1&redirect=/admin");

      await expect(page).toHaveURL((url) => url.pathname === "/admin");
      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: "admin.title" }),
      ).toBeVisible();
      await expect(page.locator(".p-toast-message")).toHaveCount(0);
    });
  });
});
