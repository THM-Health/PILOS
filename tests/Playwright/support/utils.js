import { readFileSync } from "node:fs";
import { expect } from "@playwright/test";

// ----------------------------------------------------------------------------
// Fixtures

/**
 * Reads a JSON fixture from `tests/Playwright/fixtures`. Returns a new object each time, so tests can change it.
 * @param {string} name e.g. "room.json"
 * @returns {any}
 */
export function readFixture(name) {
  return JSON.parse(readFileSync(`tests/Playwright/fixtures/${name}`, "utf8"));
}

// ----------------------------------------------------------------------------
// Mocking API requests (paths relative to `api/v1/`)

/**
 * @typedef {object} RequestView The requests that were received after a point in time.
 * @property {import("@playwright/test").Request[]} requests
 * @property {(count?: number) => Promise<import("@playwright/test").Request>} waitForRequest Like the one of the mock,
 *   but counts only the requests after that point in time.
 */

/**
 * @typedef {object} ApiMock Handle of a mocked API endpoint.
 * @property {import("@playwright/test").Request[]} requests All requests that reached the mock.
 * @property {(count?: number) => Promise<import("@playwright/test").Request>} waitForRequest Waits until at least `count`
 *   requests were received (default 1) and returns the `count`th one. As the mock records all requests, it can be
 *   called after the action that triggers the request (no promise has to be created before it, unlike
 *   `page.waitForRequest`).
 * @property {(response: object|((request: import("@playwright/test").Request) => object)) => RequestView} respondWith
 *   Changes the answer of the mock, the recorded requests and `waitForRequest` keep counting. The response is the same
 *   as the one of `mockApiRequest`. Returns a view of the requests that are received after the change.
 * @property {() => RequestView} respondWithDefault Goes back to the answer the mock was registered with. It is a deep
 *   copy taken at registration, so changes that a test made to the registered object afterwards are not part of it, and
 *   a `hold` of the default is applied again with a new gate. Returns a view like `respondWith`.
 * @property {() => void} release Answers all requests that are held by a response with `hold: true`.
 */

/**
 * Mocks the requests of a method to `api/v1/<path>`, other methods fall through to the next route (mocks registered
 * later win, like `cy.intercept`). All requests that reach the mock are recorded. Tests change the answer of an
 * existing mock with `respondWith()`, they register a new mock only for endpoints that have no mock yet.
 *
 * The response object is served as it is (not copied), so tests can change a mocked object after registering it, e.g.
 * the body that a fixture hands to the test. `respondWithDefault()` serves a deep copy of it from the time of the
 * registration instead.
 * @param {import("@playwright/test").Page} page
 * @param {string|null} method - `null` mocks every method
 * @param {string|RegExp|Function} path - glob relative to `api/v1/` (`*` matches the query string, but not further
 *   path segments), other matchers of `page.route` are used as they are
 * @param {object|((request: import("@playwright/test").Request) => object)} response - options for
 *   `route.fulfill()` (e.g. `{ status, json }` or `{ path }`) or a function that returns them. With `hold: true` the
 *   requests are answered after `release()` was called (replaces `interceptIndefinitely`), every response has its own
 *   hold.
 * @param {object} [options]
 * @param {(request: import("@playwright/test").Request) => void} [options.onRequest] - called for every request
 * @returns {Promise<ApiMock>}
 */
export async function mockApiRequest(
  page,
  method,
  path,
  response,
  { onRequest } = {},
) {
  const requestRecorder = createRequestRecorder();
  const { requests } = requestRecorder;
  const gates = new Set();

  const createAnswer = (definition) => {
    if (typeof definition === "function") {
      return { respond: definition, gate: null };
    }
    const { hold = false, ...options } = definition;
    let gate = null;
    if (hold) {
      let open;
      gate = { promise: new Promise((resolve) => (open = resolve)), open };
      gates.add(gate);
    }
    return { respond: () => options, gate };
  };

  const defaultResponse =
    typeof response === "function" ? response : structuredClone(response);
  let answer = createAnswer(response);

  await page.route(
    typeof path === "string" ? `**/api/v1/${path}` : path,
    async (route) => {
      const request = route.request();
      if (method && request.method() !== method) {
        return route.fallback();
      }
      requests.push(request);
      onRequest?.(request);
      const current = answer;
      await current.gate?.promise;
      return route.fulfill(current.respond(request));
    },
  );

  return {
    ...requestRecorder,
    respondWith(newResponse) {
      answer = createAnswer(newResponse);
      return requestRecorder.startView();
    },
    respondWithDefault() {
      answer = createAnswer(defaultResponse);
      return requestRecorder.startView();
    },
    release() {
      gates.forEach((gate) => gate.open());
    },
  };
}

