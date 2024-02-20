<template>
  <div>
      <div class="grid">
        <div class="col">
          <h2>
            {{ $t('app.roles') }}
          </h2>
        </div>
        <div class="col flex justify-content-end align-items-center">
            <RouterLink
              v-if="userPermissions.can('create', 'RolePolicy')"
              class="float-right p-button p-button-success"
              v-tooltip="$t('settings.roles.new')"
              :aria-label="$t('settings.roles.new')"
              :to="{ name: 'settings.roles.view', params: { id: 'new' } }"
            >
              <i class="fa-solid fa-plus" />
            </RouterLink>
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
        <i v-if="!isBusy && !loadingError">{{ $t('settings.roles.nodata') }}</i>
      </template>

      <Column field="id" :header="$t('app.id')" sortable></Column>
      <Column field="name" :header="$t('app.model_name')" sortable>
        <template #body="slotProps">
<!--          ToDo check if text-truncate needed-->
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
                class="p-button p-button-info"
                v-tooltip="$t('settings.roles.view', { name: slotProps.data.id })"
                :aria-label="$t('settings.roles.view', { name: slotProps.data.id })"
                :disabled="isBusy"
                :to="{ name: 'settings.roles.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
              >
                <i class="fa-solid fa-eye" />
              </router-link>
              <router-link
                v-if="userPermissions.can('update', slotProps.data)"
                class="p-button p-button-secondary"
                v-tooltip="$t('settings.roles.edit', { name: slotProps.data.id })"
                :aria-label="$t('settings.roles.edit', { name: slotProps.data.id })"
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

onMounted(() =>{
  loadData();
});

/**
 * Loads the roles from the backend
 *
 */
function loadData (){
  isBusy.value = true;
  loadingError.value = false;
  const config = {
    params: {
      page: currentPage.value,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc'
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

function onPage(event) {
  currentPage.value = event.page + 1;
  loadData();
}

function onSort() {
  //ToDo check if solves problem
  currentPage.value = 1;
  loadData();
}

</script>
