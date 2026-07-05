// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Policy for system actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user can monitor the system or not.
   *
   * @param user
   * @return {boolean}
   */
  monitor(user) {
    return !user ? false : user.permissions.includes("system.monitor");
  },
};
