// SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import mitt from "mitt";

/**
 * Event bus that can be used to emit events between services and
 * other parts of the application.
 */
const EventBus = mitt();

// listen to all events in development mode
if (import.meta.env.DEV) {
  EventBus.on("*", (type, e) => console.debug("[EventBus]", type, e));
}

export default EventBus;
