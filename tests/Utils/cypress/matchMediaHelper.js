// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export function patchMatchMedia(win) {
  const originalMatchMedia = win.matchMedia.bind(win);

  win.matchMedia = (query) => {
    const mql = originalMatchMedia(query);

    // Get the dark mode setting from Cypress exposed variables
    const darkMode = Cypress.expose("darkMode");

    // Override the matches property for dark mode queries based on the provided darkMode value
    if (query === "(prefers-color-scheme: dark)" && darkMode !== undefined) {
      Object.defineProperty(mql, "matches", {
        value: darkMode,
      });
    }

    return mql;
  };
}
