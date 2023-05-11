<template>
  <div>
    <tip-tab-menu :editor="editor"></tip-tab-menu>
    <editor-content :editor="editor" />
  </div>
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-2';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TipTabMenu from './TipTabMenu.vue';
import { markInputRule } from '@tiptap/core';

const CustomImage = Image.extend({
  addAttributes () {
    return {
      src: {
        default: null
      },
      alt: {
        default: null
      },
      width: {
        default: null
      }
    };
  },
  addInputRules () {
    const inputRegex = /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => {
          const [,, alt, src, width] = match;

          return { src, alt, width };
        }
      })
    ];
  }
});

export default {
  components: {
    TipTabMenu,
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

  watch: {
    value (value) {
      const isSame = this.editor.getHTML() === value;
      if (isSame) {
        return;
      }
      this.editor.commands.setContent(value, false);
    }
  },

  mounted () {
    this.editor = new Editor({
      content: this.value,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        Underline,
        Color,
        TextStyle,
        TextAlign.configure({
          alignments: ['left', 'center', 'right'],
          types: ['heading', 'paragraph']
        }),
        Highlight.configure({ multicolor: true }),
        CustomImage,
        Link.configure({
          protocols: ['https', 'mailto'],
          openOnClick: false
        })
      ],
      onUpdate: () => {
        this.$emit('input', this.editor.getHTML());
      }
    });
  },

  beforeDestroy () {
    this.editor.destroy();
  }
};
</script>
