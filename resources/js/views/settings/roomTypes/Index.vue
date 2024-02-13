<template>
  <div>
    <div class="flex justify-content-between align-items-start">
      <h2>{{ $t('app.room_types') }}</h2>
      <router-link
        v-if="userPermissions.can('create', 'RoomTypePolicy')"
        v-tooltip.left="$t('settings.room_types.new')"
        class="p-button p-button-success"
        :to="{ name: 'settings.room_types.view', params: { id: 'new' } }"
      >
        <i class="fa-solid fa-plus" />
      </router-link>
    </div>

    <Divider/>

    <DataTable
      :value="roomTypes"
      sort-field="description"
      :sort-order="1"
      paginator
      :loading="isBusy"
      :rows="settingsStore.getSetting('pagination_page_size')"
    >
      <Column field="description" key="description" :header="$t('app.description')" :sortable="true"></Column>
      <Column field="actions" :header="$t('app.actions')" class="action-column">
        <template #body="{data}">
          <div class="flex flex-row gap-2">
            <router-link
              v-if="userPermissions.can('view', data)"
              class="p-button p-button-info"
              v-tooltip="$t('settings.room_types.view', { name: data.description })"
              :disabled="isBusy"
              :to="{ name: 'settings.room_types.view', params: { id: data.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </router-link>
            <router-link
              v-if="userPermissions.can('update', data)"
              class="p-button p-button-secondary"
              v-tooltip="$t('settings.room_types.edit', { name: data.description })"
              :disabled="isBusy"
              :to="{ name: 'settings.room_types.view', params: { id: data.id } }"
            >
              <i class="fa-solid fa-edit" />
            </router-link>
            <SettingsRoomTypesDeleteButton
              v-if="userPermissions.can('delete', data)"
              :id="data.id"
              :description="data.description"
              @deleted="fetchRoomTypes"
            />
          </div>
        </template>
      </Column>
      <template #empty>
        <i>{{ $t('settings.room_types.no_data') }}</i>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useApi } from '@/composables/useApi.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useSettingsStore } from '@/stores/settings';

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();

const isBusy = ref(false);
const roomTypes = ref([]);

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
