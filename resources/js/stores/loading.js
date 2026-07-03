import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import { useSettingsStore } from "./settings";
import { useApi } from "../composables/useApi.js";

export const useLoadingStore = defineStore("loading", {
  state: () => {
    return {
      initialized: false,
      /**
       * Counter of running data loading processes for the entire application.
       *
       * This counter can be used for a global overlay over the whole page and unmounts the whole app until finished
       */
      loadingCounter: 0,

      /**
       * Counter of running data loading processes for the entire application.
       *
       * This counter can be used for a global overlay over the whole page without unmounting
       */
      overlayLoadingCounter: 0,
    };
  },
  actions: {
    async initialize() {
      const api = useApi();
      const auth = useAuthStore();
      const settings = useSettingsStore();

      this.setLoading();
      await settings.getSettings();

      settings.setupAxiosInterceptors();

      await auth.getCurrentUser();

      this.initialized = true;
      this.setLoadingFinished();
    },

    setLoading() {
      this.loadingCounter++;
    },

    setLoadingFinished() {
      this.loadingCounter = Math.max(0, this.loadingCounter - 1);
    },

    setOverlayLoading() {
      this.overlayLoadingCounter++;
    },

    setOverlayLoadingFinished() {
      this.overlayLoadingCounter = Math.max(0, this.overlayLoadingCounter - 1);
    },
  },
});
