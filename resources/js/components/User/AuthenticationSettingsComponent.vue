<template>
  <div>
    <div>
      <h4>{{ $t('settings.users.roles_and_permissions') }}</h4>
      <roles-and-permissions-component
        :user="user"
        :view-only="viewOnly"
        @updateUser="updateUser"
        @staleError="handleStaleError"
        @notFoundError="handleNotFoundError"
      ></roles-and-permissions-component>
    </div>

    <div v-if="!viewOnly && user.authenticator === 'users' && canChangePassword" class="mt-3">
      <hr>
      <h4>{{ $t('auth.change_password') }}</h4>
      <password-component
        :user="user"
        @updateUser="updateUser"
        @notFoundError="handleNotFoundError"
      ></password-component>
    </div>

    <div v-if="isOwnUser" class="mt-3">
      <hr>
      <h4>{{ $t('auth.sessions.active') }}</h4>
      <sessions-component/>
    </div>
  </div>
</template>

<script>
import SessionsComponent from './SessionsComponent.vue';
import PasswordComponent from './PasswordComponent.vue';
import RolesAndPermissionsComponent from './RolesAndPermissionsComponent.vue';
import { mapState } from 'pinia';
import { useSettingsStore } from '../../stores/settings';
import { useAuthStore } from '../../stores/auth';

export default {
  name: 'AuthenticationSettingsComponent',
  components: { PasswordComponent, RolesAndPermissionsComponent, SessionsComponent },
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
    ...mapState(useSettingsStore, ['getSetting']),

    isOwnUser () {
      return this.currentUser?.id === this.user.id;
    },
    canChangePassword () {
      return !this.isOwnUser || this.getSetting('password_self_reset_enabled');
    }
  },
  methods: {
    handleStaleError (error) {
      this.$emit('staleError', error);
    },
    updateUser (user) {
      this.$emit('updateUser', user);
    },
    handleNotFoundError (error) {
      this.$emit('notFoundError', error);
    }
  }
};
</script>
