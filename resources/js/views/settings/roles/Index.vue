<template>
  <div>
    <div class="flex justify-content-between align-items-center">
      <h2>
        {{ $t('app.roles') }}
      </h2>
      <router-link
        v-if="userPermissions.can('create', 'RolePolicy')"
        class="p-button p-button-success p-button-icon-only"
        v-tooltip.left="$t('settings.roles.new')"
        :aria-label="$t('settings.roles.new')"
        :to="{ name: 'settings.roles.view', params: { id: 'new' } }"
      >
        <i class="fa-solid fa-plus" />
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
          >
          </Button>
        </InputGroup>
      </div>
    </div>
    <Divider/>

    <DataTable
      :totalRecords="meta.total"
      :rows="meta.per_page"
      :value="roles"
      lazy
      dataKey="id"
      paginator
      :loading="isBusy || loadingError"
      rowHover
      v-model:sortField="sortField"
      v-model:sortOrder="sortOrder"
      @page="onPage"
      @sort="onSort"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData" />
      </template>
      <!-- Show message on empty role list -->
      <template #empty>
        <div v-if="!isBusy && !loadingError">
          <InlineNote v-if="meta.total_no_filter === 0">{{ $t('settings.roles.no_data') }}</InlineNote>
          <InlineNote v-else>{{ $t('settings.roles.no_data_filtered') }}</InlineNote>
        </div>
      </template>

      <Column field="name" :header="$t('app.model_name')" sortable>
        <template #body="slotProps">
          <text-truncate>
            {{ $te(`app.role_labels.${slotProps.data.name}`) ? $t(`app.role_labels.${slotProps.data.name}`) : slotProps.data.name }}
          </text-truncate>
        </template>
      </Column>
      <Column field="default" :header="$t('settings.roles.default')" sortable>
        <template #body="slotProps">
          {{ $t(`app.${slotProps.data.default ? 'yes' : 'no'}`) }}
        </template>
      </Column>
      <Column :header="$t('app.actions')" class="action-column">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              class="p-button p-button-info p-button-icon-only"
              v-tooltip="$t('settings.roles.view', { name: slotProps.data.name })"
              :aria-label="$t('settings.roles.view', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.roles.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              class="p-button p-button-secondary p-button-icon-only"
              v-tooltip="$t('settings.roles.edit', { name: slotProps.data.name })"
              :aria-label="$t('settings.roles.edit', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.roles.view', params: { id: slotProps.data.id } }"
            >
              <i class="fa-solid fa-edit" />
            </router-link>
            <SettingsRolesDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi.js';
import { onMounted, ref } from 'vue';
import { useUserPermissions } from '@/composables/useUserPermission.js';

const api = useApi();
const userPermissions = useUserPermissions();

const isBusy = ref(false);
const loadingError = ref(false);
const roles = ref([]);
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
 * Loads the roles from the backend
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

  api.call('roles', config).then(response => {
    roles.value = response.data.data;
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
