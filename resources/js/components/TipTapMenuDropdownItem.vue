<template>
  <li>
    <button
      class="rounded-border my-1 flex w-full items-center border-0 px-4 py-2"
      :class="{
        'bg-primary': props.active,
        'hover:text-900 text-surface-500 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700 bg-transparent':
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
