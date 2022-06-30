require('jsdom-global')(undefined, {
  url: 'http://localhost'
});
const glob = require('glob');
const path = require('path');

global.$ = global.jQuery = require('jquery');

const MutationObserver = require('mutationobserver-shim');
global.MutationObserver = MutationObserver;

require('array-flat-polyfill');

if (!process.env.MIX_AVAILABLE_LOCALES) {
  process.env.MIX_AVAILABLE_LOCALES = glob.sync('resources/js/lang/*').map(folder => {
    return path.basename(folder);
  }).join(',');
}

if (!process.env.MIX_DEFAULT_LOCALE) {
  process.env.MIX_DEFAULT_LOCALE = 'en';
}

const Vue = require('vue');
Vue.config.productionTip = false;
Vue.config.devtools = false;
