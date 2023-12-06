import { mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton, BFormInput, BFormInvalidFeedback, BFormRadio,
  BTbody
} from 'bootstrap-vue';

import { vi } from 'vitest';
import TokensComponent from '@/components/Room/TokensComponent.vue';

import PermissionService from '@/services/PermissionService';
import VueRouter from 'vue-router';
import RoomView from '@/views/rooms/View.vue';
import _ from 'lodash';
import Base from '@/api/base';
import { waitModalHidden, waitModalShown, mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const routerMock = new VueRouter({
  mode: 'abstract',
  routes: [{
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView
  }]
});

const i18nDateMock = (date, format) => {
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'Max Doe' }, type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const initialState = { settings: { settings: { base_url: 'https://domain.tld' } } };

describe('Room Token', () => {
  beforeEach(() => {
    mockAxios.reset();
    PermissionService.setCurrentUser(exampleUser);
  });
  afterEach(() => {

  });

  it('load tokens', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    let request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: [
          { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
          { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
        ]
      }
    });

    await view.vm.$nextTick();
    let table = view.findComponent(BTbody);
    let rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
    expect(rows[0].at(0).text()).toBe('John');
    expect(rows[0].at(1).text()).toBe('Doe');
    expect(rows[0].at(2).text()).toBe('rooms.roles.participant');
    expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
    expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');

    let buttonsRow0 = rows[0].at(5).findAll('button');
    expect(buttonsRow0.length).toBe(3);

    expect(buttonsRow0.at(0).html()).toContain('fa-solid fa-link');
    expect(buttonsRow0.at(1).html()).toContain('fa-solid fa-pen-square');
    expect(buttonsRow0.at(2).html()).toContain('fa-solid fa-trash');
    expect(buttonsRow0.length).toBe(3);

    expect(rows.length).toBe(2);

    // reload with empty response
    const reloadButton = view.findAllComponents(BButton).at(1);
    expect(reloadButton.html()).toContain('fa-solid fa-sync');

    request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await reloadButton.trigger('click');

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: []
      }
    });

    await view.vm.$nextTick();
    table = view.findComponent(BTbody);
    rows = table.findAll('tr');
    expect(rows.length).toBe(1);
    expect(rows.at(0).text()).toContain('rooms.tokens.nodata');

    request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    // reload without owner permissions to check edit buttons missing
    await reloadButton.trigger('click');
    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: [
          { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
          { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
        ]
      }
    });

    await view.vm.$nextTick();

    // change owner
    const newRoom = _.cloneDeep(view.vm.room);
    newRoom.owner.id = 2;
    await view.setProps({ room: newRoom });
    await view.vm.$nextTick();

    // check if reload buttons position changed due to missing add button
    expect(view.findAllComponents(BButton).at(0).html()).toContain('fa-solid fa-sync');

    // check if the edit and delete buttons are missing
    table = view.findComponent(BTbody);
    rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
    buttonsRow0 = rows[0].at(5).findAll('button');
    expect(buttonsRow0.length).toBe(1);
    expect(buttonsRow0.at(0).html()).toContain('fa-solid fa-link');

    request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    // reload without owner permissions to check edit buttons missing
    await reloadButton.trigger('click');
    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('copy to clipboard', async () => {
    const clipboardSpy = vi.fn();
    navigator.clipboard = { writeText: clipboardSpy };

    const toastInfoSpy = vi.fn();

    const request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock,
        toastInfo: toastInfoSpy
      },
      propsData: {
        room: exampleRoom
      },
      router: routerMock,
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: [
          { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
          { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
        ]
      }
    });

    await view.vm.$nextTick();
    const table = view.findComponent(BTbody);
    const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
    expect(buttonsRow0.at(0).html()).toContain('fa-solid fa-link');
    await buttonsRow0.at(0).trigger('click');

    expect(clipboardSpy).toBeCalledTimes(1);
    expect(clipboardSpy).toBeCalledWith('https://domain.tld/rooms/123-456-789/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

    expect(toastInfoSpy).toBeCalledTimes(1);
    expect(toastInfoSpy).toBeCalledWith('rooms.tokens.room_link_copied:{"firstname":"John","lastname":"Doe"}');

    delete navigator.clipboard;
    view.destroy();
  });

  it('delete token', async () => {
    const request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: [
          {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'John',
            lastname: 'Doe',
            role: 1,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          },
          {
            token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus',
            firstname: 'Max',
            lastname: 'Mustermann',
            role: 2,
            expires: '2021-10-20T09:17:02.000000Z',
            last_usage: '2021-10-03T17:24:10.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-token-modal' }).find('.modal').element.style.display).toEqual('none');
    let table = view.findComponent(BTbody);
    const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
    expect(buttonsRow0.at(2).html()).toContain('fa-solid fa-trash'); // alte bezeichnung für font awesome?

    await waitModalShown(view, async () => {
      await buttonsRow0.at(2).trigger('click');
    });

    await view.vm.$nextTick();

    const modal = view.findComponent({ ref: 'delete-token-modal' });
    expect(modal.find('.modal').element.style.display).toEqual('block');
    expect(modal.find('.modal-body').text()).toContain('rooms.tokens.confirm_delete:{"firstname":"John","lastname":"Doe"}');

    const confirmButton = modal.findAllComponents(BButton).at(1);
    expect(confirmButton.text()).toBe('app.yes');

    const deleteRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

    await confirmButton.trigger('click');

    await deleteRequest.wait();
    await view.vm.$nextTick();
    expect(deleteRequest.config.method).toEqual('delete');

    await view.vm.$nextTick();

    const reloadRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await waitModalHidden(view, async () => {
      await deleteRequest.respondWith({
        status: 204
      });
    });

    expect(modal.find('.modal').element.style.display).toEqual('none');

    await reloadRequest.wait();
    await view.vm.$nextTick();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus',
            firstname: 'Max',
            lastname: 'Mustermann',
            role: 2,
            expires: '2021-10-20T09:17:02.000000Z',
            last_usage: '2021-10-03T17:24:10.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();

    table = view.findComponent(BTbody);
    const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
    expect(rows[0].at(0).text()).toBe('Max');
    expect(rows[0].at(1).text()).toBe('Mustermann');
    expect(rows[0].at(2).text()).toBe('rooms.roles.moderator');
    expect(rows[0].at(3).text()).toBe('10/03/2021, 19:24');
    expect(rows[0].at(4).text()).toBe('10/20/2021, 11:17');
    expect(rows.length).toBe(1);

    view.destroy();
  });

  it('delete token error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: [
          {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'John',
            lastname: 'Doe',
            role: 1,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          },
          {
            token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus',
            firstname: 'Max',
            lastname: 'Mustermann',
            role: 2,
            expires: '2021-10-20T09:17:02.000000Z',
            last_usage: '2021-10-03T17:24:10.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-token-modal' }).find('.modal').element.style.display).toEqual('none');
    let table = view.findComponent(BTbody);
    const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
    expect(buttonsRow0.at(2).html()).toContain('fa-solid fa-trash');

    await waitModalShown(view, () => {
      buttonsRow0.at(2).trigger('click');
    });

    await view.vm.$nextTick();

    const modal = view.findComponent({ ref: 'delete-token-modal' });
    expect(modal.find('.modal').element.style.display).toEqual('block');
    expect(modal.find('.modal-body').text()).toContain('rooms.tokens.confirm_delete:{"firstname":"John","lastname":"Doe"}');

    const confirmButton = modal.findAllComponents(BButton).at(1);
    expect(confirmButton.text()).toBe('app.yes');

    const deleteRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

    await confirmButton.trigger('click');

    await deleteRequest.wait();
    await view.vm.$nextTick();
    expect(deleteRequest.config.method).toEqual('delete');

    const reloadRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await waitModalHidden(view, async () => {
      await deleteRequest.respondWith({
        status: 500,
        data: {
          message: 'Internal server error'
        }
      });
    });

    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('none');

    expect(spy).toBeCalledTimes(1);

    await reloadRequest.wait();
    await view.vm.$nextTick();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'John',
            lastname: 'Doe',
            role: 1,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          },
          {
            token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus',
            firstname: 'Max',
            lastname: 'Mustermann',
            role: 2,
            expires: '2021-10-20T09:17:02.000000Z',
            last_usage: '2021-10-03T17:24:10.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();

    table = view.findComponent(BTbody);
    const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
    expect(rows[0].at(0).text()).toBe('John');
    expect(rows[0].at(1).text()).toBe('Doe');
    expect(rows[0].at(2).text()).toBe('rooms.roles.participant');
    expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
    expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');
    expect(rows.length).toBe(2);

    view.destroy();
  });

  it('edit token', async () => {
    const request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: [
          {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'John',
            lastname: 'Doe',
            role: 1,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          },
          {
            token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus',
            firstname: 'Max',
            lastname: 'Mustermann',
            role: 2,
            expires: '2021-10-20T09:17:02.000000Z',
            last_usage: '2021-10-03T17:24:10.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'add-edit-token-modal' }).find('.modal').element.style.display).toEqual('none');
    let table = view.findComponent(BTbody);
    const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
    expect(buttonsRow0.at(1).html()).toContain('fa-solid fa-pen-square');

    await waitModalShown(view, () => {
      buttonsRow0.at(1).trigger('click');
    });

    await view.vm.$nextTick();

    const modal = view.findComponent({ ref: 'add-edit-token-modal' });

    expect(modal.find('.modal').element.style.display).toEqual('block');
    expect(modal.find('.modal-header').text()).toContain('rooms.tokens.edit');

    expect(modal.findAllComponents(BFormInput).at(0).element.value).toBe('John');
    expect(modal.findAllComponents(BFormInput).at(1).element.value).toBe('Doe');

    await modal.findAllComponents(BFormInput).at(0).setValue('Richard2');
    await modal.findAllComponents(BFormInput).at(1).setValue('Roe');

    expect(modal.findAllComponents(BFormRadio).at(0).find('input').element.checked).toBeTruthy();
    expect(modal.findAllComponents(BFormRadio).at(1).find('input').element.checked).toBeFalsy();

    await modal.findAllComponents(BFormRadio).at(1).find('input').setChecked();

    const confirmButton = modal.findAllComponents(BButton).at(1);
    expect(confirmButton.text()).toBe('app.save');

    let editRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

    await confirmButton.trigger('click');

    await editRequest.wait();
    await view.vm.$nextTick();
    expect(editRequest.config.method).toEqual('put');

    let data = JSON.parse(editRequest.config.data);

    expect(data.firstname).toEqual('Richard2');
    expect(data.lastname).toEqual('Roe');
    expect(data.role).toEqual(2);

    await editRequest.respondWith({
      status: 422,
      data: {
        errors: {
          firstname: ['Firstname contains the following non-permitted characters: 2']
        }
      }
    });

    expect(modal.find('.modal').element.style.display).toEqual('block');
    expect(modal.findAllComponents(BFormInput).at(0).element.parentElement.innerHTML).toContain('Firstname contains the following non-permitted characters: 2');
    await modal.findAllComponents(BFormInput).at(0).setValue('Richard');

    editRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

    await confirmButton.trigger('click');

    await editRequest.wait();
    await view.vm.$nextTick();

    data = JSON.parse(editRequest.config.data);

    expect(data.firstname).toEqual('Richard');
    expect(data.lastname).toEqual('Roe');
    expect(data.role).toEqual(2);

    const reloadRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await waitModalHidden(view, () => {
      editRequest.respondWith({
        status: 200,
        data: {
          data: {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'Richard',
            lastname: 'Roe',
            role: 2,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          }
        }
      });
    });

    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('none');

    await reloadRequest.wait();
    await view.vm.$nextTick();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'Richard',
            lastname: 'Roe',
            role: 2,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          },
          {
            token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus',
            firstname: 'Max',
            lastname: 'Mustermann',
            role: 2,
            expires: '2021-10-20T09:17:02.000000Z',
            last_usage: '2021-10-03T17:24:10.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();

    table = view.findComponent(BTbody);
    const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
    expect(rows[0].at(0).text()).toBe('Richard');
    expect(rows[0].at(1).text()).toBe('Roe');
    expect(rows[0].at(2).text()).toBe('rooms.roles.moderator');
    expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
    expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');
    expect(rows.length).toBe(2);

    view.destroy();
  });

  it('add token', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: []
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'add-edit-token-modal' }).find('.modal').element.style.display).toEqual('none');

    const addButton = view.findComponent(BButton);
    expect(addButton.text()).toContain('rooms.tokens.add');

    await waitModalShown(view, () => {
      addButton.trigger('click');
    });

    await view.vm.$nextTick();

    const modal = view.findComponent({ ref: 'add-edit-token-modal' });

    expect(modal.find('.modal').element.style.display).toEqual('block');
    expect(modal.find('.modal-header').text()).toContain('rooms.tokens.add');

    expect(modal.findAllComponents(BFormInput).at(0).element.value).toBe('');
    expect(modal.findAllComponents(BFormInput).at(1).element.value).toBe('');

    await modal.findAllComponents(BFormInput).at(0).setValue('Richard');
    await modal.findAllComponents(BFormInput).at(1).setValue('Roe');

    expect(modal.findAllComponents(BFormRadio).at(0).find('input').element.checked).toBeFalsy();
    expect(modal.findAllComponents(BFormRadio).at(1).find('input').element.checked).toBeFalsy();

    await modal.findAllComponents(BFormRadio).at(1).find('input').setChecked();

    const confirmButton = modal.findAllComponents(BButton).at(1);
    expect(confirmButton.text()).toBe('app.save');

    let addRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await confirmButton.trigger('click');

    await addRequest.wait();
    await view.vm.$nextTick();
    expect(addRequest.config.method).toEqual('post');

    let data = JSON.parse(addRequest.config.data);

    expect(data.firstname).toEqual('Richard');
    expect(data.lastname).toEqual('Roe');
    expect(data.role).toEqual(2);

    await addRequest.respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });

    expect(modal.find('.modal').element.style.display).toEqual('block');

    expect(spy).toBeCalledTimes(1);

    addRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await confirmButton.trigger('click');

    await addRequest.wait();
    await view.vm.$nextTick();
    expect(addRequest.config.method).toEqual('post');

    data = JSON.parse(addRequest.config.data);

    expect(data.firstname).toEqual('Richard');
    expect(data.lastname).toEqual('Roe');
    expect(data.role).toEqual(2);

    const reloadRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await waitModalHidden(view, () => {
      addRequest.respondWith({
        status: 200,
        data: {
          data: {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'Richard',
            lastname: 'Roe',
            role: 2,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          }
        }

      });
    });

    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('none');

    await reloadRequest.wait();
    await view.vm.$nextTick();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R',
            firstname: 'Richard',
            lastname: 'Roe',
            role: 2,
            expires: '2021-10-17T12:21:19.000000Z',
            last_usage: '2021-09-17T14:36:11.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();

    const table = view.findComponent(BTbody);
    const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
    expect(rows[0].at(0).text()).toBe('Richard');
    expect(rows[0].at(1).text()).toBe('Roe');
    expect(rows[0].at(2).text()).toBe('rooms.roles.moderator');
    expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
    expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');
    expect(rows.length).toBe(1);

    view.destroy();
  });

  it('add token form validation error', async () => {
    const request = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: []
      }
    });

    await view.vm.$nextTick();

    // Open modal
    const addButton = view.findComponent(BButton);
    await waitModalShown(view, () => {
      addButton.trigger('click');
    });

    await view.vm.$nextTick();

    const modal = view.findComponent({ ref: 'add-edit-token-modal' });

    // Check if modal inputs are empty
    expect(modal.findAllComponents(BFormInput).at(0).element.value).toBe('');
    expect(modal.findAllComponents(BFormInput).at(1).element.value).toBe('');

    // Set only firstname
    await modal.findAllComponents(BFormInput).at(0).setValue('Richard');

    // Click confirm button
    const confirmButton = modal.findAllComponents(BButton).at(1);

    const addRequest = mockAxios.request('/api/v1/rooms/123-456-789/tokens');

    await confirmButton.trigger('click');

    await addRequest.wait();
    await view.vm.$nextTick();
    expect(addRequest.config.method).toEqual('post');

    // Check request with mandatory fields missing
    const data = JSON.parse(addRequest.config.data);
    expect(data.firstname).toEqual('Richard');
    expect(data.lastname).toEqual(null);
    expect(data.role).toEqual(null);

    // Respond with validation errors
    await addRequest.respondWith({
      status: 422,
      data: {
        message: 'The Lastname field is required. (and 1 more error)',
        errors: {
          lastname: [
            'The Lastname field is required.'
          ],
          role: [
            'The Role field is required.'
          ]
        }
      }
    });

    await view.vm.$nextTick();

    // Check if modal is still open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // Check if error messages are shown
    let errorMessages = modal.findAllComponents(BFormInvalidFeedback);
    expect(errorMessages.length).toBe(2);
    expect(errorMessages.at(0).text()).toBe('The Lastname field is required.');
    expect(errorMessages.at(1).text()).toBe('The Role field is required.');

    // Close modal using cancel button
    const cancelButton = modal.findAllComponents(BButton).at(0);

    // Wait for modal to close
    await waitModalHidden(view, () => {
      cancelButton.trigger('click');
    });

    await view.vm.$nextTick();

    // Check if modal is closed
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // Open modal again
    await waitModalShown(view, () => {
      addButton.trigger('click');
    });

    await view.vm.$nextTick();

    // Check if values are reset
    expect(modal.findAllComponents(BFormInput).at(0).element.value).toBe('');
    expect(modal.findAllComponents(BFormInput).at(1).element.value).toBe('');

    // Check if no old error messages are shown
    errorMessages = modal.findAllComponents(BFormInvalidFeedback);
    expect(errorMessages.length).toBe(0);

    view.destroy();
  });
});
