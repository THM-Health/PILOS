require('jsdom-global')(undefined, {
  url: 'http://test.de'
});

global.expect = require('expect');

global.$ = global.jQuery = require('jquery');

const MutationObserver = require('mutationobserver-shim');
global.MutationObserver = MutationObserver;

require('array-flat-polyfill');
