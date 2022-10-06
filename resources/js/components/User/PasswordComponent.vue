<template>
  <div>
    <b-form @submit="changePassword">
      <b-form-group
        label-cols-sm='3'
        :label="$t('settings.users.authentication.change_password.current_password')"
        label-for='current_password'
        :state='fieldState("password")'
        v-if="isOwnUser"
      >
        <b-form-input
          id='current_password'
          type='password'
          v-model='current_password'
          required
          :state='fieldState("current_password")'
          :disabled="isBusy"
        ></b-form-input>
        <template slot='invalid-feedback'><div v-html="fieldError('current_password')"></div></template>
      </b-form-group>
      <b-form-group
        label-cols-sm='3'
        :label="$t('settings.users.authentication.change_password.new_password')"
        label-for='new_password'
        :state='fieldState("password")'
      >
        <b-form-input
          id='new_password'
          type='password'
          v-model='new_password'
          required
          :state='fieldState("new_password")'
          :disabled="isBusy"
        ></b-form-input>
        <template slot='invalid-feedback'><div v-html="fieldError('new_password')"></div></template>
      </b-form-group>
      <b-form-group
        label-cols-sm='3'
        :label="$t('settings.users.authentication.change_password.new_password_confirmation')"
        label-for='new_password_confirmation'
        :state='fieldState("password_confirmation")'
      >
        <b-form-input
          id='new_password_confirmation'
          type='password'
          v-model='new_password_confirmation'
          required
          :state='fieldState("new_password_confirmation")'
          :disabled="isBusy"
        ></b-form-input>
        <template slot='invalid-feedback'><div v-html="fieldError('new_password_confirmation')"></div></template>
      </b-form-group>
      <b-button
        :disabled='isBusy'
        variant='success'
        type='submit'
      >
        <i class='fa-solid fa-save'></i> {{ $t('settings.users.authentication.change_password.save') }}
      </b-button>
    </b-form>
  </div>
</template>

<script>
import PermissionService from '../../services/PermissionService';
import Base from '../../api/base';
import FieldErrors from '../../mixins/FieldErrors';
import env from '../../env';

export default {
  name: 'PasswordComponent',
  mixins: [FieldErrors],
  data () {
    return {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
      isBusy: false,
      errors: {}
    };
  },
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  computed: {
    isOwnUser () {
      return PermissionService.currentUser.id === this.user.id;
    }
  },
  methods: {
    changePassword (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.isBusy = true;
      this.errors = {};
      Base.call('users/' + this.user.id + '/password', {
        method: 'PUT',
        data: {
          current_password: this.current_password,
          new_password: this.new_password,
          new_password_confirmation: this.new_password_confirmation
        }
      })
        .then(response => {
          this.$emit('updateUser', response.data.data);
        })
        .catch(error => {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$emit('notFoundError', error);
          } else if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
            this.errors = error.response.data.errors;
          } else {
            Base.error(error, this.$root, error.message);
          }
        }).finally(() => {
          this.isBusy = false;
          this.current_password = null;
          this.new_password = null;
          this.new_password_confirmation = null;
        });
    }
  }
};
</script>
