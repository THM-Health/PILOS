import Vue from 'vue'
import VueI18n from 'vue-i18n'
import messages from './lang/en'

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: 'en',
  fallbackLocale: 'en'
})

i18n.setLocaleMessage('en', messages)

export default i18n

const loadedLanguages = ['en']

function setI18nLanguage (lang) {
  i18n.locale = lang
  axios.defaults.headers.common['Accept-Language'] = lang
  document.querySelector('html').setAttribute('lang', lang)
  return lang
}

export function loadLanguageAsync (lang) {
  if (i18n.locale === lang || loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(lang))
  }

  return import(
    /* webpackChunkName: "/js/lang/[request]" */
    /* webpackInclude: /\.js/ */
    `./lang/${lang}`
  ).then(messages => {
    i18n.setLocaleMessage(lang, messages.default)
    loadedLanguages.push(lang)
    return setI18nLanguage(lang)
  })
}
