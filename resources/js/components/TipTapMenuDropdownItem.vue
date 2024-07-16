<template>
  <button v-if="!to && !href" class="border-0 w-full flex p-4 py-2 lg:py-2 items-center" :class="{ 'bg-primary': props.active, 'bg-transparent text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-900': !props.active }">
    <slot>{{ props.text }}</slot>
  </button>
  <AppLink v-else :to="to" :href="href" :target="target" class="flex p-4 py-2 lg:py-2 items-center text-surface-500 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0">
    <slot>{{ props.text }}</slot>
  </AppLink>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String
  },
  to: {
    type: String
  },
  href: {
    type: String
  },
  target: {
    type: String
  },
  active: {
    type: Boolean
  }
});
</script>

<style scoped>

</style>
