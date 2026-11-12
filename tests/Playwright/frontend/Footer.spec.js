import { test, expect } from "../support/test.js";

const redirectBaseUrl =
  "https://thm-health.github.io/PILOS-Redirect_Test_Pages";

const legalUrl = `${redirectBaseUrl}/legal`;
const privacyUrl = `${redirectBaseUrl}/privacy`;
const accessibilityUrl = `${redirectBaseUrl}/accessibility`;

const footerCases = [
  {
    name: "2 links, version and no whitelabel",
    legal: legalUrl,
    privacy: privacyUrl,
    accessibility: accessibilityUrl,
    version: "1.0.0",
    whitelabel: false,
  },
  {
    name: "only legal notice link, no version and whitelabel",
    legal: legalUrl,
    privacy: "",
    accessibility: "",
    version: null,
    whitelabel: true,
  },
  {
    name: "only privacy policy link, no version and whitelabel",
    legal: "",
    privacy: privacyUrl,
    accessibility: "",
    version: null,
    whitelabel: true,
  },
  {
    name: "no links, no version and no whitelabel",
    legal: "",
    privacy: "",
    accessibility: "",
    version: null,
    whitelabel: false,
  },
  {
    name: "no links, version and whitelabel",
    legal: "",
    privacy: "",
    accessibility: "",
    version: "1.0.0",
    whitelabel: true,
  },
  {
    name: "2 links, version and whitelabel",
    legal: legalUrl,
    privacy: privacyUrl,
    accessibility: accessibilityUrl,
    version: "1.0.0",
    whitelabel: true,
  },
  {
    name: "2 links, no version and whitelabel",
    legal: legalUrl,
    privacy: privacyUrl,
    accessibility: accessibilityUrl,
    version: "",
    whitelabel: true,
  },
  {
    name: "only legal notice link, version and whitelabel",
    legal: legalUrl,
    privacy: "",
    accessibility: "",
    version: "1.2.0",
    whitelabel: true,
  },
  {
    name: "only privacy policy link, version and whitelabel",
    legal: "",
    privacy: privacyUrl,
    accessibility: "",
    version: "2.1.0",
    whitelabel: true,
  },
];

test.describe("Footer", () => {
  test.use({ authenticated: true });

  for (const footerCase of footerCases) {
    test(`shown correctly with ${footerCase.name}`, async ({
      page,
      config,
    }) => {
      Object.assign(config.data.general, {
        legal_notice_url: footerCase.legal,
        privacy_policy_url: footerCase.privacy,
        accessibility_statement_url: footerCase.accessibility,
        version: footerCase.version,
        whitelabel: footerCase.whitelabel,
      });

      await page.goto("/");

      const footer = page.getByTestId("app-footer");
      await expect(footer).toBeVisible();

      const links = [
        ["legal-notice-button", footerCase.legal, "app.footer.legal_notice"],
        [
          "privacy-policy-button",
          footerCase.privacy,
          "app.footer.privacy_policy",
        ],
        [
          "accessibility-button",
          footerCase.accessibility,
          "app.footer.accessibility",
        ],
      ];
      for (const [testId, url, text] of links) {
        const link = footer.getByTestId(testId);
        if (url) {
          await expect(link).toBeVisible();
          await expect(link).toHaveText(text);
          await expect(link).toHaveAttribute("href", url);
        } else {
          await expect(link).toHaveCount(0);
        }
      }

      const github = footer.getByTestId("github-button");
      if (footerCase.whitelabel) {
        await expect(github).toHaveCount(0);
      } else {
        await expect(github).toBeVisible();
        await expect(github).toHaveText("PILOS");
        await expect(github).toHaveAttribute(
          "href",
          "https://github.com/THM-Health/PILOS",
        );
      }

      const version = footer.getByTestId("version");
      if (footerCase.version) {
        await expect(version).toBeVisible();
        await expect(version).toHaveText(`app.version ${footerCase.version}`);
      } else {
        await expect(version).toHaveCount(0);
      }
    });
  }

  test("hidden with no links, no version and whitelabel", async ({
    page,
    config,
  }) => {
    Object.assign(config.data.general, {
      legal_notice_url: "",
      privacy_policy_url: "",
      accessibility_statement_url: "",
      version: "",
      whitelabel: true,
    });

    await page.goto("/");

    // Wait for the page to be rendered, otherwise the check below could pass too early
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("app-footer")).toHaveCount(0);
  });

  test.describe("external links", () => {
    test.beforeEach(async ({ page }) => {
      // Do not depend on the external redirect pages
      await page.route(`${redirectBaseUrl}/**`, (route) =>
        route.fulfill({ body: "<html><body>external</body></html>" }),
      );
    });

    for (const [name, setting, testId, path] of [
      ["legal notice", "legal_notice_url", "legal-notice-button", "legal"],
      [
        "accessibility",
        "accessibility_statement_url",
        "accessibility-button",
        "accessibility",
      ],
      [
        "privacy policy",
        "privacy_policy_url",
        "privacy-policy-button",
        "privacy",
      ],
    ]) {
      test(`open ${name} link`, async ({ page, config }) => {
        const url = `${redirectBaseUrl}/${path}?foo=a&bar=b`;
        config.data.general[setting] = url;

        await page.goto("/");
        await page.getByTestId(testId).click();

        await expect(page).toHaveURL(url);
      });
    }
  });
});
