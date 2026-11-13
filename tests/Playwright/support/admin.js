import { expect, test } from "@playwright/test";

const FILES_DIR = "tests/Playwright/fixtures/files/";

/**
 * Check the admin breadcrumbs contain the given texts.
 * @param {import("@playwright/test").Page} page
 * @param {...string} crumbs
 */
export async function expectAdminBreadcrumbs(page, ...crumbs) {
  const breadcrumbs = page.getByTestId("admin-breadcrumb");
  await expect(breadcrumbs).toBeVisible();
  for (const crumb of crumbs) {
    await expect(breadcrumbs).toContainText(crumb);
  }
}

/**
 * Check the selected role chips of the room type form.
 * @param {import("@playwright/test").Page} page
 * @param {string[]} names
 */
export async function expectRoleChips(page, names) {
  const chips = page.getByTestId("role-dropdown").getByTestId("role-chip");
  await expect(chips).toHaveCount(names.length);
  for (const [index, name] of names.entries()) {
    await expect(chips.nth(index)).toContainText(name);
    await expect(
      chips.nth(index).getByTestId("remove-role-button"),
    ).toBeVisible();
  }
}

/**
 * Check the select options of an opened multiselect: names plus the (hidden) "no elements" and "no data" entries.
 * @param {import("@playwright/test").Locator} content
 * @param {string[]} names
 * @param {string} noDataText
 */
export async function expectMultiselectOptions(content, names, noDataText) {
  const options = content.locator(".multiselect__option");
  await expect(options).toHaveCount(names.length + 2);
  for (const [index, name] of names.entries()) {
    await expect(options.nth(index)).toContainText(name);
    await expect(options.nth(index)).toBeVisible();
  }
  await expect(options.nth(names.length)).toContainText(
    "No elements found. Consider changing the search query.",
  );
  await expect(options.nth(names.length)).toBeHidden();
  await expect(options.nth(names.length + 1)).toContainText(noDataText);
  await expect(options.nth(names.length + 1)).toBeHidden();
}

/**
 * Check if a permission group is displayed correctly.
 * @param {import('@playwright/test').Page} page
 * @param {number} index
 * @param {string} permission
 * @param {boolean} explicit
 * @param {boolean} included
 * @param {boolean} disabled
 * @returns {Promise<void>}
 */
export async function checkPermissionGroup(
  page,
  index,
  permission,
  explicit,
  included,
  disabled,
) {
  const group = page.getByTestId("permission-group").nth(index);
  await expect(group).toContainText(permission);

  permission = permission.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

  await expect(group).toContainText("admin.roles.permissions." + permission);

  const checkbox = group.locator(`[id="${permission}"]`);
  if (explicit) {
    await expect(checkbox).toBeChecked();
  } else {
    await expect(checkbox).not.toBeChecked();
  }
  if (disabled) {
    await expect(checkbox).toBeDisabled();
  } else {
    await expect(checkbox).toBeEnabled();
  }

  const includedIcon = group.getByTestId("permission-included-icon");
  const notIncludedIcon = group.getByTestId("permission-not-included-icon");
  if (included) {
    await expect(includedIcon).toBeVisible();
    await expect(notIncludedIcon).toHaveCount(0);
  } else {
    await expect(includedIcon).toHaveCount(0);
    await expect(notIncludedIcon).toBeVisible();
  }
}

/**
 * Check if the room limit help dialog is shown correctly and close it.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function checkRoomLimitHelpDialog(page) {
  const dialog = page.getByTestId("roles-room-limit-help-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("app.room_limit");
  await expect(dialog).toContainText("admin.roles.room_limit.help_modal.info");
  await expect(dialog).toContainText(
    "admin.roles.room_limit.help_modal.examples",
  );
  await expect(dialog).toContainText("admin.roles.room_limit.help_modal.note");

  // Check that table is shown correctly
  const rows = dialog.locator("tr");
  await expect(rows).toHaveCount(8);

  const headers = rows.nth(0).locator("th");
  await expect(headers).toHaveCount(4);
  await expect(headers.nth(0)).toContainText(
    "admin.roles.room_limit.help_modal.system_default",
  );
  await expect(headers.nth(1)).toContainText(
    "admin.roles.room_limit.help_modal.role_a",
  );
  await expect(headers.nth(2)).toContainText(
    "admin.roles.room_limit.help_modal.role_b",
  );
  await expect(headers.nth(3)).toContainText("app.room_limit");

  const systemDefault = "admin.roles.room_limit.help_modal.system_default";
  const expectedRows = [
    ["5", "X", "X", "5"],
    ["1", "5", "X", "5"],
    ["5", "1", "X", "1"],
    ["5", "1", "2", "2"],
    ["5", systemDefault, "2", "5"],
    ["5", systemDefault, "10", "10"],
    ["5", "app.unlimited", "2", "app.unlimited"],
  ];

  for (const [rowIndex, expectedCells] of expectedRows.entries()) {
    const cells = rows.nth(rowIndex + 1).locator("td");
    await expect(cells).toHaveCount(4);
    for (const [cellIndex, expectedText] of expectedCells.entries()) {
      await expect(cells.nth(cellIndex)).toContainText(expectedText);
    }
  }

  // Close room limit help dialog
  await dialog.getByTestId("dialog-header-close-button").click();
  await expect(dialog).toBeHidden();
}

/**
 * Check if a field for the default room settings inside the room type form is displayed correctly.
 * @param {import('@playwright/test').Page} page
 * @param {string} field
 * @param {(boolean|string)} value
 * @param {boolean} enforced
 * @param {boolean} viewOnly
 * @returns {Promise<void>}
 */
