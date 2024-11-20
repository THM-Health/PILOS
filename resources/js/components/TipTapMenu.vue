<template>
  <Toolbar
    v-if="props.editor"
    :pt:start:class="'flex-wrap'"
    :pt:center:class="'flex-wrap'"
    :pt:end:class="'flex-wrap'"
  >
    <!-- Text styling -->
    <template #start>
      <!-- Text type -->
      <TipTapMenuDropdownButton
        data-test="tip-tap-text-type-dropdown"
        severity="secondary"
        :label="$t('rooms.description.tooltips.text_type')"
      >
        <template #button-content>
          <i class="fa-solid fa-heading" />
        </template>
        <TipTapMenuDropdownItem
          :active="props.editor.isActive('heading', { level: 1 })"
          @click="
            props.editor.chain().focus().toggleHeading({ level: 1 }).run()
          "
        >
          {{ $t("rooms.description.heading1") }}
        </TipTapMenuDropdownItem>
        <TipTapMenuDropdownItem
          :active="props.editor.isActive('heading', { level: 2 })"
          @click="
            props.editor.chain().focus().toggleHeading({ level: 2 }).run()
          "
        >
          {{ $t("rooms.description.heading2") }}
        </TipTapMenuDropdownItem>
        <TipTapMenuDropdownItem
          :active="props.editor.isActive('heading', { level: 3 })"
          @click="
            props.editor.chain().focus().toggleHeading({ level: 3 }).run()
          "
        >
          {{ $t("rooms.description.heading3") }}
        </TipTapMenuDropdownItem>
        <TipTapMenuDropdownItem
          :active="props.editor.isActive('paragraph')"
          @click="props.editor.chain().focus().setParagraph().run()"
        >
          {{ $t("rooms.description.paragraph") }}
        </TipTapMenuDropdownItem>
      </TipTapMenuDropdownButton>
      <!-- Text font styling -->
      <Button
        v-tooltip="$t('rooms.description.tooltips.bold')"
        :aria-label="$t('rooms.description.tooltips.bold')"
        :severity="props.editor.isActive('bold') ? 'primary' : 'secondary'"
        text
        icon="fa-solid fa-bold"
        data-test="tip-tap-bold-button"
        @click="props.editor.chain().focus().toggleBold().run()"
      />
      <Button
        v-tooltip="$t('rooms.description.tooltips.italic')"
        :aria-label="$t('rooms.description.tooltips.italic')"
        :severity="props.editor.isActive('italic') ? 'primary' : 'secondary'"
        text
        icon="fa-solid fa-italic"
        @click="props.editor.chain().focus().toggleItalic().run()"
      />
      <Button
        v-tooltip="$t('rooms.description.tooltips.underline')"
        :aria-label="$t('rooms.description.tooltips.underline')"
        :severity="props.editor.isActive('underline') ? 'primary' : 'secondary'"
        text
        icon="fa-solid fa-underline"
        @click="props.editor.chain().focus().toggleUnderline().run()"
      />
      <Button
        v-tooltip="$t('rooms.description.tooltips.strikethrough')"
        :aria-label="$t('rooms.description.tooltips.strikethrough')"
        :severity="props.editor.isActive('strike') ? 'primary' : 'secondary'"
        text
        icon="fa-solid fa-strikethrough"
        @click="props.editor.chain().focus().toggleStrike().run()"
      />

      <!-- Text color -->
      <TipTapMenuDropdownButton
        severity="secondary"
        :label="$t('rooms.description.tooltips.color')"
      >
        <template #button-content>
          <i class="fa-solid fa-palette" />
        </template>
        <!-- Clear color -->
        <TipTapMenuDropdownItem
          :active="!props.editor.isActive('textStyle')"
          @click="props.editor.chain().focus().unsetColor().run()"
        >
          <div
            class="mr-2 h-3 w-3 border-surface"
            :style="{ background: '#000' }"
          />
          {{ $t("rooms.description.color.black") }}
        </TipTapMenuDropdownItem>
        <TipTapMenuDropdownItem
          v-for="color in textColors"
          :key="color.color"
          :active="props.editor.isActive('textStyle', { color: color.color })"
          @click="props.editor.chain().focus().setColor(color.color).run()"
        >
          <div
            class="mr-2 h-3 w-3 border-surface"
            :style="{ background: color.color }"
          />
          {{ color.name }}
        </TipTapMenuDropdownItem>
      </TipTapMenuDropdownButton>

      <!-- Highlight -->
      <TipTapMenuDropdownButton
        severity="secondary"
        :label="$t('rooms.description.tooltips.highlight')"
      >
        <template #button-content>
          <i class="fa-solid fa-highlighter" />
        </template>
        <TipTapMenuDropdownItem
          v-for="color in highlightColors"
          :key="color.color"
          :active="props.editor.isActive('highlight', { color: color.color })"
          @click="
            props.editor
              .chain()
              .focus()
              .toggleHighlight({ color: color.color })
              .run()
          "
        >
          <div
            class="mr-2 h-3 w-3 border-surface"
            :style="{ background: color.color }"
          />
          {{ color.name }}
        </TipTapMenuDropdownItem>
      </TipTapMenuDropdownButton>

      <Button
        v-tooltip="$t('rooms.description.tooltips.clear')"
        :aria-label="$t('rooms.description.tooltips.clear')"
        severity="secondary"
        text
        icon="fa-solid fa-times"
        @click="props.editor.chain().focus().unsetAllMarks().run()"
      />
    </template>
    <template #center>
      <!-- Text alignment -->
      <Button
        v-tooltip="$t('rooms.description.tooltips.left')"
        :aria-label="$t('rooms.description.tooltips.left')"
        :severity="
          props.editor.isActive({ textAlign: 'left' }) ? 'primary' : 'secondary'
        "
        text
        icon="fa-solid fa-align-left"
        @click="props.editor.chain().focus().setTextAlign('left').run()"
      />
      <Button
        v-tooltip="$t('rooms.description.tooltips.center')"
        :aria-label="$t('rooms.description.tooltips.center')"
        :severity="
          props.editor.isActive({ textAlign: 'center' })
            ? 'primary'
            : 'secondary'
        "
        text
        icon="fa-solid fa-align-center"
        @click="props.editor.chain().focus().setTextAlign('center').run()"
      />
      <Button
        v-tooltip="$t('rooms.description.tooltips.right')"
        :aria-label="$t('rooms.description.tooltips.right')"
        :severity="
          props.editor.isActive({ textAlign: 'right' })
            ? 'primary'
            : 'secondary'
        "
        text
        icon="fa-solid fa-align-right"
        @click="props.editor.chain().focus().setTextAlign('right').run()"
      />

      <!-- Text styles -->
      <!-- Unordered list -->
      <Button
        v-tooltip="$t('rooms.description.tooltips.list')"
        :aria-label="$t('rooms.description.tooltips.list')"
        :severity="
          props.editor.isActive('bulletList') ? 'primary' : 'secondary'
        "
        text
        icon="fa-solid fa-list-ul"
        @click="props.editor.chain().focus().toggleBulletList().run()"
      />
      <!-- Ordered list -->
      <Button
        v-tooltip="$t('rooms.description.tooltips.numbered_list')"
        :aria-label="$t('rooms.description.tooltips.numbered_list')"
        :severity="
          props.editor.isActive('orderedList') ? 'primary' : 'secondary'
        "
        text
        icon="fa-solid fa-list-ol"
        @click="props.editor.chain().focus().toggleOrderedList().run()"
      />
      <!-- Quote -->
      <Button
        v-tooltip="$t('rooms.description.tooltips.quote')"
        :aria-label="$t('rooms.description.tooltips.quote')"
        :severity="
          props.editor.isActive('blockquote') ? 'primary' : 'secondary'
        "
        text
        icon="fa-solid fa-quote-right"
        @click="props.editor.chain().focus().toggleBlockquote().run()"
      />
      <!-- Link -->
      <TipTapLink :editor="props.editor" />
      <!-- Image -->
      <TipTapImage :editor="props.editor" />
    </template>

    <template #end>
      <!-- History -->
      <Button
        v-tooltip="$t('rooms.description.tooltips.undo')"
        severity="secondary"
        text
        :aria-label="$t('rooms.description.tooltips.undo')"
        :disabled="!props.editor.can().undo()"
        icon="fa-solid fa-undo"
        @click="props.editor.chain().focus().undo().run()"
      />
      <Button
        v-tooltip="$t('rooms.description.tooltips.redo')"
        severity="secondary"
        text
        :aria-label="$t('rooms.description.tooltips.redo')"
        :disabled="!props.editor.can().redo()"
        icon="fa-solid fa-redo"
        @click="props.editor.chain().focus().redo().run()"
      />
      <Button
        v-tooltip="$t('rooms.description.tooltips.delete')"
        severity="danger"
        text
        :aria-label="$t('rooms.description.tooltips.delete')"
        icon="fa-solid fa-trash"
        @click="props.editor.commands.clearContent(true)"
      />
      <TipTapSource :editor="props.editor" />
    </template>
  </Toolbar>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n();

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
});

// Text highlight colors
const highlightColors = computed(() => {
  return [
    { color: "#ffff00", name: t("rooms.description.highlight.yellow") },
    { color: "#ff0000", name: t("rooms.description.highlight.red") },
    { color: "#00ff00", name: t("rooms.description.highlight.green") },
  ];
});

// Text colors
const textColors = computed(() => {
  return [
    { color: "#ff0000", name: t("rooms.description.color.red") },
    { color: "#00ff00", name: t("rooms.description.color.green") },
    { color: "#0000ff", name: t("rooms.description.color.blue") },
  ];
});
</script>
