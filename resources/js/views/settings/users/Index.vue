<template>
  <div>
    <b-row>
      <b-col>
        <h3>
          {{ $t('settings.users.title') }}
        </h3>
      </b-col>
        <b-col>
          <can method='create' policy='UserPolicy'>
            <b-button
              class='float-right'
              v-b-tooltip.hover
              variant='success'
              :title="$t('settings.users.new')"
              :to="{ name: 'settings.users.view', params: { id: 'new' } }"
            ><b-icon-plus></b-icon-plus></b-button>
          </can>
        </b-col>
    </b-row>

        <b-row>
          <b-col sm='12' md='4'>
            <b-input-group>
              <b-form-input
                v-model='filter.name'
                :placeholder="$t('app.search')"
                :debounce='200'
              ></b-form-input>
              <b-input-group-append>
                <b-input-group-text class='bg-success text-white'><b-icon icon='search'></b-icon></b-input-group-text>
              </b-input-group-append>
            </b-input-group>
          </b-col>

          <b-col sm='12' md='4' offset-md="4">

          <b-input-group>
            <multiselect
              :placeholder="$t('settings.users.role_filter')"
              ref="roles-multiselect"
              v-model='filter.role'
              track-by='id'
              open-direction='bottom'
              :multiple='false'
              :searchable='false'
              :internal-search='false'
              :clear-on-select='false'
              :close-on-select='false'
              :show-no-results='false'
              :showLabels='false'
              :options='roles'
              :disabled="rolesLoadingError"
              id='roles'
              :loading='rolesLoading'
              :allowEmpty='true'
              class="multiselect-form-control"
             >
              <template slot='noOptions'>{{ $t('settings.roles.nodata') }}</template>
              <template slot='option' slot-scope="props">{{ $te(`app.roles.${props.option.name}`) ? $t(`app.roles.${props.option.name}`) : props.option.name }}</template>
              <template slot='singleLabel' slot-scope='{ option }'>
                    {{ $te(`app.roles.${option.name}`) ? $t(`app.roles.${option.name}`) : option.name }}

              </template>
              <template slot='afterList'>
                <b-button
                  :disabled='rolesLoading || rolesCurrentPage === 1'
                  variant='outline-secondary'
                  @click='loadRoles(Math.max(1, rolesCurrentPage - 1))'>
                  <i class='fas fa-arrow-left'></i> {{ $t('app.previousPage') }}
                </b-button>
                <b-button
                  :disabled='rolesLoading || !rolesHasNextPage'
                  variant='outline-secondary'
                  @click='loadRoles(rolesCurrentPage + 1)'>
                  <i class='fas fa-arrow-right'></i> {{ $t('app.nextPage') }}
                </b-button>
              </template>
            </multiselect>
            <b-input-group-append>
              <b-button
                ref="clearRolesButton"
                v-if="!rolesLoadingError && filter.role"
                @click="filter.role = null"
                variant="outline-secondary"
              ><b-icon icon='x'></b-icon></b-button>

              <b-button
                ref="reloadRolesButton"
                v-if="rolesLoadingError"
                @click="loadRoles(rolesCurrentPage)"
                variant="outline-secondary"
              ><i class="fas fa-sync"></i></b-button>
            </b-input-group-append>
          </b-input-group>
            </b-col>

          </b-row>
    <hr>

    <b-table
      fixed
      hover
      show-empty
      stacked='lg'
      :busy.sync='isBusy'
      :fields='tableFields'
      :items='fetchUsers'
      id='users-table'
      :current-page='meta.current_page'
      :filter='filter'
      ref='users'
      >

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template v-slot:empty>
        <i>{{ $t('settings.users.nodata') }}</i>
      </template>

      <template v-slot:emptyfiltered>
        <i>{{ $t('settings.users.nodataFiltered') }}</i>
      </template>

      <template v-slot:cell(authenticator)="data">
        {{ $t(`settings.users.authenticator.${data.item.authenticator}`) }}
      </template>

      <template v-slot:cell(roles)="data">
        <text-truncate  v-for="role in data.item.roles" :key="role.id">
          {{ $te(`app.roles.${role.name}`) ? $t(`app.roles.${role.name}`) : role.name }}
        </text-truncate>
      </template>

      <template #cell()="data">
        <text-truncate>
          {{ data.value }}
        </text-truncate>
      </template>

      <template v-slot:cell(actions)="data">
        <b-button-group>
          <can method='view' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.users.view', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled='isBusy'
              variant='primary'
              class='mb-1'
              :to="{ name: 'settings.users.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class='fas fa-eye'></i>
            </b-button>
          </can>
          <can method='update' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.users.edit', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled='isBusy'
              variant='dark'
              class='mb-1'
              :to="{ name: 'settings.users.view', params: { id: data.item.id } }"
            >
              <i class='fas fa-edit'></i>
            </b-button>
          </can>
          <can method='resetPassword' :policy='data.item'>
            <b-button
              :id="'resetPassword' + data.item.id"
              v-b-tooltip.hover
              :title="$t('settings.users.resetPassword.item', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled='isBusy'
              variant='warning'
              class='mb-1'
              @click='showResetPasswordModal(data.item)'
            >
              <i class='fas fa-key'></i>
            </b-button>
          </can>
          <can method='delete' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.users.delete.item', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled='isBusy'
              variant='danger'
              class='mb-1'
              @click='showDeleteModal(data.item)'>
              <i class='fas fa-trash'></i>
            </b-button>
          </can>
        </b-button-group>
      </template>
    </b-table>

    <b-pagination
      v-model='meta.current_page'
      :total-rows='meta.total'
      :per-page='meta.per_page'
      aria-controls='users-table'
      @input="$root.$emit('bv::refresh::table', 'users-table')"
      align='center'
      :disabled='isBusy'
    ></b-pagination>

    <b-modal
      :busy='resetting'
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.no')"
      @ok='resetPassword($event)'
      @cancel='clearUserToResetPassword'
      @close='clearUserToResetPassword'
      ref='reset-user-password-modal'
      :static='modalStatic'
      :no-close-on-esc="resetting"
      :no-close-on-backdrop="resetting"
      :hide-header-close="resetting"
    >
      <template v-slot:modal-title>
        {{ $t('settings.users.resetPassword.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="resetting"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span v-if="userToResetPassword">
        {{ $t('settings.users.resetPassword.confirm', { firstname: userToResetPassword.firstname, lastname: userToResetPassword.lastname }) }}
      </span>
    </b-modal>

    <b-modal
      :busy='deleting'
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.no')"
      @ok='deleteUser($event)'
      @cancel='clearUserToDelete'
      @close='clearUserToDelete'
      ref='delete-user-modal'
      :static='modalStatic'
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
    >
      <template v-slot:modal-title>
        {{ $t('settings.users.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="deleting"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span v-if="userToDelete">
        {{ $t('settings.users.delete.confirm', { firstname: userToDelete.firstname, lastname: userToDelete.lastname }) }}
      </span>
    </b-modal>
  </div>
</template>

<script>
import ActionsColumn from '../../../mixins/ActionsColumn';
import Can from '../../../components/Permissions/Can';
import Base from '../../../api/base';
import TextTruncate from '../../../components/TextTruncate';
import Multiselect from 'vue-multiselect';

export default {
  components: { TextTruncate, Can, Multiselect },
  mixins: [ActionsColumn],

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    tableFields () {
      const fields = [
        { key: 'id', label: this.$t('settings.users.id'), sortable: true, tdClass: 'td-max-width-0-lg', thStyle: { width: '8%' } },
        { key: 'firstname', label: this.$t('settings.users.firstname'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'lastname', label: this.$t('settings.users.lastname'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'email', label: this.$t('settings.users.email'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'authenticator', label: this.$t('settings.users.authenticator.title'), sortable: true },
        { key: 'roles', label: this.$t('settings.users.roles'), sortable: false, tdClass: 'td-max-width-0-lg' }
      ];

      if (this.actionColumnVisible) {
        fields.push(this.actionColumnDefinition);
      }

      return fields;
    }
  },

  data () {
    return {
      isBusy: false,
      deleting: false,
      resetting: false,
      meta: {},
      userToDelete: undefined,
      userToResetPassword: undefined,
      actionPermissions: ['users.view', 'users.update', 'users.delete'],
      actionColumnThStyle: 'width: 200px',
      filter: {
        name: undefined,
        role: undefined
      },
      roles: [],
      rolesLoading: false,
      rolesLoadingError: false,
      rolesCurrentPage: 1,
      rolesHasNextPage: false

    };
  },

  /**
   * Loads the user, part of roles that can be selected and enables an event listener
   * to enable or disable the edition of roles and attributes when the permissions
   * of the current user gets changed.
   */
  mounted () {
    this.loadRoles();
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
        this.rolesCurrentPage = page;
        this.rolesHasNextPage = page < response.data.meta.last_page;
      }).catch(error => {
        this.$refs['roles-multiselect'].deactivate();
        this.rolesLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.rolesLoading = false;
      });
    },

    /**
     * Loads the users from the backend and calls on finish the callback function.
     *
     * @param ctx Context information e.g. the sort field and direction, filter and the page.
     * @param callback
     * @return {null}
     */
    fetchUsers (ctx, callback) {
      let data = [];

      const config = {
        params: {
          page: ctx.currentPage
        }
      };

      if (ctx.sortBy) {
        config.params.sort_by = ctx.sortBy;
        config.params.sort_direction = ctx.sortDesc ? 'desc' : 'asc';
      }

      if (ctx.filter.name) {
        config.params.name = ctx.filter.name;
      }
      if (ctx.filter.role) {
        config.params.role = ctx.filter.role.id;
      }

      Base.call('users', config).then(response => {
        this.meta = response.data.meta;
        data = response.data.data;
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        callback(data);
      });

      return null;
    },

    /**
     * Shows the delete modal with the passed user.
     *
     * @param user The user that should be deleted.
     */
    showDeleteModal (user) {
      this.userToDelete = user;
      this.$refs['delete-user-modal'].show();
    },

    /**
     * Shows the reset password modal with the passed user.
     *
     * @param user The user whose password should be reset.
     */
    showResetPasswordModal (user) {
      this.userToResetPassword = user;
      this.$refs['reset-user-password-modal'].show();
    },

    /**
     * Deletes the user that is set in the property `userToDelete`.
     */
    deleteUser (evt) {
      evt.preventDefault();
      this.deleting = true;

      Base.call(`users/${this.userToDelete.id}`, {
        method: 'delete'
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.meta = {};
        this.$refs.users.refresh();
        this.clearUserToDelete();
        this.$refs['delete-user-modal'].hide();
        this.deleting = false;
      });
    },

    /**
     * Clears the temporary property `userToDelete` on canceling or
     * after success delete when the modal gets hidden.
     */
    clearUserToDelete () {
      this.userToDelete = undefined;
    },

    /**
     * Clears the temporary property `userToResetPassword` on canceling or
     * after success reset when the modal gets hidden.
     */
    clearUserToResetPassword () {
      this.userToResetPassword = undefined;
    },

    /**
     * Resets the password for the given user.
     */
    resetPassword (evt) {
      evt.preventDefault();
      this.resetting = true;

      const config = {
        method: 'post'
      };

      Base.call(`users/${this.userToResetPassword.id}/resetPassword`, config).then(() => {
        this.flashMessage.success({
          title: this.$t('settings.users.passwordResetSuccess', { mail: this.userToResetPassword.email })
        });
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.clearUserToResetPassword();
        this.$refs['reset-user-password-modal'].hide();
        this.resetting = false;
      });
    }
  }
};
</script>

<style scoped>

</style>
