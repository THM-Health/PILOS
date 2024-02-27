<template>
  <div>
    <div class="flex justify-content-between align-items-center">
      <h2>{{ $t('app.room_types') }}</h2>
      <router-link
        v-if="userPermissions.can('create', 'RoomTypePolicy')"
        v-tooltip.left="$t('settings.room_types.new')"
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
            v-model="filters['global'].value"
            :placeholder="$t('app.search')"
          />
<!--          ToDo??-->
<!--          <Button-->
<!--            v-tooltip="$t('app.search')"-->
<!--            :aria-label="$t('app.search')"-->
<!--            icon="fa-solid fa-magnifying-glass"-->
<!--            severity="primary"-->
<!--          >-->
<!--          </Button>-->
          <InputGroupAddon class="bg-green-500">
            <i class="fa-solid fa-magnifying-glass text-white"></i>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>

    <Divider/>

    <DataTable
      :value="roomTypes"
      sort-field="description"
      :sort-order="1"
      paginator
      row-hover
      :loading="isBusy"
      :rows="settingsStore.getSetting('pagination_page_size')"
      v-model:filters="filters"
      :globalFilterFields="['description']"
    >
      <template #empty>
        <InlineNote v-if="roomTypes.length === 0">{{ $t('settings.room_types.no_data') }}</InlineNote>
        <InlineNote v-else>{{ $t('settings.room_types.no_data_filtered') }}</InlineNote>
      </template>
      <Column field="description" key="description" :header="$t('app.description')" :sortable="true"></Column>
      <Column field="actions" :header="$t('app.actions')" class="action-column">
        <template #body="slotProps">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', slotProps.data)"
              class="p-button p-button-icon-only p-button-info"
              v-tooltip="$t('settings.room_types.view', { name: slotProps.data.description })"
              :disabled="isBusy"
              :to="{ name: 'settings.room_types.view', params: { id: slotProps.data.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </router-link>
            <router-link
              v-if="userPermissions.can('update', slotProps.data)"
              class="p-button p-button-icon-only p-button-secondary"
              v-tooltip="$t('settings.room_types.edit', { name: slotProps.data.description })"
              :disabled="isBusy"
              :to="{ name: 'settings.room_types.view', params: { id: slotProps.data.id } }"
            >
              <i class="fa-solid fa-edit" />
            </router-link>
            <SettingsRoomTypesDeleteButton
              v-if="userPermissions.can('delete', slotProps.data)"
              :id="slotProps.data.id"
              :description="slotProps.data.description"
              @deleted="fetchRoomTypes"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useApi } from '@/composables/useApi.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useSettingsStore } from '@/stores/settings';
import { FilterMatchMode } from 'primevue/api';

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();

const isBusy = ref(false);
const roomTypes = ref([]);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
  fetchRoomTypes();
});

/**
 * Loads the roles from the backend and calls on finish the callback function.
 */
function fetchRoomTypes () {
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
