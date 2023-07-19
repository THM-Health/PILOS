import { mount } from '@vue/test-utils';
import { BButton, BListGroupItem, BSpinner } from 'bootstrap-vue';
import { createContainer, mockAxios, createLocalVue } from '../../helper';
import SessionsComponent from '../../../../resources/js/components/User/SessionsComponent.vue';

import Base from '../../../../resources/js/api/base';

const localVue = createLocalVue();

const i18nDateMock = (date, format) => {
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

describe('SessionsComponent', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('list of sessions and logout other sessions', async () => {
    const toastSuccessSpy = vi.fn();
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/api/v1/sessions').respondWith({
      status: 200,
      response: {
        data: [
          {
            last_activity: '2022-01-24T10:15:00.000000Z',
            ip_address: '10.9.1.2',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
            current: true
          },
          {
            last_activity: '2022-01-23T15:55:00.000000Z',
            ip_address: '10.9.1.5',
            user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            current: false
          }
        ]
      }
    });

    const view = mount(SessionsComponent, {
      localVue,
      mocks: {
        $t: key => key,
        $d: i18nDateMock,
        toastSuccess: toastSuccessSpy
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // Check session list
    let selects = view.findAllComponents(BListGroupItem);
    expect(selects.length).toEqual(2);

    expect(selects.at(0).find('h5').text()).toBe('Windows');
    expect(selects.at(0).find('span').text()).toBe('auth.sessions.current');
    expect(selects.at(0).findAll('p').at(0).text()).toContain('Chrome');
    expect(selects.at(0).findAll('p').at(1).text()).toContain('10.9.1.2');

    expect(selects.at(1).find('h5').text()).toBe('iOS');
    expect(selects.at(1).find('small').text()).toBe('01/23/2022, 16:55');
    expect(selects.at(1).findAll('p').at(0).text()).toContain('Mobile Safari');
    expect(selects.at(1).findAll('p').at(1).text()).toContain('10.9.1.5');

    // Check end session button
    const endSessionButton = view.findComponent(BButton);
    expect(endSessionButton.text()).toBe('auth.sessions.logout_all');
    expect(endSessionButton.attributes('disabled')).toBeUndefined();

    let deleteRequest = mockAxios.request('/api/v1/sessions');

    await endSessionButton.trigger('click');

    await deleteRequest.wait();
    expect(deleteRequest.config.method).toEqual('delete');

    // check if button is disabled during request
    expect(endSessionButton.attributes('disabled')).toBe('disabled');

    const reloadRequest = mockAxios.request('/api/v1/sessions');

    await deleteRequest.respondWith({
      status: 204
    });

    await view.vm.$nextTick();

    // check if button is enabled after request and success message is shown
    expect(endSessionButton.attributes('disabled')).toBeUndefined();
    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith('auth.flash.logout_all_others');

    // check if sessions are reloaded
    await reloadRequest.wait();
    expect(reloadRequest.config.method).toEqual('get');

    await reloadRequest.respondWith({
      status: 200,
      response: {
        data: [
          {
            last_activity: '2022-01-24T10:15:00.000000Z',
            ip_address: '10.9.1.2',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
            current: true
          }
        ]
      }
    });

    await view.vm.$nextTick();

    // Check session list
    selects = view.findAllComponents(BListGroupItem);
    expect(selects.length).toEqual(1);

    // Check end session button
    expect(endSessionButton.text()).toBe('auth.sessions.logout_all');
    expect(endSessionButton.attributes('disabled')).toBeUndefined();

    deleteRequest = mockAxios.request('/api/v1/sessions');

    await endSessionButton.trigger('click');

    await deleteRequest.wait();
    expect(deleteRequest.config.method).toEqual('delete');
    await deleteRequest.respondWith({
      status: 500,
      response: {
        message: 'Internal Server Error'
      }
    });

    await view.vm.$nextTick();
    expect(baseErrorSpy).toBeCalledTimes(1);
    expect(baseErrorSpy.mock.calls[0][0].response.status).toBe(500);

    view.destroy();
  });

  it('loading error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    let request = mockAxios.request('/api/v1/sessions');
    const view = mount(SessionsComponent, {
      localVue,
      mocks: {
        $t: key => key,
        $d: i18nDateMock
      },
      attachTo: createContainer()
    });

    await view.vm.$nextTick();

    await request.wait();

    // check if spinner is shown during request but not the reload button
    expect(view.findComponent(BSpinner).exists()).toBeTruthy();
    expect(view.findComponent({ ref: 'reload' }).exists()).toBeFalsy();

    await request.respondWith({
      status: 500,
      message: 'Internal Server Error'
    });

    await view.vm.$nextTick();

    // Check if global error handler is called
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toBe(500);

    // check if spinner is hidden and reload button is shown
    expect(view.findComponent(BSpinner).exists()).toBeFalsy();
    const reloadButton = view.findComponent({ ref: 'reload' });
    expect(reloadButton.exists()).toBeTruthy();

    request = mockAxios.request('/api/v1/sessions');

    // Check if reload button works
    await reloadButton.trigger('click');

    await request.wait();

    // check if spinner is shown during request and reload button is missing
    expect(view.findComponent(BSpinner).exists()).toBeTruthy();
    expect(view.findComponent({ ref: 'reload' }).exists()).toBeFalsy();

    await request.respondWith({
      status: 200,
      response: {
        data: [
          {
            last_activity: '2022-01-24T10:15:00.000000Z',
            ip_address: '10.9.1.2',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
            current: true
          }
        ]
      }
    });

    await view.vm.$nextTick();

    // check if spinner and reload button are hidden
    expect(view.findComponent(BSpinner).exists()).toBeFalsy();
    expect(view.findComponent({ ref: 'reload' }).exists()).toBeFalsy();

    view.destroy();
  });
});
