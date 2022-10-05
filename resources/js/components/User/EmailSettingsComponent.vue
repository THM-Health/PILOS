<template>
  <div>
    <h4>{{ $t('settings.users.email.title') }}</h4>
    <b-form-group
      label-cols-sm='3'
      :label="$t('settings.users.email.current_password')"
      label-for='current_password'
      :state='fieldState("password")'
      v-if="edit && isOwnUser"
    >
      <b-form-input
        id='current_password'
        type='password'
        v-model='current_password'
        :state='fieldState("current_password")'
        :disabled="isBusy"
      ></b-form-input>
      <template slot='invalid-feedback'><div v-html="fieldError('current_password')"></div></template>
    </b-form-group>
    <b-form-group
      label-cols-sm='3'
      :label="$t('settings.users.email.email')"
      label-for='email'
      :state='fieldState("email")'
    >
      <b-form-input
        id='email'
        type='email'
        v-model='email'
        :state='fieldState("email")'
        :disabled="isBusy || !edit"
      ></b-form-input>
      <template slot='invalid-feedback'><div v-html="fieldError('email')"></div></template>
    </b-form-group>
    <b-button
      :disabled='isBusy'
      v-if="edit"
      variant='success'
      type='submit'
      @click="save"
    >
      <i class='fa-solid fa-save'></i> {{ $t('settings.users.email.save') }}
    </b-button>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import Base from '../../api/base';
import env from '../../env';

export default {
  name: 'EmailSettingsComponent',
  mixins: [FieldErrors],
  data () {
    return {
      current_password: '',
      email: '',
      isBusy: false,
      errors: {}
    };
  },
  props: {
    user: {
      type: Object,
      required: true
    },
    edit: {
      type: Boolean,
      required: true
    },
    isOwnUser: {
      type: Boolean,
      required: true
    }
  },
  mounted () {
    this.email = this.user.email;
  },
  methods: {
    save: function () {
      this.isBusy = true;
      this.errors = {};
      Base.call(`users/${this.user.id}/email`, {
        method: 'PUT',
        data: {
          current_password: this.current_password,
          email: this.email
        }
      })
        .then(response => {
          if (response.status === 200 && response.status === 204) {
            this.$emit('userUpdated', response.data.data);
          }
          if (response.status === 202) {
            this.flashMessage.success(this.$t('settings.users.email.verifyEmail'));
          }
        })
        .catch(error => {
          if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
          } else {
            Base.error(error, this.$root, error.message);
          }
        })
        .finally(() => {
          this.current_password = null;
          this.isBusy = false;
        });
    }
  }
};
</script>
