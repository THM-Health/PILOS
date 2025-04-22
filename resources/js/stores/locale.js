import { defineStore } from "pinia";
import i18n, { setTimeZone, setLocale } from "../i18n";
import { useApi } from "../composables/useApi.js";
import { useTextDirection } from "@vueuse/core";

export const useLocaleStore = defineStore("locale", {
  state: () => {
    return {
      currentLocale: null,
      timezone: null,
      i18n: i18n.global,
      locales: {},
    };
  },
  actions: {
    async setLocale(currentLocale) {
      console.log(currentLocale);
      this.currentLocale = currentLocale;

      const api = useApi();

      // Load translations from backend if not already loaded
      if (!(currentLocale in this.locales)) {
        let localeLoaded = false;
        await api
          .call("locale/" + currentLocale)
          .then((response) => {
            localeLoaded = true;
            this.locales[currentLocale] = {
              messages: response.data.data,
              dateTimeFormat: response.data.meta.dateTimeFormat,
              textDirection: response.data.meta.rtl === true ? "rtl" : "ltr",
            };
          })
          .catch((error) => {
            console.error(error);
          });
        if (!localeLoaded) {
          return;
        }
      }

      setLocale(
        this.i18n,
        currentLocale,
        this.locales[currentLocale].messages,
        this.locales[currentLocale].dateTimeFormat,
      );
      setTimeZone(this.i18n, this.timezone);
      const dir = useTextDirection();
      dir.value = this.locales[currentLocale].textDirection;
    },

    async setTimezone(timezone) {
      this.timezone = timezone;
      setTimeZone(this.i18n, timezone);
    },
  },
});
