<template>
  <div>
    <b-button-toolbar
      v-if="editor"
      justify
    >
      <!-- Text styling -->
      <b-button-group>
        <!-- Text type -->
        <b-dropdown
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.text_type')"
        >
          <template #button-content>
            <i class="fa-solid fa-heading" />
          </template>

          <b-dropdown-item
            :active="editor.isActive('heading', { level: 1 })"
            @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          >
            {{ $t('rooms.description.heading1') }}
          </b-dropdown-item>
          <b-dropdown-item
            :active="editor.isActive('heading', { level: 2 })"
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          >
            {{ $t('rooms.description.heading2') }}
          </b-dropdown-item>
          <b-dropdown-item
            :active="editor.isActive('heading', { level: 3 })"
            @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          >
            {{ $t('rooms.description.heading3') }}
          </b-dropdown-item>
          <b-dropdown-item
            :active="editor.isActive('paragraph')"
            @click="editor.chain().focus().setParagraph().run()"
          >
            {{ $t('rooms.description.paragraph') }}
          </b-dropdown-item>
        </b-dropdown>

        <!-- Text font styling -->
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.bold')"
          :pressed="editor.isActive('bold')"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <i class="fa-solid fa-bold" />
        </b-button>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.italic')"
          :pressed="editor.isActive('italic')"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <i class="fa-solid fa-italic" />
        </b-button>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.underline')"
          :pressed="editor.isActive('underline')"
          @click="editor.chain().focus().toggleUnderline().run()"
        >
          <i class="fa-solid fa-underline" />
        </b-button>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.strikethrough')"
          :pressed="editor.isActive('strike')"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <i class="fa-solid fa-strikethrough" />
        </b-button>

        <!-- Text color -->
        <b-dropdown
          v-b-tooltip.hover
          :title="$t('rooms.description.tooltips.color')"
          variant="outline-dark"
        >
          <template #button-content>
            <i class="fa-solid fa-palette" />
          </template>
          <!-- Clear color -->
          <b-dropdown-item
            :active="!editor.isActive('textStyle')"
            @click="editor.chain().focus().unsetColor().run()"
          >
            <div
              class="color-picker-block"
              :style="{background: '#000'}"
            /> {{ $t('rooms.description.color.black') }}
          </b-dropdown-item>
          <b-dropdown-item
            v-for="color in textColors"
            :key="color.color"
            :active="editor.isActive('textStyle', { color: color.color })"
            @click="editor.chain().focus().setColor(color.color ).run()"
          >
            <div
              class="color-picker-block"
              :style="{background: color.color}"
            /> {{ color.name }}
          </b-dropdown-item>
        </b-dropdown>

        <!-- Highlight -->
        <b-dropdown
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.highlight')"
        >
          <template #button-content>
            <i class="fa-solid fa-highlighter" />
          </template>
          <b-dropdown-item
            v-for="color in highlightColors"
            :key="color.color"
            :active="editor.isActive('highlight', { color: color.color })"
            @click="editor.chain().focus().toggleHighlight({ color: color.color }).run()"
          >
            <div
              class="color-picker-block"
              :style="{background: color.color}"
            /> {{ color.name }}
          </b-dropdown-item>
        </b-dropdown>

        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.clear')"
          @click="editor.chain().focus().unsetAllMarks().run()"
        >
          <i class="fa-solid fa-times" />
        </b-button>
      </b-button-group>

      <!-- Text alignment -->
      <b-button-group>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.left')"
          :pressed="editor.isActive({ textAlign: 'left' })"
          @click="editor.chain().focus().setTextAlign('left').run()"
        >
          <i class="fa-solid fa-align-left" />
        </b-button>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.center')"
          :pressed="editor.isActive({ textAlign: 'center' })"
          @click="editor.chain().focus().setTextAlign('center').run()"
        >
          <i class="fa-solid fa-align-center" />
        </b-button>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.right')"
          :pressed="editor.isActive({ textAlign: 'right' })"
          @click="editor.chain().focus().setTextAlign('right').run()"
        >
          <i class="fa-solid fa-align-right" />
        </b-button>
      </b-button-group>

      <!-- Text styles -->
      <b-button-group>
        <!-- Unordered list -->
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.list')"
          :pressed="editor.isActive('bulletList')"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <i class="fa-solid fa-list-ul" />
        </b-button>
        <!-- Ordered list -->
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.numbered_list')"
          :pressed="editor.isActive('orderedList')"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <i class="fa-solid fa-list-ol" />
        </b-button>
        <!-- Quote -->
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.quote')"
          :pressed="editor.isActive('blockquote')"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <i class="fa-solid fa-quote-right" />
        </b-button>
        <!-- Link -->
        <tip-tap-link :editor="editor" />
        <!-- Image -->
        <tip-tap-image :editor="editor" />
      </b-button-group>

      <!-- History -->
      <b-button-group>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.undo')"
          :disabled="!editor.can().undo()"
          @click="editor.chain().focus().undo().run()"
        >
          <i class="fa-solid fa-undo" />
        </b-button>
        <b-button
          v-b-tooltip.hover
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.redo')"
          :disabled="!editor.can().redo()"
          @click="editor.chain().focus().redo().run()"
        >
          <i class="fa-solid fa-redo" />
        </b-button>
        <b-button
          v-b-tooltip.hover
          variant="danger"
          :title="$t('rooms.description.tooltips.delete')"
          @click="editor.commands.clearContent(true)"
        >
          <i class="fa-solid fa-trash" />
        </b-button>
        <tip-tap-source :editor="editor" />
      </b-button-group>
    </b-button-toolbar>
  </div>
</template>

<script>
import TipTapImage from './TipTapImage.vue';

import TipTapLink from './TipTapLink.vue';
import TipTapSource from './TipTapSource.vue';
export default {
  name: 'TipTapMenu',
  components: {
    TipTapLink,
    TipTapImage,
    TipTapSource
  },
  props: [
    'editor'
  ],
  computed: {
    // Text highlight colors
    highlightColors: function () {
      return [
        { color: '#ffff00', name: this.$t('rooms.description.highlight.yellow') },
        { color: '#ff0000', name: this.$t('rooms.description.highlight.red') },
        { color: '#00ff00', name: this.$t('rooms.description.highlight.green') }
      ];
    },

    // Text colors
    textColors: function () {
      return [
        { color: '#ff0000', name: this.$t('rooms.description.color.red') },
        { color: '#00ff00', name: this.$t('rooms.description.color.green') },
        { color: '#0000ff', name: this.$t('rooms.description.color.blue') }
      ];
    }
  }
};
</script>
