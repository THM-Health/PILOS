<template>
  <b-input-group>
    <b-form-select
      :options='timezones'
      :id='id'
      :required="required"
      :value="value"
      @input="input"
      :state='state'
      :disabled="disabled"
    >
      <template v-slot:first v-if="placeholder">
        <b-form-select-option :value="null" disabled>{{ placeholder }}</b-form-select-option>
      </template>
    </b-form-select>
    <b-input-group-append  v-if="loadingError">
      <b-button
        @click="loadTimezones()"
        variant="outline-secondary"
      ><i class="fa-solid fa-sync"></i></b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
import Base from '../../api/base';

export default {
  name: 'TimezoneSelect',
  props: {
    value: {
      type: String,
      default: null
    },
    placeholder: {
      type: String,
      required: false
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
  data () {
    return {
      timezones: [],
      loading: false,
      loadingError: false
    };
  },
  watch: {
    // detect changes of the model loading error
    loadingError: function () {
      this.$emit('loadingError', this.loadingError);
    },

    // detect busy status while data fetching and notify parent
    loading: function () {
      this.$emit('busy', this.loading);
    }
  },
  mounted () {
    this.loadTimezones();
  },
  methods: {
    /**
     * Loads the possible selectable timezones.
     */
    loadTimezones () {
      this.loading = true;
      this.loadingError = false;

      Base.call('getTimezones').then(response => {
        this.timezones = response.data.timezones;
      }).catch(error => {
        this.loadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.loading = false;
      });
    },

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
