<script setup>
defineProps(['title']);
</script>

<template>
  <Panel
    :header="$props.title"
    :pt="{
      title: {
        class: 'text-xl font-medium'
      },
      content: {
        class: 'flex flex-col gap-4'
      }
    }"
  >
    <slot></slot>
  </Panel>
</template>

<style scoped>

</style>
