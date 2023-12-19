<template>
  <div>
    <tip-tap-menu :editor="editor" />
    <editor-content :editor="editor" />
  </div>
</template>

<script>

import { EditorContent } from '@tiptap/vue-3';
import TipTapEditor from './TipTapEditor.js';
import TipTapMenu from './TipTapMenu.vue';

export default {
  components: {
    TipTapMenu,
    EditorContent
  },

  props: {
    value: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      editor: null
    };
  },

  mounted () {
    this.editor = TipTapEditor(this.value, () => {
      this.$emit('input', this.editor.getHTML());
    });
  },

  beforeUnmount () {
    this.editor.destroy();
  }
};
</script>