export async function roomTypeCheckDefaultRoomSettingCheckboxField(
  page,
  field,
  value,
  enforced,
  viewOnly,
) {
  const checkbox = page.locator("#" + field + "-default");
  if (value) {
    await expect(checkbox).toBeChecked();
  } else {
    await expect(checkbox).not.toBeChecked();
  }

  const enforcedButton = page.getByTestId(field + "-enforced");
  await expect(enforcedButton).toHaveText(
    enforced
      ? "admin.room_types.default_room_settings.enforced"
      : "admin.room_types.default_room_settings.default",
  );

  if (viewOnly) {
    await expect(checkbox).toBeDisabled();
    await expect(enforcedButton).toBeDisabled();
  } else {
    await expect(checkbox).toBeEnabled();
    await expect(enforcedButton).toBeEnabled();
  }
}

/**
 * Checks that the file input button opens the file chooser on keyboard activation.
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} root
 * @returns {Promise<void>}
 */
async function checkFileInputButtonOpensChooser(root) {
  const button = root.getByTestId("file-input-button");
  await expect(button).toContainText("app.browse");

  // Check that button is connected to file input
  const page = typeof root.page === "function" ? root.page() : root;
  const fileChooserPromise = page.waitForEvent("filechooser");
  await button.dispatchEvent("keyup", { key: "Enter" });
  await fileChooserPromise;
}

/**
 * Checks that the image preview shows the uploaded fixture file (blob url).
 * The blob can't be fetched (CSP connect-src), so the rendered preview is compared to a screenshot.
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} root
 * @param {string} originalSrc
 * @returns {Promise<void>}
 */
async function checkUploadedImagePreview(root, originalSrc) {
  const preview = root.getByTestId("settings-image-preview");

  await expect(preview).toHaveAttribute("src", /^blob:/);
  expect(await preview.getAttribute("src")).not.toContain(originalSrc);

  // The same image is used by several settings with different preview sizes, so the name has to be per test
  const name = test.info().title.replace(/\W+/g, "-");
  await expect(preview).toHaveScreenshot(`${name}.png`);
}

/**
 * Checks if the image file upload works correctly.
 * `root` is the page or a field that scopes the selector (several can be on one page).
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} root
 * @param {string} originalSrc
 * @param {string} imageName
 * @param {boolean} deletable
 * @returns {Promise<void>}
 */
