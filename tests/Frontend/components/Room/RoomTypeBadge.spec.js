import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue } from '../../helper';
import RoomTypeBadge from '@/components/Room/RoomTypeBadge.vue';
import { BBadge } from 'bootstrap-vue';

const localVue = createLocalVue();

describe('RoomTypeBadge', () => {
  it('show room details', async () => {
    const view = mount(RoomTypeBadge, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        roomType: {
          id: 2,
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      },
      attachTo: createContainer()
    });

    const badge = view.findComponent(BBadge);

    expect(badge.text()).toBe('Meeting');
    expect(badge.attributes().style).toContain('background-color: rgb(74, 92, 102)');

    view.destroy();
  });
});
