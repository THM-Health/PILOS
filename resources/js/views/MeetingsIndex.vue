<template>
  <div class="container mb-8 mt-8">
    <Card>
      <template #title
        ><h1 class="m-0 text-3xl">
          {{ $t("meetings.currently_running") }}
        </h1></template
      >

      <template #content>
        <div class="flex justify-between">
          <div>
            <InputGroup data-test="meeting-search">
              <InputText
                v-model="search"
                :disabled="isBusy"
                :placeholder="$t('app.search')"
                @keyup.enter="loadData(1)"
              />
              <Button
                :disabled="isBusy"
                icon="fa-solid fa-magnifying-glass"
                @click="loadData(1)"
              />
            </InputGroup>
          </div>
          <div>
            <Button
              v-tooltip="$t('app.reload')"
              :aria-label="$t('app.reload')"
              severity="secondary"
              :disabled="isBusy"
              icon="fa-solid fa-sync"
              :loading="isBusy"
              data-test="meetings-reload-button"
              @click="loadData()"
            />
          </div>
        </div>

        <!-- table with room members -->
        <DataTable
          v-model:sort-field="sortField"
          v-model:sort-order="sortOrder"
          class="mt-6"
          :total-records="paginator.getTotalRecords()"
          :rows="paginator.getRows()"
          :first="paginator.getFirst()"
          :value="meetings"
          lazy
          data-key="id"
          paginator
          :paginator-template="paginator.getTemplate()"
          :current-page-report-template="
            paginator.getCurrentPageReportTemplate()
          "
          :loading="isBusy || loadingError"
          row-hover
          :pt="{
            bodyRow: {
              'data-test': 'meeting-item',
            },
            mask: {
              'data-test': 'overlay',
            },
            column: {
              bodyCell: {
                'data-test': 'meeting-item-cell',
              },
              headerCell: {
                'data-test': 'meeting-header-cell',
              },
            },
            pcPaginator: {
              page: {
                'data-test': 'paginator-page',
              },
              next: {
                'data-test': 'paginator-next-button',
              },
            },
          }"
          @update:first="paginator.setFirst($event)"
          @page="onPage"
          @sort="onSort"
        >
          <template #loading>
            <LoadingRetryButton :error="loadingError" @reload="loadData()" />
          </template>

          <!-- Show message on empty attendance list -->
          <template #empty>
            <div v-if="!isBusy && !loadingError">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
                $t("meetings.no_data")
              }}</InlineNote>
              <InlineNote v-else>{{
                $t("meetings.no_data_filtered")
              }}</InlineNote>
            </div>
          </template>

          <Column
            field="start"
            :header="$t('meetings.start')"
            :sortable="true"
            :style="{ width: '120px' }"
          >
            <template #body="slotProps">
              {{ $d(new Date(slotProps.data.start), "datetimeShort") }}
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
              <i
                v-tooltip="$t('meetings.participant_count')"
                class="fa-solid fa-users"
              />
            </template>
            <template #body="slotProps">
              <span v-if="slotProps.data.room.participant_count !== null">{{
                slotProps.data.room.participant_count
              }}</span>
              <raw-text v-else> --- </raw-text>
            </template>
          </Column>
          <Column
            field="room.listener_count"
            :sortable="true"
            :style="{ width: '64px' }"
          >
            <template #header>
              <i
                v-tooltip="$t('meetings.listener_count')"
                class="fa-solid fa-headphones"
              />
            </template>
            <template #body="slotProps">
              <span v-if="slotProps.data.room.listener_count !== null">{{
                slotProps.data.room.listener_count
              }}</span>
              <raw-text v-else> --- </raw-text>
            </template>
          </Column>

          <Column
            field="room.voice_participant_count"
            :sortable="true"
            :style="{ width: '64px' }"
          >
            <template #header>
              <i
                v-tooltip="$t('meetings.voice_participant_count')"
                class="fa-solid fa-microphone"
              />
            </template>
            <template #body="slotProps">
              <span
                v-if="slotProps.data.room.voice_participant_count !== null"
                >{{ slotProps.data.room.voice_participant_count }}</span
              >
              <raw-text v-else> --- </raw-text>
            </template>
          </Column>

          <Column
            field="room.video_count"
            :sortable="true"
            :style="{ width: '64px' }"
          >
            <template #header>
              <i
                v-tooltip="$t('meetings.video_count')"
                class="fa-solid fa-video"
              />
            </template>
            <template #body="slotProps">
              <span v-if="slotProps.data.room.video_count !== null">{{
                slotProps.data.room.video_count
              }}</span>
              <raw-text v-else> --- </raw-text>
            </template>
          </Column>

          <!-- actions -->
          <Column :style="{ width: '100px' }" :header="$t('app.actions')">
            <template #body="slotProps">
              <div class="flex justify-between">
                <router-link
                  :to="{
                    name: 'rooms.view',
                    params: { id: slotProps.data.room.id },
                  }"
                  :disabled="true"
                  data-test="meeting-view-room-button"
                >
                  <Button
                    v-tooltip="
                      $t('meetings.view_room', {
                        name: slotProps.data.room.name,
                      })
                    "
                    :aria-label="
                      $t('meetings.view_room', {
                        name: slotProps.data.room.name,
                      })
                    "
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
import RawText from "../components/RawText.vue";
import TextTruncate from "../components/TextTruncate.vue";
import { ref, onMounted } from "vue";
import { useApi } from "../composables/useApi.js";
import { usePaginator } from "../composables/usePaginator.js";

const api = useApi();
const paginator = usePaginator();

const isBusy = ref(false);
const loadingError = ref(false);
const meetings = ref([]);
const sortField = ref("start");
const sortOrder = ref(1);
const search = ref("");

/**
 * reload member list from api
 */
function loadData(page = null) {
  // enable data loading indicator
  isBusy.value = true;
  loadingError.value = false;
  // make request to load users

  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
    },
  };

  if (search.value) {
    config.params.search = search.value;
  }

  api
    .call("meetings", config)
    .then((response) => {
      // fetching successful
      meetings.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      paginator.revertFirst();
      api.error(error);
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage(event) {
  loadData(event.page + 1);
}

function onSort() {
  loadData(1);
}

onMounted(() => {
  loadData();
});
</script>
