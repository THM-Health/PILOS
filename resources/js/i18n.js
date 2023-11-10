import axios from 'axios';
import { createI18n } from 'vue-i18n';
import _, { forEach } from 'lodash';
import Base from './api/base';
const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE; ;

const availableLocales = import.meta.env.VITE_AVAILABLE_LOCALES.split(',');

const localeMetadata = {};
const localeMetadataFiles = import.meta.glob(['../../lang/**/metadata.json', '../custom/lang/**/metadata.json'], { eager: true });
forEach(localeMetadataFiles, (module, path) => {
  const locale = path.match(/lang\/(.*)\/metadata.json/)[1];

  if (!availableLocales.includes(locale)) { return; }

  if (!localeMetadata[locale]) { localeMetadata[locale] = {}; }
  localeMetadata[locale] = Object.assign(localeMetadata[locale], module.default);
});

const datetimeFormats = {};
for (const [locale, metadata] of Object.entries(localeMetadata)) {
  datetimeFormats[locale] = metadata.dateTimeFormat;
}

export function getLocaleList () {
  const localeList = {};
  for (const [locale, metadata] of Object.entries(localeMetadata)) {
    localeList[locale] = metadata.name;
  }
  return localeList;
}

/**
 * Set the timezone for showing date and time
 * @param {string=} timezone Timezone string e.g. 'Europe/Berlin', if undefined (default) use users system timezone
 */
export function setTimeZone (i18n, timezone) {
  availableLocales.forEach((locale) => {
    const formats = i18n.getDateTimeFormat(locale);
    Object.keys(formats).forEach((index) => {
      formats[index].timeZone = timezone;
    });
    i18n.setDateTimeFormat(locale, formats);
  });
}

function setI18nLanguage (i18n, locale) {
  i18n.locale = locale;
  axios.defaults.headers.common['Accept-Language'] = locale;
  document.querySelector('html').setAttribute('lang', locale);
  return locale;
}

const loadedLanguages = [];

export function loadLanguageAsync (i18n, lang) {
  if (loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(i18n, lang));
  }

  if (import.meta.env.MODE !== 'test') {
    return new Promise((resolve, reject) => {
      Base.call('locale/' + lang).then((data) => {
        importLanguage(i18n, lang, data.data);
        resolve();
      });
    });
  } else {
    return Promise.resolve(setI18nLanguage(i18n, lang));
  }
}

export function importLanguage (i18n, lang, messages) {
  const existingLocaleMessages = i18n.getLocaleMessage(lang);
  i18n.setLocaleMessage(lang, _.merge({}, messages, existingLocaleMessages));
  loadedLanguages.push(lang);
  return setI18nLanguage(i18n, lang);
}

function messageCompiler (message) {
  if (typeof message === 'string') {
    return (ctx) => {
      if (!ctx.values) {
        return [message];
      }
      Object.keys(ctx.values).forEach(key => {
        // Use Laravel syntax :placeholder instead of {placeholder}
        message = message.replace(`:${key}`, ctx.values[key]);
      });

      return message;
    };
  }
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  datetimeFormats,
  messageCompiler
});

export default i18n;
