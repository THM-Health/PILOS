import axios from 'axios';
import { createI18n } from 'vue-i18n';
import { useApi } from './composables/useApi.js';

/**
 * Custom message compiler for vue-i18n to use Laravel locale file syntax
 */
function messageCompiler (message) {
  // Check if message is missing in the locales (!!missing!! injected by missingHandler)
  const isMissing = message.startsWith('!!missing!!');
  // Remove "!!missing!!" from message
  if (isMissing) {
    message = message.slice(11);
  }

  if (typeof message === 'string') {
    return (ctx) => {
      if (!ctx.values) {
        return message;
      }
      Object.keys(ctx.values).forEach(key => {
        // Use Laravel syntax :placeholder instead of {placeholder}
        message = message.replace(`:${key}`, ctx.values[key]);
      });

      // If message is missing and values are present, append values to message for debugging
      if (isMissing && Object.keys(ctx.values).length > 0) {
        return message + '_' + JSON.stringify(ctx.values);
      }

      return message;
    };
  }
}

function missingHandler (locale, key, instance, type) {
  return '!!missing!!' + key;
}

/**
 * Set the timezone for showing date and time
 * @param i18n vue-i18n instance
 * @param {string=} timezone Timezone string e.g. 'Europe/Berlin', if undefined (default) use users system timezone
 */
export function setTimeZone (i18n, timezone) {
  const locale = i18n.locale;
  const formats = i18n.getDateTimeFormat(locale);
  Object.keys(formats).forEach((index) => {
    formats[index].timeZone = timezone;
  });
  i18n.setDateTimeFormat(locale, formats);
}

/**
 * Set the locale for the app and load the translations from the backend if necessary
 */
export async function setLocale (i18n, locale) {
  const api = useApi();

  // Load translations from backend if not already loaded
  if (!i18n.availableLocales.includes(locale)) {
    await api.call('locale/' + locale).then((response) => {
      i18n.setLocaleMessage(locale, response.data.data);
      i18n.setDateTimeFormat(locale, response.data.meta.dateTimeFormat);
    }).catch((error) => {
      console.error(error);
    });
  }

  i18n.locale = locale;
  axios.defaults.headers.common['Accept-Language'] = locale;
  document.querySelector('html').setAttribute('lang', locale);
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  messageCompiler,
  missing: missingHandler
});
export default i18n;
