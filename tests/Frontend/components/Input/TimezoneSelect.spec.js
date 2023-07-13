import { mount } from '@vue/test-utils';
import { BButton, BFormSelect, BInputGroupAppend } from 'bootstrap-vue';
import TimezoneSelect from '../../../../resources/js/components/Inputs/TimezoneSelect.vue';
import { createContainer, waitMoxios, createLocalVue } from '../../helper';
import moxios from 'moxios';
import Base from '../../../../resources/js/api/base';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

describe('TimezoneSelect', () => {
  beforeEach(() => {
    axiosMock.reset();
  });

  afterEach(() => {

  });

  it('check v-model and props', async () => {
    const view = mount(TimezoneSelect, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        value: 'Europe/Berlin',
        state: null,
        disabled: false,
        required: false,
        placeholder: 'Select a timezone',
        id: 'timezone'
      },
      attachTo: createContainer()
    });

    await view.vm.$nextTick();
    const select = view.findComponent(BFormSelect);

    await waitAxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/getTimezones');

    // Check if the select is disabled during request and the busy event is emitted
    expect(select.props('disabled')).toBeTruthy();
    expect(view.emitted().busy[0]).toEqual([true]);

    await request.respondWith({
      status: 200,
      response: {
        data: [
          'America/New_York',
          'Australia/Sydney',
          'Europe/Berlin',
          'UTC'
        ]
      }
    });

    await view.vm.$nextTick();

    // Check if the select is enabled and the busy event is emitted
    expect(select.props('disabled')).toBeFalsy();
    expect(view.emitted().busy[1]).toEqual([false]);

    // check default value
    expect(select.element.value).toBe('Europe/Berlin');

    // check options and placeholder
    const options = select.findAll('option');
    expect(options.length).toBe(5);
    expect(options.at(0).element.value).toBe('');
    expect(options.at(0).text()).toBe('Select a timezone');
    expect(options.at(0).attributes('disabled')).toBeTruthy();

    expect(options.at(1).element.value).toBe('America/New_York');
    expect(options.at(2).element.value).toBe('Australia/Sydney');
    expect(options.at(3).element.value).toBe('Europe/Berlin');
    expect(options.at(4).element.value).toBe('UTC');

    // remove placeholder
    await view.setProps({ placeholder: null });
    expect(select.findAll('option').length).toBe(4);

    // check if event is emitted on change
    await select.setValue('America/New_York');
    expect(view.emitted('input')[0][0]).toBe('America/New_York');

    // check input id attribute
    expect(select.attributes('id')).toBe('timezone');

    // check required attribute
    expect(select.attributes('required')).toBeUndefined();
    await view.setProps({ required: true });
    expect(select.attributes('required')).toBe('required');

    // check disabled attribute
    expect(select.attributes('disabled')).toBeUndefined();
    await view.setProps({ disabled: true });
    expect(select.attributes('disabled')).toBe('disabled');

    // check state prop
    expect(select.props('state')).toBeNull();
    await view.setProps({ state: false });
    expect(select.props('state')).toBe(false);

    view.destroy();
  });

  it('loading error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(TimezoneSelect, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        value: 'Europe/Berlin',
        state: null,
        disabled: false,
        required: false,
        placeholder: 'Select a timezone',
        id: 'timezone'
      },
      attachTo: createContainer()
    });

    await view.vm.$nextTick();
    const select = view.findComponent(BFormSelect);

    await waitAxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/getTimezones');

    // Check if the select is disabled during request and the busy event is emitted
    expect(select.props('disabled')).toBeTruthy();
    expect(view.emitted().busy[0]).toEqual([true]);

    await request.respondWith({
      status: 500,
      response: {
        message: 'Internal Server Error'
      }
    });

    await view.vm.$nextTick();

    // Check if the select are still disabled, busy event is emitted and error is emitted
    expect(select.props('disabled')).toBeTruthy();
    expect(view.emitted().busy[1]).toEqual([false]);
    expect(view.emitted().loadingError[0]).toEqual([true]);

    // Check if global error handler is called
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toBe(500);

    // Check if reload button is shown
    const appendWrapper = view.findComponent(BInputGroupAppend);
    expect(appendWrapper.exists()).toBeTruthy();
    const reloadButton = appendWrapper.findComponent(BButton);
    expect(reloadButton.exists()).toBeTruthy();

    // Trigger reload
    expect(reloadButton.attributes('disabled')).toBeUndefined();
    await reloadButton.trigger('click');

    await waitAxios();
    expect(moxios.requests.count()).toBe(2);
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/getTimezones');

    // Check if button is disabled during request
    expect(reloadButton.attributes('disabled')).toBe('disabled');

    await request.respondWith({
      status: 200,
      response: {
        data: [
          'America/New_York',
          'Australia/Sydney',
          'Europe/Berlin',
          'UTC'
        ]
      }
    });

    // Check if parent component is notified and reload button is removed
    expect(view.emitted().loadingError[1]).toEqual([false]);
    expect(view.findComponent(BInputGroupAppend).exists()).toBeFalsy();

    view.destroy();
  });
});
