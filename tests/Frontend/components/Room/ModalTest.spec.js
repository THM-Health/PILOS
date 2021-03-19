import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BModal } from 'bootstrap-vue';
import ModalTest from '../../../../resources/js/components/Room/ModalTestComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
const localVue = createLocalVue();

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

describe('ModalTest', function () {
  it('open close modal', function (done) {
    const view = mount(ModalTest, {
      localVue,
      attachTo: createContainer(),
      stubs: {
        transition: false
      }
    });

    view.vm.$nextTick().then(() => {
      expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('none');
      view.vm.showModal();
      return new Promise((resolve, reject) => {
        view.vm.$root.$once('bv::modal::shown', () => resolve());
      });
    }).then(() => {
      expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');
      view.vm.hideModal();
      return new Promise((resolve, reject) => {
        view.vm.$root.$once('bv::modal::hidden', () => resolve());
      });
    }).then(() => {
      expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('none');
      view.vm.showModal();
      return new Promise((resolve, reject) => {
        view.vm.$root.$once('bv::modal::shown', () => resolve());
      });
    }).then(() => {
      expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('block');
      view.vm.hideModal();
      return new Promise((resolve, reject) => {
        view.vm.$root.$once('bv::modal::hidden', () => resolve());
      });
    }).then(() => {
      expect(view.findComponent(BModal).find('.modal').element.style.display).toEqual('none');
      done();
    });
  });
});
