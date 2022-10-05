<template>
  <div>
    <b-form-group
      label-cols-sm='3'
      :label="$t('settings.users.authentication.roles_and_perm.roles')"
      label-for='roles'
      :state='fieldState("roles", true)'
    >
      <b-input-group>
        <multiselect
          :placeholder="$t('settings.users.authentication.roles_and_perm.select_roles')"
          ref="roles-multiselect"
          v-model='model.roles'
          track-by='id'
          open-direction='bottom'
          :multiple='true'
          :searchable='false'
          :internal-search='false'
          :clear-on-select='false'
          :close-on-select='false'
          :show-no-results='false'
          :showLabels='false'
          :options='roles'
          :disabled="isBusy || modelLoadingError || rolesLoadingError || !edit || !canEditRoles"
          id='roles'
          :loading='rolesLoading'
          :allowEmpty='false'
          :class="{ 'is-invalid': fieldState('roles', true), 'multiselect-form-control': true }">
          <template slot='noOptions'>{{ $t('settings.roles.nodata') }}</template>
          <template slot='option' slot-scope="props">{{ $te(`app.roles.${props.option.name}`) ? $t(`app.roles.${props.option.name}`) : props.option.name }}</template>
          <template slot='tag' slot-scope='{ option, remove }'>
            <h5 class='d-inline mr-1 mb-1'>
              <b-badge variant='secondary'>
                {{ $te(`app.roles.${option.name}`) ? $t(`app.roles.${option.name}`) : option.name }}
                <span @click='remove(option)'><i class="fa-solid fa-xmark" :aria-label="$t('settings.users.authentication.roles_and_perm.removeRole')"></i></span>
              </b-badge>
            </h5>
          </template>
          <template slot='afterList'>
            <b-button
              :disabled='rolesLoading || currentPage === 1'
              variant='outline-secondary'
              @click='loadRoles(Math.max(1, currentPage - 1))'>
              <i class='fa-solid fa-arrow-left'></i> {{ $t('app.previousPage') }}
            </b-button>
            <b-button
              :disabled='rolesLoading || !hasNextPage'
              variant='outline-secondary'
              @click='loadRoles(currentPage + 1)'>
              <i class='fa-solid fa-arrow-right'></i> {{ $t('app.nextPage') }}
            </b-button>
          </template>
        </multiselect>
        <b-input-group-append>
          <b-button
            ref="reloadRolesButton"
            v-if="rolesLoadingError"
            @click="loadRoles(currentPage)"
            variant="outline-secondary"
          ><i class="fa-solid fa-sync"></i></b-button>
        </b-input-group-append>
      </b-input-group>
      <template slot='invalid-feedback'><div v-html="fieldError('roles', true)"></div></template>
    </b-form-group>

    <b-button
      :disabled='isBusy || rolesLoadingError'
      variant='success'
      type='submit'
      v-if="edit && canEditRoles"
      @click="save"
    >
      <i class='fa-solid fa-save'></i> {{ $t('app.save') }}
    </b-button>

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
import PermissionService from '../../services/PermissionService';
import EventBus from '../../services/EventBus';
import Base from '../../api/base';
import env from '../../env';
import Multiselect from 'vue-multiselect';
import _ from 'lodash';

