/*
* This file contains a helper functions to mock Axios requests in the frontend tests
*
* To mock a single request, use the `mockAxios.request` method.
* The first argument is the URL to mock, and the second argument is an optional object with the request parameters that also have to match.
* The method returns an object with two methods:
* - `wait` returns a promise that resolves when the request is called
* - `respondWith` is a method that sets up the response for the mocked request
*
* To resolve a request immediately, you can chain the `respondWith` method to the `request` method, e.g.: `mockAxios.request('/api/users').respondWith({ status: 200, data: [] })`.
*
* You can delay the response, e.g. to check the loading state of the component or validate the request data, by calling the `respondWith` method later.
* To wait for the request to be called, you can use the `wait` method, you can than access the request using the request.config property.
*/

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Set default configurations for Axios like in the application
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Create a new instance of the Axios Mock Adapter and connect it to the global Axios instance
const mockAxios = new MockAdapter(axios);

export default {
  // Reset the Axios mock adapter, clearing all the registered routes and handlers
  reset: () => mockAxios.reset(),

  // Wait for all requests to resolve
  wait: () => new Promise(resolve => setTimeout(resolve)),

  // Function to mock a request and set up the response for the given URL and parameters
  request: function (url, params) {
    const resolvers = {
      request: null,
      response: null
    };

    const promises = {
      // Create a promise that resolves when the request is called
      request: new Promise(function (resolve) {
        resolvers.request = resolve;
      }),
      // Create a promise that resolves when the response is set using `respondWith` method
      response: new Promise(function (resolve) {
        resolvers.response = resolve;
      })
    };

    // Object representing the mocked request
    const request = {
      config: null, // Will hold the Axios request config
      respondWith: function ({ status, data, header = {} }) {
        // A method to set up the response for the mocked request
        resolvers.response([status, data, header]);
        // Return a promise that resolves when the response is sent
        return new Promise(resolve => setTimeout(resolve));
      },
      wait: () => promises.request // A method that returns the request promise to wait for the request to be called
    };

    // Set up a mock response handler for any HTTP method and URL
    mockAxios.onAny(url, params).replyOnce(function (config) {
      // Add xsrf header if necessary
      const xsrfValue = document.cookie.split('; ').find((row) => row.startsWith(config.xsrfCookieName))?.split('=')[1];

      if (config.withCredentials && config.xsrfCookieName && xsrfValue) {
        config.headers[config.xsrfHeaderName] = xsrfValue;
      }

      // Save the request configuration and resolve the request promise
      request.config = config;
      resolvers.request();

      // Return the response promise to simulate a delayed response
      return promises.response;
    });

    return request; // Return the mocked request object
  },

  // Returns the Axios mock adapter history, which contains a list of intercepted requests
  history: () => mockAxios.history
};
