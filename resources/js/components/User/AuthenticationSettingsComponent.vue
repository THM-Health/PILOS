<template>
  <div>
    <div>
      <h4>{{ $t('settings.users.roles_and_permissions') }}</h4>
      <roles-and-permissions-component
        :user="user"
        :edit="edit"
        @updateUser="updateUser"
        @staleError="handleStaleError"
        @notFoundError="handleNotFoundError"
      ></roles-and-permissions-component>
    </div>

    <div v-if="edit && user.authenticator === 'users' && canChangePassword" class="mt-3">
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
      <sessions-component :user="user"></sessions-component>
    </div>
  </div>
</template>

<script>
import SessionsComponent from './SessionsComponent';
import PermissionService from '../../services/PermissionService';
import PasswordComponent from './PasswordComponent';
import RolesAndPermissionsComponent from './RolesAndPermissionsComponent';
import { mapGetters } from 'vuex';

export default {
  name: 'AuthenticationSettingsComponent',
  components: { PasswordComponent, RolesAndPermissionsComponent, SessionsComponent },
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
    ...mapGetters({
      settings: 'session/settings'
    }),

    isOwnUser () {
      return PermissionService.currentUser.id === this.user.id;
    },
    canChangePassword () {
      return !this.isOwnUser || this.settings('password_self_reset_enabled');
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
