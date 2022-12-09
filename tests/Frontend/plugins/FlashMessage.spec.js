import { mount } from '@vue/test-utils';
import FlashMessage from '@/plugins/FlashMessage';
import { createLocalVue } from '../helper';

const localVue = createLocalVue();

// Spy vueFlashMessage component
const vueFlashMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
};

// Mock vueFlashMessage plugin
localVue.use((Vue, options) => {
  Vue.prototype.vueFlashMessage = vueFlashMessage;
});

localVue.use(FlashMessage, {
  name: 'flashMessage',
  vueFlashMessageName: 'vueFlashMessage'
});

describe('FlashMessage', () => {
  it('call flash message with title only', async () => {
    const testComponent = {
      name: 'test-component',
      methods: {
        success: function () {
          this.flashMessage.success('success-text');
        },
        warning: function () {
          this.flashMessage.warning('warning-text');
        },
        error: function () {
          this.flashMessage.error('error-text');
        },
        info: function () {
          this.flashMessage.info('info-text');
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

    // Trigger success
    await wrapper.findComponent({ ref: 'success-bn' }).trigger('click');
    expect(vueFlashMessage.success).toHaveBeenCalledWith({ title: 'success-text', message: undefined });

    // Trigger warning
    await wrapper.findComponent({ ref: 'warning-bn' }).trigger('click');
    expect(vueFlashMessage.warning).toHaveBeenCalledWith({ title: 'warning-text', message: undefined });

    // Trigger error
    await wrapper.findComponent({ ref: 'error-bn' }).trigger('click');
    expect(vueFlashMessage.error).toHaveBeenCalledWith({ title: 'error-text', message: undefined });

    // Trigger info
    await wrapper.findComponent({ ref: 'info-bn' }).trigger('click');
    expect(vueFlashMessage.info).toHaveBeenCalledWith({ title: 'info-text', message: undefined });
  });

  it('call flash message with description', async () => {
    const testComponent = {
      name: 'test-component',
      methods: {
        error: function () {
          this.flashMessage.error('error-text', 'error-description');
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

    // Trigger error
    await wrapper.findComponent({ ref: 'error-bn' }).trigger('click');
    expect(vueFlashMessage.error).toHaveBeenCalledWith({ title: 'error-text', message: 'error-description' });
  });
});
