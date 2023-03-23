import moxios from 'moxios';
import { createLocalVue as originalCreateLocalVue } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import HideTooltip from '../../resources/js/directives/hide-tooltip';

function createLocalVue () {
  const localVue = originalCreateLocalVue();
  localVue.use(BootstrapVue);
  localVue.directive('tooltip-hide-click', HideTooltip);
  return localVue;
}

/**
 * Various helper functions for testing
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
  },

  /**
   * Overwrite an existing moxios response
   * @see https://github.com/axios/moxios/issues/42#issuecomment-499578991
   * @param url Url of the axios call
   * @param response New response for axios call
   * @returns {restoreFunc} Function to restore old response
   */
  overrideStub: (url, response) => {
    const l = moxios.stubs.count();
    for (let i = 0; i < l; i++) {
      const stub = moxios.stubs.at(i);
      if (stub.url === url) {
        const oldResponse = stub.response;
        const restoreFunc = () => { stub.response = oldResponse; };

        stub.response = response;
        return restoreFunc;
      }
    }
  },

  /**
   * Create new html element in html body
   * @param tag tag of the element
   * @returns {HTMLDivElement}
   */
  createContainer: (tag = 'div') => {
    const container = document.createElement(tag);
    document.body.appendChild(container);
    return container;
  },

  createLocalVue
};
