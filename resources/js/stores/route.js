// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineStore } from "pinia";
import { useSettingsStore } from "./settings.js";

export const useRouteStore = defineStore("route", {
  state: () => {
    return {
      pageTitle: null,
    };
  },
  getters: {
    getPageTitle: (state) => {
      return state.pageTitle;
    },
  },
  actions: {
    setPageTitle(pageTitle, updateState = true) {
      const settings = useSettingsStore();

      const postfix = settings.getSetting("general.name");

      document.title = pageTitle ? pageTitle + " - " + postfix : postfix;

      if (updateState) {
        this.pageTitle = pageTitle;
      }
    },
  },
});
