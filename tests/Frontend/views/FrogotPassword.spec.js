import Vuex from 'vuex';
import store from '../../../resources/js/store';
import ForgotPassword from '../../../resources/js/views/ForgotPassword';
import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, { BButton, BFormInput, IconsPlugin } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import sinon from 'sinon';
import Base from '../../../resources/js/api/base';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);
localVue.use(VueRouter);

describe('ForgotPassword', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('before route enter redirects to the 404 page if the self reset is disabled', function (done) {
    store.__Rewire__('getters', { 'session/settings': () => false });

    ForgotPassword.beforeRouteEnter({}, {}, (to) => {
      expect(to).toBe('/404');
      store.__ResetDependency__('getters');
      done();
    });
  });

  it('before route enter continues to the view if the self reset is enabled', function (done) {
    store.__Rewire__('getters', { 'session/settings': () => true });

    ForgotPassword.beforeRouteEnter({}, {}, (to) => {
      expect(to).toBe(undefined);
      store.__ResetDependency__('getters');
      done();
    });
  });

  it('submit handles errors correctly', function (done) {
    store.__Rewire__('getters', { 'session/settings': () => true });

    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(ForgotPassword, {
      localVue,
      mocks: {
        $t: (key) => key
      }
    });

    view.findComponent(BFormInput).setValue('foo@bar.com').then(() => {
      view.findComponent(BButton).trigger('submit');
      moxios.wait(function () {
        moxios.requests.mostRecent().respondWith({
          status: 500,
          response: {
            message: 'Internal server error'
          }
        }).then(() => {
          sinon.assert.calledOnce(Base.error);
          expect(spy.getCall(0).args[0].response.status).toEqual(500);

          Base.error.restore();
          store.__ResetDependency__('getters');
          done();
        });
      });
    });
  });

  it('submit redirects to home page withe a success message on success', function (done) {
    store.__Rewire__('getters', { 'session/settings': () => true });

    const routerSpy = sinon.spy();

    const router = new VueRouter();
    router.push = routerSpy;

    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      success (param) {
        flashMessageSpy(param);
      }
    };

    const view = mount(ForgotPassword, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      router
    });

    view.findComponent(BFormInput).setValue('foo@bar.com').then(() => {
      view.findComponent(BButton).trigger('submit');
      moxios.wait(function () {
        moxios.requests.mostRecent().respondWith({
          status: 200
        }).then(() => {
          moxios.wait(function () {
            moxios.requests.mostRecent().respondWith({
              status: 200,
              response: {
                message: 'Success!'
              }
            }).then(() => {
              sinon.assert.calledOnce(routerSpy);
              sinon.assert.calledWith(routerSpy, { name: 'home' });
              expect(flashMessageSpy.calledOnce).toBeTruthy();
              expect(flashMessageSpy.getCall(0).args[0]).toEqual({ title: 'Success!' });
              store.__ResetDependency__('getters');
              done();
            });
          });
        });
      });
    });
  });
});
