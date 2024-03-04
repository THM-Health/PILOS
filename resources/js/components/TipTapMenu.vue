<template>
  <div v-if="props.editor">
    <div class="flex justify-content-start md:justify-content-between gap-1 flex-wrap border-1 border-300 p-2 border-round surface-100">
      <div>
        <!-- Text styling -->
        <span class="p-button-group">
          <!-- Text type -->
          <TipTapMenuDropdownButton
            severity="secondary"
          >
            <template v-slot:button-content>
              <i class="fa-solid fa-heading" />
            </template>
            <TipTapMenuDropdownItem
              :active="props.editor.isActive('heading', { level: 1 })"
              @click="props.editor.chain().focus().toggleHeading({ level: 1 }).run()"
            >
              {{ $t('rooms.description.heading1') }}
            </TipTapMenuDropdownItem>
            <TipTapMenuDropdownItem
              :active="props.editor.isActive('heading', { level: 2 })"
              @click="props.editor.chain().focus().toggleHeading({ level: 2 }).run()"
            >
              {{ $t('rooms.description.heading2') }}
            </TipTapMenuDropdownItem>
            <TipTapMenuDropdownItem
              :active="props.editor.isActive('heading', { level: 3 })"
              @click="props.editor.chain().focus().toggleHeading({ level: 3 }).run()"
            >
              {{ $t('rooms.description.heading3') }}
            </TipTapMenuDropdownItem>
            <TipTapMenuDropdownItem
              :active="props.editor.isActive('paragraph')"
              @click="props.editor.chain().focus().setParagraph().run()"
            >
              {{ $t('rooms.description.paragraph') }}
            </TipTapMenuDropdownItem>
          </TipTapMenuDropdownButton>
          <!-- Text font styling -->
          <Button
            v-tooltip="$t('rooms.description.tooltips.bold')"
            :severity="props.editor.isActive('bold') ? 'primary' : 'secondary'"
            @click="props.editor.chain().focus().toggleBold().run()"
            icon="fa-solid fa-bold"
          />
          <Button
            v-tooltip="$t('rooms.description.tooltips.italic')"
            :severity="props.editor.isActive('italic') ? 'primary' : 'secondary'"
            @click="props.editor.chain().focus().toggleItalic().run()"
            icon="fa-solid fa-italic"
          />
          <Button
            v-tooltip="$t('rooms.description.tooltips.underline')"
            :severity="props.editor.isActive('underline') ? 'primary' : 'secondary'"
            @click="props.editor.chain().focus().toggleUnderline().run()"
            icon="fa-solid fa-underline"
          />
          <Button
            v-tooltip="$t('rooms.description.tooltips.strikethrough')"
            :severity="props.editor.isActive('strike') ? 'primary' : 'secondary'"
            @click="props.editor.chain().focus().toggleStrike().run()"
            icon="fa-solid fa-strikethrough"
          />

          <!-- Text color -->
          <TipTapMenuDropdownButton
            severity="secondary"
            v-tooltip="$t('rooms.description.tooltips.color')"
          >
            <template v-slot:button-content>
              <i class="fa-solid fa-palette" />
            </template>
            <!-- Clear color -->
            <TipTapMenuDropdownItem
              :active="!props.editor.isActive('textStyle')"
              @click="props.editor.chain().focus().unsetColor().run()"
            >
              <div
                class="color-picker-block"
                :style="{background: '#000'}"
              /> {{ $t('rooms.description.color.black') }}
            </TipTapMenuDropdownItem>
            <TipTapMenuDropdownItem
              v-for="color in textColors"
              :key="color.color"
              :active="props.editor.isActive('textStyle', { color: color.color })"
              @click="props.editor.chain().focus().setColor(color.color ).run()"
            >
              <div
                class="color-picker-block"
                :style="{background: color.color}"
              /> {{ color.name }}
            </TipTapMenuDropdownItem>
          </TipTapMenuDropdownButton>

          <!-- Highlight -->
          <TipTapMenuDropdownButton
            severity="secondary"
            v-tooltip="$t('rooms.description.tooltips.highlight')"
          >
            <template v-slot:button-content>
              <i class="fa-solid fa-highlighter" />
            </template>
            <TipTapMenuDropdownItem
              v-for="color in highlightColors"
              :key="color.color"
              :active="props.editor.isActive('highlight', { color: color.color })"
              @click="props.editor.chain().focus().toggleHighlight({ color: color.color }).run()"
            >
              <div
                class="color-picker-block"
                :style="{background: color.color}"
              /> {{ color.name }}
            </TipTapMenuDropdownItem>
          </TipTapMenuDropdownButton>

          <Button
            v-tooltip="$t('rooms.description.tooltips.clear')"
            severity="secondary"
            @click="props.editor.chain().focus().unsetAllMarks().run()"
            icon="fa-solid fa-times"
          />
        </span>
      </div>
      <div>
        <span class="p-button-group">
          <!-- Text alignment -->
          <Button
            v-tooltip="$t('rooms.description.tooltips.left')"
            :severity="props.editor.isActive({ textAlign: 'left' }) ? 'primary' : 'secondary'"
            @click="props.editor.chain().focus().setTextAlign('left').run()"
            icon="fa-solid fa-align-left"
          />
          <Button
            v-tooltip="$t('rooms.description.tooltips.center')"
            :severity="props.editor.isActive({ textAlign: 'center' }) ? 'primary' : 'secondary'"
            @click="props.editor.chain().focus().setTextAlign('center').run()"
            icon="fa-solid fa-align-center"
          />
          <Button
            v-tooltip="$t('rooms.description.tooltips.right')"
            :severity="props.editor.isActive({ textAlign: 'right' }) ? 'primary' : 'secondary'"
            @click="props.editor.chain().focus().setTextAlign('right').run()"
            icon="fa-solid fa-align-right"
          />

        </span>
      </div>
      <div>
        <span class="p-button-group">
          <!-- Text styles -->
          <!-- Unordered list -->
        <Button
          v-tooltip="$t('rooms.description.tooltips.list')"
          :severity="props.editor.isActive('bulletList') ? 'primary' : 'secondary'"
          @click="props.editor.chain().focus().toggleBulletList().run()"
          icon="fa-solid fa-list-ul"
        />
          <!-- Ordered list -->
        <Button
          v-tooltip="$t('rooms.description.tooltips.numbered_list')"
          :severity="props.editor.isActive('orderedList') ? 'primary' : 'secondary'"
          @click="props.editor.chain().focus().toggleOrderedList().run()"
          icon="fa-solid fa-list-ol"
        />
          <!-- Quote -->
        <Button
          v-tooltip="$t('rooms.description.tooltips.quote')"
          :severity="props.editor.isActive('blockquote') ? 'primary' : 'secondary'"
          @click="props.editor.chain().focus().toggleBlockquote().run()"
          icon="fa-solid fa-quote-right"
        />
          <!-- Link -->
        <TipTapLink :editor="props.editor" />
          <!-- Image -->
        <TipTapImage :editor="props.editor" />
        </span>
      </div>

      <div>
        <span class="p-button-group">
          <!-- History -->
          <Button
            severity="secondary"
            v-tooltip="$t('rooms.description.tooltips.undo')"
            :disabled="!props.editor.can().undo()"
            @click="props.editor.chain().focus().undo().run()"
            icon="fa-solid fa-undo"
          />
          <Button
            severity="secondary"
            v-tooltip="$t('rooms.description.tooltips.redo')"
            :disabled="!props.editor.can().redo()"
            @click="props.editor.chain().focus().redo().run()"
            icon="fa-solid fa-redo"
          />
          <Button
            severity="danger"
            v-tooltip="$t('rooms.description.tooltips.delete')"
            @click="props.editor.commands.clearContent(true)"
            icon="fa-solid fa-trash"
          />
          <TipTapSource :editor="props.editor" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>

import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

const props = defineProps({
  editor: {
    type: Object
  }
});

// Text highlight colors
const highlightColors = computed(() => {
  return [
    { color: '#ffff00', name: t('rooms.description.highlight.yellow') },
    { color: '#ff0000', name: t('rooms.description.highlight.red') },
    { color: '#00ff00', name: t('rooms.description.highlight.green') }
  ];
});

// Text colors
const textColors = computed(() => {
  return [
    { color: '#ff0000', name: t('rooms.description.color.red') },
    { color: '#00ff00', name: t('rooms.description.color.green') },
    { color: '#0000ff', name: t('rooms.description.color.blue') }
  ];
});
</script>