/**
 * Answers the GET requests to `api/v1/<path>` with a paginated list like the API does. If `meta.per_page` is smaller
 * than the number of items, only the requested page (query `page`) of the items is answered. `meta.current_page`,
 * `meta.from` and `meta.to` are derived from the request, the test sets `meta.per_page`, `meta.last_page`,
 * `meta.total` and `meta.total_no_filter` of `collection`. Use `respondWith` of the handle for other answers.
 * @param {import("@playwright/test").Page} page
 * @param {string} path - glob relative to `api/v1/`
 * @param {{ data: object[], meta: object }} collection - read on every request
 * @returns {Promise<ApiMock>}
 */
export async function mockApiCollection(page, path, collection) {
  return mockApiRequest(page, "GET", path, (request) => {
    const { data, meta } = collection;
    const currentPage = Number(getRequestQuery(request).page ?? 1);
    const offset =
      meta.per_page < data.length ? (currentPage - 1) * meta.per_page : 0;
    const items =
      meta.per_page < data.length
        ? data.slice(offset, offset + meta.per_page)
        : data;
    return {
      json: {
        ...collection,
        data: items,
        meta: {
          ...meta,
          current_page: currentPage,
          from: items.length ? offset + 1 : null,
          to: items.length ? offset + items.length : null,
        },
      },
    };
  });
}

/**
 * @typedef {ApiMock & {
 *   respondWithPage: (options: { currentPage?: number, lastPage: number, perPage?: number, meta?: object }) => RequestView,
 *   respondWithSlice: (options?: { slice?: number[], meta?: object }) => RequestView,
 *   respondWithNoSearchResults: () => RequestView,
 *   respondWithNoItems: () => RequestView,
 * }} ApiListMock
 */

/**
 * Mocks a list endpoint (GET `api/v1/<path>`) whose answer the test sets page by page. `body` is the live answer, the
 * test changes it (e.g. `body.data[0].name = ...`) before the request. The `respondWith…` methods fill `body` again
 * from a copy of how it was at the registration, so they undo changes of the test:
 * - `respondWithPage({ currentPage = 1, lastPage, perPage = 1, meta })`: the items of that page and the meta data
 * - `respondWithSlice({ slice, meta })`: a slice of the items and changed meta data
 * - `respondWithNoSearchResults()`: a search without result, `respondWithNoItems()`: no items at all
 * - `respondWithDefault()`: the whole list again
 * @param {import("@playwright/test").Page} page
 * @param {string} path - glob relative to `api/v1/`
 * @param {{ data: object[], meta: object }} body e.g. `readFixture("rooms.json")`
 * @returns {Promise<ApiListMock>}
 */
export async function mockApiList(page, path, body) {
  const pristine = structuredClone(body);
  const mock = await mockApiRequest(page, "GET", path, () => ({ json: body }));
  const answerWithBody = mock.respondWithDefault;

  const respondWithSlice = ({ slice, meta } = {}) => {
    const fresh = structuredClone(pristine);
    if (slice) {
      fresh.data = fresh.data.slice(...slice);
    }
    Object.assign(fresh.meta, meta);
    Object.assign(body, fresh);
    return answerWithBody();
  };

  return Object.assign(mock, {
    respondWithSlice,
    respondWithPage({ currentPage = 1, lastPage, perPage = 1, meta } = {}) {
      const start = (currentPage - 1) * perPage;
      const end = start + perPage;
      return respondWithSlice({
        slice: [start, end],
        meta: {
          current_page: currentPage,
          from: start + 1,
          to: end,
          last_page: lastPage,
          per_page: perPage,
          ...meta,
        },
      });
    },
    respondWithNoSearchResults() {
      return respondWithSlice({
        slice: [0, 0],
        meta: { from: null, per_page: 1, to: null, total: 0 },
      });
    },
    respondWithNoItems() {
      return respondWithSlice({
        slice: [0, 0],
        meta: {
          from: null,
          per_page: 1,
          to: null,
          total: 0,
          total_no_filter: 0,
        },
      });
    },
    respondWithDefault() {
      return respondWithSlice();
    },
  });
}

/**
 * Holds the matching requests of every method until `release()` is called, to be able to check the loading state
 * (replaces interceptIndefinitely).
 * @param {import("@playwright/test").Page} page
 * @param {string|RegExp|Function} path - see `mockApiRequest`
 * @param {object} [response] - options for `route.fulfill()`, e.g. `{ json: {...} }` or `{ path: "..." }`
 * @returns {Promise<() => void>} release function, call it to send the response
 */
