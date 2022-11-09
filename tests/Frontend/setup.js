require('jsdom-global')(undefined, {
  url: 'http://localhost'
});
const glob = require('glob');
const path = require('path');

// Required for bootstrap vue modal
const MutationObserver = require('mutationobserver-shim');
global.MutationObserver = MutationObserver;

if (!process.env.MIX_AVAILABLE_LOCALES) {
  process.env.MIX_AVAILABLE_LOCALES = glob.sync('lang/*.json').map(file => {
    return path.parse(file).name;
  }).join(',');
}

if (!process.env.MIX_DEFAULT_LOCALE) {
  process.env.MIX_DEFAULT_LOCALE = 'en';
}

const Vue = require('vue');
const HideTooltip = require('../../resources/js/directives/hide-tooltip');
Vue.config.productionTip = false;
Vue.config.devtools = false;
Vue.directive('tooltip-hide-click', HideTooltip);
