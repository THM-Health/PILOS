<template>
  <div>
    <h3>
      {{ $t('settings.users.title') }}
      <can method='create' policy='UserPolicy'>
        <b-button
          class='float-right'
          v-b-tooltip.hover
          variant='success'
          :title="$t('settings.users.new')"
          :to="{ name: 'settings.users.view', params: { id: 'new' } }"
        ><b-icon-plus></b-icon-plus></b-button>
      </can>
    </h3>
    <hr>
  </div>
</template>

<script>
</script>

<style scoped>

</style>
