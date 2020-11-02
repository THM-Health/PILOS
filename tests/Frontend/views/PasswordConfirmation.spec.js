import moxios from 'moxios';
import { createLocalVue, mount } from '@vue/test-utils';
import PasswordConfirmation from '../../../resources/js/views/PasswordConfirmation';
import BootstrapVue, { BForm, BFormInput, BFormInvalidFeedback, IconsPlugin } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import sinon from 'sinon';
import Base from '../../../resources/js/api/base';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(VueRouter);

describe('PasswordConfirmation', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('confirms the password and redirects the user to the protected page on success', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const routerPushSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerPushSpy;

    const view = mount(PasswordConfirmation, {
      localVue,
      propsData: {
        next: '/foo/bar'
      },
      mocks: {
        $t: key => key
      },
      router
    });

    view.findComponent(BFormInput).setValue('test');
    view.findComponent(BForm).trigger('submit');

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      const data = JSON.parse(request.config.data);

      expect(data).toEqual({ password: 'test' });
      request.respondWith({
        status: 422,
        response: {
          message: 'The given data was invalid.',
          errors: {
            password: ['The given password is wrong!']
          }
        }
      }).then(() => {
        expect(view.findComponent(BFormInvalidFeedback).html()).toContain('The given password is wrong!');

        view.findComponent(BForm).trigger('submit');

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          request.respondWith({
            status: 500,
            response: {
              message: 'Test error'
            }
          }).then(() => {
            return view.vm.$nextTick();
          }).then(() => {
            expect(spy.calledOnce).toBeTruthy();
            expect(spy.getCall(0).args[0].response.status).toBe(500);
            Base.error.restore();

            view.findComponent(BForm).trigger('submit');

            moxios.wait(function () {
              const request = moxios.requests.mostRecent();

              request.respondWith({
                status: 204
              }).then(() => {
                return view.vm.$nextTick();
              }).then(() => {
                expect(routerPushSpy.calledOnce).toBeTruthy();
                expect(routerPushSpy.getCall(0).args[0]).toBe('/foo/bar');
                done();
              });
            });
          });
        });
      });
    });
  });
});
