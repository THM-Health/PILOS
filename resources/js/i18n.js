import axios from 'axios';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import dateTimeFormats from './lang/date-time-formats';
import _ from 'lodash';

const defaultLocale = process.env.MIX_DEFAULT_LOCALE;

const messages = {};
messages[defaultLocale] = require(`./lang/${process.env.MIX_DEFAULT_LOCALE}`).default;

Vue.use(VueI18n);

const i18n = new VueI18n({
  dateTimeFormats,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  availableLocales: process.env.MIX_AVAILABLE_LOCALES.split(','),
  messages
});

const loadedLanguages = [defaultLocale];

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
  if (i18n.locale === lang || loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(lang));
  }

  if (process.env.NODE_ENV !== 'test') {
    return import(
      /* webpackChunkName: "js/lang/[request]" */
      /* webpackInclude: /\.js/ */
      `./lang/${lang}`
    ).then(messages => {
      return Promise.resolve(importLanguage(lang, messages));
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
