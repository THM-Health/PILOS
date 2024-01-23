<script setup>
const props = defineProps([
  'text',
  'to',
  'href',
  'target',
  'active'
]);
</script>

<template>
  <button v-if="!to && !href" class="border-none w-full flex p-3 py-2 lg:py-2 align-items-center" :class="{ 'bg-primary': props.active, 'bg-transparent text-500 hover:surface-100 hover:text-900': !props.active }">
    <slot>{{ props.text }}</slot>
  </button>
  <AppLink v-else :to="to" :href="href" :target="target" class="flex p-3 py-2 lg:py-2 align-items-center text-500 hover:text-900">
    <slot>{{ props.text }}</slot>
  </AppLink>
</template>

<style scoped>

</style>
