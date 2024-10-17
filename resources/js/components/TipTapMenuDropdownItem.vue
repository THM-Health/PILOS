<template>
  <li>
    <button class="border-0 w-full flex p-4 py-2 lg:py-2 items-center" :class="{ 'bg-primary': props.active, 'bg-transparent text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-900': !props.active }" data-test="tip-tap-menu-dropdown-item-button">
      <slot/>
    </button>
  </li>
</template>

<script setup>
const props = defineProps({
  active: {
    type: Boolean
  }
});
</script>
