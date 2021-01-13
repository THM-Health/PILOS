<template>
  <b-container class='mt-3 mb-5'>
    <h2><b-button
      class='mr-3'
      v-if="$route.name!=='settings'"
      v-b-tooltip.hover
      variant='success'
      :title="$t('settings.users.new')"
      :to="{ name: 'settings'}"
    ><b-icon-house-fill></b-icon-house-fill></b-button> {{ $t('settings.title') }}
    </h2>
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
