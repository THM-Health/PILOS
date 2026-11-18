/**
 * The server form of the admin servers pages (new, view and edit).
 */
export class AdminServersForm {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.name = page.locator("#name");
    this.description = page.locator("#description");
    this.version = page.locator("#version");
    this.baseUrl = page.locator("#base_url");
    this.secret = page.locator("#secret");
    this.strengthRating = page.getByTestId("strength-rating");
    this.strengthOptions = page.getByTestId("strength-rating-option");
    this.statusDropdown = page.getByTestId("status-dropdown");
    this.statusItems = page.getByTestId("status-dropdown-items");
    this.statusOptions = this.statusItems.getByTestId("status-dropdown-option");
    this.alwaysOnline = page.locator("#connection-status-always-online");
    this.connectionStatus = page.locator("#connectionStatus");
    this.testConnectionButton = page.getByTestId(
      "servers-test-connection-button",
    );
    this.saveButton = page.getByTestId("servers-save-button");
  }

  /**
   * Fill the given text fields.
   * @param {{ name?: string, description?: string, baseUrl?: string, secret?: string }} values
   */
  async fillTextFields({ name, description, baseUrl, secret }) {
    if (name !== undefined) {
      await this.name.fill(name);
    }
    if (description !== undefined) {
      await this.description.fill(description);
    }
    if (baseUrl !== undefined) {
      await this.baseUrl.fill(baseUrl);
    }
    if (secret !== undefined) {
      await this.secret.fill(secret);
    }
  }

  /**
   * Select the strength by clicking the rating option.
   * @param {number} strength 1 to 10
   */
  async selectStrength(strength) {
    await this.strengthOptions.nth(strength - 1).click();
  }

  /**
   * Open the status dropdown and select the option.
   * @param {number} index 0 enabled, 1 draining, 2 disabled
   */
  async selectStatus(index) {
    await this.statusDropdown.click();
    await this.statusOptions.nth(index).click();
  }
}
