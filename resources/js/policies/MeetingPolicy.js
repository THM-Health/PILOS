// SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Policy for meeting actions
 */
export default {
  viewAny(user) {
    return !user ? false : user.permissions.includes("meetings.viewAny");
  },
};
