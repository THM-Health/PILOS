<template>
  <div>
    <h4>{{ $t('app.email') }}</h4>
    <b-form @submit="save">
      <b-form-group
        label-cols-sm='3'
        :label="$t('auth.current_password')"
        label-for='current_password'
        :state='fieldState("password")'
        v-if="edit && isOwnUser && canUpdateAttributes"
      >
        <b-form-input
          id='current_password'
          type='password'
          required
          v-model='current_password'
          :state='fieldState("current_password")'
          :disabled="isBusy"
        ></b-form-input>
        <template slot='invalid-feedback'><div v-html="fieldError('current_password')"></div></template>
      </b-form-group>
      <b-form-group
        label-cols-sm='3'
        :label="$t('app.email')"
        label-for='email'
        :state='fieldState("email")'
      >
        <b-form-input
          id='email'
          type='email'
          v-model='email'
          required
          :state='fieldState("email")'
          :disabled="isBusy || !edit || !canUpdateAttributes"
        ></b-form-input>
        <template slot='invalid-feedback'><div v-html="fieldError('email')"></div></template>

        <div v-if="validationRequiredEmail">
          <b-alert variant="success" show dismissible class="mt-3">
            {{ $t('auth.send_email_confirm_mail', {email: validationRequiredEmail}) }}
          </b-alert>
        </div>
      </b-form-group>
      <b-button
        :disabled='isBusy || email === this.user.email'
        v-if="edit && canUpdateAttributes"
        variant='success'
        type='submit'
      >
        <i class='fa-solid fa-save'></i> {{ $t('auth.change_email') }}
      </b-button>
    </b-form>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import Base from '../../api/base';
import env from '../../env';
import PermissionService from '../../services/PermissionService';

export default {
  name: 'EmailSettingsComponent',
  mixins: [FieldErrors],
  data () {
    return {
      current_password: '',
      email: '',
      isBusy: false,
      validationRequiredEmail: null,
      errors: {},
      canUpdateAttributes: false
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
    }
  },
  computed: {
    isOwnUser () {
      return PermissionService.currentUser.id === this.user.id;
    }
  },
  mounted () {
    this.email = this.user.email;
    this.validationRequiredEmail = null;
    this.canUpdateAttributes = PermissionService.can('updateAttributes', this.user);
  },
  methods: {
    save: function (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.isBusy = true;
      this.errors = {};
      this.validationRequiredEmail = null;
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
            this.validationRequiredEmail = this.email;
            this.email = this.user.email;
          }
        })
        .catch(error => {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$emit('notFoundError', error);
          } else if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
          } else if (error.response.status === env.HTTP_EMAIL_CHANGE_THROTTLE) {
            this.toastError(this.$t('auth.throttle_email'));
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
