const moxios = require('moxios');
module.exports = {
  waitMoxios: async () => {
    await new Promise((resolve) => {
      moxios.wait(resolve);
    });
  },

  waitModalEvent: async (view, action, event) => {
    const promise = new Promise((resolve, reject) => {
      view.vm.$root.$once('bv::modal::' + event, () => resolve());
    });
    await action();
    await promise;
  },

  waitModalHidden: async (view, action) => {
    await module.exports.waitModalEvent(view, action, 'hidden');
  },

  waitModalShown: async (view, action) => {
    await module.exports.waitModalEvent(view, action, 'shown');
  }
};
