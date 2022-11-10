<template>
  <b-nav-item-dropdown right
    toggle-class="text-primary nav-icon-item">
    <template v-slot:button-content>
      <i class="fa-solid fa-language"></i><span class="sr-only">{{ $t('app.selectLocale') }}</span>
    </template>
    <b-dropdown-item
      v-for="(value, key) in locales"
      :key="key"
      @click="changeLocale(key)"
      :active="key === currentLocale">
      {{ value }}
    </b-dropdown-item>
  </b-nav-item-dropdown>
</template>

<script>
import { loadLanguageAsync } from '../i18n';
import { mapState } from 'vuex';
import env from './../env.js';
import LocaleMap from '../lang/LocaleMap';
import Base from '../api/base';

export default {
  props: {
    availableLocales: {
      type: Array,
      required: true,
      validator: prop => prop.every(element => {
        return typeof element === 'string' && Object.keys(LocaleMap).includes(element);
      })
    }
  },

  computed: {
    locales () {
      return Object.keys(LocaleMap)
        .filter(key => this.availableLocales.includes(key))
        .reduce((object, key) => {
          object[key] = LocaleMap[key];
          return object;
        }, {});
    },

    ...mapState({
      currentLocale: state => state.session.currentLocale
    })
  },
  methods: {
    async changeLocale (locale) {
      this.$store.commit('loading');
      try {
        await this.$store.dispatch('session/setLocale', { locale });
        await loadLanguageAsync(locale);
      } catch (error) {
        if (error.response !== undefined && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.flashMessage.error(error.response.data.errors.locale.join(' '));
        } else {
          this.$store.commit('loadingFinished');
          Base.error(error, this.$root, error.message);
        }
      } finally {
        this.$store.commit('loadingFinished');
      }
    }
  }
};
</script>

<style scoped>

</style>
