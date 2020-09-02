<template>
  <div>
    <b-row>
      <b-col>
        <b-row>
          <h2 class="ml-3 text-success">{{ $t('settings.users.title') }}</h2>
          <b-avatar
            id="create-user-button"
            class="text-white ml-2"
            variant="success"
            icon="person-plus"
            v-b-tooltip.hover.top="$t('settings.users.tooltip.create')"
            @click="openModal('create')"
            button>
          </b-avatar>
          <b-avatar
            id="invite-user-button"
            class="text-white ml-2"
            variant="success"
            icon="envelope"
            v-b-tooltip.hover.top="$t('settings.users.tooltip.invite')"
            v-b-modal.invite-modal
            button>
          </b-avatar>
        </b-row>
      </b-col>
      <!--Search Bar-->
      <b-col lg="6" class="my-1">
        <b-form-group
          label-cols-sm="3"
          label-align-sm="right"
          label-size="sm"
          label-for="filterInput"
          class="mb-0"
        >
          <b-input-group size="sm">
            <b-form-input
              v-model="filterInput"
              type="search"
              id="filterInput"
              :placeholder="$t('app.searchbar.placeholder')"
              @input="getUsers(currentPage, filterInput)"
            ></b-form-input>
            <b-input-group-append>
              <b-input-group-text class="bg-success text-white"><i class="fa fas fa-search"></i>
              </b-input-group-text>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>

    <hr>

    <b-table id="user-table"
             hover
             :fields="fields"
             :busy.sync="isBusy"
             :items="users"
             :filter="filterInput"
             :no-local-sorting="true"
             responsive
             small
             @filtered="onFiltered"
             @row-clicked="toggleRowDetails"
             @sort-changed="sortChanged"
    >
      <!--Table Loading Spinner-->
      <template v-slot:table-busy>
        <div class="text-center text-success my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>{{ $t('app.wait') }}</strong>
        </div>
      </template>
      <!--Action Dropdown Button-->
      <template v-slot:cell(action)="row">
        <b-dropdown id="user-action-dropdown"
                    size="sm"
                    class="ml-3 mt-1"
                    right
                    variant="success"
                    boundary="window"
                    no-caret>
          <template v-slot:button-content>
            <span><i class="fas fa fa-user"></i></span>
          </template>
          <b-dropdown-item @click="populateSelectedUser(row.item);openModal( 'update')">
            <b-row class="text-muted">
              <b-col cols="3"><i class="fas fa fa-user-edit"></i></b-col>
              <b-col cols="9">{{ $t('settings.users.fields.edit') }}</b-col>
            </b-row>
          </b-dropdown-item>
          <b-dropdown-item @click="populateSelectedUser(row.item);openModal( 'delete')">
            <b-row class="text-muted">
              <b-col cols="3"><i class="fas fa fa-user-minus"></i></b-col>
              <b-col cols="9">{{ $t('settings.users.fields.delete') }}</b-col>
            </b-row>
          </b-dropdown-item>
          <b-dropdown-item v-if="row.item.authenticator === 'ldap'" @click="populateSelectedUser(row.item);openLdapModal('update')">
            <b-row class="text-muted">
              <b-col cols="3"><i class="fas fa fa-user-cog"></i></b-col>
              <b-col cols="9">{{ $t('settings.users.fields.ldapedit') }}</b-col>
            </b-row>
          </b-dropdown-item>
          <b-dropdown-item v-if="row.item.authenticator === 'ldap'" @click="populateSelectedUser(row.item);openLdapModal('delete')">
            <b-row class="text-muted">
              <b-col cols="3"><i class="fas fa fa-user-times"></i></b-col>
              <b-col cols="9">{{ $t('settings.users.fields.ldapdelete') }}</b-col>
            </b-row>
          </b-dropdown-item>
          <b-dropdown-item @click="toggleRowDetails(row.item)">
            <b-row class="text-muted">
              <b-col cols="3"><i class="fas fa fa-user-check"></i></b-col>
              <b-col cols="9">{{ $t('settings.users.fields.details') }}</b-col>
            </b-row>
          </b-dropdown-item>
        </b-dropdown>
      </template>

      <!-- User Details Card-->
      <template v-slot:row-details="row">
        <!--Database user info detail card-->
        <b-card>
          <b-card-title class="text-success">
            {{ $t('settings.users.titleDatabaseCard') }}
          </b-card-title>
          <hr>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.id') }}</b></b-col>
            <b-col>{{ row.item.id }}</b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.firstname') }}</b></b-col>
            <b-col>{{ row.item.firstname }}</b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.lastname') }}</b></b-col>
            <b-col>{{ row.item.lastname }}</b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.email') }}</b></b-col>
            <b-col>{{ row.item.email }}</b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.username') }}</b></b-col>
            <b-col>{{ row.item.username }}</b-col>
          </b-row>
          <b-row sclass="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.authenticator') }}</b></b-col>
            <b-col>{{ row.item.authenticator }}</b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.guid') }}</b></b-col>
            <b-col>{{ row.item.guid }}</b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.created') }}</b></b-col>
            <b-col>{{ formatDate(row.item.createdAt) }}</b-col>
          </b-row>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>{{ $t('settings.users.fields.updated') }}</b></b-col>
            <b-col>{{ formatDate(row.item.updatedAt) }}</b-col>
          </b-row>
        </b-card>
      </template>
    </b-table>

    <b-pagination
      v-model="currentPage"
      :total-rows="rows"
      :per-page="perPage"
      :limit="limits"
      :first-text="$t('app.pagination.first')"
      :prev-text="$t('app.pagination.prev')"
      :next-text="$t('app.pagination.next')"
      :last-text="$t('app.pagination.last')"
      :disabled="isBusy"
      class="mt-3"
      align="right"
      pills
      @input="getUsers(currentPage)"
    >
    </b-pagination>

    <!-- CRUD modal -->
    <crud-modal-component
      ref="crudUserModal"
      @crud="getUsers(currentPage)"
      v-bind:modal-id="'crud-modal'"
      v-bind:crud-user="selectedUser"
      v-bind:modal-type="modalType">
    </crud-modal-component>

    <!-- CRUD LDAP modal -->
    <crud-ldap-modal-component
      ref="crudUserLdapModal"
      @crud-ldap="getUsers(currentPage)"
      @crud-ldap-delete="deleteUser(selectedUser.id)"
      v-bind:modal-id="'crud-ldap-modal'"
      v-bind:modal-type="ldapModalType"
      v-bind:uid="selectedUser.username">
    </crud-ldap-modal-component>

    <!-- Invite modal-->
    <invite-modal-component v-bind:modal-id="'invite-modal'"></invite-modal-component>
  </div>
