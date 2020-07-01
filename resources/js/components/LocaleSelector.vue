<template>
  <div>
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
  </div>
</template>

<script>
import { loadLanguageAsync } from '../i18n'
import { mapState } from 'vuex'

const localeMap = {
  de: 'Deutsch',
  en: 'English'
}

export default {
  props: {
    availableLocales: {
      type: Array,
      required: true,
      validator: prop => prop.every(element => {
        return typeof element === 'string' && Object.keys(localeMap).includes(element)
      })
    }
  },

  computed: {
    locales () {
      return Object.keys(localeMap)
        .filter(key => this.availableLocales.includes(key))
        .reduce((object, key) => {
          object[key] = localeMap[key]
          return object
        }, {})
    },

    ...mapState({
      currentLocale: state => state.session.currentLocale
    })
  },

  data () {
    return {
      errors: null
    }
  },

  methods: {
    async changeLocale (locale) {
      this.$store.commit('loading')
      this.errors = null

      try {
        await this.$store.dispatch('session/setLocale', { locale })
        await loadLanguageAsync(locale)
      } catch (error) {
        this.errors = error.response.data.errors.locale
      } finally {
        this.$store.commit('loadingFinished')
      }
    }
  }
}
</script>

<style scoped>

</style>
