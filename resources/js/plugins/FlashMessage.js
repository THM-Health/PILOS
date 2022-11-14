const defaultSettings = {
  name: 'flashMessage',
  vueFlashMessageName: 'vueFlashMessage'
};

const SHORTHANDS = ['error', 'success', 'warning', 'info'];

function createEventBus (config, Vue) {
  const eventBus = { methods: {} };
  for (const shorthand of SHORTHANDS) {
    eventBus.methods[shorthand] = function (title, message) {
      return Vue.prototype[config.vueFlashMessageName][shorthand]({ title: title, message: message });
    };
  }

  return eventBus;
}

export default function install (Vue, config = {}) {
  config = Object.assign(defaultSettings, config);

  // Global access to flashMessage property
  Vue.prototype[config.name] = new Vue(createEventBus(config, Vue));
}
