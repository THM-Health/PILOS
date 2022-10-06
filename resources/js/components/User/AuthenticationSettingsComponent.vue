<template>
  <div>
    <div>
      <h4>{{ $t('settings.users.authentication.roles_and_perm.title') }}</h4>
      <roles-and-permissions-component
        :user="user"
        :edit="edit"
        @updateUser="updateUser"
        @staleError="handleStaleError"
        @notFoundError="handleNotFoundError"
      ></roles-and-permissions-component>
    </div>

    <div v-if="edit && user.authenticator === 'users'" class="mt-3">
      <hr>
      <h4>{{ $t('settings.users.authentication.change_password.title') }}</h4>
      <password-component
        :user="user"
        @updateUser="updateUser"
        @notFoundError="handleNotFoundError"
      ></password-component>
    </div>

    <div v-if="isOwnUser" class="mt-3">
      <hr>
      <h4>{{ $t('settings.users.authentication.sessions.title') }}</h4>
      <sessions-component :user="user"></sessions-component>
    </div>
  </div>
</template>

<script>
import SessionsComponent from './SessionsComponent';
import PermissionService from '../../services/PermissionService';
import PasswordComponent from './PasswordComponent';
import RolesAndPermissionsComponent from './RolesAndPermissionsComponent';
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
    isOwnUser () {
      return PermissionService.currentUser.id === this.user.id;
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
