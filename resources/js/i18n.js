import axios from 'axios';
import { createI18n } from 'vue-i18n';
import Base from './api/base';

/**
 * Custom message compiler for vue-i18n to use Laravel locale file syntax
 */
function messageCompiler (message) {
  if (typeof message === 'string') {
    return (ctx) => {
      if (!ctx.values) {
        return message;
      }
      Object.keys(ctx.values).forEach(key => {
        // Use Laravel syntax :placeholder instead of {placeholder}
        message = message.replace(`:${key}`, ctx.values[key]);
      });

      return message;
    };
  }
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
  // Load translations from backend if not already loaded
  if (!i18n.availableLocales.includes(locale)) {
    await Base.call('locale/' + locale).then((response) => {
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
  messageCompiler
});
export default i18n;
