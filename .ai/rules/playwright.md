---
paths:
    - "tests/Playwright/**"
---

# Playwright tests

## Mocked suites mock every API request through the fixtures

The `frontend` and `visual` projects never talk to the backend. Every API request is mocked, a request that no test or fixture mocked fails the test ("API requests that were not mocked"). Mock, change, wait for and assert requests only with the fixtures and the helpers of `tests/Playwright/support/utils.js`. The `system` project uses the real backend and is not affected.

## Naming

| Kind                         | Name                        | Example                                           |
| ---------------------------- | --------------------------- | ------------------------------------------------- |
| Response body of an endpoint | `<thing>Response`           | `roomResponse`, `usersResponse`, `serverResponse` |
| Mock handle of an endpoint   | `<method><Resource>ApiMock` | `getRoomApiMock`, `postRoomAuthApiMock`           |
| Helper method on a handle    | `respondWith…`, `waitFor…`  | `respondWithPage({ currentPage, lastPage })`      |

The name of a handle comes from the HTTP method and the path: `PUT users/2` is `putUserApiMock`, `POST rooms/{room}/auth` is `postRoomAuthApiMock`. A second mock of the same endpoint in one scope gets a number. The `…Response` fixtures are the live bodies that a test changes before the page requests them (`roomResponse.data.allow_membership = true`).

## Fixtures per backend controller

`tests/Playwright/support/fixtures/` has one file per backend controller (`roomController.js`, `roomFileController.js`, `userController.js`, …). Each file holds the `…Response` data fixtures and the automatic handles of the endpoints of that controller. A spec composes the controllers it needs:

```js
import { mergeTests } from "@playwright/test";
import { test as roomControllerTest } from "../support/fixtures/roomController.js";
import { test as roomFileControllerTest } from "../support/fixtures/roomFileController.js";

const test = mergeTests(roomControllerTest, roomFileControllerTest);
```

Options that change a default are set with `test.use`, e.g. `test.use({ roomFilesFixtureName: "roomFilesNoDetails.json" })`. Endpoints without a controller (`getTimezones`, `participantName/check`) have their own small fixture file. The base requests of the app (`config`, `currentUser`, `locale/en`) are mocked in `support/test.js`.

## Change the answer of a mock with its handle

A test never registers a second mock for an endpoint that has a handle. It changes the answer of the handle:

```js
test("shows the error", async ({ page, getRoomApiMock }) => {
    getRoomApiMock.respondWith(modelNotFound("room", ["abc-def-123"]));
    await page.goto("/rooms/abc-def-123");
});
```

- `respondWith(response)`: answers with `{ status, json, headers, path }` or with a function `(request) => response`.
- `respondWithOnce(response)`: answers only the next request, then goes back to the previous answer.
- `respondWithSequence([a, b])`: answers the first request with `a`, the second with `b`, the last answer is repeated.
- `respondWithDefault()`: goes back to the answer the mock was registered with.
- `respondWith({ …, hold: true })` holds the requests until `release()` is called (loading states).
- List handles (`getRoomsApiMock`, `getUsersApiMock`, …) have `respondWithPage({ currentPage, lastPage, perPage })`, `respondWithSlice`, `respondWithNoSearchResults()` and `respondWithNoItems()`. They change the list in place, `usersResponse` is the live body.

`respondWith…` returns the requests that arrive after the change (`const reload = getRoomApiMock.respondWith(…)`, `await reload.waitForRequest()`).

## Endpoints without a handle

Register the mock in the test with `mockApiRequest(page, method, path, response)`. `path` is relative to `api/v1/`, `*` matches the query string. Use the returned handle exactly like a fixture handle. If several tests of a controller need an endpoint, add a fixture for it instead.

```js
const putServerApiMock = await mockApiRequest(page, "PUT", "servers/1", {
    status: 204,
});
```

## Wait for requests and assert them with the handle

- `await mock.waitForRequest()` / `waitForRequest(2)`: waits for the first / second request and returns it. It can be called after the action, no promise has to be created before.
- `mock.waitForNextRequest()` / `waitForNextResponse()`: a promise for the next request, create it before the action.
- `await expect(mock).toHaveReceivedRequest({ json, query }, { nth })` checks the body (`json`, exact) and the query parameters (`query`, at least these) of a request. `await expect(mock).toHaveReceivedRequests(n)` checks the count.
- `getRequestQuery(request)` and `getRequestFormData(request)` read a request that was waited for.

## Responses of the API

Use the builders of `utils.js` for errors instead of writing the JSON: `serverError()`, `unauthorized(message)`, `forbidden(message)`, `modelNotFound(model, ids)`, `validationErrors(errors, message)`, `errorResponse(status, message)`.

## Not allowed

- `page.route`, `page.waitForRequest` and `page.waitForResponse` in the mocked suites (ESLint `no-restricted-syntax`). The only exceptions are routes of external URLs (redirect targets), marked with an `eslint-disable-next-line` comment and a reason.
- Registering a second `mockApiRequest` for an endpoint that has a handle.
- Describe-level `let` variables that hold mocks, request counters or flags for a route callback. Use the handle (`requests`, `respondWithSequence`, a response function).
- Helpers that mock requests outside of the fixtures (the former `intercept…` helpers). A helper gets the handle it needs as an argument or uses `mockApiRequest`.

## Add a new endpoint

1. Add the `…Response` fixture and an automatic handle in the fixture file of the backend controller (for a list use `mockApiList`, for a paginated body `mockApiCollection`).
2. Name the handle `<method><Resource>ApiMock`.
3. Compose the controller into the specs that need it with `mergeTests`.
