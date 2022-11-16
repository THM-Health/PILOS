import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BListGroupItem, BSpinner } from 'bootstrap-vue';
import { createContainer, waitMoxios } from '../../helper';
import SessionsComponent from '../../../../resources/js/components/User/SessionsComponent';
import moxios from 'moxios';
import Base from '../../../../resources/js/api/base';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

const i18nDateMock = (date, format) => {
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

describe('SessionsComponent', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('list of sessions and logout other sessions', async () => {
    const flashMessageSpy = jest.fn();
    const flashMessage = { success: flashMessageSpy };

    const view = mount(SessionsComponent, {
      localVue,
      mocks: {
        $t: key => key,
        $d: i18nDateMock,
        flashMessage
      },
      attachTo: createContainer()
    });

    await view.vm.$nextTick();

    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/sessions');
    await request.respondWith({
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
    await endSessionButton.trigger('click');

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/sessions');

    // check if button is disabled during request
    expect(endSessionButton.attributes('disabled')).toBe('disabled');

    await request.respondWith({
      status: 204
    });

    await view.vm.$nextTick();

    // check if button is enabled after request and success message is shown
    expect(endSessionButton.attributes('disabled')).toBeUndefined();
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('auth.flash.logout_all_others');

    // check if sessions are reloaded
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/sessions');

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

    // Check session list
    selects = view.findAllComponents(BListGroupItem);
    expect(selects.length).toEqual(1);

    view.destroy();
  });

  it('loading error', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const view = mount(SessionsComponent, {
      localVue,
      mocks: {
        $t: key => key,
        $d: i18nDateMock
      },
      attachTo: createContainer()
    });

    await view.vm.$nextTick();

    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/sessions');

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

    // Check if reload button works
    await reloadButton.trigger('click');

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/sessions');

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
