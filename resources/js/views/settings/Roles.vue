<template>
  <div>
      <h3>
        {{ $t('settings.roles.title') }}
        <can method='create' policy='RolePolicy'>
          <b-button
            class='float-right'
            v-b-tooltip.hover
            variant='success'
            :title="$t('settings.roles.new')"
          ><b-icon-plus></b-icon-plus></b-button>
        </can>
      </h3>
    <hr>

    <b-table
      hover
      stacked='md'
      show-empty
      :fields='tableFields'
      :items='fetchRoles'
      id='roles-table'
      :current-page='currentPage'>

      <template v-slot:empty>
        <i>{{ $t('settings.roles.nodata') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template v-slot:cell(name)="data">
        {{ $te(`app.roles.${data.item.name}`) ? $t(`app.roles.${data.item.name}`) : data.item.name }}
      </template>

      <template v-slot:cell(default)="data">
        {{ $t(`app.${data.item.default}`) }}
      </template>

      <template v-slot:cell(actions)="data">
        <can method='view' :policy='data.item'>
          <b-button
            :disabled='isBusy'
            variant='primary'
          >
            <!--          @click="showEditUserModal(data.item,data.index)"-->
            <i class='fas fa-eye'></i>
          </b-button>
        </can>
        <can method='update' :policy='data.item'>
          <b-button
            :disabled='isBusy'
            variant='dark'
          >
            <!--          @click="showEditUserModal(data.item,data.index)"-->
            <i class='fas fa-edit'></i>
          </b-button>
        </can>
        <can method='delete' :policy='data.item'>
          <b-button
            :disabled='isBusy'
            variant='danger'
          >
            <!--          @click="showEditUserModal(data.item,data.index)"-->
            <i class='fas fa-trash'></i>
          </b-button>
        </can>
      </template>
    </b-table>

    <b-pagination
      v-model='currentPage'
      :total-rows='total'
      :per-page='perPage'
      aria-controls='roles-table'
      @input="$root.$emit('bv::refresh::table', 'roles-table')"
      align='center'
    ></b-pagination>
  </div>
</template>

<script>
import Base from '../../api/base';
import Vue from 'vue';
import Can from '../../components/Permissions/Can';

export default {
  components: { Can },
  data () {
    return {
      isBusy: false,
      currentPage: undefined,
      total: undefined,
      perPage: undefined
    }
  },
  computed: {
    tableFields () {
      return [
        { key: 'id', label: this.$t('settings.roles.id'), sortable: true },
        { key: 'name', label: this.$t('settings.roles.name'), sortable: true },
        { key: 'default', label: this.$t('settings.roles.default'), sortable: true },
        { key: 'actions', label: this.$t('settings.roles.actions') }
      ];
    }
  },
  methods: {
    fetchRoles (ctx, callback) {
      let data = [];

      let config = {
        params: {
          sort_by: ctx.sortBy,
          sort_direction: ctx.sortDesc ? 'desc' : 'asc',
          page: ctx.currentPage
        }
      };

      Base.call('roles', config).then(response => {
        this.perPage = response.data.meta.per_page;
        this.currentPage = response.data.meta.current_page;
        this.total = response.data.meta.total;

        data = response.data.data;
      }).catch(error => {
        Vue.config.errorHandler(error, this.$root, error.message);
      }).finally(() => {
        callback(data);
      });

      return null;
    }
  }
}
</script>

<style scoped>

</style>
