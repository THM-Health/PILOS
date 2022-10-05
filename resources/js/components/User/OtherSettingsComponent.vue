<template>
  <div>
    <h4>{{ $t('settings.users.other_settings.bbb.title') }}</h4>
    <b-form-group
      label-cols-sm='3'
      :label="$t('settings.users.other_settings.bbb.skip_check_audio')"
      label-for='bbb_skip_check_audio'
      :state="fieldState('bbb_skip_check_audio')"
      class="align-items-center d-flex"
    >
      <b-form-checkbox
        id='bbb_skip_check_audio'
        v-model='model.bbb_skip_check_audio'
        :state="fieldState('bbb_skip_check_audio')"
        :disabled="isBusy || !edit"
        switch
      ></b-form-checkbox>
      <template slot='invalid-feedback'><div v-html="fieldError('bbb_skip_check_audio')"></div></template>
    </b-form-group>

    <b-button
      :disabled='isBusy'
      variant='success'
      type='submit'
      v-if="edit"
      @click="save"
    >
      <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
    </b-button>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import Base from '../../api/base';
import env from '../../env';
import _ from 'lodash';

export default {
  name: 'OtherSettingsComponent',
  mixins: [FieldErrors],
  props: {
    user: {
      type: Object,
      required: true
    },
    edit: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      model: false,
      isBusy: false,
      errors: {}
    };
  },
  mounted () {
    this.model = _.cloneDeep(this.user);
  },
  watch: {
    user: {
      handler: function (user) {
        this.model = _.cloneDeep(user);
      },
      deep: true
    }
  },
  methods: {
    /**
     * Saves the changes of the user to the database by making a api call.
     *
     */
    save () {
      this.isBusy = true;

      Base.call('users/' + this.model.id, {
        method: 'POST',
        data: {
          _method: 'PUT',
          updated_at: this.model.updated_at,
          bbb_skip_check_audio: this.model.bbb_skip_check_audio

        }
      }).then(response => {
        this.errors = {};

        this.$emit('updateUser', response.data.data);
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          // Validation errors
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // Stale error
          this.$emit('staleError', error.response.data);
        } else {
          // Other errors
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    }
  }
};
</script>