</template>

<script>
import Base from '../../api/base';
import moment from 'moment';
import CrudModalComponent from '../../components/Admin/users/CrudModalComponent';
import InviteModalComponent from '../../components/Admin/users/InviteModalComponent';
import CrudLdapModalComponent from '../../components/Admin/users/CrudLdapModalComponent';

export default {
  components: {
    CrudModalComponent,
    InviteModalComponent,
    CrudLdapModalComponent
  },
  data () {
    return {
      users: [],
      isBusy: true,
      sortBy: 'id',
      orderBy: 'asc',
      totalRows: null,
      filterInput: null,
      currentPage: 1,
      firstPage: 1,
      lastPage: null,
      nextPage: null,
      prevPage: null,
      perPage: null,
      limits: process.env.MIX_PAGINATION_INDEX_LIMIT,
      selectedUser: {
        id: null,
        password: null,
        firstname: null,
        lastname: null,
        username: null,
        email: null
      },
      modalType: null,
      ldapModalType: null
    };
  },
  mounted () {
    this.getUsers();
  },
  computed: {
    rows () {
      return this.totalRows;
    },
    fields () {
      return [
        { key: 'firstname', sortable: true, label: this.$t('settings.users.fields.firstname') },
        { key: 'lastname', sortable: true, label: this.$t('settings.users.fields.lastname') },
        { key: 'username', sortable: true, label: this.$t('settings.users.fields.username') },
        { key: 'email', sortable: true, label: this.$t('settings.users.fields.email') },
        {
          key: 'authenticator',
          sortable: true,
          label: this.$t('settings.users.fields.authenticator')
        },
        { key: 'action', label: this.$t('settings.users.fields.actions') }
      ];
    }
  },
  methods: {
    getUsers (pageVal = 1, searchInput) {
      this.isBusy = true;
      Base.call('users', {
        params: {
          page: pageVal,
          name: searchInput,
          orderBy: this.orderBy,
          sortBy: this.sortBy
        }
      }).then(response => {
        this.users = response.data.data;
        this.currentPage = response.data.meta.current_page;
        this.lastPage = response.data.meta.last_page;
        this.perPage = response.data.meta.per_page;
        this.totalRows = response.data.meta.total;
        this.nextPage = this.currentPage + 1;
        this.prevPage = this.currentPage - 1;
      }).finally(() => {
        this.isBusy = false;
        this.users.map(user => {
          user._showDetails = false;
        });
      });
    },
    deleteUser (id) {
      this.$refs.crudUserModal.deleteUser(id);
    },
    openModal (modalType) {
      this.modalType = modalType;
      this.$bvModal.show('crud-modal');
    },
    openLdapModal (ldapModalType) {
      this.ldapModalType = ldapModalType;
      this.$bvModal.show('crud-ldap-modal');
    },
    populateSelectedUser (user) {
      this.selectedUser.id = user.id;
      this.selectedUser.firstname = user.firstname;
      this.selectedUser.lastname = user.lastname;
      this.selectedUser.username = user.username;
      this.selectedUser.email = user.email;
      this.selectedUser.guid = user.guid;
      this.selectedUser.authenticator = user.authenticator;
    },
    resetSelectedUser () {
      this.selectedUser = null;
    },
    sortChanged (ctx) {
      this.sortBy = ctx.sortBy;
      this.orderBy = (ctx.sortDesc === false) ? 'asc' : 'desc';
      this.getUsers(this.currentPage);
    },
    formatDate (value) {
      return moment(value).format('DD-MM-YYYY HH:mm UTC');
    },
    onFiltered (filteredItems) { // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.users.count = filteredItems.length;
      this.currentPage = 1;
    },
    toggleRowDetails (user) {
      this.$set(user, '_showDetails', !user._showDetails);
      this.$root.$emit('bv::refresh::table', 'user-table');
    }
  }
};
</script>

<style scoped>
</style>
