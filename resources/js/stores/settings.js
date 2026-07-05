// SPDX-FileCopyrightText: 2022 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineStore } from "pinia";
import * as _ from "lodash-es";
import { useApi } from "../composables/useApi.js";
import { setToastLifetime } from "../composables/useToast";
import { updateTheme } from "../composables/useTheme";

export const useSettingsStore = defineStore("settings", {
  state: () => {
    return {
      settings: null,
    };
  },
  getters: {
    getSetting: (state) => {
      return (setting) =>
        _.isEmpty(state.settings) ? undefined : _.get(state.settings, setting);
    },
  },
  actions: {
    async getSettings() {
      const api = useApi();

      const response = await api.call("config");
      this.settings = response.data.data;

      setToastLifetime(this.settings.general.toast_lifetime);

      updateTheme(
        this.settings.theme.primary_color,
        this.settings.theme.rounded,
      );
    },
  },
});
