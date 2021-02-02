<template>
  <div></div>
</template>

<script>
import store from '../store';

export default {
  beforeRouteEnter (to, from, next) {
    if (!store.getters['session/settings']('password_self_reset_enabled')) {
      next('/404');
    } else {
      next();
    }
  }
};
</script>

<style scoped>

</style>
