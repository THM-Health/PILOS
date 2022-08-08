const moxios = require('moxios');
/**
 * Various asynchronous helper functions for testing with promises
 */
module.exports = {
  /**
   * Asynchronous helper function for moxios.wait
   * @returns {Promise<void>}
   */
  waitMoxios: async () => {
    await new Promise((resolve) => {
      moxios.wait(resolve);
    });
  },

  /**
   * Asynchronous helper function for modal events
   * @param wrapper Vue testing wrapper for component (https://v1.test-utils.vuejs.org/api/wrapper/#wrapper)
   * @param action Function to be executed, causing the modal event, e.g. triggering button click
   * @param event Modal event to listen to
   * @returns {Promise<void>}
   */
  waitModalEvent: async (wrapper, action, event) => {
    const promise = new Promise((resolve, reject) => {
      wrapper.vm.$root.$once('bv::modal::' + event, () => resolve());
    });
    await action();
    await promise;
  },

  /**
   * Asynchronous helper function for modal hidden event
   * @param wrapper Vue testing wrapper for component (https://v1.test-utils.vuejs.org/api/wrapper/#wrapper)
   * @param action Function to be executed, causing the modal to hide, e.g. triggering button click
   * @returns {Promise<void>}
   */
  waitModalHidden: async (wrapper, action) => {
    await module.exports.waitModalEvent(wrapper, action, 'hidden');
  },

  /**
   * Asynchronous helper function for modal shown event
   * @param wrapper Vue testing wrapper for component (https://v1.test-utils.vuejs.org/api/wrapper/#wrapper)
   * @param action Function to be executed, causing the modal to show, e.g. triggering button click
   * @returns {Promise<void>}
   */
  waitModalShown: async (wrapper, action) => {
    await module.exports.waitModalEvent(wrapper, action, 'shown');
  }
};
