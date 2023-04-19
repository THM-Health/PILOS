<template>
  <div>
    <h4>{{ $t('app.email') }}</h4>
    <b-form @submit="save">
      <can method='updateAttributes' :policy='user'>
        <b-form-group
          label-cols-sm='3'
          :label="$t('auth.current_password')"
          label-for='current_password'
          :state='fieldState("password")'
          v-if="!viewOnly && isOwnUser"
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
      </can>
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
          :disabled="isBusy || viewOnly || !canUpdateAttributes"
        ></b-form-input>
        <template slot='invalid-feedback'><div v-html="fieldError('email')"></div></template>

        <div v-if="validationRequiredEmail">
          <b-alert variant="success" show dismissible class="mt-3">
            {{ $t('auth.send_email_confirm_mail', {email: validationRequiredEmail}) }}
          </b-alert>
        </div>
      </b-form-group>
      <can method='updateAttributes' :policy='user'>
        <b-button
          :disabled='isBusy'
          v-if="!viewOnly"
          variant='success'
          type='submit'
        >
          <i class='fa-solid fa-save'></i> {{ $t('auth.change_email') }}
        </b-button>
      </can>
    </b-form>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import Base from '../../api/base';
import env from '../../env';
import PermissionService from '../../services/PermissionService';
import { mapState } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import Can from '../Permissions/Can.vue';

export default {
  name: 'EmailSettingsComponent',
  components: { Can },
  mixins: [FieldErrors],
  data () {
    return {
      current_password: '',
      email: '',
      isBusy: false,
      validationRequiredEmail: null,
      canUpdateAttributes: false,
      errors: {}
    };
  },
  props: {
    user: {
      type: Object,
      required: true
    },
    viewOnly: {
      type: Boolean,
      default: false
    }
  },
  computed: {

    ...mapState(useAuthStore, ['currentUser']),

    isOwnUser () {
      return this.currentUser.id === this.user.id;
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

      const data = {
        email: this.email
      };

      if (this.isOwnUser) {
        data.current_password = this.current_password;
      }

      Base.call(`users/${this.user.id}/email`, {
        method: 'PUT',
        data
      })
        .then(response => {
          if (response.status === 200) {
            this.$emit('updateUser', response.data.data);
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