export default {
  name: 'RolesAndPermissionsComponent',
  components: { Multiselect },
  props: {
    edit: {
      type: Boolean,
      required: true
    },
    user: {
      type: Object,
      required: true
    },
    modalStatic: {
      type: Boolean,
      default: false
    }
  },
  mixins: [FieldErrors],
  computed: {
    isOwnUser () {
      return PermissionService.currentUser.id === this.model.id;
    }
  },

  data () {
    return {
      isBusy: false,
      model: {},
      errors: {},
      rolesLoading: false,
      roles: [],
      currentPage: 1,
      hasNextPage: false,
      modelLoadPromise: Promise.resolve(),
      canEditRoles: false,
      staleError: {},
      modelLoadingError: false,
      rolesLoadingError: false,
      timezonesLoading: false,
      timezonesLoadingError: false,
      timezones: [],

      imageToBlobLoading: false,
      croppedImage: null,
      croppedImageBlob: null,
      selectedFile: null,
      image_deleted: false
    };
  },

  /**
   * Removes the event listener to enable or disable the edition of roles
   * and attributes when the permissions of the current user gets changed.
   */
  beforeDestroy () {
    EventBus.$off('currentUserChangedEvent', this.togglePermissionFlags);
  },

  /**
   * Loads the user, part of roles that can be selected and enables an event listener
   * to enable or disable the edition of roles and attributes when the permissions
   * of the current user gets changed.
   */
  mounted () {
    EventBus.$on('currentUserChangedEvent', this.togglePermissionFlags);

    this.model = _.cloneDeep(this.user);

    if (PermissionService.can('editUserRole', { id: this.model.id, model_name: 'User' }) && this.edit) {
      this.loadRoles();
    }

    this.togglePermissionFlags();
  },

  watch: {
    /**
     * When the user changes, the model is updated and the roles are reloaded.
     */
    user: {
      handler (user) {
        this.model = _.cloneDeep(user);
      },
      deep: true
    }
  },

  methods: {
    /**
     * Loads the roles for the passed page, that can be selected through the multiselect.
     *
     * @param [page=1] The page to load the roles for.
     */
    loadRoles (page = 1) {
      this.rolesLoading = true;

      const config = {
        params: {
          page
        }
      };

      Base.call('roles', config).then(response => {
        this.rolesLoadingError = false;
        this.roles = response.data.data;
        this.currentPage = page;
        this.hasNextPage = page < response.data.meta.last_page;
        return this.modelLoadPromise;
      }).then(() => {
        this.roles.forEach(role => {
          role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
        });
      }).catch(error => {
        this.$refs['roles-multiselect'].deactivate();
        this.rolesLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.rolesLoading = false;
      });
    },

    /**
     * Saves the changes of the user to the database by making a api call.
     *
     */
    save (evt) {
      this.isBusy = true;

      const formData = new FormData();

      for (var i = 0; i < this.model.roles.length; i++) {
        const role = this.model.roles[i].id;
        formData.append('roles[' + i + ']', role);
      }

      formData.append('updated_at', this.model.updated_at);

      formData.append('_method', 'PUT');

      Base.call('users/' + this.model.id, {
        method: 'POST',
        data: formData
      }).then(response => {
        this.$emit('updateUser', response.data.data);
        this.model = response.data.data;
      }).catch(error => {
        // If the user wasn't found and it is the current user log him out!
        if (PermissionService.currentUser && this.model.id === PermissionService.currentUser.id && error.response && error.response.status === env.HTTP_NOT_FOUND) {
          this.$store.dispatch('session/logout').then(() => {
            this.$router.push({ name: 'home' });
          });
          Base.error(error, this.$root, error.message);
        } else if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          // Stale error
          this.$emit('staleError', error.response.data);
        } else {
          if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
            this.$router.push({ name: 'settings.users' });
          }

          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    },

    /**
     * Enable or disable the edition of roles and attributes depending on the permissions of the current user.
     */
    togglePermissionFlags () {
      if (this.model.id && this.model.model_name) {
        this.canEditRoles = PermissionService.can('editUserRole', this.model);
      }
    },

    /**
     * Refreshes the current model with the new passed from the stale error response.
     */
    refreshUser () {
      this.model = this.staleError.new_model;
      this.roles.forEach(role => {
        role.$isDisabled = !!this.model.roles.find(selectedRole => selectedRole.id === role.id && selectedRole.automatic);
      });
      this.model.roles.forEach(role => {
        role.$isDisabled = role.automatic;
      });
      this.staleError = {};
      this.$refs['stale-user-modal'].hide();
    }
  }
};
</script>

<style scoped>

</style>