export async function checkSettingsImageSelector(
  page,
  root,
  originalSrc,
  imageName,
  deletable,
) {
  const urlInput = root.getByTestId("settings-image-url-input");
  const preview = root.getByTestId("settings-image-preview");
  const cancelButton = root.getByTestId("settings-image-cancel-button");
  const deleteButton = root.getByTestId("settings-image-delete-button");
  const undoDeleteButton = root.getByTestId(
    "settings-image-undo-delete-button",
  );
  const fileInput = root.getByTestId("file-input-input");
  const fileButton = root.getByTestId("file-input-button");

  const checkOriginalState = async () => {
    await expect(cancelButton).toHaveCount(0);

    if (originalSrc !== "" && deletable) {
      await expect(deleteButton).toBeVisible();
    } else {
      await expect(deleteButton).toHaveCount(0);
    }

    await expect(undoDeleteButton).toHaveCount(0);
  };

  // Check that correct url is shown
  await expect(urlInput).toHaveValue(originalSrc);
  await expect(preview).toHaveAttribute(
    "src",
    new RegExp(originalSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  await checkOriginalState();

  await checkFileInputButtonOpensChooser(root);

  await fileInput.setInputFiles(FILES_DIR + imageName);

  // Check that buttons changed
  await expect(fileButton).toContainText(imageName);
  await expect(urlInput).toHaveCount(0);
  await expect(cancelButton).toBeVisible();
  await expect(deleteButton).toHaveCount(0);
  await expect(undoDeleteButton).toHaveCount(0);

  // Check that correct image is shown
  await checkUploadedImagePreview(root, originalSrc);

  // Cancel upload
  await cancelButton.click();

  // Check that setting is shown correctly
  await expect(urlInput).toBeVisible();
  await expect(urlInput).toHaveValue(originalSrc);
  await checkOriginalState();
  await expect(fileButton).toContainText("app.browse");

  // Upload image again
  await fileInput.setInputFiles(FILES_DIR + imageName);

  // Check that correct image is shown
  await checkUploadedImagePreview(root, originalSrc);
}

/**
 * Checks if the file upload works correctly.
 * `root` is the page or a field that scopes the selector (several can be on one page).
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} root
 * @param {string} originalHref
 * @param {string} fileName
 * @param {boolean} deletable
 * @returns {Promise<void>}
 */
export async function checkSettingsFileSelector(
  _page,
  root,
  originalHref,
  fileName,
  deletable,
) {
  const cancelButton = root.getByTestId("settings-file-cancel-button");
  const deleteButton = root.getByTestId("settings-file-delete-button");
  const undoDeleteButton = root.getByTestId("settings-file-undo-delete-button");
  const viewButton = root.getByTestId("settings-file-view-button");
  const fileInput = root.getByTestId("file-input-input");
  const fileButton = root.getByTestId("file-input-button");

  const checkOriginalState = async () => {
    await expect(cancelButton).toHaveCount(0);
    if (originalHref !== "" && deletable) {
      await expect(deleteButton).toBeVisible();
    } else {
      await expect(deleteButton).toHaveCount(0);
    }
    await expect(undoDeleteButton).toHaveCount(0);

    if (originalHref !== "") {
      await expect(viewButton).toBeVisible();
      await expect(viewButton).toContainText("app.view");
      await expect(viewButton).toHaveAttribute("href", originalHref);
    } else {
      await expect(viewButton).toHaveCount(0);
    }
  };

  await checkOriginalState();

  await checkFileInputButtonOpensChooser(root);

  await fileInput.setInputFiles(FILES_DIR + fileName);

  // Check that buttons changed
  await expect(fileButton).toContainText(fileName);
  await expect(cancelButton).toBeVisible();
  await expect(deleteButton).toHaveCount(0);
  await expect(undoDeleteButton).toHaveCount(0);

  // Cancel upload
  await cancelButton.click();

  // Check that setting is shown correctly
  await checkOriginalState();
  await expect(fileButton).toContainText("app.browse");

  // Upload file again
  await fileInput.setInputFiles(FILES_DIR + fileName);
}

/**
 * Checks if the SettingsImageSelector is shown correctly with only view permission
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} root
 * @param {string} src
 * @returns {Promise<void>}
 */
export async function checkSettingsImageSelectorOnlyView(root, src) {
  if (src !== "") {
    const preview = root.getByTestId("settings-image-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute("src", src);
  }

  for (const testId of [
    "settings-image-url-input",
    "settings-image-cancel-button",
    "settings-image-delete-button",
    "settings-image-undo-delete-button",
    "file-input-button",
    "file-input-input",
  ]) {
    await expect(root.getByTestId(testId)).toHaveCount(0);
  }
}

/**
 * Checks if the SettingsFileSelector is shown correctly with only view permission
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} root
 * @param {string} href
 * @returns {Promise<void>}
 */
export async function checkSettingsFileSelectorOnlyView(root, href) {
  const viewButton = root.getByTestId("settings-file-view-button");

  if (href !== "") {
    await expect(viewButton).toBeVisible();
    await expect(viewButton).toContainText("app.view");
    await expect(viewButton).toHaveAttribute("href", href);
  }

  for (const testId of [
    "settings-file-cancel-button",
    "settings-file-delete-button",
    "settings-file-undo-delete-button",
    "file-input-button",
    "file-input-input",
  ]) {
    await expect(root.getByTestId(testId)).toHaveCount(0);
  }

  if (href === "") {
    await expect(viewButton).toHaveCount(0);
  }
}
