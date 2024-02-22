<template>
  <div>
    <div class="grid">
      <div class="col">
        <h2>
          {{ $t('app.server_pools') }}
        </h2>
      </div>
      <div class="col flex justify-content-end align-items-center">
        <Can
          method="create"
          policy="ServerPoolPolicy"
        >
          <router-link
            ref="newServerPool"
            v-tooltip.left="$t('settings.server_pools.new')"
            :aria-label="$t('settings.server_pools.new')"
            :to="{ name: 'settings.server_pools.view', params: { id: 'new' } }"
            class="p-button p-button-success"
          >
            <i class="fa-solid fa-plus"/>
          </router-link>
        </can>
      </div>
      <div class="col-12 md:col-3 flex align-items-center">
        <InputGroup>
          <!--ToDo debounce???-->
          <InputText
            v-model="filter"
            :placeholder="$t('app.search')"
            @change="loadData"
          />
          <Button
            v-tooltip="$t('app.search')"
            :aria-label="$t('app.search')"
            severity="primary"
            @click="loadData"
          >
            <i class="fa-solid fa-magnifying-glass"/>
          </Button>
        </InputGroup>
      </div>
    </div>
    <Divider/>

    <DataTable
      v-model:sortField="sortField"
      v-model:sortOrder="sortOrder"
      :loading="isBusy || loadingError"
      :rows="meta.per_page"
      :totalRecords="meta.total"
      :value="serverPools"
      dataKey="id"
      lazy
      paginator
      rowHover
      @page="onPage"
      @sort="onSort"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData"/>
      </template>
      <!-- Show message on empty user list -->
      <template #empty>
        <i v-if="!isBusy && !loadingError">{{ $t('settings.server_pools.no_data') }}</i>
      </template>
      <!--ToDo check if needed-->
      <!--<template #emptyfiltered>-->
      <!--<i>{{ $t('settings.server_pools.no_data_filtered') }}</i>-->
      <!--</template>-->
      <Column :header="$t('app.id')" field="id" sortable></Column>
      <Column :header="$t('app.model_name')" field="name" sortable></Column>
      <Column :header="$t('settings.server_pools.server_count')" field="servers_count" sortable></Column>
      <Column :header="$t('app.actions')" class="action-column">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              v-tooltip="$t('settings.server_pools.view', { name: slotProps.data.name })"
              :aria-la="$t('settings.server_pools.view', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.server_pools.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
              class="p-button p-button-info"
            >
              <i class="fa-solid fa-eye"/>
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              v-tooltip="$t('settings.server_pools.edit', { name: slotProps.data.name })"
              :aria-label="$t('settings.server_pools.edit', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.server_pools.view', params: { id: slotProps.data.id } }"
              class="p-button p-button-secondary"
            >
              <i class="fa-solid fa-edit"/>
            </router-link>
            <SettingsServerPoolsDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData"
            >
            </SettingsServerPoolsDeleteButton>
          </div>
        </template>
      </Column>

    </DataTable>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { onMounted, ref } from 'vue';

const api = useApi();
const userPermissions = useUserPermissions();

const isBusy = ref(false);
const loadingError = ref(false);
const serverPools = ref([]);
const currentPage = ref(1);
const sortField = ref('id');
const sortOrder = ref(1);
const meta = ref({
  current_page: 0,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});
const filter = ref(undefined);

onMounted(() => {
  loadData();
});

/**
 * Loads the server pools from the backend
 *
 */
function loadData () {
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: currentPage.value,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      name: filter.value
    }
  };

  api.call('serverPools', config).then(response => {
    serverPools.value = response.data.data;
    meta.value = response.data.meta;
  }).catch(error => {
    api.error(error);
    loadingError.value = true;
  }).finally(() => {
    isBusy.value = false;
  });
}

function onPage (event) {
  currentPage.value = event.page + 1;
  loadData();
}

function onSort () {
  // ToDo check if solves problem
  currentPage.value = 1;
  loadData();
}
</script>
