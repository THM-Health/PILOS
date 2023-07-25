import { mount } from '@vue/test-utils';
import { mockAxios, createLocalVue } from '../helper';
import VerifyEmail from '../../../resources/js/views/VerifyEmail.vue';
import { BAlert, BSpinner } from 'bootstrap-vue';
import Base from '../../../resources/js/api/base';

const localVue = createLocalVue();

describe('VerifyEmail', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('success', async () => {
    const request = mockAxios.request('/api/v1/email/verify');

    const wrapper = mount(VerifyEmail, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        email: 'john.doe@example.com',
        token: '123ABC'
      }
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(BSpinner).exists()).toBe(true);

    await request.wait();
    expect(request.config.method).toBe('post');
    expect(JSON.parse(request.config.data)).toEqual({
      email: 'john.doe@example.com',
      token: '123ABC'
    });
    await request.respondWith({
      status: 200
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(BSpinner).exists()).toBe(false);
    const alert = wrapper.findComponent(BAlert);
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toBe('app.verify_email.success');
    expect(alert.props('variant')).toBe('success');

    wrapper.destroy();
  });

  it('invalid code', async () => {
    const request = mockAxios.request('/api/v1/email/verify');

    const wrapper = mount(VerifyEmail, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        email: 'john.doe@example.com',
        token: '123ABC'
      }
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(BSpinner).exists()).toBe(true);

    await request.wait();
    expect(request.config.method).toBe('post');
    expect(JSON.parse(request.config.data)).toEqual({
      email: 'john.doe@example.com',
      token: '123ABC'
    });
    await request.respondWith({
      status: 422
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(BSpinner).exists()).toBe(false);
    const alert = wrapper.findComponent(BAlert);
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toBe('app.verify_email.invalid');
    expect(alert.props('variant')).toBe('danger');

    wrapper.destroy();
  });

  it('other error', async () => {
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/email/verify');

    const wrapper = mount(VerifyEmail, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        email: 'john.doe@example.com',
        token: '123ABC'
      }
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(BSpinner).exists()).toBe(true);

    await request.wait();
    expect(request.config.method).toBe('post');
    expect(JSON.parse(request.config.data)).toEqual({
      email: 'john.doe@example.com',
      token: '123ABC'
    });
    await request.respondWith({
      status: 500
    });

    await wrapper.vm.$nextTick();
    expect(baseErrorSpy).toHaveBeenCalled();
    expect(baseErrorSpy.mock.calls[0][0].response.status).toBe(500);

    expect(wrapper.findComponent(BSpinner).exists()).toBe(false);
    const alert = wrapper.findComponent(BAlert);
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toBe('app.verify_email.fail');
    expect(alert.props('variant')).toBe('danger');

    wrapper.destroy();
  });
});