export async function holdApiRequest(page, path, response = { status: 200 }) {
  const mock = await mockApiRequest(page, null, path, {
    ...response,
    hold: true,
  });
  return () => mock.release();
}

// ----------------------------------------------------------------------------
// Responses of the API (for `mockApiRequest` and `respondWith`)

/**
 * An error response of the API with a message. `options` are added to the response, e.g. `{ hold: true }`.
 * @param {number} status
 * @param {string} message
 * @param {object} [options]
 */
export function errorResponse(status, message, options = {}) {
  return { status, json: { message }, ...options };
}

/** 500, the server fails with a message (default "Test"). */
export function serverError(options = {}) {
  const { message = "Test", ...rest } = options;
  return errorResponse(500, message, rest);
}

/** 401, e.g. with the message `invalid_auth_token` or `invalid_personalized_link`. */
export function unauthorized(message, options = {}) {
  return errorResponse(401, message, options);
}

/** 403, e.g. with the message `require_code` or `guests_not_allowed`. */
export function forbidden(message, options = {}) {
  return errorResponse(403, message, options);
}

/**
 * 404 for a model that does not exist.
 * @param {string} model e.g. "room"
 * @param {(string|number)[]} ids
 * @param {object} [options]
 */
export function modelNotFound(model, ids, options = {}) {
  return {
    status: 404,
    json: { message: "model_not_found", model, ids },
    ...options,
  };
}

/**
 * 422 with the validation errors of fields.
 * @param {Record<string, string[]>} errors messages by field
 * @param {string} [message] summary message of the response
 * @param {object} [options]
 */
export function validationErrors(errors, message, options = {}) {
  return {
    status: 422,
    json: message === undefined ? { errors } : { message, errors },
    ...options,
  };
}

// ----------------------------------------------------------------------------
// Reading requests

/**
 * Records requests and lets a test wait for them. `mockApiRequest` returns one, fixtures with their own mock handles
 * spread it into the handle (`{ ...createRequestRecorder(), ... }`).
 * - `requests`: all recorded requests
 * - `waitForNextRequest()`: a promise for the next request, call it before the action that triggers it
 * - `waitForRequest(count = 1)`: waits until at least `count` requests were recorded and returns the `count`th one. As
 *   the mock records all requests, it can be called after the action that triggers the request (no promise has to be
 *   created before it, unlike `page.waitForRequest`).
 * @returns {{ requests: import("@playwright/test").Request[], waitForRequest: (count?: number) => Promise<import("@playwright/test").Request> }}
 */
export function createRequestRecorder() {
  const requests = [];
  const waitForRequestAfter =
    (start) =>
    async (count = 1) => {
      await expect
        .poll(() => requests.length - start)
        .toBeGreaterThanOrEqual(count);
      return requests[start + count - 1];
    };
  return {
    requests,
    waitForRequest: waitForRequestAfter(0),
    /**
     * Returns a promise for the next request. Call it before the action that triggers the request.
     */
    waitForNextRequest() {
      const start = requests.length;
      return waitForRequestAfter(start)(1);
    },
    /**
     * A view of the requests that are recorded from now on, with its own `requests` and `waitForRequest`, e.g. to wait
     * for the first request after a change of the answer.
     */
    startView() {
      const start = requests.length;
      return {
        get requests() {
          return requests.slice(start);
        },
        waitForRequest: waitForRequestAfter(start),
      };
    },
  };
}

/**
 * Query parameters of a request as a plain object.
 * @param {import("@playwright/test").Request} request
 * @returns {Record<string, string>}
 */
export function getRequestQuery(request) {
  return Object.fromEntries(new URL(request.url()).searchParams);
}

/**
 * Parses the multipart body of a request into a FormData object (File entries for uploaded files).
 * Replaces the hand written parser of the Cypress suite, uses the native `Response.formData()`.
 * @param {import("@playwright/test").Request} request
 * @returns {Promise<FormData>}
 */
export async function getRequestFormData(request) {
  return new Response(request.postDataBuffer(), {
    headers: { "content-type": await request.headerValue("content-type") },
  }).formData();
}

// ----------------------------------------------------------------------------
// Assertions

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

// ----------------------------------------------------------------------------
// Files

/**
 * Converts an ArrayBuffer (or Node Buffer) to a base64 string.
 * @param {ArrayBuffer|Uint8Array} buffer
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
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
