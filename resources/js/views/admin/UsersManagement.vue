<template>
  <div>
    <h2>{{$t('admin.users.title')}}</h2>
    <hr>

    <b-table id="user-table" hover
             :fields="fields"
             :sort-desc.sync="sortDesc"
             :busy.sync="isBusy"
             :items="users"
             :per-page="perPage"
             :current-page="currentPage"
             responsive>
    </b-table>

    <b-pagination
      v-model="currentPage"
      :total-rows="rows"
      :per-page="perPage"
      aria-controls="user-table"
      :first-text="$t('admin.pagination.first')"
      :prev-text="$t('admin.pagination.prev')"
      :next-text="$t('admin.pagination.next')"
      :last-text="$t('admin.pagination.last')"
    >
    </b-pagination>
  </div>
</template>

<script>
import Base from '../../api/base'

export default {
  data () {
    return {
      users: [],
      isBusy: false,
      perPage: 10,
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
        { key: 'id', sortable: true },
        { key: 'firstname', sortable: true, label: this.$t('admin.users.table.firstname') },
        { key: 'lastname', sortable: true, label: this.$t('admin.users.table.lastname') },
        { key: 'guid', sortable: true, label: 'GUID' },
        { key: 'createdAt', sortable: true, label: this.$t('admin.users.table.createdAt') },
        { key: 'updatedAt', sortable: true, label: this.$t('admin.users.table.updatedAt') },
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
