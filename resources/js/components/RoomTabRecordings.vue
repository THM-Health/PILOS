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

    <!-- table with room members -->
    <DataTable
      class="mt-4"
      :totalRecords="meta.total"
      :rows="meta.per_page"
      :value="recordings"
      lazy
      dataKey="id"
      paginator
      :loading="isBusy"
      rowHover
      v-model:sortField="sortField"
      v-model:sortOrder="sortOrder"
      @page="onPage"
      @sort="onSort"
    >

      <!-- Show message on empty recording list -->
      <template #empty>
        <i>{{ $t('rooms.recordings.nodata') }}</i>
      </template>

      <Column field="start" :header="$t('rooms.recordings.start')">
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.start),'datetimeShort') }}
        </template>
      </Column>

      <Column field="end" :header="$t('rooms.recordings.end')">
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.end),'datetimeShort') }}
        </template>
      </Column>

      <Column field="description" :header="$t('rooms.recordings.description')" />

      <Column field="formats" :header="$t('rooms.recordings.formats')">
        <template #body="slotProps">
          <span class="p-buttonset">
            <!-- View file -->
            <RoomTabRecordingsViewButton
              v-for="format in slotProps.data.formats.filter(format => !format.disabled || userPermissions.can('manageSettings', room))" :key="format.id"
              :roomId="props.room.id"
              :id="format.id"
              :format="format.format"
              :format-disabled="format.disabled"
              :token="props.token"
              :access-code="props.accessCode"
              @invalidCode="$emit('invalidCode')"
              @invalidToken="$emit('invalidToken')"
              @forbidden="loadData"
              @notFound="loadData"
            />
          </span>
        </template>
      </Column>

      <Column v-if="userPermissions.can('manageSettings', room)" field="access" :header="$t('rooms.recordings.access')">
        <template #body="slotProps">
          <RoomRecodingAccessBadge :access="slotProps.data.access" />
        </template>
      </Column>

      <Column v-if="userPermissions.can('manageSettings', room)" :header="$t('rooms.recordings.actions')">
        <template #body="slotProps">
          <span class="p-buttonset">
            <!-- Edit button -->
            <RoomTabRecordingsEditButton
              :roomId="props.room.id"
              :recordingId="slotProps.data.id"
              :description="slotProps.data.description"
              :start="slotProps.data.start"
              :end="slotProps.data.end"
              :formats="slotProps.data.formats"
              :access="slotProps.data.access"
              :disabled="isBusy"
              @edited="loadData()"
            />

            <!-- Delete file -->
            <RoomTabRecordingsDeleteButton
              :roomId="props.room.id"
              :recordingId="slotProps.data.id"
              :filename="slotProps.data.description"
              @deleted="loadData()"
            />
          </span>
        </template>
      </Column>

    </DataTable>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';

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

const isBusy = ref(false);
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
      api.error(error, this.$root);
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage (event) {
  currentPage.value = event.page + 1;
  loadData();
}

function onSort () {
  loadData();
}

onMounted(() => {
  loadData();
});

</script>
