<template>
  <div class="container mt-5 mb-5">
    <Card>
      <template #title><h1 class="m-0 text-3xl">{{ $t('meetings.currently_running') }}</h1></template>

      <template #content>

        <div class="flex justify-content-between">
          <div>
            <InputGroup>
              <InputText
                v-model="search"
                :disabled="isBusy"
                :placeholder="$t('app.search')"
                @keyup.enter="loadData()"
              />
                <Button
                  :disabled="isBusy "
                  variant="primary"
                  @click="loadData()"
                  icon="fa-solid fa-magnifying-glass"
                />
            </InputGroup>
          </div>
          <div>
            <Button
              v-tooltip="$t('app.reload')"
              :aria-label="$t('app.reload')"
              severity="secondary"
              :disabled="isBusy"
              @click="loadData()"
              icon="fa-solid fa-sync"
              :loading="isBusy"
            />
          </div>
        </div>

        <!-- table with room members -->
        <DataTable
          class="mt-4"
          :totalRecords="meta.total"
          :rows="meta.per_page"
          :value="meetings"
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

          <!-- Show message on empty attendance list -->
          <template #empty>
            <div v-if="!isBusy && !loadingError">
              <InlineNote v-if="meta.total_no_filter === 0">{{ $t('meetings.no_data') }}</InlineNote>
              <InlineNote v-else>{{ $t('meetings.no_data_filtered') }}</InlineNote>
            </div>
          </template>

          <Column
            field="start"
            :header="$t('meetings.start')"
            :sortable="true"
            :style="{ width: '120px' }"
          >
            <template #body="slotProps">
              {{ $d(new Date(slotProps.data.start),'datetimeShort') }}
            </template>
          </Column>
          <Column
            field="room.name"
            :header="$t('rooms.name')"
            :sortable="false"
          >
            <template #body="slotProps">
              <text-truncate>
                {{ slotProps.data.room.name }}
              </text-truncate>
            </template>
          </Column>
          <Column
            field="room.owner"
            :header="$t('meetings.owner')"
            :sortable="false"
          >
            <template #body="slotProps">
              <text-truncate>
                {{ slotProps.data.room.owner }}
              </text-truncate>
            </template>
          </Column>
          <Column
            field="server.name"
            :header="$t('app.server')"
            :sortable="false"
          >
            <template #body="slotProps">
              <text-truncate>
                {{ slotProps.data.server.name }}
              </text-truncate>
            </template>
          </Column>
          <Column
            field="room.participant_count"
            :sortable="true"
            :style="{ width: '64px' }"
          >
            <template #header>
              <i v-tooltip="$t('meetings.voice_participant_count')" class="fa-solid fa-microphone" />
            </template>
            <template #body="slotProps">
              <span v-if="slotProps.data.room.participant_count !== null">{{ slotProps.data.room.participant_count }}</span>
              <raw-text v-else>
                ---
              </raw-text>
            </template>
          </Column>
          <Column
            field="room.listener_count"
            :sortable="true"
            :style="{ width: '64px' }"
          >
            <template #header>
              <i v-tooltip="$t('meetings.listener_count')" class="fa-solid fa-headphones" />
            </template>
            <template #body="slotProps">
              <span v-if="slotProps.data.room.listener_count !== null">{{ slotProps.data.room.listener_count }}</span>
              <raw-text v-else>
                ---
              </raw-text>
            </template>
          </Column>

          <Column
            field="room.voice_participant_count"
            :sortable="true"
            :style="{ width: '64px' }"
          >
            <template #header>
              <i v-tooltip="$t('meetings.voice_participant_count')" class="fa-solid fa-microphone" />
            </template>
            <template #body="slotProps">
              <span v-if="slotProps.data.room.voice_participant_count !== null">{{ slotProps.data.room.voice_participant_count }}</span>
              <raw-text v-else>
                ---
              </raw-text>
            </template>
          </Column>

          <Column
            field="room.video_count"
            :sortable="true"
            :style="{ width: '64px' }"
          >
            <template #header>
              <i v-tooltip="$t('meetings.video_count')" class="fa-solid fa-video" />
            </template>
            <template #body="slotProps">
              <span v-if="slotProps.data.room.video_count !== null">{{ slotProps.data.room.video_count }}</span>
              <raw-text v-else>
                ---
              </raw-text>
            </template>
          </Column>

          <!-- actions -->
          <Column
            :style="{ width: '100px' }"
            :header="$t('app.actions')"
          >
            <template #body="slotProps">
              <div class="flex justify-content-between">
                <router-link
                  :to="{ name: 'rooms.view', params: { id: slotProps.data.room.id } }"
                  :disabled="true"
                >
                  <Button
                    v-tooltip="$t('meetings.view_room', { name: slotProps.data.room.name })"
                    :aria-label="$t('meetings.view_room', { name: slotProps.data.room.name })"

                    icon="fa-solid fa-eye"
                  />
                </router-link>
              </div>
            </template>
          </Column>

        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import RawText from '@/components/RawText.vue';
import TextTruncate from '@/components/TextTruncate.vue';
import { ref, onMounted } from 'vue';
import { useApi } from '../../composables/useApi.js';

const api = useApi();

const isBusy = ref(false);
const loadingError = ref(false);
const meetings = ref([]);
const currentPage = ref(1);
const sortField = ref('lastname');
const sortOrder = ref(1);
const search = ref('');
const meta = ref({
  current_page: 0,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});

/**
 * reload member list from api
 */
function loadData () {
  // enable data loading indicator
  isBusy.value = true;
  loadingError.value = false;
  // make request to load users

  const config = {
    params: {
      page: currentPage.value,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc'
    }
  };

  if (search.value) {
    config.params.search = search.value;
  }

  api.call('meetings', config)
    .then(response => {
      // fetching successful
      meetings.value = response.data.data;
      meta.value = response.data.meta;
    })
    .catch((error) => {
      api.error(error);
      loadingError.value = true;
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
