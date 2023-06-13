import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue } from '../../helper';
import { BootstrapVue } from 'bootstrap-vue';
import TipTapEditor from '../../../../resources/js/components/TipTap/TipTapEditor.vue';
import TipTapMenu from '../../../../resources/js/components/TipTap/TipTapMenu.vue';
import { EditorContent } from '@tiptap/vue-2';
import { expect, it } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('TipTap Editor', () => {
  it('Initalizing editor with value and emit content on change', async () => {
    const view = mount(TipTapEditor, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      stubs: {
        EditorContent: true,
        TipTapMenu: true
      },
      attachTo: createContainer(),
      propsData: {
        value: '<p>Test</p>'
      }
    });

    await view.vm.$nextTick();

    // Check if menu is mounted and has the correct content
    const menu = view.findComponent(TipTapMenu);
    expect(menu.exists()).toBe(true);
    expect(menu.props('editor').getHTML()).toBe('<p>Test</p>');

    // Check if editor is mounted and has the correct content
    const editor = view.findComponent(EditorContent);
    expect(editor.exists()).toBe(true);
    expect(editor.props('editor').getHTML()).toBe('<p>Test</p>');

    // Trigger a change in the editor
    editor.props('editor').commands.insertContent('<h1>Example Title</h1>');

    // Check if component emits the new content to the parent
    expect(view.emitted().input[0][0]).toBe('<p></p><h1>Example Title</h1><p>Test</p>');

    view.destroy();
  });
});
