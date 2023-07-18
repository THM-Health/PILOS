import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { createLocalVue as originalCreateLocalVue } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import HideTooltip from '../../resources/js/directives/hide-tooltip';

function createLocalVue () {
  const localVue = originalCreateLocalVue();
  localVue.use(BootstrapVue);
  localVue.directive('tooltip-hide-click', HideTooltip);
  return localVue;
}

const mockAxios = new MockAdapter(axios);
/**
 * Various helper functions for testing
 */
module.exports = {

  mockAxios: {
    reset: () => mockAxios.reset(),

    wait: () => new Promise(resolve => setTimeout(resolve)),

    request: function (url, params) {
      const resolvers = {
        request: null,
        response: null
      };

      const promises = {
        request: new Promise(function (resolve) {
          resolvers.request = resolve;
        }),
        response: new Promise(function (resolve) {
          resolvers.response = resolve;
        })
      };

      const request = {
        config: null,
        respondWith: function ({ status, response }) {
          resolvers.response([status, response]);
          return new Promise(resolve => setTimeout(resolve));
        },
        wait: () => promises.request
      };

      mockAxios.onAny(url, params).replyOnce(function (config) {
        request.config = config;
        resolvers.request();
        return promises.response;
      });

      return request;
    },

    history: () => mockAxios.history
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
   * Asynchronous helper function for modal events
   * @param wrapper Vue testing wrapper for component (https://v1.test-utils.vuejs.org/api/wrapper/#wrapper)
   * @param action Function to be executed, causing the modal event, e.g. triggering button click
   * @param event Modal event to listen to
   * @returns {Promise<void>}
   */
  waitCollapseEvent: async (wrapper, action, event) => {
    const promise = new Promise((resolve, reject) => {
      wrapper.vm.$once(event, () => resolve());
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
  waitCollapseHidden: async (wrapper, action) => {
    await module.exports.waitCollapseEvent(wrapper, action, 'hidden');
  },

  /**
   * Asynchronous helper function for modal shown event
   * @param wrapper Vue testing wrapper for component (https://v1.test-utils.vuejs.org/api/wrapper/#wrapper)
   * @param action Function to be executed, causing the modal to show, e.g. triggering button click
   * @returns {Promise<void>}
   */
  waitCollapseShown: async (wrapper, action) => {
    await module.exports.waitCollapseEvent(wrapper, action, 'shown');
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
