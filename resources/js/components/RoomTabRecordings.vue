<template>
  <div>
    <div class="flex flex-wrap gap-2 justify-content-end flex-column-reverse md:flex-row">
      <!-- Reload list -->
      <div class="flex justify-content-end">
        <Button
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <!-- table with room recordings -->
    <DataView
      :totalRecords="meta.total"
      :rows="meta.per_page"
      :value="recordings"
      lazy
      dataKey="id"
      paginator
      :loading="isBusy"
      rowHover
      @page="onPage"
      class="mt-4 table-auto lg:table-fixed"
    >

      <!-- Show message on empty recording list -->
      <template #empty>
        <div>
          <InlineNote v-if="!isBusy && !loadingError">{{ $t('rooms.recordings.nodata') }}</InlineNote>
        </div>
      </template>

      <template #list="slotProps">
        <div class="grid grid-nogutter border-top-1 border-bottom-1 surface-border">
          <div v-for="(item, index) in slotProps.items" :key="index" class="col-12">
            <div class="flex flex-column md:flex-row justify-content-between gap-3 py-3" :class="{ 'border-top-1 surface-border': index !== 0 }">
              <div class="flex flex-column gap-2">
                <p class="text-lg font-semibold m-0">{{ item.description }}</p>
                <div class="flex flex-column gap-2 align-items-start">
                  <div class="flex flex-row gap-2">
                    <i class="fa-solid fa-clock" />
                    <p class="text-sm m-0">{{ $d(new Date(item.start),'datetimeShort') }}</p>
                  </div>
                  <div class="flex flex-row gap-2" v-if="showManagementColumns">
                    <i class="fa-solid fa-lock"></i>
                    <RoomRecodingAccessBadge :access="item.access" />
                  </div>
                </div>
                <div class="flex flex-row flex-wrap gap-1" v-if="showManagementColumns">
                  <Tag
                    v-for="format in item.formats"
                    :key="format.id"
                    :value="$t('rooms.recordings.format_types.'+format.format)"
                    :icon="format.disabled ? 'fa-solid fa-eye-slash' : ''"
                  />
                </div>
              </div>
              <div class="flex-shrink-0 flex flex-row gap-1 align-items-start justify-content-end" >

                <RoomTabRecordingsViewButton
                  :roomId="props.room.id"
                  :recordingId="item.id"
                  :formats="item.formats"
                  :view-disabled="userPermissions.can('manageSettings', room)"
                  :token="props.token"
                  :start="item.start"
                  :end="item.end"
                  :description="item.description"
                  :access-code="props.accessCode"
                  :disabled="isBusy"
                  @invalidCode="$emit('invalidCode')"
                  @invalidToken="$emit('invalidToken')"
                  @forbidden="loadData"
                  @notFound="loadData"
                />

                <RoomTabRecordingsDownloadButton
                  :recordingId="item.id"
                  :disabled="isBusy"
                  v-if="showManagementColumns"
                />

                <!-- Edit button -->
                <RoomTabRecordingsEditButton
                  v-if="showManagementColumns"
                  :roomId="props.room.id"
                  :recordingId="item.id"
                  :description="item.description"
                  :start="item.start"
                  :end="item.end"
                  :formats="item.formats"
                  :access="item.access"
                  :disabled="isBusy"
                  @edited="loadData()"
                />

                <!-- Delete file -->
                <RoomTabRecordingsDeleteButton
                  v-if="showManagementColumns"
                  :roomId="props.room.id"
                  :recordingId="item.id"
                  :disabled="isBusy"
                  @deleted="loadData()"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataView>
    <div id="retentionPeriodInfo">
      <Divider/>
      <b>{{ $t('rooms.recordings.retention_period.title') }}</b><br>
      <span v-if="settingsStore.getSetting('recording.retention_period') !== -1">{{ $t('rooms.recordings.retention_period.days', {'days': settingsStore.getSetting('recording.retention_period')}) }}</span><br>
      <span v-if="settingsStore.getSetting('recording.retention_period') === -1">{{ $t('rooms.recordings.retention_period.unlimited') }}</span><br>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import RoomTabRecordingsDownloadButton from './RoomTabRecordingsDownloadButton.vue';
import { useSettingsStore } from '../stores/settings.js';

const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  accessCode: {
    type: Number,
    required: false
  },
  token: {
    type: String,
    required: false
  }
});

const api = useApi();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();

const isBusy = ref(false);
const loadingError = ref(false);

const recordings = ref([]);
const currentPage = ref(1);
const sortField = ref('lastname');
const sortOrder = ref(1);

const meta = ref({
  current_page: 0,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});

/**
 * reload recordings list from api
 */
function loadData () {
  // enable data loading indicator
  isBusy.value = true;
  loadingError.value = false;

  // make request to load recordings
  const config = {
    params: {
      page: currentPage.value,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc'
    }
  };

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  api.call('rooms/' + props.room.id + '/recordings', config)
    .then(response => {
      // fetching successful
      recordings.value = response.data.data;
      meta.value = response.data.meta;
    })
    .catch((error) => {
      loadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}

const showManagementColumns = computed(() => {
  return userPermissions.can('manageSettings', props.room);
});

function onPage (event) {
  currentPage.value = event.page + 1;
  loadData();
}

onMounted(() => {
  loadData();
});

</script>
