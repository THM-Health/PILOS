// SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useBreakpoints } from "@vueuse/core";

export const menuBreakpoint = 1023;
const breakpoints = useBreakpoints({
  desktop: menuBreakpoint,
});
export const isMobile = breakpoints.smallerOrEqual("desktop");
