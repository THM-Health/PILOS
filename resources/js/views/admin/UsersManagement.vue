<template>
  <div>
    <b-row>
      <b-col>
        <h2 class="">{{$t('admin.users.title')}}</h2>
      </b-col>
      <!--Search Bar-->
      <b-col lg="6" class="my-1">
        <b-form-group
          :label="$t('admin.searchbar.filter')"
          label-cols-sm="3"
          label-align-sm="right"
          label-size="sm"
          label-for="filterInput"
          class="mb-0"
        >
          <b-input-group size="sm">
            <b-form-input
              v-model="filter"
              type="search"
              id="filterInput"
              :placeholder="$t('admin.searchbar.placeholder')"
            ></b-form-input>
            <b-input-group-append>
              <b-button :disabled="!filter" @click="filter = ''">
                <i class="fas fa fa-trash"></i>
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>
    <hr>

    <b-table id="user-table" hover
             :fields="fields"
             :sort-by.sync="sortBy"
             :sort-desc.sync="sortDesc"
             :busy.sync="isBusy"
             :items="users"
             :per-page="perPage"
             :current-page="currentPage"
             :filter="filter"
             @filtered="onFiltered"
             responsive
             small>
      <!-- A virtual composite column -->
      <template v-slot:cell(firstname)="data">
        <div class="text-wrap">
          <p class="m-0">{{ data.item.firstname }} {{data.item.lastname}}</p>
          <p class="text-secondary m-0  ">{{$t('admin.users.table.created')}} {{formatDate(data.item.createdAt)}}</p>
        </div>
      </template>
      <template v-slot:cell(action)>
        <div class="ml-3">
          <b-dropdown id="dropdown-right" right variant="success" class="m-2">
            <template v-slot:button-content>
              <span><i class="fas fa fa-user"></i></span>
            </template>
            <!--TODO Add :to navigation -->
            <b-dropdown-item>
              <span class="mr-3">
              <i class="fas fa fa-user-edit"></i>
              </span>{{$t('admin.users.table.edit')}}
            </b-dropdown-item>
            <b-dropdown-item>
              <span class="mr-3">
              <i class="fas fa fa-user-minus"></i>
              </span>{{$t('admin.users.table.delete')}}
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
      aria-controls="user-table"
      :first-text="$t('admin.pagination.first')"
      :prev-text="$t('admin.pagination.prev')"
      :next-text="$t('admin.pagination.next')"
      :last-text="$t('admin.pagination.last')"
      align="right"
      pills
    >
    </b-pagination>
  </div>
</template>

<script>
import Base from '../../api/base'
import moment from 'moment'

export default {
  data () {
    return {
      users: [],
      isBusy: false,
      perPage: 10,
      currentPage: 1,
      sortDesc: false,
      totalRows: null,
      filter: null
    }
  },
  mounted () {
    this.getUsers()
  },
  computed: {
    rows () {
      return this.users.length
    },
    fields () {
      return [
        { key: 'firstname', sortable: true, label: this.$t('admin.users.table.name') },
        { key: 'username', sortable: true, label: this.$t('admin.users.table.username') },
        {
          key: 'guid',
          sortable: true,
          label: 'Authenticator',
          formatter: value => {
            return value === null ? 'pilos' : 'ldap'
          }
        },
        { key: 'action', label: this.$t('admin.users.table.actions') }
      ]
    }
  },
  methods: {
    getUsers () {
      this.isBusy = true
      Base.call('users').then(response => {
        this.users = response.data.data
        this.totalRows = response.data.length
        this.isBusy = false
        return this.users
      })
    },
    formatDate (value) {
      return moment(value).format('l HH:mm')
    },
    onFiltered (filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length
      this.currentPage = 1
    }
  }
}
</script>

<style scoped>
</style>
