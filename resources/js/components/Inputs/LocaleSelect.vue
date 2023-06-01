<template>
  <b-form-select
    :options='locales'
    :id='id'
    :required="required"
    :value="value"
    @input="input"
    :state='state'
    :disabled="disabled"
  >
    <template v-slot:first>
      <b-form-select-option :value="null" disabled>{{ $t('app.select_locale') }}</b-form-select-option>
    </template>
  </b-form-select>
</template>

<script>
import { getLocaleList } from '../../i18n';

export default {
  name: 'LocaleSelect',
  props: {
    value: {
      type: String,
      default: null
    },
    state: {
      type: Boolean,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: 'locale'
    }
  },
  computed: {
    /**
     * The available locales that the user can select from.
     */
    locales () {
      const locales = [];
      for (const [locale, label] of Object.entries(getLocaleList())) {
        locales.push({
          value: locale,
          text: label
        });
      }
      return locales;
    }
  },
  methods: {
    /**
     * Emits the input event.
     *
     * @param {string} value
     */
    input (value) {
      this.$emit('input', value);
    }
  }
};
</script>
