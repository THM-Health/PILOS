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

      // If ctx.values has n property, we have to handle pluralization
      if (ctx.values["n"] !== undefined) {
        message = getPluralization(message, ctx.values["n"]);
      }

      Object.keys(ctx.values).forEach((key) => {
        // Use Laravel syntax :placeholder instead of {placeholder}
        message = message.replace(`:${key}`, ctx.values[key]);
      });

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
  const regex = /^(?:(?:\{(\d+)\})|(?:\[(\d+),(\d+|\*)\])) (.*)$/;

  for (const part of messageParts) {
    const match = part.trim().match(regex);
    if (match) {
      // Match {n}
      if (match[1] !== undefined && Number(match[1]) === Number(count)) {
        return match[4];
      }
      if (match[1] === undefined) {
        // Match [n,m] or [n,*]
        const n = Number(match[2]);
        const m = match[3] === "*" ? Infinity : Number(match[3]);
        if (Number(count) >= n && Number(count) <= m) {
          return match[4];
        }
      }
    }
  }

  // Fallback; should not happen if the syntax is correct
  return message;
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
