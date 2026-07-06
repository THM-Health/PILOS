// SPDX-FileCopyrightText: 2022 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from "vite";
import commonConfig from "./vite.config.common";
export default ({ mode }) => {
  return defineConfig(commonConfig(mode));
};
