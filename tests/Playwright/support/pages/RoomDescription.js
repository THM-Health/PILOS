import { expect } from "@playwright/test";

/**
 * The description editor (TipTap) of the room view.
 */
export class RoomDescription {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;
    this.content = page.locator(".tiptap");
  }

  /**
   * Selects the whole content, retries until the browser selection equals the editor text.
   */
  async selectContent() {
    await expect(async () => {
      await this.content.press("ControlOrMeta+a");
      const selectedText = await this.page.evaluate(() =>
        window.getSelection().toString(),
      );
      expect(selectedText).toBe(await this.content.innerText());
    }, "Selecting the text failed").toPass();
  }

  /**
   * Clears the content, retries until the editor is empty.
   */
  async clearContent() {
    await expect(async () => {
      await this.content.clear();
      await expect(this.content).toHaveText("", { timeout: 500 });
    }, "Clearing the text failed").toPass();
  }
}
