<template>
  <div>
    <div class="flex justify-content-between align-items-center">
      <h2>
        {{ $t('app.server_pools') }}
      </h2>
      <router-link
        v-if="userPermissions.can('create', 'ServerPolicy')"
        v-tooltip="$t('settings.server_pools.new')"
        :aria-label="$t('settings.server_pools.new')"
        :to="{ name: 'settings.server_pools.view', params: { id: 'new' } }"
        class="p-button p-button-success p-button-icon-only"
      >
        <i class="fa-solid fa-plus"/>
      </router-link>
    </div>

    <div class="flex flex-column md:flex-row">
      <div>
        <InputGroup>
          <InputText
            v-model="filter"
            :placeholder="$t('app.search')"
            @keyup.enter="loadData"
          />
          <Button
            v-tooltip="$t('app.search')"
            :aria-label="$t('app.search')"
            severity="primary"
            @click="loadData"
            icon="fa-solid fa-magnifying-glass"
          />
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
      stripedRows
      @page="onPage"
      @sort="onSort"
      class="table-auto lg:table-fixed"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData"/>
      </template>
      <!-- Show message on empty server pool list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="meta.total_no_filter === 0">{{ $t('settings.server_pools.no_data') }}</InlineNote>
          <InlineNote v-else>{{ $t('settings.server_pools.no_data_filtered') }}</InlineNote>
        </div>
      </template>
      <Column :header="$t('app.model_name')" field="name" sortable>
        <template #body="slotProps">
          <TextTruncate>{{slotProps.data.name}}</TextTruncate>
        </template>
      </Column>
      <Column :header="$t('settings.server_pools.server_count')" field="servers_count" sortable></Column>
      <Column :header="$t('app.actions')"  :class="actionColumn.classes" v-if="actionColumn.visible">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              v-tooltip="$t('settings.server_pools.view', { name: slotProps.data.name })"
              :aria-label="$t('settings.server_pools.view', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.server_pools.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
              class="p-button p-button-info p-button-icon-only"
            >
              <i class="fa-solid fa-eye"/>
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              v-tooltip="$t('settings.server_pools.edit', { name: slotProps.data.name })"
              :aria-label="$t('settings.server_pools.edit', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.server_pools.view', params: { id: slotProps.data.id } }"
              class="p-button p-button-secondary p-button-icon-only"
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
import { useActionColumn } from '@/composables/useActionColumn.js';
import { onMounted, ref } from 'vue';

const api = useApi();
const userPermissions = useUserPermissions();
const actionColumn = useActionColumn([{ permissions: ['serverPools.view'] }, { permissions: ['serverPools.update'] }, { permissions: ['serverPools.delete'] }]);

const isBusy = ref(false);
const loadingError = ref(false);
const serverPools = ref([]);
const currentPage = ref(1);
const sortField = ref('name');
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
  currentPage.value = 1;
  loadData();
}
</script>
