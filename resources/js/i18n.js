import axios from 'axios';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import dateTimeFormats from './lang/date-time-formats';
import _ from 'lodash';
const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE;

const messages = {};

Vue.use(VueI18n);

class CustomFormatter {
  interpolate (message, values) {
    if (!values) {
      return [message];
    }
    Object.keys(values).forEach(key => {
      // Use Laravel syntax :placeholder instead of {placeholder}
      message = message.replace(`:${key}`, values[key]);
    });

    return [message];
  }
}

const i18n = new VueI18n({
  formatter: new CustomFormatter(),
  dateTimeFormats,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  availableLocales: import.meta.env.VITE_AVAILABLE_LOCALES.split(','),
  messages
});

const overrideLocales = import.meta.glob('../custom/lang/*.json', { eager: true });

const loadedLanguages = [];

export default i18n;

/**
 * Set the timezone for showing date and time
 * @param {string=} timezone Timezone string e.g. 'Europe/Berlin', if undefined (default) use users system timezone
 */
export function setTimeZone (timezone) {
  const locales = i18n.availableLocales;
  locales.forEach((locale) => {
    const formats = i18n.getDateTimeFormat(locale);
    Object.keys(formats).forEach((index) => {
      formats[index].timeZone = timezone;
    });
    i18n.setDateTimeFormat(locale, formats);
  });
}

function setI18nLanguage (lang) {
  i18n.locale = lang;
  axios.defaults.headers.common['Accept-Language'] = lang;
  document.querySelector('html').setAttribute('lang', lang);
  return lang;
}

export function loadLanguageAsync (lang) {
  if (loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(lang));
  }

  if (import.meta.env.MODE !== 'test') {
    return new Promise((resolve, reject) => {
      import(`./lang/${lang}.json`).then((messages) => {
        importLanguage(lang, messages);

        for (const path in overrideLocales) {
          if (path.endsWith(`/${lang}.json`)) {
            i18n.mergeLocaleMessage(lang, overrideLocales[path].default);
          }
        }

        resolve();
      });
    });
  } else {
    return Promise.resolve(setI18nLanguage(lang));
  }
}

export function importLanguage (lang, messages) {
  const existingLocaleMessages = i18n.getLocaleMessage(lang);
  i18n.setLocaleMessage(lang, _.merge({}, messages.default, existingLocaleMessages));
  loadedLanguages.push(lang);
  return setI18nLanguage(lang);
}
