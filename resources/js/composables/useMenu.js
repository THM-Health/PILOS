import { useBreakpoints } from "@vueuse/core";

export const menuBreakpoint = 1023;
const breakpoints = useBreakpoints({
  desktop: menuBreakpoint,
});
export const isMobile = breakpoints.smallerOrEqual("desktop");
