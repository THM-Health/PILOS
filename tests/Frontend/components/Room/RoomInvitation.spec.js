import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import RoomInvitation from '../../../../resources/js/components/Room/RoomInvitation.vue';
import BootstrapVue, { BButton, BFormInput } from 'bootstrap-vue';

import VueRouter from 'vue-router';
import RoomView from '../../../../resources/js/views/rooms/View.vue';
import _ from 'lodash';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

const routerMock = new VueRouter({
  mode: 'abstract',
  routes: [{
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView
  }]
});

const initialState = { settings: { settings: { base_url: 'https://pilos.tld', name: 'PILOS' } } };

describe('RoomInvitation', () => {
  it('With access code', async () => {
    const clipboardSpy = vi.fn();
    navigator.clipboard = { writeText: clipboardSpy };

    const view = mount(RoomInvitation, {
      localVue,
      propsData: {
        name: 'Meeting One',
        id: '123-abc-def',
        accessCode: 123456789
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer()
    });

    const inputs = view.findAllComponents(BFormInput);

    const urlInput = inputs.at(0);
    const codeInput = inputs.at(1);

    expect(urlInput.element.value).toBe('https://pilos.tld/rooms/123-abc-def');
    expect(codeInput.element.value).toBe('123-456-789');

    const copyButton = view.findComponent(BButton);
    await copyButton.trigger('click');

    expect(clipboardSpy).toBeCalledTimes(1);
    expect(clipboardSpy).toBeCalledWith('rooms.invitation.room:{"roomname":"Meeting One","platform":"PILOS"}\nrooms.invitation.link: https://pilos.tld/rooms/123-abc-def\nrooms.invitation.code: 123-456-789');
  });

  it('Without access code', async () => {
    const clipboardSpy = vi.fn();
    navigator.clipboard = { writeText: clipboardSpy };

    const view = mount(RoomInvitation, {
      localVue,
      propsData: {
        name: 'Meeting One',
        id: '123-abc-def',
        accessCode: null
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer()
    });

    const inputs = view.findAllComponents(BFormInput);

    const urlInput = inputs.at(0);

    expect(inputs.length).toBe(1);

    expect(urlInput.element.value).toBe('https://pilos.tld/rooms/123-abc-def');

    const copyButton = view.findComponent(BButton);
    await copyButton.trigger('click');

    expect(clipboardSpy).toBeCalledTimes(1);
    expect(clipboardSpy).toBeCalledWith('rooms.invitation.room:{"roomname":"Meeting One","platform":"PILOS"}\nrooms.invitation.link: https://pilos.tld/rooms/123-abc-def');
  });
});
