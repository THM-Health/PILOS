import { execFileSync } from "node:child_process";
import { test as base, expect } from "@playwright/test";
import { coverageFixture } from "./coverage.js";

/**
 * `test` object for the system suite (real backend, no mocked API).
 *
 * Every test starts with a freshly seeded database. As all tests share one database, the system project must not run
 * in parallel: `npm run playwright:run:system` (`--workers=1`).
 */
export const test = base.extend({
  coverage: coverageFixture,

  resetDatabase: [
    async ({}, use) => {
      execFileSync(
        "docker",
        [
          "compose",
          "-f",
          "compose.test.yml",
          "exec",
          "-T",
          "app",
          "pilos-cli",
          "demo:create",
          "--force",
          "--disable-bbb-session-check",
        ],
        { stdio: "pipe" },
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };

const CREDENTIALS = {
  john: { email: "john.doe@example.org", password: "johndoe" },
  daniel: { email: "daniel.osorio@example.org", password: "danielosorio" },
  angela: { email: "angela.jones@example.org", password: "angelajones" },
  hoyt: { email: "hoyt.hastings@example.org", password: "hoythastings" },
  william: { email: "william.white@example.org", password: "williamwhite" },
  thomas: { email: "thomas.bolden@example.org", password: "thomasbolden" },
};

/**
 * Logs in as one of the seeded demo users (john, daniel, angela, hoyt, william, thomas) via the local login.
 * @param {import("@playwright/test").Page} page
 * @param {string} name
 */
export async function loginAs(page, name) {
  const user = CREDENTIALS[name];
  if (!user) {
    throw new Error("Unknown user: " + name);
  }

  await page.goto("/login");

  await page.getByTestId("login-tab-button-local").click();
  await page.locator("#local-email").fill(user.email);
  await page.locator("#local-password").fill(user.password);
  const loginButton = page.getByTestId("login-button");
  await expect(loginButton).toHaveText("Login");
  await loginButton.click();

  await expect(page.locator(".p-toast")).toHaveText("Successfully logged in");
}
