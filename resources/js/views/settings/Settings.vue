<template>
  <b-container class="mt-3 mb-5">
    <h2>
      <b-button
        v-if="$route.name!=='settings'"
        v-b-tooltip
        class="mr-3"
        variant="secondary"
        :title="$t('settings.home_button')"
        :to="{ name: 'settings'}"
      >
        <i class="fa-solid fa-arrow-left" />
      </b-button> {{ $t('settings.title') }}
    </h2>
    <hr>
    <b-card class="p-3 border bg-white">
      <router-view />
    </b-card>
  </b-container>
</template>

<script>
export default {

};
</script>
<style scoped>
</style>
