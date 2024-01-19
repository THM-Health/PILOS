<template>
  <a v-if="props.href" :class="props.class" :href="props.href" :target="props.target">
    <slot />
  </a>
  <router-link
    v-else
    :to="props.to"
    custom
    v-slot="{ href, navigate }"
  >
    <a
      :href="href"
      @click="navigate"
      :class="props.class"
    >
      <slot />
    </a>
  </router-link>
</template>

<script setup>

const props = defineProps([
  'to',
  'href',
  'target',
  'class'
]);

</script>
