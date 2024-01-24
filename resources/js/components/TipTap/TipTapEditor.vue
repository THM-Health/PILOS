<template>
  <div>
    <tip-tap-menu :editor="editor" />
    <editor-content :editor="editor" />
  </div>
</template>

<script setup>

import { EditorContent } from '@tiptap/vue-3';
import { onMounted, onUnmounted, ref } from 'vue';
import TipTapEditor from './TipTapEditor.js';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const editor = ref(null);

onMounted(() => {
  console.log('mounted', props.modelValue);
  editor.value = TipTapEditor(props.modelValue, () => {
    emit('update:modelValue', editor.value.getHTML());
  });
});

onUnmounted(() => {
  editor.value.destroy();
});
</script>
