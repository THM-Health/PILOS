<script setup>

const props = defineProps([
  'text',
  'to',
  'href',
  'target'
]);

</script>

<template>
  <li class="py-2 lg:py-0">
    <button v-if="!to && !href" class="bg-transparent border-none w-full text-500 hover:text-900 focus:text-900 block lg:px-2 lg:py-3">
      <slot>{{ props.text }}</slot>
    </button>
    <AppLink v-else :to="to" :href="href" :target="target" class="text-500 hover:text-900 focus:text-900 block lg:px-2 lg:py-3">
      <slot>{{ props.text }}</slot>
    </AppLink>
  </li>
</template>

<style scoped>

</style>
