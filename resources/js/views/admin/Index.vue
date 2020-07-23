<template>
  <b-container class="mt-3 mb-5">
    <h2>{{$t('settings.settings')}}</h2>
    <hr>
    <b-row class="mt-5">
      <b-col lg="3" class="mb-4">
        <menu-button></menu-button>
      </b-col>
      <b-col lg="9">
        <settings-view></settings-view>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import MenuButton from '../../components/Admin/MenuButton'
import SettingsView from '../../components/Admin/SettingsView'

export default {
  components: {
    MenuButton,
    SettingsView
  }
}
</script>

<style scoped>

</style>
