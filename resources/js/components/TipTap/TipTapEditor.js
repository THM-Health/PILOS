import { Editor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

// Custom image based on offical image extension https://github.com/ueberdosis/tiptap/blob/b0198eb14b98db5ca691bd9bfe698ffaddbc4ded/packages/extension-image/src/image.ts
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
  }
});

function TipTapEditor (content, onUpdate) {
  return new Editor({
    content,
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
        protocols: ['https', 'http', 'mailto'],
        openOnClick: false,
        autolink: true,
        linkOnPaste: true
      })
    ],
    onUpdate
  });
}

export default TipTapEditor;
