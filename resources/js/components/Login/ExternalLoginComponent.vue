<template>
  <div>
    <h5>{{ title }}</h5>

    <b-button
      :href="redirectUrl"
      variant="primary"
      block
    >
      {{ redirectLabel }}
    </b-button>
  </div>
</template>

<script>
export default {
  props: [
    'redirectLabel',
    'title',
    'redirect-url'
  ]
};
</script>

<style scoped>

</style>
