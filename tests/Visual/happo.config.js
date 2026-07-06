// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from "happo";

export default defineConfig({
  apiKey: process.env.HAPPO_API_KEY,
  apiSecret: process.env.HAPPO_API_SECRET,
  integration: {
    type: "cypress",
  },
  targets: {
    "chrome-desktop": {
      type: "chrome",
      viewport: "1280x800",
    },
  },
});
