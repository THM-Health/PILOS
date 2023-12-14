import axios from 'axios';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import _, { forEach } from 'lodash';
import Base from './api/base';

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

const availableLocales = import.meta.env.VITE_AVAILABLE_LOCALES.split(',');

const localeMetadata = {};
const localeMetadataFiles = import.meta.glob(['../../lang/**/metadata.json', '../custom/lang/**/metadata.json'], { eager: true });
forEach(localeMetadataFiles, (module, path) => {
  const locale = path.match(/lang\/(.*)\/metadata.json/)[1];

  if (!availableLocales.includes(locale)) { return; }

  if (!localeMetadata[locale]) { localeMetadata[locale] = {}; }
  localeMetadata[locale] = Object.assign(localeMetadata[locale], module.default);
});

const dateTimeFormats = {};
for (const [locale, metadata] of Object.entries(localeMetadata)) {
  dateTimeFormats[locale] = metadata.dateTimeFormat;
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
export function setTimeZone (timezone) {
  availableLocales.forEach((locale) => {
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

const loadedLanguages = [];

export function loadLanguageAsync (lang) {
  if (loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(lang));
  }

  if (import.meta.env.MODE !== 'test') {
    return new Promise((resolve, reject) => {
      Base.call('locale/' + lang).then((data) => {
        importLanguage(lang, data.data);
        resolve();
      });
    });
  } else {
    return Promise.resolve(setI18nLanguage(lang));
  }
}

export function importLanguage (lang, messages) {
  const existingLocaleMessages = i18n.getLocaleMessage(lang);
  i18n.setLocaleMessage(lang, _.merge({}, messages, existingLocaleMessages));
  loadedLanguages.push(lang);
  return setI18nLanguage(lang);
}

const i18n = new VueI18n({
  formatter: new CustomFormatter(),
  dateTimeFormats
});
export default i18n;
