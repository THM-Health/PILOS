import { mount } from '@vue/test-utils';
import { BButton, BInputGroupAppend } from 'bootstrap-vue';
import { createContainer, waitMoxios, createLocalVue } from '../../helper';
import { Multiselect } from 'vue-multiselect';
import moxios from 'moxios';
import Base from '../../../../resources/js/api/base';
import RoleSelect from '../../../../resources/js/components/Inputs/RoleSelect.vue';

const localVue = createLocalVue();

describe('RoleSelect', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('check v-model and props', async () => {
    const view = mount(RoleSelect, {
      localVue,
      mocks: {
        $t: key => key === 'app.roles.admin' ? 'Administrator' : key,
        $te: (key) => key === 'app.roles.admin'
      },
      propsData: {
        value: [{ id: 1, name: 'admin' }],
        invalid: false,
        disabled: false,
        id: 'roles'
      },
      attachTo: createContainer()
    });

    const select = view.findComponent(Multiselect);

    await view.vm.$nextTick();

    await waitMoxios();

    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/roles');
    expect(request.config.params).toEqual({ page: 1 });

    expect(select.props('disabled')).toBeTruthy();
    expect(view.vm.$data.loading).toBeTruthy();

    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 1, name: 'admin' },
          { id: 2, name: 'user' }
        ],
        links: {
          first: 'http://localhost/api/v1/roles?page=1',
          last: 'http://localhost/api/v1/roles?page=2',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          links: [
            { url: null, label: '&laquo; Previous', active: false },
            { url: 'http://localhost/api/v1/roles?page=1', label: '1', active: true },
            { url: null, label: 'Next &raquo;', active: false }
          ],
          path: 'http://localhost/api/v1/roles',
          per_page: 2,
          to: 2,
          total: 2
        }
      }
    });

    await view.vm.$nextTick();

    expect(select.props('disabled')).toBeFalsy();
    expect(view.vm.$data.loading).toBeFalsy();

    // Check tags
    expect(select.find('.multiselect__tags').findAll('h5').length).toEqual(1);
    expect(select.find('.multiselect__tags').find('h5').text()).toEqual('Administrator');

    // Check tag has remove button
    expect(view.find('.multiselect__tags').find('h5').find('.fa-xmark').exists()).toBeTruthy();

    // Check if options are set
    const options = view.findAll('li.multiselect__element');
    expect(options.length).toBe(2);

    // Check internationalization
    expect(options.at(0).text()).toBe('Administrator');
    expect(options.at(1).text()).toBe('user');

    // check default value
    expect(options.at(0).find('span').classes('multiselect__option--selected')).toBeTruthy();

    // check if event is emitted on change (add second role)
    await options.at(1).find('span').trigger('click');
    expect(view.emitted('input')[0][0]).toEqual([{ id: 1, name: 'admin', $isDisabled: false }, { id: 2, name: 'user', $isDisabled: false }]);
    await view.setProps({ value: view.emitted('input')[0][0] });

    // check if event is emitted on change (remove first role)
    await options.at(0).find('span').trigger('click');
    expect(view.emitted('input')[1][0]).toEqual([{ id: 2, name: 'user', $isDisabled: false }]);

    // Check disabled roles
    await view.setProps({ disabledRoles: [1] });
    await view.setProps({ value: [{ id: 1, name: 'admin' }, { id: 2, name: 'user' }] });
    await view.vm.$nextTick();

    // Check options
    expect(options.at(0).find('span').classes('multiselect__option--disabled')).toBeTruthy();
    expect(options.at(1).find('span').classes('multiselect__option--disabled')).toBeFalsy();

    // Check tags
    const tags = select.findAll('.multiselect__tags h5');
    expect(tags.length).toEqual(2);
    expect(tags.at(0).text()).toEqual('Administrator');
    expect(tags.at(0).find('.fa-xmark').exists()).toBeFalsy();
    expect(tags.at(1).text()).toEqual('user');
    expect(tags.at(1).find('.fa-xmark').exists()).toBeTruthy();

    // check input id attribute
    expect(select.props('id')).toBe('roles');

    // check state prop
    expect(select.classes('is-invalid')).toBe(false);
    await view.setProps({ invalid: true });
    expect(select.classes('is-invalid')).toBe(true);

    view.destroy();
  });

  it('mounted disabled', async () => {
    const view = mount(RoleSelect, {
      localVue,
      mocks: {
        $t: key => key === 'app.roles.admin' ? 'Administrator' : key,
        $te: (key) => key === 'app.roles.admin'
      },
      propsData: {
        value: [],
        invalid: false,
        disabled: true,
        id: 'roles'
      },
      attachTo: createContainer()
    });

    const select = view.findComponent(Multiselect);

    await view.vm.$nextTick();

    // Check if options are empty and no request is sent
    expect(view.vm.$data.roles.length).toBe(0);
    expect(moxios.requests.count()).toBe(0);

    // Check if component is disabled
    expect(select.props('disabled')).toBeTruthy();

    // Enable select
    await view.setProps({ disabled: false });

    // Check if request is sent
    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/roles');
    expect(request.config.params).toEqual({ page: 1 });

    // Check loading indicator
    expect(view.vm.$data.loading).toBeTruthy();

    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 1, name: 'admin' },
          { id: 2, name: 'user' }
        ],
        links: {
          first: 'http://localhost/api/v1/roles?page=1',
          last: 'http://localhost/api/v1/roles?page=2',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          links: [
            { url: null, label: '&laquo; Previous', active: false },
            { url: 'http://localhost/api/v1/roles?page=1', label: '1', active: true },
            { url: null, label: 'Next &raquo;', active: false }
          ],
          path: 'http://localhost/api/v1/roles',
          per_page: 2,
          to: 2,
          total: 2
        }
      }
    });

    // Check if options are set and loading indicator is disabled
    expect(view.vm.$data.loading).toBeFalsy();
    expect(view.vm.$data.roles.length).toBe(2);

    // Check if component is enabled
    expect(select.props('disabled')).toBeFalsy();

    view.destroy();
  });

  it('loading error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoleSelect, {
      localVue,
      mocks: {
        $t: key => key === 'app.roles.admin' ? 'Administrator' : key,
        $te: (key) => key === 'app.roles.admin'
      },
      propsData: {
        value: [],
        invalid: false,
        disabled: false,
        id: 'roles'
      },
      attachTo: createContainer()
    });

    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/roles');
    expect(request.config.params).toEqual({ page: 1 });

    // Check loading indicator
    expect(view.vm.$data.loading).toBeTruthy();

    await request.respondWith({
      status: 500,
      response: {
        message: 'Internal Server Error'
      }
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toBe(500);

    // Check if parent component is notified
    expect(view.emitted().loadingError[0]).toEqual([true]);

    // Check if reload button is shown
    const appendWrapper = view.findComponent(BInputGroupAppend);
    expect(appendWrapper.exists()).toBeTruthy();
    const reloadButton = appendWrapper.findComponent(BButton);
    expect(reloadButton.exists()).toBeTruthy();

    // Trigger reload
    expect(reloadButton.attributes('disabled')).toBeUndefined();
    await reloadButton.trigger('click');

    await waitMoxios();
    expect(moxios.requests.count()).toBe(2);
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/roles');
    expect(request.config.params).toEqual({ page: 1 });

    // Check if button is disabled during request
    expect(reloadButton.attributes('disabled')).toBe('disabled');

    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 1, name: 'admin' },
          { id: 2, name: 'user' }
        ],
        links: {
          first: 'http://localhost/api/v1/roles?page=1',
          last: 'http://localhost/api/v1/roles?page=2',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          links: [
            { url: null, label: '&laquo; Previous', active: false },
            { url: 'http://localhost/api/v1/roles?page=1', label: '1', active: true },
            { url: null, label: 'Next &raquo;', active: false }
          ],
          path: 'http://localhost/api/v1/roles',
          per_page: 2,
          to: 2,
          total: 2
        }
      }
    });

    // Check if parent component is notified and reload button is removed
    expect(view.emitted().loadingError[1]).toEqual([false]);
    expect(view.findComponent(BInputGroupAppend).exists()).toBeFalsy();

    view.destroy();
  });
});
