<template>
  <div>
    <h2 class="">{{$t('admin.users.title')}}</h2>
    <hr>

    <b-table id="user-table" hover
             :fields="fields"
             :sort-desc.sync="sortDesc"
             :busy.sync="isBusy"
             :items="users"
             :per-page="perPage"
             :current-page="currentPage"
             responsive>
      <!-- A virtual composite column -->
      <template v-slot:cell(name)="data">
        <div class="text-wrap">{{ data.item.firstname }} {{data.item.lastname}}</div>
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
      align="center"
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
      perPage: 5,
      currentPage: 1,
      sortDesc: false,
      totalRows: null
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
        { key: 'name', sortable: true, label: this.$t('admin.users.table.name') },
        { key: 'username', sortable: true, label: this.$t('admin.users.table.username') },
        {
          key: 'guid',
          sortable: true,
          label: 'Authenticator',
          formatter: value => {
            return value === null ? 'pilos' : 'ldap'
          }
        },
        {
          key: 'createdAt',
          sortable: true,
          label: this.$t('admin.users.table.created'),
          formatter: value => {
            return moment(value).format('l HH:mm')
          }
        },
        {
          key: 'updatedAt',
          sortable: true,
          label: this.$t('admin.users.table.updated'),
          formatter: value => {
            return moment(value).format('l HH:mm')
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
    }
  }
}
</script>

<style scoped>
</style>
