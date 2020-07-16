<template>
  <b-container class="mt-3 mb-5">
    <h2>{{$t('admin.admin')}}</h2>

    <b-row class="mt-5">
      <b-col lg="3" class="mb-4"><menu-button></menu-button></b-col>
      <b-col lg="9"><!--TODO menu buttons setting view components--></b-col>
    </b-row>
  </b-container>
</template>

<script>
import MenuButton from '../../components/Admin/MenuButton'

export default {
  components: {
    MenuButton
  }
}
</script>

<style scoped>

</style>
