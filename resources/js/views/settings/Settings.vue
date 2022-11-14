<template>
  <b-container class='mt-3 mb-5'>
    <h2> <b-button
      class='mr-3'
      v-if="$route.name!=='settings'"
      variant='secondary'
      v-b-tooltip
      :title="$t('settings.home_button')"
      :to="{ name: 'settings'}"
    ><i class='fa-solid fa-arrow-left'></i></b-button> {{ $t('settings.title') }}</h2>
    <hr>
    <b-card class='p-3 border bg-white'>
      <router-view></router-view>
    </b-card>
  </b-container>
</template>

<script>
export default {

};
</script>
<style scoped>
</style>
