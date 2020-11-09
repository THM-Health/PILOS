<template>
  <div>
    <b-row>
      <b-col>
        <h3>
          {{ $t('settings.users.title') }}
          <can method='create' policy='UserPolicy'>
            <b-button
              class='float-right'
              v-b-tooltip.hover
              variant='success'
              :title="$t('settings.users.new')"
              :to="{ name: 'settings.users.view', params: { id: 'new' } }"
            ><b-icon-plus></b-icon-plus></b-button>
          </can>
        </h3>
      </b-col>
      <b-col sm='12' md='3'>
        <b-input-group>
          <b-form-input
            v-model='filter'
            :placeholder="$t('app.search')"
            :debounce='200'
          ></b-form-input>
          <b-input-group-append>
            <b-input-group-text class='bg-success text-white'><b-icon icon='search'></b-icon></b-input-group-text>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <hr>

    <b-table
      :responsive='true'
      hover
      show-empty
      stacked='md'
      :busy.sync='isBusy'
      :fields='tableFields'
      :items='fetchUsers'
      id='users-table'
      :current-page='currentPage'
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

      <template v-slot:cell(actions)="data">
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
      </template>
    </b-table>

    <b-pagination
      v-model='currentPage'
      :total-rows='total'
      :per-page='perPage'
      aria-controls='users-table'
      @input="$root.$emit('bv::refresh::table', 'users-table')"
      align='center'
      :disabled='isBusy'
    ></b-pagination>

    <b-modal
      :busy='deleting'
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.false')"
      @ok='deleteUser'
      @cancel='clearUserToDelete'
      @close='clearUserToDelete'
      ref='delete-user-modal'
      :static='modalStatic'>
      <template v-slot:modal-title>
        {{ $t('settings.users.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="deleting"></b-spinner>  {{ $t('app.true') }}
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

export default {
  components: { Can },
  mixins: [ActionsColumn],

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    tableFields () {
      return [
        { key: 'id', label: this.$t('settings.users.id'), sortable: true },
        { key: 'firstname', label: this.$t('settings.users.firstname'), sortable: true },
        { key: 'lastname', label: this.$t('settings.users.lastname'), sortable: true },
        { key: 'email', label: this.$t('settings.users.email'), sortable: true },
        { key: 'authenticator', label: this.$t('settings.users.authenticator.title'), sortable: true }
      ];
    }
  },

  data () {
    return {
      isBusy: false,
      deleting: false,
      currentPage: undefined,
      total: undefined,
      perPage: undefined,
      userToDelete: undefined,
      actionPermissions: ['users.view', 'users.update', 'users.delete'],
      filter: undefined
    };
  },

  methods: {
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

      if (ctx.filter) {
        config.params.name = ctx.filter;
      }

      Base.call('users', config).then(response => {
        this.perPage = response.data.meta.per_page;
        this.currentPage = response.data.meta.current_page;
        this.total = response.data.meta.total;

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
     * Deletes the user that is set in the property `userToDelete`.
     */
    deleteUser () {
      this.deleting = true;

      Base.call(`users/${this.userToDelete.id}`, {
        method: 'delete'
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.currentPage = 1;
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
    }
  }
};
</script>

<style scoped>

</style>
