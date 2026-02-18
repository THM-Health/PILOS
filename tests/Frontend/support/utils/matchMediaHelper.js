export function patchMatchMedia(win, config = {}) {
  const originalMatchMedia = win.matchMedia.bind(win);

  win.matchMedia = (query) => {
    const mql = originalMatchMedia(query);

    // Override the matches property for dark mode queries based on the provided config
    if (
      query === "(prefers-color-scheme: dark)" &&
      config.darkMode !== undefined
    ) {
      Object.defineProperty(mql, "matches", {
        value: config.darkMode,
      });
    }

    return mql;
  };
}
