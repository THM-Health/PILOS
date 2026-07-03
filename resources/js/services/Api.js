import axios from "axios";
import { useToast } from "../composables/useToast";
import i18n from "../i18n";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import { EVENT_FORBIDDEN, EVENT_UNAUTHORIZED } from "../constants/events.js";
import EventBus from "./EventBus.js";
import { ROOM } from "../constants/modelNames.js";
import {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_GUESTS_ONLY,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_PAYLOAD_TOO_LARGE,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
} from "../constants/httpStatusCodes.js";

axios.defaults.withCredentials = true;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

export class Api {
  constructor() {
    this.auth = useAuthStore();
    this.router = useRouter();
    this.toast = useToast();
    this.t = i18n.global.t;
  }

  setupAxiosInterceptors(settingsStore) {
    // Add a response interceptor
    axios.interceptors.response.use(function onFulfilled(response) {
      const frontendHash = response.headers["x-frontend-version"];
      if (frontendHash !== undefined)
        settingsStore.setFrontendVersion(frontendHash);

      return response;
    });
  }

  /**
   * Makes a request with the passed params.
   *
   * If `loadCsrfCookie` is set to true before the request a csrf cookie will be requested.
   *
   * @param path Path that should be called. The api slug will be automatically added.
   * @param config Config object as it is passed to the axios function.
   * @param loadCsrfCookie Boolean, that indicates whether a csrf cookie should be requested or not.
   * @return {Promise<AxiosResponse<any>>} Promise that resolves to a axios response or rejects on errors.
   */
  call(path, config, loadCsrfCookie = false) {
    const promise = loadCsrfCookie
      ? axios.get("/sanctum/csrf-cookie")
      : Promise.resolve();

    return promise.then(() => {
      return axios(`/api/v1/${path}`, config);
    });
  }

  /**
   * Global error handler for unhandled errors that can occur in the application.
   *
   * Make sure that you catch possible errors caused by requests to the server (e.g. validation errors)
   * in the appropriate place in the application. This handler is only for the last instance if there
   * is something going on, that should be normally.
   *
   * @param error The occurred error
   * @param options
   */
  error(error, options = {}) {
    const statusCode = this.getErrorStatusCode(error);
    const message = this.getErrorMessage(error);

    if (statusCode === HTTP_STATUS_UNAUTHORIZED) {
      // 401 => unauthorized, redirect and show error messages as flash!
      this.handleUnauthorized(error, options);
    } else if (
      statusCode === HTTP_STATUS_FORBIDDEN &&
      message === "This action is unauthorized."
    ) {
      // 403 => unauthorized, show error messages as flash!
      this.handleForbidden(error, options);
    } else if (statusCode === HTTP_STATUS_NOT_FOUND) {
      // 404 => not found, show error messages as flash!
      if (message === "model_not_found") {
        this.handleModelNotFound(error, options);
      } else {
        this.handleOtherServerError(error, options);
      }
    } else if (statusCode === HTTP_STATUS_GUESTS_ONLY) {
      // 420 => only for guests, redirect to home route
      this.handleGuestsOnly(error, options);
    } else if (statusCode === HTTP_STATUS_PAYLOAD_TOO_LARGE) {
      // 413 => payload to large
      this.handlePayloadTooLarge(error, options);
    } else if (statusCode === HTTP_STATUS_TOO_MANY_REQUESTS) {
      // 429 => too many requests
      this.handleTooManyRequests(error, options);
    } else if (statusCode === HTTP_STATUS_SERVICE_UNAVAILABLE) {
      // 503 => maintenance mode
      this.handleMaintenance(error, options);
    } else if (statusCode !== undefined) {
      // Another error on server
      this.handleOtherServerError(error, options);
    } else {
      this.handleClientError(error, options);
    }
  }

  validationError(error) {
    this.toast.error(error.response.data.message);
  }

  getErrorMessage(error) {
    return error.response && error.response.data
      ? error.response.data.message
      : undefined;
  }

  getErrorStatusCode(error) {
    return error.response !== undefined ? error.response.status : undefined;
  }

  handleUnauthorized(error, options) {
    EventBus.emit(EVENT_UNAUTHORIZED);
    if (this.auth.isAuthenticated) {
      this.toast.info(this.t("app.flash.unauthenticated"));
      this.auth.setCurrentUser(null);
      // By default, always redirect on an unauthenticated error to the login page,
      // however using the flag 'redirectOnUnauthenticated' this behavior can be turned off
      if (options.redirectOnUnauthenticated !== false) {
        this.router.replace({
          name: "login",
          query: { redirect: this.router.currentRoute.value.path },
        });
      }
    }
  }

  handleForbidden() {
    EventBus.emit(EVENT_FORBIDDEN);
    this.toast.error(this.t("app.flash.unauthorized"));
  }

  handleModelNotFound(error, options) {
    const data = error.response?.data;
    const model = data?.model;
    const ids = data?.ids;

    if (model === ROOM && options.redirectOnRoomModelNotFound !== false) {
      // Redirect to room index page if user is authenticated, otherwise show 404 page, because
      // unauthenticated user is not able to visit the room index page
      if (this.auth.isAuthenticated) {
        this.router.push({ name: "rooms.index" });
      } else {
        this.router.push({ name: "404" });
      }
    }

    // Show error message for model not found error with model name and ids if available
    this.toast.error(
      this.t("app.flash.model_not_found.title", {
        model: this.t("app.model." + model),
      }),
      ids && ids.length > 0
        ? this.t("app.flash.model_not_found.details", {
            ids: `${ids.join(", ")}`,
          })
        : null,
    );
  }

  handleGuestsOnly() {
    this.toast.info(this.t("app.flash.guests_only"));
    this.router.replace({ name: "home" });
  }

  handlePayloadTooLarge() {
    this.toast.error(this.t("app.flash.too_large"));
  }

  handleTooManyRequests() {
    this.toast.error(this.t("app.flash.too_many_requests"));
  }

  handleMaintenance() {
    window.location.reload();
  }

  handleOtherServerError(error) {
    const statusCode = this.getErrorStatusCode(error);
    const message = this.getErrorMessage(error);

    this.toast.error(
      message
        ? this.t("app.flash.server_error.message", { message })
        : this.t("app.flash.server_error.empty_message"),
      this.t("app.flash.server_error.error_code", { statusCode }),
    );
  }

  handleClientError(error) {
    this.toast.error(this.t("app.flash.client_error"));
    console.error(error);
  }
}
