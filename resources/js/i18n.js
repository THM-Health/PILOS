import axios from "axios";
import { createI18n } from "vue-i18n";

/**
 * Custom message compiler for vue-i18n to use Laravel locale file syntax
 */
function messageCompiler(message) {
  // Check if a message is missing in the locales (!!missing!! injected by missingHandler)
  const isMissing = message.startsWith("!!missing!!");
  // Remove "!!missing!!" from message
  if (isMissing) {
    message = message.slice(11);
  }

  if (typeof message === "string") {
    return (ctx) => {
      if (!ctx.values) {
        return message;
      }

      // If ctx.values has n or count property, we have to handle pluralization
      if (ctx.values["n"] !== undefined) {
        message = getPluralization(message, ctx.values["n"]);
      } else if (ctx.values["count"] !== undefined) {
        message = getPluralization(message, ctx.values["count"]);
      }

      // Use Laravel syntax :placeholder instead of {placeholder}
      message = applyReplacements(message, ctx.values);

      // If a message is missing and values are present, append values to the message for debugging
      if (isMissing && Object.keys(ctx.values).length > 0) {
        return message + "_" + JSON.stringify(ctx.values);
      }

      return message;
    };
  }
}

function getPluralization(message, count) {
  const messageParts = message.split("|");
  const regex = /^(?:(?:\{(-?\d+)\})|(?:\[(-?\d+|\*),(-?\d+|\*)\]))(.*)$/;

  for (const part of messageParts) {
    const match = part.match(regex);
    if (match) {
      // Match {n}
      if (match[1] !== undefined && Number(match[1]) === Number(count)) {
        return match[4].trim();
      }
      if (match[1] === undefined) {
        // Match [n,m], [*,m] or [n,*]
        const n = match[2] === "*" ? -Infinity : Number(match[2]);
        const m = match[3] === "*" ? Infinity : Number(match[3]);
        if (Number(count) >= n && Number(count) <= m) {
          return match[4].trim();
        }
      }
    }
  }

  // Fallback; should not happen if the syntax is correct
  return message;
}

/**
 * Apply the replacements to the message using laravel :placeholder syntax
 * @param {string} message
 * @param {object} replacementMap
 * @returns {string} message with the replacements applied
 */
function applyReplacements(message, replacementMap) {
  if (Object.keys(replacementMap).length === 0) {
    // No replacements to apply, return the original message
    return message;
  }

  // Transform the replacement map to a map with variant cases of the key
  // The casing of the key determines if the value should be transformed
  // plain key -> plain value
  // uppercase key -> uppercase value
  // first letter uppercase key -> first letter uppercase value
  const replacements = {};
  for (const key of Object.keys(replacementMap)) {
    const replacement = String(replacementMap[key]);

    replacements[`:${key}`] = replacement;
    replacements[`:${key.toUpperCase()}`] = replacement.toUpperCase();
    replacements[`:${key.charAt(0).toUpperCase() + key.slice(1)}`] =
      replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  // Sort the placeholder keys by length in descending order to make sure the longest placeholders are replaced first
  const sortedPlaceholderKeys = Object.keys(replacements).sort(
    (first, second) => second.length - first.length,
  );

  // Escape special characters in the placeholder keys
  const escapedPlaceholderKeys = sortedPlaceholderKeys.map((placeholderKey) =>
    placeholderKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );

  // Create a regular expression and replace the placeholder keys with their corresponding values
  const regExp = new RegExp(escapedPlaceholderKeys.join("|"), "g");
  return message.replace(regExp, (matched) => replacements[matched]);
}

function missingHandler(locale, key) {
  return "!!missing!!" + key;
}

/**
 * Set the timezone for showing date and time
 * @param i18n vue-i18n instance
 * @param {string=} timezone Timezone string e.g. 'Europe/Berlin', if undefined (default) use users system timezone
 */
export function setTimeZone(i18n, timezone) {
  const locale = i18n.locale;
  const formats = i18n.getDateTimeFormat(locale);
  Object.keys(formats).forEach((index) => {
    formats[index].timeZone = timezone;
  });
  i18n.setDateTimeFormat(locale, formats);
}

/**
 * Set the locale for the app
 */
export function setLocale(i18n, locale, messages, dateTimeFormat) {
  i18n.setLocaleMessage(locale, messages);
  i18n.setDateTimeFormat(locale, dateTimeFormat);
  i18n.locale = locale;
  axios.defaults.headers.common["Accept-Language"] = locale;
  document.querySelector("html").setAttribute("lang", locale);
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false,
  messageCompiler,
  missing: missingHandler,
});
export default i18n;
