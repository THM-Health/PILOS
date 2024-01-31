<script setup>
const props = defineProps([
  'text',
  'to',
  'href',
  'target'
]);
</script>

<template>
  <li @click="$emit('itemClicked')">
    <button v-if="!to && !href" class="bg-transparent border-none w-full flex p-3 py-2 lg:py-2 align-items-center text-500 hover:text-900 cursor-pointer">
      <slot>{{ props.text }}</slot>
    </button>
    <AppLink v-else :to="to" :href="href" :target="target" class="flex p-3 py-2 lg:py-2 align-items-center text-500 hover:text-900  cursor-pointer">
      <slot>{{ props.text }}</slot>
    </AppLink>
  </li>
</template>

<style scoped>

</style>
