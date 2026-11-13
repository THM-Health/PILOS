/**
 * Server multiselect of the admin server pool form (new, edit and view page).
 */
export class AdminServerPoolsServerSelect {
  /** @param {import("@playwright/test").Page} page */
  constructor(page) {
    this.page = page;
    this.field = page.getByTestId("server-field");
    this.dropdown = page.getByTestId("server-dropdown");
    this.content = page.locator(".multiselect__content");
    this.options = this.content.locator(".multiselect__option");
    this.chips = this.dropdown.getByTestId("server-chip");
    this.removeButtons = this.dropdown.getByTestId("remove-server-button");
    this.visibleRemoveButtons = this.removeButtons.locator("visible=true");
    this.previousPageButton = this.content.getByTestId("previous-page-button");
    this.nextPageButton = this.content.getByTestId("next-page-button");
    this.reloadButton = page.getByTestId("servers-reload-button");
  }

  async open() {
    await this.dropdown.click();
  }

  async close() {
    await this.page.locator(".multiselect__select").click();
  }

  /** @param {number} index */
  async selectOption(index) {
    await this.options.nth(index).click();
  }

  /** @param {number} index */
  async removeServer(index) {
    await this.chips.nth(index).getByTestId("remove-server-button").click();
  }

  async showNextPage() {
    await this.nextPageButton.click();
  }
}
