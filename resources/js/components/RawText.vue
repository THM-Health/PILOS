<template>
  <div v-frag>
    <slot></slot>
  </div>
</template>

<script>
import frag from 'vue-frag';
export default {
  directives: {
    frag
  }
};
</script>
