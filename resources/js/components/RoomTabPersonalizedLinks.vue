<template>
  <div>
    <div class="flex flex-wrap gap-2 justify-content-end flex-column-reverse md:flex-row">
      <!-- add -->
      <RoomTabPersonalizedLinksAddButton
        :room-id="props.room.id"
        :disabled="isBusy"
        @added="loadData"
      />
      <!-- reload -->
      <Button
        v-tooltip="$t('app.reload')"
        severity="secondary"
        :disabled="isBusy"
        @click="loadData"
        icon="fa-solid fa-sync"
      />
    </div>
    <!-- table  -->
    <DataTable
      class="mt-4"
      :totalRecords="tokens.length"
      :rows="settingsStore.getSetting('pagination_page_size')"
      :value="tokens"
      dataKey="id"
      paginator
      :loading="isBusy || loadingError"
      rowHover
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData" />
      </template>

      <template #empty v-if="!isBusy && !loadingError">
        <i>{{ $t('rooms.tokens.nodata') }}</i>
      </template>

      <Column field="firstname" sortable :header="$t('app.firstname')"></Column>
      <Column field="lastname" sortable :header="$t('app.lastname')"></Column>

      <Column field="expires" sortable :header="$t('rooms.tokens.expires')">
        <template #body="slotProps">
          <raw-text v-if="slotProps.data.expires == null">
            -
          </raw-text>
          <span v-else>{{ $d(new Date(slotProps.data.expires),'datetimeShort') }}</span>
        </template>
      </Column>

      <Column field="last_usage" sortable :header="$t('rooms.tokens.last_usage')">
        <template #body="slotProps">
          <raw-text v-if="slotProps.data.last_usage == null">
            -
          </raw-text>
          <span v-else>{{ $d(new Date(slotProps.data.last_usage),'datetimeShort') }}</span>
        </template>
      </Column>

      <Column field="role" sortable :header="$t('rooms.role')">
        <template #body="slotProps">
          <RoomRoleBadge :role="slotProps.data.role" />
        </template>
      </Column>

      <Column :header="$t('app.actions')" class="action-column">
        <template #body="slotProps">
          <div class="flex gap-2">
            <!-- copy -->
            <RoomTabPersonalizedLinksCopyButton
              :room-id="props.room.id"
              :token="slotProps.data.token"
              :firstname="slotProps.data.firstname"
              :lastname="slotProps.data.lastname"
              :disabled="isBusy"
            />
            <!-- edit -->
            <RoomTabPersonalizedLinksEditButton
              v-if="userPermissions.can('manageSettings', props.room)"
              :room-id="props.room.id"
              :firstname="slotProps.data.firstname"
              :lastname="slotProps.data.lastname"
              :role="slotProps.data.role"
              :token="slotProps.data.token"
              :disabled="isBusy"
              @edited="loadData"
            />
            <!-- delete -->
            <RoomTabPersonalizedLinksDeleteButton
              v-if="userPermissions.can('manageSettings', props.room)"
              :room-id="props.room.id"
              :firstname="slotProps.data.firstname"
              :lastname="slotProps.data.lastname"
              :token="slotProps.data.token"
              :disabled="isBusy"
              @deleted="loadData"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../stores/settings';
import { onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';

const props = defineProps({
  room: Object
});

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();

const tokens = ref([]);
const isBusy = ref(false);
const loadingError = ref(false);

/**
 * (Re)loads list of tokens from api
 */
function loadData () {
  isBusy.value = true;
  loadingError.value = false;

  api.call('rooms/' + props.room.id + '/tokens')
    .then(response => {
      tokens.value = response.data.data;
    })
    .catch((error) => {
      api.error(error);
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

onMounted(() => {
  loadData();
});

</script>
