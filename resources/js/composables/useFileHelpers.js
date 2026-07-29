export function useFileHelpers() {
  return new FileHelpers();
}

class FileHelpers {
  /**
   * Parse file size to human-readable format using SI suffixes (base 10)
   * @param sizeInBytes File size in bytes
   */
  fileSize(sizeInBytes) {
    const bytes = Number(sizeInBytes);

    // Validate input: must be a finite number greater than zero
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

    // SI unit suffixes in ascending order (base 10: 1 kB = 1000 B)
    const units = ["B", "kB", "MB", "GB"];

    // Determine the appropriate unit exponent (0 = B, 1 = kB, 2 = MB, …)
    // log10(bytes) / 3 gives the base-1000 exponent; clamped to the available units
    let exponent = Math.min(
      Math.floor(Math.log10(bytes) / 3),
      units.length - 1,
    );

    // Scale the value down to the chosen unit and round to 2 decimal places
    let value = Math.round((bytes / Math.pow(1000, exponent)) * 100) / 100;

    // If the value rounds up to 1000, we need to move to the next unit
    if (value === 1000 && exponent < units.length - 1) {
      exponent += 1;
      value = 1;
    }

    // Return the rounded value with its corresponding SI unit suffix
    return `${value} ${units[exponent]}`;
  }
}
