import { mount } from '@vue/test-utils';
import { createLocalVue } from '../helper';
import Toast from '../../../resources/js/mixins/Toast';

const localVue = createLocalVue();
localVue.mixin(Toast);

describe('Toast', () => {
  it('call toast message with message only', async () => {
    const testComponent = {
      name: 'test-component',
      methods: {
        success: function () {
          this.toastSuccess('success-text');
        },
        warning: function () {
          this.toastWarning('warning-text');
        },
        error: function () {
          this.toastError('error-text');
        },
        info: function () {
          this.toastInfo('info-text');
        }
      },
      /* eslint-disable @intlify/vue-i18n/no-raw-text */
      template: '<div>' +
        '<b-button ref="success-bn" @click="success">Success</b-button>' +
        '<b-button ref="warning-bn" @click="warning">Warning</b-button>' +
        '<b-button ref="error-bn" @click="error">Error</b-button>' +
        '<b-button ref="info-bn" @click="info">Infp</b-button>' +
        '</div>'
    };

    const wrapper = mount(testComponent, {
      localVue
    });

    const spy = vi.spyOn(wrapper.vm.$root.$bvToast, 'toast').mockImplementation();

    // Trigger success
    await wrapper.findComponent({ ref: 'success-bn' }).trigger('click');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('success-text', { title: null, variant: 'success' });

    // Trigger warning
    await wrapper.findComponent({ ref: 'warning-bn' }).trigger('click');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('warning-text', { title: null, variant: 'warning' });

    // Trigger error
    await wrapper.findComponent({ ref: 'error-bn' }).trigger('click');
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith('error-text', { title: null, variant: 'danger' });

    // Trigger info
    await wrapper.findComponent({ ref: 'info-bn' }).trigger('click');
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenCalledWith('info-text', { title: null, variant: 'info' });
  });

  it('call flash message with title', async () => {
    const testComponent = {
      name: 'test-component',
      methods: {
        error: function () {
          this.toastError('error-text', 'error-title');
        }
      },
      /* eslint-disable @intlify/vue-i18n/no-raw-text */
      template: '<div>' +
        '<b-button ref="error-bn" @click="error">Error</b-button>' +
        '</div>'
    };

    const wrapper = mount(testComponent, {
      localVue
    });

    const spy = vi.spyOn(wrapper.vm.$root.$bvToast, 'toast').mockImplementation();

    // Trigger error
    await wrapper.findComponent({ ref: 'error-bn' }).trigger('click');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('error-text', { title: 'error-title', variant: 'danger' });
  });
});
