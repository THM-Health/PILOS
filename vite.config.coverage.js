// SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from "vite";
import commonConfig from "./vite.config.common";
import istanbul from "vite-plugin-istanbul";
export default ({ mode }) => {
  const config = commonConfig(mode);

  config.plugins.push(
    istanbul({
      forceBuildInstrument: true,
    }),
  );

  config.build.sourcemap = true;

  return defineConfig(config);
};
