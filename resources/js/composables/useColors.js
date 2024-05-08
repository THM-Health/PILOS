import { useCssVar } from '@vueuse/core';

/**
 * Get the color values from the current theme
 * @return {{getAllColors: (function(): string[]), getColor: (function(*): string)}}
 */
export function useColors () {
  // List of all colors provided by the theme as a css variable
  const cssVars = {
    indigo: '--pc-indigo',
    blue: '--pc-blue',
    cyan: '--pc-cyan',
    teal: '--pc-teal',
    green: '--pc-green',
    orange: '--pc-orange',
    yellow: '--pc-yellow',
    red: '--pc-red',
    pink: '--pc-pink',
    purple: '--pc-purple',
    bluegray: '--pc-bluegray'
  };

  /**
   * Get the value of a specify color
   * @param color
   * @return {string}
   */
  function getColor (color) {
    return useCssVar(cssVars[color]).value.toUpperCase();
  }

  /**
   * Get all colors values
   * @return {string[]}
   */
  function getAllColors () {
    return Object.keys(cssVars).map(color => getColor(color));
  }

  return {
    getColor,
    getAllColors
  };
}
