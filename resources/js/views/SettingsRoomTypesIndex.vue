<template>
  <div>
    <div class="flex justify-content-between align-items-center">
      <h2>{{ $t('app.room_types') }}</h2>
      <router-link
        v-if="userPermissions.can('create', 'RoomTypePolicy')"
        v-tooltip="$t('settings.room_types.new')"
        class="p-button p-button-success p-button-icon-only"
        :to="{ name: 'settings.room_types.view', params: { id: 'new' } }"
      >
        <i class="fa-solid fa-plus" />
      </router-link>
    </div>

    <div class="flex flex-column md:flex-row">
      <div>
        <InputGroup>
          <InputText
            v-model="nameSearch"
            :placeholder="$t('app.search')"
            @keyup.enter="filters['name'].value = nameSearch"
          />
          <Button
            v-tooltip="$t('app.search')"
            :aria-label="$t('app.search')"
            icon="fa-solid fa-magnifying-glass"
            severity="primary"
            @click="filters['name'].value = nameSearch"
          />
        </InputGroup>
      </div>
    </div>

    <Divider/>

    <DataTable
      :value="roomTypes"
      sort-field="name"
      :sort-order="1"
      paginator
      :paginator-template="paginator.getTemplate()"
      :current-page-report-template="paginator.getCurrentPageReportTemplate()"
      stripedRows
      row-hover
      :loading="isBusy"
      :rows="settingsStore.getSetting('pagination_page_size')"
      v-model:filters="filters"
      class="table-auto lg:table-fixed"
    >
      <template #empty>
        <InlineNote v-if="roomTypes.length === 0">{{ $t('settings.room_types.no_data') }}</InlineNote>
        <InlineNote v-else>{{ $t('settings.room_types.no_data_filtered') }}</InlineNote>
      </template>
      <Column field="name" key="name" :header="$t('app.model_name')" :sortable="true">
        <template #body="slotProps">
          <TextTruncate>{{slotProps.data.name}}</TextTruncate>
        </template>
      </Column>
      <Column field="actions" :header="$t('app.actions')" class="action-column" :class="actionColumn.classes" v-if="actionColumn.visible">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              class="p-button p-button-icon-only p-button-info"
              v-tooltip="$t('settings.room_types.view', { name: slotProps.data.name })"
              :aria-label="$t('settings.room_types.view', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.room_types.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              class="p-button p-button-icon-only p-button-secondary"
              v-tooltip="$t('settings.room_types.edit', { name: slotProps.data.name })"
              :aria-label="$t('settings.room_types.edit', { name: slotProps.data.name })"
              :disabled="isBusy"
              :to="{ name: 'settings.room_types.view', params: { id: slotProps.data.id } }"
            >
              <i class="fa-solid fa-edit" />
            </router-link>
            <SettingsRoomTypesDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :name="slotProps.data.name"
              @deleted="loadData()"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useSettingsStore } from '../stores/settings';
import { FilterMatchMode } from 'primevue/api';
import { useActionColumn } from '../composables/useActionColumn.js';
import { usePaginator } from '../composables/usePaginator.js';

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const actionColumn = useActionColumn([{ permissions: ['roomTypes.view'] }, { permissions: ['roomTypes.update'] }, { permissions: ['roomTypes.delete'] }]);

const isBusy = ref(false);
const roomTypes = ref([]);
const nameSearch = ref('');
const filters = ref({
  name: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
  loadData();
});

/**
 * Loads the roles from the backend and calls on finish the callback function.
 */
function loadData () {
  isBusy.value = true;
  api.call('roomTypes').then(response => {
    roomTypes.value = response.data.data;
  }).catch(error => {
    api.error(error);
  }).finally(() => {
    isBusy.value = false;
  });
}
</script>
