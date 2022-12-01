<template>
  <div>
    <div class="container pt-5 pb-5">
      <div class="row">
        <div class="col-md-12 col-sm-12 text-center">
          <img class="logo" v-if="getSetting('logo')" :src="getSetting('logo')">
          <h1 id="main-text" class="mb-4">{{ $t('home.title') }}</h1>
          <p class="lead col-sm-12">{{ $t('home.subtitle') }}</p>
          <p class="lead col-sm-12">{{ $t('home.description') }}</p>
          <p class="lead col-sm-12">{{ $t('home.description_extended') }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white pt-5 mt-2 mb-5" >
      <features></features>
    </div>
  </div>
</template>

<script>
import Features from 'components/Features';
import { mapState } from 'pinia';
import {useSettingsStore} from '../stores/settings';
export default {
  components: { Features },
  computed: {
    ...mapState(useSettingsStore, ['getSetting'])
  }
};

</script>

<style scoped>
.logo {
  height: 80px;
  max-width: 100%;
  margin-bottom: 21px;
}
</style>
