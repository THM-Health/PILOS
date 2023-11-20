<template>
  <b-input-group>
    <b-form-select
      :id="id"
      :options="timezones"
      :required="required"
      :value="value"
      :state="state"
      :disabled="disabled || loading || loadingError"
      @input="input"
    >
      <template
        v-if="placeholder"
        #first
      >
        <b-form-select-option
          :value="null"
          disabled
        >
          {{ placeholder }}
        </b-form-select-option>
      </template>
    </b-form-select>
    <b-input-group-append v-if="loadingError">
      <b-button
        :disabled="loading"
        variant="outline-secondary"
        @click="loadTimezones()"
      >
        <i class="fa-solid fa-sync" />
      </b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
import Base from '@/api/base';

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
      this.$emit('loading-error', this.loadingError);
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

      Base.call('getTimezones').then(response => {
        this.timezones = response.data.data;
        this.loadingError = false;
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
