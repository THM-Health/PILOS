<template>
  <li>
    <b-dropdown
      size="lg"
      variant="link"
      toggle-class="text-decoration-none">
      <template v-slot:button-content>
        <i class="fas fa-language"></i><span class="sr-only">{{ $t('app.selectLocale') }}</span>
      </template>
      <b-dropdown-item
        v-for="(value, key) in locales"
        :key="key"
        @click="changeLocale(key)"
        :active="key === currentLocale">
        {{ value }}
      </b-dropdown-item>
    </b-dropdown>
    <b-form-invalid-feedback v-if="errors !== null && errors.length > 0" :force-show="true">
      <template v-for="error in errors">
        {{ error }}
      </template>
    </b-form-invalid-feedback>
  </li>
</template>

<script>
import { loadLanguageAsync } from '../i18n';
import { mapState } from 'vuex';
import env from './../env.js';
import LocaleMap from '../lang/LocaleMap';

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

  data () {
    return {
      errors: null
    };
  },

  methods: {
    async changeLocale (locale) {
      this.$store.commit('loading');
      this.errors = null;

      try {
        await this.$store.dispatch('session/setLocale', { locale });
        await loadLanguageAsync(locale);
      } catch (error) {
        if (error.response !== undefined && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors.locale;
        } else {
          this.$store.commit('loadingFinished');
          throw error;
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
