import axios from 'axios'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import messages from './lang'

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: process.env.MIX_DEFAULT_LOCALE,
  fallbackLocale: process.env.MIX_DEFAULT_LOCALE,
  messages: messages,
  availableLocales: process.env.MIX_AVAILABLE_LOCALES.split(',')
})

export default i18n

export function setI18nLanguage (lang) {
  i18n.locale = lang
  axios.defaults.headers.common['Accept-Language'] = lang
  document.querySelector('html').setAttribute('lang', lang)
}
