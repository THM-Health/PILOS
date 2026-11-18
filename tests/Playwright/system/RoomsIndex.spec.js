import { test, expect, loginAs } from "../support/system.js";

test("visit with user that is not logged in", async ({ page }) => {
  await page.goto("/rooms");

  await expect(page).toHaveURL(/\/login\?redirect=\/rooms/);
});

test.describe("Room index", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "daniel");
    await page.goto("/rooms");
    await expect(page.getByTestId("room-card")).toHaveCount(5);
  });

  test("rooms are sorted by last started and show their data", async ({
    page,
  }) => {
    const cards = page.getByTestId("room-card");

    await expect(cards.nth(0)).toContainText("Meeting Room");
    await expect(cards.nth(0)).toContainText("Angela Jones");
    await expect(cards.nth(0)).toContainText("Running since 01/01/2024, 08:00");
    await expect(cards.nth(0)).toContainText("2 participants");
    await expect(cards.nth(0).locator("a")).toHaveAttribute(
      "href",
      "/rooms/abc-def-345",
    );

    await expect(cards.nth(1)).toContainText("Anatomy");
    await expect(cards.nth(1)).toContainText("Daniel Osorio");
    await expect(cards.nth(1)).toContainText(
      "Last run until 01/01/2024, 11:00",
    );
    await expect(cards.nth(1).locator("a")).toHaveAttribute(
      "href",
      "/rooms/abc-def-123",
    );

    await expect(cards.nth(2)).toContainText("Math");
    await expect(cards.nth(2)).toContainText("Daniel Osorio");
    await expect(cards.nth(2)).toContainText(
      "Last run until 01/01/2024, 12:00",
    );
    await expect(cards.nth(2).locator("a")).toHaveAttribute(
      "href",
      "/rooms/abc-def-234",
    );

    await expect(cards.nth(3)).toContainText("Exam Room");
    await expect(cards.nth(3)).toContainText("Angela Jones");
    await expect(cards.nth(3)).toContainText("Never started before");
    await expect(cards.nth(3).locator("a")).toHaveAttribute(
      "href",
      "/rooms/abc-def-456",
    );
  });

  test("change sorting", async ({ page }) => {
    const cards = page.getByTestId("room-card");

    await page.getByTestId("sorting-type-dropdown").click();
    await page
      .getByTestId("sorting-type-dropdown-items")
      .locator(".p-select-option")
      .nth(1)
      .click();

    await expect(cards.nth(0)).toContainText("Anatomy");
    await expect(cards.nth(1)).toContainText("Exam Room");
    await expect(cards.nth(2)).toContainText("Math");
    await expect(cards.nth(3)).toContainText("Meeting Room");
    await expect(cards.nth(4)).toContainText("Seminar Room");
  });

  test("search and clear search", async ({ page }) => {
    const search = page.getByTestId("room-search").locator("> input");

    await search.fill("Anatomy");
    await search.press("Enter");
    await expect(page.getByTestId("room-card")).toHaveCount(1);

    await search.clear();
    await search.press("Enter");
    await expect(page.getByTestId("room-card")).toHaveCount(5);
  });

  test("toggle shared rooms", async ({ page }) => {
    const button = page.getByRole("button", { name: "Shared rooms" });

    await button.click();
    await expect(page.getByTestId("room-card")).toHaveCount(2);

    await button.click();
    await expect(page.getByTestId("room-card")).toHaveCount(5);
  });

  test("toggle own rooms", async ({ page }) => {
    const button = page.getByRole("button", { name: "Own rooms" });

    await button.click();
    await expect(page.getByTestId("room-card")).toHaveCount(3);

    await button.click();
    await expect(page.getByTestId("room-card")).toHaveCount(5);
  });

  test("filter by favorites", async ({ page }) => {
    const cards = page.getByTestId("room-card");

    await cards.nth(2).getByTestId("room-favorites-button").click();
    await cards.nth(3).getByTestId("room-favorites-button").click();

    await page.getByTestId("only-favorites-button").click();
    await expect(cards).toHaveCount(2);

    await page.getByTestId("only-favorites-button").click();
    await expect(cards).toHaveCount(5);
  });

  test("filter by room type", async ({ page }) => {
    const options = page
      .getByTestId("room-type-dropdown-items")
      .locator(".p-select-option");

    await page.getByTestId("room-type-dropdown").click();
    await options.nth(2).click();
    await expect(page.getByTestId("room-card")).toHaveCount(2);

    await page.getByTestId("room-type-dropdown").click();
    await options.nth(0).click();
    await expect(page.getByTestId("room-card")).toHaveCount(5);
  });

  test("click on room card to open room view", async ({ page }) => {
    const card = page.getByTestId("room-card").nth(0);

    await expect(card).toContainText("Meeting Room");
    await card.click();

    await expect(page).toHaveURL(/\/rooms\/abc-def-345/);
  });
});
