import { expect } from "@playwright/test";

/**
 * Query parameters of a request as a plain object.
 * @param {import("@playwright/test").Request} request
 * @returns {Record<string, string>}
 */
export function queryOf(request) {
  return Object.fromEntries(new URL(request.url()).searchParams);
}

/**
 * Check that the given paginator page button is the active one.
 * @param {import("@playwright/test").Page} page
 * @param {number} index
 */
export async function expectActivePage(page, index) {
  await expect(page.getByTestId("paginator-page").nth(index)).toHaveAttribute(
    "data-p-active",
    "true",
  );
}

/**
 * Mock all requests of a method and url. Later mocks win (like `cy.intercept`).
 * With `hold` the requests are answered after `release()` was called (replaces `interceptIndefinitely`).
 * @param {import("@playwright/test").Page} page
 * @param {string} method
 * @param {string|RegExp|Function} url
 * @param {object} response - options for `route.fulfill()`, plus optional `hold`
 * @returns {Promise<{ requests: import("@playwright/test").Request[], release?: () => void }>}
 */
export async function mockMethod(
  page,
  method,
  url,
  { hold = false, ...response },
) {
  let release;
  const gate = hold ? new Promise((resolve) => (release = resolve)) : null;
  const requests = [];

  await page.route(url, async (route) => {
    if (route.request().method() !== method) {
      return route.fallback();
    }
    requests.push(route.request());
    if (gate) {
      await gate;
    }
    await route.fulfill(response);
  });

  return { requests, release };
}

/**
 * Wait until the mock received at least `count` requests and return the last of them.
 * @param {{ requests: import("@playwright/test").Request[] }} mock
 * @param {number} [count=1]
 * @returns {Promise<import("@playwright/test").Request>}
 */
export async function nthRequest(mock, count = 1) {
  await expect.poll(() => mock.requests.length).toBeGreaterThanOrEqual(count);
  return mock.requests[count - 1];
}

/**
 * Tolerance for comparing cropped and resized images: the resampling differs slightly between browser versions,
 * but a different crop or zoom is still detected.
 */
export const IMAGE_SNAPSHOT_OPTIONS = {
  threshold: 0.3,
  maxDiffPixelRatio: 0.05,
};

/**
 * Checks that the (blob url) image is loaded and looks like the screenshot.
 * The blob can't be fetched because of the CSP (connect-src).
 * @param {import("@playwright/test").Locator} image
 * @param {string} name file name of the screenshot, e.g. "profile-image.png"
 */
export async function expectImageToMatchScreenshot(image, name) {
  await expect
    .poll(() => image.evaluate((element) => element.naturalWidth))
    .toBeGreaterThan(0);
  await expect(image).toHaveScreenshot(name);
}

/**
 * Converts an ArrayBuffer (or Node Buffer) to a base64 string.
 * @param {ArrayBuffer|Uint8Array} buffer
 * @returns {string}
 */
export function _arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString("base64");
}

const FILE_CONTENT_TYPES = {
  svg: "image/svg+xml",
  ico: "image/vnd.microsoft.icon",
};

/**
 * Content type of a file by its extension (only the types used by the tests).
 * @param {string} fileName
 * @returns {string}
 */
export function getFileContentType(fileName) {
  const fileExtension = fileName.split(".").pop().toLowerCase();

  const contentType = FILE_CONTENT_TYPES[fileExtension];

  if (!contentType) {
    throw new Error(
      "No file content type listed for given file extension: " + fileExtension,
    );
  }

  return contentType;
}

/**
 * Parses the multipart body of a request into a FormData object (File entries for uploaded files).
 * Replaces the hand written parser of the Cypress suite, uses the native `Response.formData()`.
 * @param {import("@playwright/test").Request} request
 * @returns {Promise<FormData>}
 */
export async function parseFormData(request) {
  return new Response(request.postDataBuffer(), {
    headers: { "content-type": await request.headerValue("content-type") },
  }).formData();
}

/**
 * Holds the matching requests until `release()` is called, to be able to check the loading state
 * (replaces interceptIndefinitely).
 * @param {import("@playwright/test").Page} page
 * @param {string|RegExp|Function} url - url matcher as accepted by `page.route`
 * @param {object} [response] - options for `route.fulfill()`, e.g. `{ json: {...} }` or `{ path: "..." }`
 * @returns {Promise<() => void>} release function, call it to send the response
 */
export async function holdRequest(page, url, response = { status: 200 }) {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  await page.route(url, async (route) => {
    await gate;
    await route.fulfill(response);
  });
  return release;
}

/**
 * Selects the whole content of the tiptap editor, retries until the browser selection equals the editor text.
 * @param {import("@playwright/test").Page} page
 */
export async function selectTiptapContent(page) {
  const tiptap = page.locator(".tiptap");
  await expect(async () => {
    await tiptap.press("ControlOrMeta+a");
    const selectedText = await page.evaluate(() =>
      window.getSelection().toString(),
    );
    expect(selectedText).toBe(await tiptap.innerText());
  }, "Selecting the text failed").toPass();
}

/**
 * Clears the content of the tiptap editor, retries until the editor is empty.
 * @param {import("@playwright/test").Page} page
 */
export async function clearTiptapContent(page) {
  const tiptap = page.locator(".tiptap");
  await expect(async () => {
    await tiptap.clear();
    await expect(tiptap).toHaveText("", { timeout: 500 });
  }, "Clearing the text failed").toPass();
}
