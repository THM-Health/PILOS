import { mount, createLocalVue } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormInvalidFeedback, BSpinner } from 'bootstrap-vue';
import moxios from 'moxios';
import Login from '../../../../resources/js/views/Login';
import store from '../../../../resources/js/store';
import EmailLoginComponent from '../../../../resources/js/components/Login/EmailLoginComponent';
import LdapLoginComponent from '../../../../resources/js/components/Login/LdapLoginComponent';
import env from '../../../../resources/js/env';
import Base from '../../../../resources/js/api/base';
import sinon from 'sinon';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('Login', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('correct data gets sent on ldap login', function (done) {
    const view = mount(Login, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    const ldapLoginComponent = view.findComponent(LdapLoginComponent);
    ldapLoginComponent.find('#ldapUsername').setValue('user').then(() => {
      return ldapLoginComponent.find('#ldapPassword').setValue('password');
    }).then(() => {
      return ldapLoginComponent.findComponent(BButton).trigger('submit');
    }).then(() => {
      expect(ldapLoginComponent.findComponent(BSpinner).exists()).toBe(true);

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();

        expect(request.config.url).toBe('/sanctum/csrf-cookie');

        document.cookie = 'XSRF-TOKEN=test-csrf';
        request.respondWith({
          status: 200
        });

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();

          expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
          expect(request.config.url).toBe('/api/v1/login/ldap');

          const data = JSON.parse(request.config.data);
          expect(data.username).toBe('user');
          expect(data.password).toBe('password');

          view.destroy();
          done();
        });
      });
    });
  });

  it('correct data gets sent on email login', function (done) {
    const view = mount(Login, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    emailLoginComponent.find('#defaultEmail').setValue('user').then(() => {
      return emailLoginComponent.find('#defaultPassword').setValue('password');
    }).then(() => {
      return emailLoginComponent.findComponent(BButton).trigger('submit');
    }).then(() => {
      expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();

        expect(request.config.url).toBe('/sanctum/csrf-cookie');

        document.cookie = 'XSRF-TOKEN=test-csrf';
        request.respondWith({
          status: 200
        });

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();

          expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
          expect(request.config.url).toBe('/api/v1/login');

          const data = JSON.parse(request.config.data);
          expect(data.email).toBe('user');
          expect(data.password).toBe('password');

          view.destroy();
          done();
        });
      });
    });
  });

  it('unprocessable entity errors gets displayed for the corresponding fields', function (done) {
    const view = mount(Login, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    emailLoginComponent.find('#defaultEmail').setValue('user').then(() => {
      return emailLoginComponent.find('#defaultPassword').setValue('password');
    }).then(() => {
      return emailLoginComponent.findComponent(BButton).trigger('submit');
    }).then(() => {
      expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();

        expect(request.config.url).toBe('/sanctum/csrf-cookie');

        document.cookie = 'XSRF-TOKEN=test-csrf';
        request.respondWith({
          status: 200
        });

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();

          expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
          expect(request.config.url).toBe('/api/v1/login');

          const data = JSON.parse(request.config.data);
          expect(data.email).toBe('user');
          expect(data.password).toBe('password');

          request.respondWith({
            status: env.HTTP_UNPROCESSABLE_ENTITY,
            response: {
              errors: {
                email: ['Password or Email wrong!']
              }
            }
          }).then(() => {
            const invalidFeedback = emailLoginComponent.findComponent(BFormInvalidFeedback);

            expect(invalidFeedback.exists()).toBe(true);
            expect(invalidFeedback.html()).toContain('Password or Email wrong!');

            view.destroy();
            done();
          });
        });
      });
    });
  });

  it('error for too many login requests gets displayed', function (done) {
    const view = mount(Login, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    emailLoginComponent.find('#defaultEmail').setValue('user').then(() => {
      return emailLoginComponent.find('#defaultPassword').setValue('password');
    }).then(() => {
      return emailLoginComponent.findComponent(BButton).trigger('submit');
    }).then(() => {
      expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();

        expect(request.config.url).toBe('/sanctum/csrf-cookie');

        document.cookie = 'XSRF-TOKEN=test-csrf';
        request.respondWith({
          status: 200
        });

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();

          expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
          expect(request.config.url).toBe('/api/v1/login');

          const data = JSON.parse(request.config.data);
          expect(data.email).toBe('user');
          expect(data.password).toBe('password');

          request.respondWith({
            status: env.HTTP_TOO_MANY_REQUESTS,
            response: {
              errors: {
                email: ['Too many logins. Please try again later!']
              }
            }
          }).then(() => {
            const invalidFeedback = emailLoginComponent.findComponent(BFormInvalidFeedback);

            expect(invalidFeedback.exists()).toBe(true);
            expect(invalidFeedback.html()).toContain('Too many logins. Please try again later!');

            view.destroy();
            done();
          });
        });
      });
    });
  });

  it('other api errors gets thrown and handled by the global error handler', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(Login, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    emailLoginComponent.find('#defaultEmail').setValue('user').then(() => {
      return emailLoginComponent.find('#defaultPassword').setValue('password');
    }).then(() => {
      return emailLoginComponent.findComponent(BButton).trigger('submit');
    }).then(() => {
      expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();

        expect(request.config.url).toBe('/sanctum/csrf-cookie');

        request.respondWith({
          status: 500
        }).then(() => {
          sinon.assert.calledOnce(Base.error);
          Base.error.restore();
          view.destroy();
          done();
        });
      });
    });
  });
});
