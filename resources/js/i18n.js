import axios from 'axios';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import Base from './api/base';

Vue.use(VueI18n);

/**
 * Custom formatter for vue-i18n to use Laravel locale file syntax
 */
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

/**
 * Set the timezone for showing date and time
 * @param {string=} timezone Timezone string e.g. 'Europe/Berlin', if undefined (default) use users system timezone
 */
export function setTimeZone (timezone) {
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
export async function setLocale (locale) {
  // Load translations from backend if not already loaded
  if (!i18n.availableLocales.includes(locale) && import.meta.env.MODE !== 'test') {
    await Base.call('locale/' + locale).then((response) => {
      i18n.setLocaleMessage(locale, response.data.data);
      i18n.setDateTimeFormat(locale, response.data.meta.dateTimeFormat);
    });
  }

  i18n.locale = locale;
  axios.defaults.headers.common['Accept-Language'] = locale;
  document.querySelector('html').setAttribute('lang', locale);
}

const i18n = new VueI18n({
  formatter: new CustomFormatter()
});
export default i18n;
