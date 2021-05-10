<template>
  <div>
    <h5>{{title}}</h5>
    <b-button :href="link" block  variant="success">{{ submitLabel }} </b-button>
  </div>
</template>

<script>
export default {
  props: [
    'title',
    'submitLabel'
  ],
  computed: {
    link: function () {
      const base = '/shibboleth/login';
      if (this.$route.query.redirect !== undefined) {
        return base + '?redirect=' + this.$route.query.redirect;
      } else {
        return base;
      }
    }
  }
};
</script>
<style scoped>
</style>
