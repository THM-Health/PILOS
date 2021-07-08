import axios from 'axios';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import dateTimeFormats from './lang/date-time-formats';

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
      const existingLocaleMessages = i18n.getLocaleMessage(lang);
      i18n.setLocaleMessage(lang, $.extend(true, {}, messages.default, existingLocaleMessages));
      loadedLanguages.push(lang);
      return setI18nLanguage(lang);
    });
  } else {
    return Promise.resolve(setI18nLanguage(lang));
  }
}
