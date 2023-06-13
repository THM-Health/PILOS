<template>
  <div>
    <b-button-toolbar v-if="editor" justify>
      <!-- Text styling -->
      <b-button-group>
        <!-- Text type -->
        <b-dropdown
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.text_type')"
          v-b-tooltip.hover
          v-tooltip-hide-click
        >
          <template v-slot:button-content>
            <i class="fa-solid fa-heading"></i>
          </template>

          <b-dropdown-item @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :active="editor.isActive('heading', { level: 1 })">
            {{ $t('rooms.description.heading1') }}
          </b-dropdown-item>
          <b-dropdown-item @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :active="editor.isActive('heading', { level: 2 })">
            {{ $t('rooms.description.heading2') }}
          </b-dropdown-item>
          <b-dropdown-item @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :active="editor.isActive('heading', { level: 3 })">
            {{ $t('rooms.description.heading3') }}
          </b-dropdown-item>
          <b-dropdown-item @click="editor.chain().focus().setParagraph().run()" :active="editor.isActive('paragraph')">
            {{ $t('rooms.description.paragraph') }}
          </b-dropdown-item>
        </b-dropdown>

        <!-- Text font styling -->
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.bold')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().toggleBold().run()"
          :pressed="editor.isActive('bold')"
        >
          <i class="fa-solid fa-bold"></i>
        </b-button>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.italic')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().toggleItalic().run()"
          :pressed="editor.isActive('italic')"
        >
          <i class="fa-solid fa-italic"></i>
        </b-button>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.underline')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().toggleUnderline().run()"
          :pressed="editor.isActive('underline')"
        >
          <i class="fa-solid fa-underline"></i>
        </b-button>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.strikethrough')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().toggleStrike().run()"
          :pressed="editor.isActive('strike')"
        >
          <i class="fa-solid fa-strikethrough"></i>
        </b-button>

        <!-- Text color -->
        <b-dropdown
          :title="$t('rooms.description.tooltips.color')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          variant="outline-dark"
        >
          <template v-slot:button-content>
            <i class="fa-solid fa-palette"></i>
          </template>
          <!-- Clear color -->
          <b-dropdown-item @click="editor.chain().focus().unsetColor().run()" :active="!editor.isActive('textStyle')">
            <div class="color-picker-block" v-bind:style="{background: '#000'}" /> {{ $t('rooms.description.color.black') }}
          </b-dropdown-item>
          <b-dropdown-item v-for="color in textColors" :key="color.color" @click="editor.chain().focus().setColor(color.color ).run()" :active="editor.isActive('textStyle', { color: color.color  })">
            <div class="color-picker-block" v-bind:style="{background: color.color}" /> {{ color.name }}
          </b-dropdown-item>
        </b-dropdown>

        <!-- Highlight -->
        <b-dropdown
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.highlight')"
          v-b-tooltip.hover
          v-tooltip-hide-click
        >
          <template v-slot:button-content>
            <i class="fa-solid fa-highlighter"></i>
          </template>
          <b-dropdown-item v-for="color in highlightColors" :key="color.color" @click="editor.chain().focus().toggleHighlight({ color: color.color }).run()" :active="editor.isActive('highlight', { color: color.color  })">
            <div class="color-picker-block" v-bind:style="{background: color.color}" /> {{ color.name }}
          </b-dropdown-item>
        </b-dropdown>

        <b-button
          variant="outline-dark"
          @click="editor.chain().focus().unsetAllMarks().run()"
          :title="$t('rooms.description.tooltips.clear')"
          v-b-tooltip.hover
          v-tooltip-hide-click
        >
          <i class="fa-solid fa-times"></i>
        </b-button>

      </b-button-group>

      <!-- Text alignment -->
      <b-button-group>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.left')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().setTextAlign('left').run()"
          :pressed="editor.isActive({ textAlign: 'left' })"
        >
          <i class="fa-solid fa-align-left"></i>
        </b-button>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.center')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().setTextAlign('center').run()"
          :pressed="editor.isActive({ textAlign: 'center' })"
        >
          <i class="fa-solid fa-align-center"></i></b-button>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.right')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().setTextAlign('right').run()"
          :pressed="editor.isActive({ textAlign: 'right' })"
        >
          <i class="fa-solid fa-align-right"></i>
        </b-button>
      </b-button-group>

      <!-- Text styles -->
      <b-button-group>
        <!-- Unordered list -->
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.list')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().toggleBulletList().run()"
          :pressed="editor.isActive('bulletList')"
        >
          <i class="fa-solid fa-list-ul"></i>
        </b-button>
        <!-- Ordered list -->
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.numbered_list')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().toggleOrderedList().run()"
          :pressed="editor.isActive('orderedList')"
        >
          <i class="fa-solid fa-list-ol"></i>
        </b-button>
        <!-- Quote -->
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.quote')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().toggleBlockquote().run()"
          :pressed="editor.isActive('blockquote')"
        >
          <i class="fa-solid fa-quote-right"></i>
        </b-button>
        <!-- Link -->
        <tip-tap-link :editor="editor"/>
        <!-- Image -->
        <tip-tap-image :editor="editor"/>
      </b-button-group>

      <!-- History -->
      <b-button-group>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.undo')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
        >
          <i class="fa-solid fa-undo"></i>
        </b-button>
        <b-button
          variant="outline-dark"
          :title="$t('rooms.description.tooltips.redo')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
        >
          <i class="fa-solid fa-redo"></i>
        </b-button>
        <b-button
          variant="danger"
          :title="$t('rooms.description.tooltips.delete')"
          v-b-tooltip.hover
          v-tooltip-hide-click
          @click="editor.commands.clearContent(true)"
        >
          <i class="fa-solid fa-trash"></i>
        </b-button>
        <tip-tap-source :editor="editor"/>
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
  props: [
    'editor'
  ],
  components: {
    TipTapLink,
    TipTapImage,
    TipTapSource
  },
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
