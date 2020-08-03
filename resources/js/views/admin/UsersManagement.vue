<template>
  <div>
    <b-row>
      <b-col>
        <b-row>
          <h2 class="ml-3 text-success">{{$t('settings.users.title')}}</h2>
          <b-avatar
            class="text-white ml-2"
            variant="success"
            icon="person-plus"
            v-b-tooltip.hover.top="$t('settings.users.tooltip.create')"
            v-b-modal.create-modal
            button>
          </b-avatar>
          <!--TODO Invite Participant Function-->
          <b-avatar
            class="text-white ml-2"
            variant="success"
            icon="envelope"
            v-b-tooltip.hover.top="$t('settings.users.tooltip.invite')"
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
              <b-button class="btn-success">
                <i class="text-white fas fa fa-search"></i>
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>

    <hr>

    <b-table id="user-table"
             hover
             :fields="fields"
             :sort-desc.sync="sortDesc"
             :busy.sync="isBusy"
             :items="users"
             :filter="filterInput"
             @filtered="onFiltered"
             responsive
             small
    >
      <!--Action Dropdown Button-->
      <template v-slot:cell(action)="row">
        <b-dropdown size="sm" id="dropdown-right" class="ml-3 mb-1" right variant="success" no-caret>
          <template v-slot:button-content>
            <span><i class="fas fa fa-user"></i></span>
          </template>
          <b-dropdown-item v-b-modal.edit-modal @click="populateSelectedUser(row.item)">
            <b-row class="text-muted">
              <b-col cols="3"><i class="fas fa fa-user-edit"></i></b-col>
              <b-col cols="9">{{$t('settings.users.fields.edit')}}</b-col>
            </b-row>
          </b-dropdown-item>
          <b-dropdown-item v-b-modal.delete-modal @click="populateSelectedUser(row.item)">
            <b-row class="text-muted">
              <b-col cols="3"><i class="fas fa fa-user-minus"></i></b-col>
              <b-col cols="9">{{$t('settings.users.fields.delete')}}</b-col>
            </b-row>
          </b-dropdown-item>
        </b-dropdown>
      </template>
    </b-table>

    <b-pagination
      class="mt-3"
      v-model="currentPage"
      :total-rows="rows"
      :per-page="perPage"
      :limit="limits"
      :first-text="$t('app.pagination.first')"
      :prev-text="$t('app.pagination.prev')"
      :next-text="$t('app.pagination.next')"
      :last-text="$t('app.pagination.last')"
      align="right"
      pills
      @input="getUsers(currentPage)"
    >
    </b-pagination>

    <!-- Edit form modal-->
    <edit-modal-component v-bind:edited-user="selectedUser" v-bind:modal-id="'edit-modal'"></edit-modal-component>

    <!-- Create form modal-->
    <create-modal-component v-bind:created-user="selectedUser" v-bind:modal-id="'create-modal'"></create-modal-component>

    <!-- Delete modal-->
    <delete-modal-component v-bind:deleted-user="selectedUser" v-bind:modal-id="'delete-modal'"></delete-modal-component>
  </div>
</template>

<script>
import Base from '../../api/base';
import moment from 'moment';
import EditModalComponent from '../../components/Admin/users/EditModalComponent';
import CreateModalComponent from '../../components/Admin/users/CreateModalComponent';
import DeleteModalComponent from '../../components/Admin/users/DeleteModalComponent';

export default {
  components: { EditModalComponent, CreateModalComponent, DeleteModalComponent },
  data () {
    return {
      users: [],
      isBusy: true,
      sortDesc: false,
      totalRows: null,
      filterInput: null,
      currentPage: 1,
      firstPage: 1,
      lastPage: null,
      nextPage: null,
      prevPage: null,
      perPage: null,
      limits: process.env.MIX_PAGINATION_LIMIT,
      selectedUser: {
        id: null,
        password: null,
        firstname: null,
        lastname: null,
        username: null,
        email: null
      }
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
        {
          key: 'guid',
          sortable: true,
          label: this.$t('settings.users.fields.authenticator'),
          formatter: value => {
            return value === null ? 'pilos' : 'ldap';
          }
        },
        {
          key: 'createdAt',
          sortable: true,
          label: this.$t('settings.users.fields.created'),
          formatter: value =>
            this.formatDate(value)
        },
        {
          key: 'updatedAt',
          sortable: true,
          label: this.$t('settings.users.fields.updated'),
          formatter: value =>
            this.formatDate(value)
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
          name: searchInput
        }
      }).then(response => {
        this.users = response.data.data;
        this.currentPage = response.data.meta.current_page;
        this.lastPage = response.data.meta.last_page;
        this.perPage = response.data.meta.per_page;
        this.totalRows = response.data.meta.total;
        this.nextPage = this.currentPage + 1;
        this.prevPage = this.currentPage - 1;
      }).finally(this.isBusy = false);
    },
    populateSelectedUser (user) {
      this.selectedUser.id = user.id;
      this.selectedUser.firstname = user.firstname;
      this.selectedUser.lastname = user.lastname;
      this.selectedUser.username = user.username;
      this.selectedUser.email = user.email;
    },
    resetSelectedUser () {
      this.selectedUser.id = null;
      this.selectedUser.firstname = null;
      this.selectedUser.lastname = null;
      this.selectedUser.username = null;
      this.selectedUser.email = null;
      this.selectedUser.password = null;
    },
    formatDate (value) {
      return moment(value).format('DD-MM-YYYY HH:mm UTC');
    },
    onFiltered (filteredItems) { // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.users.count = filteredItems.length;
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
</style>
