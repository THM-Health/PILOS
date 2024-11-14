<template>
  <li>
    <button
      class="my-1 flex w-full items-center border-0 px-4 py-2 rounded-border"
      :class="{
        'bg-primary': props.active,
        'hover:text-900 bg-transparent text-surface-500 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700':
          !props.active,
      }"
      data-test="tip-tap-menu-dropdown-item-button"
    >
      <slot />
    </button>
  </li>
</template>

<script setup>
const props = defineProps({
  active: {
    type: Boolean,
  },
});
</script>
