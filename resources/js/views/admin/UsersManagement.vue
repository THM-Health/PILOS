<template>
  <div>
    <b-row>
      <b-col>
        <h2 class="">{{$t('settings.users.title')}}</h2>
      </b-col>
      <!--Search Bar-->
      <b-col lg="6" class="my-1">
        <b-form-group
          :label="$t('settings.searchbar.filter')"
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
              :placeholder="$t('settings.searchbar.placeholder')"
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
             :filter="filter"
             @filtered="onFiltered"
             responsive
             small>
      <!--Loading state overlay on table-->
      <template v-slot:table-busy>
        <div class="text-center text-success my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>{{$t('settings.users.table.loading')}}</strong>
        </div>
      </template>
      <template v-slot:cell(action)>
        <div class="ml-3">
          <b-dropdown size="sm" id="dropdown-right" right variant="success" class="m-2">
            <template v-slot:button-content>
              <span><i class="fas fa fa-user"></i></span>
            </template>
            <!--TODO Add :to navigation -->
            <b-dropdown-item>
              <span class="mr-3">
              <i class="fas fa fa-user-edit"></i>
              </span>{{$t('settings.users.table.edit')}}
            </b-dropdown-item>
            <b-dropdown-item>
              <span class="mr-3">
              <i class="fas fa fa-user-minus"></i>
              </span>{{$t('settings.users.table.delete')}}
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </template>
    </b-table>

    <b-pagination
      class="mt-3"
      v-model="currentPage"
      :total-rows="rows"
      :per-page="perPage"
      :limit="limits"
      :first-text="$t('settings.pagination.first')"
      :prev-text="$t('settings.pagination.prev')"
      :next-text="$t('settings.pagination.next')"
      :last-text="$t('settings.pagination.last')"
      align="right"
      pills
      @input="getUsers(currentPage)"
    >
    </b-pagination>

  </div>
</template>

<script>
import Base from '../../api/base';
import moment from 'moment';

export default {
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
      limits: process.env.MIX_PAGINATION_LIMIT
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
        { key: 'firstname', sortable: true, label: this.$t('settings.users.table.firstname') },
        { key: 'lastname', sortable: true, label: this.$t('settings.users.table.lastname') },
        { key: 'username', sortable: true, label: this.$t('settings.users.table.username') },
        {
          key: 'guid',
          sortable: true,
          label: 'Authenticator',
          formatter: value => {
            return value === null ? 'pilos' : 'ldap';
          }
        },
        {
          key: 'created_at',
          sortable: true,
          label: this.$t('settings.users.table.created'),
          formatter: value =>
            this.formatDate(value)
        },
        {
          key: 'updated_at',
          sortable: true,
          label: this.$t('settings.users.table.updated'),
          formatter: value =>
            this.formatDate(value)
        },
        { key: 'action', label: this.$t('settings.users.table.actions') }
      ];
    }
  },
  methods: {
    getUsers (pageVal = 1, searchInput) {
      this.isBusy = true;
      Base.call('users', {
        params: {
          page: pageVal,
          firstname: searchInput,
          lastname: searchInput,
          username: searchInput
        }
      }).then(response => {
        this.users = response.data.data;
        this.currentPage = response.data.current_page;
        this.lastPage = response.data.last_page;
        this.perPage = response.data.per_page;
        this.totalRows = response.data.total;
        this.nextPage = this.currentPage + 1;
        this.prevPage = this.currentPage - 1;
      }).finally(this.isBusy = false);
    },
    formatDate (value) {
      return moment(value).format('l HH:mm');
    },
    onFiltered (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.users.count = filteredItems.length;
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
</style>
