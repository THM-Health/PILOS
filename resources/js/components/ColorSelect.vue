<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="color in props.colors"
      :key="color"
      role="button"
      class="color-select relative h-11 w-11 overflow-hidden rounded-border border border-surface"
      :style="{ 'background-color': color }"
      :class="{
        selected: isColorSelected(color),
        'cursor-pointer': !props.disabled,
        'pointer-events-none opacity-80': props.disabled,
      }"
      data-test="color-button"
      @click="selectColor(color)"
    >
      <div class="overlay">
        <i v-if="isColorSelected(color)" class="fa-solid fa-circle-check"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
const model = defineModel({ type: String });

const props = defineProps({
  colors: {
    type: Array,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

function selectColor(value) {
  if (props.disabled) return;
  model.value = value;
}
function isColorSelected(color) {
  return model.value && model.value.toLowerCase() === color.toLowerCase();
}
</script>
