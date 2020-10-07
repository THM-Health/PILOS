<template>
  <component
    v-bind:is="config.type === 'profile' ? 'b-container' : 'div'"
    v-bind:class="{ 'mt-3': config.type === 'profile', 'mb-5': config.type === 'profile' }"
  >
    <component
      v-bind:is="config.type === 'profile' ? 'b-card' : 'div'"
      v-bind:class="{ 'p-3': config.type === 'profile', border: config.type === 'profile', 'bg-white': config.type === 'profile' }">
      <!-- TODO: Password confirmation for profile page -->
      <h3>
        {{ config.id === 'new' ? $t('settings.users.new') : (
          config.type === 'profile' ? $t('app.profile') :
            $t(`settings.users.${config.type}`, { firstname: model.firstname, lastname: model.lastname })
        ) }}
      </h3>
      <hr>

      <b-form @submit='saveUser'>
        <b-container :fluid='true'>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.firstname')"
            label-for='firstname'
            :state='fieldState("firstname")'
          >
            <b-form-input
              id='firstname'
              type='text'
              v-model='model.firstname'
              :state='fieldState("firstname")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('firstname')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.lastname')"
            label-for='lastname'
            :state='fieldState("lastname")'
          >
            <b-form-input
              id='lastname'
              type='text'
              v-model='model.lastname'
              :state='fieldState("lastname")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('lastname')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.username')"
            label-for='username'
            :state='fieldState("username")'
          >
            <b-form-input
              id='username'
              type='text'
              v-model='model.username'
              :state='fieldState("username")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('username')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.email')"
            label-for='email'
            :state='fieldState("email")'
          >
            <b-form-input
              id='email'
              type='email'
              v-model='model.email'
              :state='fieldState("email")'
              :disabled="isBusy || config.type === 'view' || model.authenticator !== 'users'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('email')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.password')"
            label-for='password'
            :state='fieldState("password")'
            v-if="model.authenticator === 'users'"
          >
            <b-form-input
              id='password'
              type='password'
              v-model='model.password'
              :state='fieldState("password")'
              :disabled="isBusy || config.type === 'view'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('password')"></div></template>
          </b-form-group>
          <b-form-group
            label-cols-sm='3'
            :label="$t('settings.users.password_confirmation')"
            label-for='password_confirmation'
            :state='fieldState("password_confirmation")'
            v-if="model.authenticator === 'users'"
          >
            <b-form-input
              id='password_confirmation'
              type='password'
              v-model='model.password_confirmation'
              :state='fieldState("password_confirmation")'
              :disabled="isBusy || config.type === 'view'"
            ></b-form-input>
            <template slot='invalid-feedback'><div v-html="fieldError('password_confirmation')"></div></template>
          </b-form-group>
          <!-- TODO user_locale, roles-->
          <hr>
          <b-row class='my-1 float-right'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy'
                variant='secondary'
                @click="$router.push({ name: 'settings.users' })"
                v-if="config.type !== 'profile'">
                <i class='fas fa-arrow-left'></i> {{ $t('app.back') }}
              </b-button>
              <b-button
                :disabled='isBusy'
                variant='success'
                type='submit'
                class='ml-1'
                v-if="config.type !== 'view'">
                <i class='fas fa-save'></i> {{ $t('app.save') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>
    </component>
  </component>
</template>

<script>
import FieldErrors from '../../../mixins/FieldErrors';
import Base from '../../../api/base';

export default {
  mixins: [FieldErrors],

  props: {
    config: {
      type: Object,
      required: true,
      validator ({ id, type }) {
        if (['string', 'number'].indexOf(typeof id) === -1) {
          return false;
        }
        if (typeof type !== 'string' || ['view', 'edit', 'profile'].indexOf(type) === -1) {
          return false;
        }
        return !(id === 'new' && type !== 'edit');
      }
    },

    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      isBusy: false,
      model: {
        firstname: null,
        lastname: null,
        username: null,
        email: null,
        password: null,
        password_confirmation: null,
        user_locale: null,
        roles: []
      },
      errors: {}
    };
  },

  mounted () {
    if (this.config.id !== 'new') {
      Base.call(`users/${this.config.id}`).then(response => {
        this.model = response.data.data;
        console.log(this.model.roles);
      }).catch(response => {
        // TODO: If not found and the user is the current user, then log him out!
      }).finally(() => {
        this.isBusy = false;
      });
    }
  },

  methods: {
    // TODO: load roles
    //    - saveUser => if it is the current, then renew also the currentUser by calling
    //      getCurrentUser of the store
    // If the user wasn't found and it is the current user log him out!
    // handle stale errors
    // don't change page on save on profile page
    saveUser () {

    }
  }
};

</script>

<style scoped>

</style>
