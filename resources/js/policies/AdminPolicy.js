// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Policy for administration actions
 */
export default {
  /**
   * Returns a boolean that indicates whether the user view the admin panel
   *
   * @param user
   * @return {boolean}
   */
  view(user) {
    return !user ? false : user.permissions.includes("admin.view");
  },
};
