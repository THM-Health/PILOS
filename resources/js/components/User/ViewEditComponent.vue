<template>
  <div>
    <b-tabs v-if="busyCounter===0" fill nav-wrapper-class="mb-3">
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-user"></i> {{ $t('settings.users.tabs.profile') }}
        </template>
        <profile-component :user="user" :edit="!viewOnly" @updateUser="updateUser" @staleError="handleStaleError" ></profile-component>
      </b-tab>
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-envelope"></i> {{ $t('settings.users.tabs.email') }}
        </template>
        <email-settings-component :user="user" :edit="!viewOnly" :is-own-user="isOwnUser" @updateUser="updateUser"></email-settings-component>
      </b-tab>
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-user-shield"></i> {{ $t('settings.users.tabs.authentication') }}
        </template>
        <authentication-settings-component :user="user" :edit="!viewOnly" @updateUser="updateUser" @staleError="handleStaleError"></authentication-settings-component>
      </b-tab>
      <b-tab lazy>
        <template #title>
          <i class="fa-solid fa-user-gear"></i> {{ $t('settings.users.tabs.other_settings') }}
        </template>
        <other-settings-component :user="user" :edit="!viewOnly" @updateUser="updateUser" @staleError="handleStaleError" ></other-settings-component>
      </b-tab>
    </b-tabs>

    <b-modal
      :static='modalStatic'
      :busy='isBusy'
      ok-variant='secondary'
      @ok='refreshUser'
      :ok-only="true"
      :hide-header-close='true'
      :no-close-on-backdrop='true'
      :no-close-on-esc='true'
      ref='stale-user-modal'
      :hide-header='true'>
      <template v-slot:default>
        <h5>{{ staleError.message }}</h5>
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.reload') }}
      </template>
    </b-modal>
  </div>
</template>

<script>
import FieldErrors from '../../mixins/FieldErrors';
import 'cropperjs/dist/cropper.css';
import AuthenticationSettingsComponent from './AuthenticationSettingsComponent';
import OtherSettingsComponent from './OtherSettingsComponent';
import EmailSettingsComponent from './EmailSettingsComponent';
import ProfileComponent from './ProfileComponent';
import Base from '../../api/base';
import PermissionService from '../../services/PermissionService';
import env from '../../env';

export default {
  mixins: [FieldErrors],
  components: {
    ProfileComponent,
    EmailSettingsComponent,
    OtherSettingsComponent,
    AuthenticationSettingsComponent
  },
  data () {
    return {
      user: {
        firstname: null,
        lastname: null,
        username: null,
        email: null,
        new_password: null,
        new_password_confirmation: null,
        user_locale: null,
        bbb_skip_check_audio: false,
        timezone: null,
        image: null,
        roles: []
      },
      busyCounter: 0,
      staleError: {}
    };
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    },

    viewOnly: {
      type: Boolean,
      required: true
    },
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    /**
     * Boolean that indicates, whether any request for this form is pending or not.
     */
    isBusy () {
      return this.busyCounter > 0;
    },

    isOwnUser () {
      return PermissionService.currentUser.id === this.user.id;
    }

  },
  methods: {
    handleStaleError (error) {
      this.staleError = error;
      this.$refs['stale-user-modal'].show();
    },

    updateUser (user) {
      this.user = user;
      this.$emit('updateUser', this.user);
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshUser () {
      this.user = this.staleError.new_model;
      this.user.roles.forEach(role => {
        role.$isDisabled = role.automatic;
      });
      this.$emit('updateUser', this.staleError.new_model);
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
    },

    loadUser () {
      this.busyCounter++;

      Base.call('users/' + this.id).then(response => {
        this.user = response.data.data;
        this.user.roles.forEach(role => {
          role.$isDisabled = role.automatic;
        });
        this.$emit('updateUser', this.user);
      }).catch(error => {
        // If user is not found and is the current user, redirect to login
        if (PermissionService.currentUser && this.id === PermissionService.currentUser.id && error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$store.dispatch('session/logout').then(() => {
            this.$router.push({ name: 'home' });
          });
        } else if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$router.push({ name: 'settings.users' });
        }

        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.busyCounter--;
      });
    }
  },
  created () {
    if (this.id !== 'new') {
      this.loadUser();
    }
  }
};

</script>

<style scoped>

</style>
