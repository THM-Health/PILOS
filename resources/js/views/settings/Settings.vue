<template>
  <b-container class='mt-3 mb-5'>
    <h2>{{ $t('settings.title') }}</h2>
    <b-button
      class='mr-3'
      v-if="$route.name!=='settings'"
      variant='secondary'
      :to="{ name: 'settings'}"
    ><i class='fas fa-arrow-left'></i> {{ $t('settings.homeButton') }}</b-button>
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
