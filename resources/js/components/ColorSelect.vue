<template>
    <div class="flex gap-2 flex-wrap">
        <div
            role="button"
            v-for="color in props.colors"
            :key="color"
            class="color-select h-11 w-11 rounded-border border border-surface relative overflow-hidden"
            :style="{'background-color': color}"
            :class="{'selected': isColorSelected(color), 'pointer-events-none cursor-not-allowed opacity-80': props.disabled}"
            @click="selectColor(color)"
        >
          <div class="overlay">
            <i v-if="isColorSelected(color)" class="fa-solid fa-circle-check"></i>
          </div>
        </div>
    </div>
  </template>

<script setup>

const model = defineModel();

const props = defineProps({
  colors: {
    type: Array
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

function selectColor (value) {
  if (props.disabled) return;
  model.value = value;
}
function isColorSelected (color) {
  return model.value && model.value.toLowerCase() === color.toLowerCase();
}
</script>
