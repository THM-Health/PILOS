import { expect as baseExpect } from "@playwright/test";
import { getRequestQuery } from "./utils.js";

/**
 * Custom matchers for the mock handles of `mockApiRequest` (added to `expect` in `test.js`).
 *
 * - `await expect(mock).toHaveReceivedRequest({ json, query }, { nth = 1 })`: the `nth` request of the mock has these
 *   request values (`json` is compared completely, `query` has to contain at least these parameters). It waits for the
 *   request like `mock.waitForRequest(nth)`.
 * - `await expect(mock).toHaveReceivedRequests(count)`: the mock received exactly `count` requests. It retries until
 *   the count is reached.
 */
export const matchers = {
  async toHaveReceivedRequest(mock, expected = {}, { nth = 1 } = {}) {
    const name = "toHaveReceivedRequest";
    let request;
    try {
      request = await mock.waitForRequest(nth);
    } catch {
      return {
        pass: false,
        name,
        message: () =>
          `Expected request ${nth}, but the mock received ${mock.requests.length} request(s)`,
      };
    }

    const actual = {};
    const wanted = {};
    if ("json" in expected) {
      actual.json = request.postDataJSON();
      wanted.json = expected.json;
    }
    if ("query" in expected) {
      actual.query = getRequestQuery(request);
      wanted.query = expected.query;
    }

    let failure = null;
    try {
      /* eslint-disable playwright/no-standalone-expect -- a matcher runs inside of the test */
      if ("json" in wanted) {
        baseExpect(actual.json).toEqual(wanted.json);
      }
      if ("query" in wanted) {
        baseExpect(actual.query).toMatchObject(wanted.query);
      }
      /* eslint-enable playwright/no-standalone-expect */
    } catch (error) {
      failure = error.message;
    }
    return {
      pass: failure === null,
      name,
      message: () =>
        failure ??
        `Expected request ${nth} of ${request.method()} ${request.url()} not to match ${JSON.stringify(wanted)}`,
    };
  },

  async toHaveReceivedRequests(mock, count) {
    const name = "toHaveReceivedRequests";
    const deadline = Date.now() + 5000;
    while (mock.requests.length !== count && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return {
      pass: mock.requests.length === count,
      name,
      message: () =>
        `Expected the mock to receive ${count} request(s), received ${mock.requests.length}`,
    };
  },
};
