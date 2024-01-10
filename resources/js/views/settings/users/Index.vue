<template>
  <div>
    <b-row>
      <b-col>
        <h3>
          {{ $t('app.users') }}
        </h3>
      </b-col>
      <b-col>
        <can
          method="create"
          policy="UserPolicy"
        >
          <b-button
            v-if="getSetting('auth.local')"
            ref="new-user-button"
            v-b-tooltip.hover
            v-tooltip-hide-click
            class="float-right"
            variant="success"
            :title="$t('settings.users.new')"
            :to="{ name: 'settings.users.new' }"
          >
            <i class="fa-solid fa-plus" />
          </b-button>
        </can>
      </b-col>
    </b-row>

    <b-row>
      <b-col
        sm="12"
        md="4"
      >
        <b-input-group>
          <b-form-input
            v-model="filter.name"
            :placeholder="$t('app.search')"
            :debounce="200"
          />
          <b-input-group-append>
            <b-input-group-text class="bg-primary">
              <i class="fa-solid fa-magnifying-glass" />
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
      </b-col>

      <b-col
        sm="12"
        md="4"
        offset-md="4"
      >
        <b-input-group>
          <multiselect
            id="roles"
            ref="roles-multiselect"
            v-model="filter.role"
            :placeholder="$t('settings.users.role_filter')"
            track-by="id"
            open-direction="bottom"
            :multiple="false"
            :searchable="false"
            :internal-search="false"
            :clear-on-select="false"
            :close-on-select="false"
            :show-no-results="false"
            :show-labels="false"
            :options="roles"
            :disabled="rolesLoadingError"
            :loading="rolesLoading"
            :allow-empty="true"
            class="multiselect-form-control"
          >
            <template #noOptions>
              {{ $t('settings.roles.nodata') }}
            </template>
            <template v-slot:option="{ option }">
              {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
            </template>
            <template v-slot:singleLabel="{ option }">
              {{ $te(`app.role_lables.${option.name}`) ? $t(`app.role_lables.${option.name}`) : option.name }}
            </template>
            <template #afterList>
              <b-button
                :disabled="rolesLoading || rolesCurrentPage === 1"
                variant="outline-secondary"
                @click="loadRoles(Math.max(1, rolesCurrentPage - 1))"
              >
                <i class="fa-solid fa-arrow-left" /> {{ $t('app.previous_page') }}
              </b-button>
              <b-button
                :disabled="rolesLoading || !rolesHasNextPage"
                variant="outline-secondary"
                @click="loadRoles(rolesCurrentPage + 1)"
              >
                <i class="fa-solid fa-arrow-right" /> {{ $t('app.next_page') }}
              </b-button>
            </template>
          </multiselect>
          <b-input-group-append>
            <b-button
              v-if="!rolesLoadingError && filter.role"
              ref="clearRolesButton"
              variant="outline-secondary"
              @click="filter.role = null"
            >
              <i class="fa-solid fa-xmark" />
            </b-button>

            <b-button
              v-if="rolesLoadingError"
              ref="reloadRolesButton"
              variant="outline-secondary"
              @click="loadRoles(rolesCurrentPage)"
            >
              <i class="fa-solid fa-sync" />
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <hr>

    <b-table
      id="users-table"
      ref="users"
      fixed
      hover
      show-empty
      stacked="lg"
      v-model:busy="isBusy"
      :fields="tableFields"
      :items="fetchUsers"
      :current-page="meta.current_page"
      :filter="filter"
    >
      <template #table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle" />
        </div>
      </template>

      <template #empty>
        <i>{{ $t('settings.users.no_data') }}</i>
      </template>

      <template #emptyfiltered>
        <i>{{ $t('settings.users.no_data_filtered') }}</i>
      </template>

      <template #cell(authenticator)="data">
        {{ $t(`settings.users.authenticator.${data.item.authenticator}`) }}
      </template>

      <template #cell(roles)="data">
        <text-truncate
          v-for="role in data.item.roles"
          :key="role.id"
        >
          {{ $te(`app.role_lables.${role.name}`) ? $t(`app.role_lables.${role.name}`) : role.name }}
        </text-truncate>
      </template>

      <template #cell()="data">
        <text-truncate>
          {{ data.value }}
        </text-truncate>
      </template>

      <template #cell(actions)="data">
        <b-button-group>
          <can
            method="view"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              v-tooltip-hide-click
              :title="$t('settings.users.view', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled="isBusy"
              variant="info"
              class="mb-1"
              :to="{ name: 'settings.users.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </b-button>
          </can>
          <can
            method="update"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              v-tooltip-hide-click
              :title="$t('settings.users.edit', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled="isBusy"
              variant="secondary"
              class="mb-1"
              :to="{ name: 'settings.users.view', params: { id: data.item.id } }"
            >
              <i class="fa-solid fa-edit" />
            </b-button>
          </can>
          <can
            method="resetPassword"
            :policy="data.item"
          >
            <b-button
              v-if="getSetting('auth.local')"
              :id="'resetPassword' + data.item.id"
              v-b-tooltip.hover
              v-tooltip-hide-click
              :title="$t('settings.users.reset_password.item', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled="isBusy"
              variant="warning"
              class="mb-1"
              @click="showResetPasswordModal(data.item)"
            >
              <i class="fa-solid fa-key" />
            </b-button>
          </can>
          <can
            method="delete"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              v-tooltip-hide-click
              :title="$t('settings.users.delete.item', { firstname: data.item.firstname, lastname: data.item.lastname })"
              :disabled="isBusy"
              variant="danger"
              class="mb-1"
              @click="showDeleteModal(data.item)"
            >
              <i class="fa-solid fa-trash" />
            </b-button>
          </can>
        </b-button-group>
      </template>
    </b-table>

    <b-pagination
      v-model="meta.current_page"
      :total-rows="meta.total"
      :per-page="meta.per_page"
      aria-controls="users-table"
      align="center"
      :disabled="isBusy"
      @input="$root.$emit('bv::refresh::table', 'users-table')"
    />

    <b-modal
      ref="reset-user-password-modal"
      :busy="resetting"
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      :static="modalStatic"
      :no-close-on-esc="resetting"
      :no-close-on-backdrop="resetting"
      :hide-header-close="resetting"
      @ok="resetPassword($event)"
      @cancel="clearUserToResetPassword"
      @close="clearUserToResetPassword"
    >
      <template #modal-title>
        {{ $t('settings.users.reset_password.title') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="resetting"
          small
        />  {{ $t('app.yes') }}
      </template>
      <span v-if="userToResetPassword">
        {{ $t('settings.users.reset_password.confirm', { firstname: userToResetPassword.firstname, lastname: userToResetPassword.lastname }) }}
      </span>
    </b-modal>

    <b-modal
      ref="delete-user-modal"
      :busy="deleting"
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      :static="modalStatic"
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
      @ok="deleteUser($event)"
      @cancel="clearUserToDelete"
      @close="clearUserToDelete"
    >
      <template #modal-title>
        {{ $t('settings.users.delete.title') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="deleting"
          small
        />  {{ $t('app.yes') }}
      </template>
      <span v-if="userToDelete">
        {{ $t('settings.users.delete.confirm', { firstname: userToDelete.firstname, lastname: userToDelete.lastname }) }}
      </span>
    </b-modal>
  </div>
</template>

<script>
import ActionsColumn from '@/mixins/ActionsColumn';
import Can from '@/components/Permissions/Can.vue';
import Base from '@/api/base';
import TextTruncate from '@/components/TextTruncate.vue';
import { Multiselect } from 'vue-multiselect';
import { mapState } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

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
        { key: 'id', label: this.$t('app.id'), sortable: true, tdClass: 'td-max-width-0-lg', thStyle: { width: '8%' } },
        { key: 'firstname', label: this.$t('app.firstname'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'lastname', label: this.$t('app.lastname'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'email', label: this.$t('settings.users.email'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'authenticator', label: this.$t('settings.users.authenticator.title'), sortable: true },
        { key: 'roles', label: this.$t('app.roles'), sortable: false, tdClass: 'td-max-width-0-lg' }
      ];

      if (this.actionColumnVisible) {
        fields.push(this.actionColumnDefinition);
      }

      return fields;
    },

    ...mapState(useSettingsStore, ['getSetting'])
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
        this.toastSuccess(this.$t('settings.users.password_reset_success', { mail: this.userToResetPassword.email }));
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
