export function useFileHelpers() {
  return new FileHelpers();
}

class FileHelpers {
  /**
   * Parse file size to human-readable format using SI suffixes (base 10)
   * @param sizeInBytes File size in bytes
   */
  fileSize(sizeInBytes) {
    // Return early with a human-readable zero value
    if (sizeInBytes === 0) return "0 B";

    // SI unit suffixes in ascending order (base 10: 1 kB = 1000 B)
    const units = ["B", "kB", "MB", "GB"];

    // Determine the appropriate unit exponent (0 = B, 1 = kB, 2 = MB, …)
    // log10(sizeInBytes) / 3 gives the base-1000 exponent; clamped to the available units
    const exponent = Math.min(
      Math.floor(Math.log10(sizeInBytes) / 3),
      units.length - 1,
    );

    // Scale the value down to the chosen unit
    const value = sizeInBytes / Math.pow(1000, exponent);

    // Return the rounded value with its corresponding SI unit suffix
    return `${value.toFixed()} ${units[exponent]}`;
  }
}
