import { $dt } from '@primevue/themes';

/**
 * Get the color values from the current theme
 * @return {{getAllColors: (function(): string[]), getColor: (function(*): string)}}
 */
export function useColors () {
  // List of all colors provided by the theme as a css variable
  const cssVars = ['indigo', 'blue', 'cyan', 'teal', 'green', 'orange', 'yellow', 'red', 'pink', 'purple'];

  /**
   * Get the value of a specify color
   * @param color
   * @return {string}
   */
  function getColor (color) {
    return $dt(color + '.500').value;
  }

  /**
   * Get all colors values
   * @return {string[]}
   */
  function getAllColors () {
    return Object.values(cssVars).map(color => getColor(color));
  }

  return {
    getColor,
    getAllColors
  };
}
