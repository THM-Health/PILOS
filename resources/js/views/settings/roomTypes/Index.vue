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
      row-hover
      :loading="isBusy"
      :rows="settingsStore.getSetting('pagination_page_size')"
    >
      <template #empty>
        <InlineNote>{{ $t('settings.room_types.no_data') }}</InlineNote>
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
