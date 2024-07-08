<template>
  <div>
    <Message
      severity="info"
      v-if="requireAgreement && files.length >0"
      :closable="false"
      class="mx-2"
      :pt="{
        wrapper: { class: 'items-start gap-2'},
        icon: { class: [ 'mt-1' ] }
      }"
    >
      <strong>{{ $t('rooms.files.terms_of_use.title') }}</strong><br>
      {{ $t('rooms.files.terms_of_use.content') }}
      <Divider/>
      <div class="flex items-center">
        <Checkbox v-model="downloadAgreement" inputId="terms_of_use" :binary="true" />
        <label for="terms_of_use" class="ml-2">{{ $t('rooms.files.terms_of_use.accept') }}</label>
      </div>
    </Message>

    <div class="flex justify-between flex-col-reverse lg:flex-row gap-2 px-2">
      <div class="flex justify-between flex-col lg:flex-row grow gap-2">
        <div>
          <InputGroup>
            <InputText
              v-model="search"
              :disabled="isBusy"
              :placeholder="$t('app.search')"
              @keyup.enter="loadData(1)"
            />
            <Button
              :disabled="isBusy"
              @click="loadData(1)"
              v-tooltip="$t('app.search')"
              :aria-label="$t('app.search')"
              icon="fa-solid fa-magnifying-glass"
            />
          </InputGroup>
        </div>
        <div class="flex gap-2 flex-col lg:flex-row">
          <InputGroup v-if="userPermissions.can('manageSettings', props.room)">
            <InputGroupAddon>
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Select :disabled="isBusy" v-model="filter" :options="filterOptions" @change="loadData(1)" option-label="name" option-value="value" />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select :disabled="isBusy" v-model="sortField" :options="sortFields" @change="loadData(1)" option-label="name" option-value="value" />
            <InputGroupAddon class="p-0">
              <Button :disabled="isBusy" :icon="sortOrder === 1 ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short'" @click="toggleSortOrder" severity="secondary" text class="rounded-l-none"  />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div class="flex gap-2 justify-end">
        <RoomTabFilesUploadButton
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @uploaded="loadData()"
        />

        <!-- Reload file list -->
        <Button
          class="shrink-0"
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData()"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <!-- Display files -->
    <OverlayComponent :show="isBusy || loadingError" z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>
      <DataView
        :totalRecords="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        :value="files"
        lazy
        dataKey="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
        rowHover
        @page="onPage"
        class="mt-6"
      >
        <!-- Show message on empty list -->
        <template #empty>
          <div>
            <div class="px-2" v-if="!isBusy && !loadingError">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{ $t('rooms.files.nodata') }}</InlineNote>
              <InlineNote v-else>{{ $t('app.filter_no_results') }}</InlineNote>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2 border-t border-b border-surface">
            <div v-for="(item, index) in slotProps.items" :key="index">
              <div class="flex flex-col md:flex-row justify-between gap-4 py-4" :class="{ 'border-top-1 surface-border': index !== 0 }">
                <div class="flex flex-col gap-2">
                  <p class="text-lg font-semibold m-0 text-word-break">{{ item.filename }}</p>
                  <div class="flex flex-col gap-2 items-start">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-clock" />
                      <p class="text-sm m-0">
                        {{ $d(new Date(item.uploaded), 'datetimeLong') }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 items-start" v-if="userPermissions.can('manageSettings', props.room)">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-download" />
                      <p class="text-sm m-0">
                        <Tag v-if="item.download" severity="success">{{ $t('rooms.files.download_visible') }}</Tag>
                        <Tag v-else severity="danger">{{ $t('rooms.files.download_hidden') }}</Tag>
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 items-start" v-if="userPermissions.can('manageSettings', props.room)">
                    <div class="flex flex-row gap-2">
                      <i v-if="item.use_in_meeting" class="fa-solid fa-circle-check"></i>
                      <i v-else class="fa-solid fa-circle-xmark"></i>
                      <p class="text-sm m-0 flex flex-row gap-2">
                        <Tag v-if="item.use_in_meeting" severity="success">{{ $t('rooms.files.use_in_next_meeting') }}</Tag>
                        <Tag v-else severity="danger">{{ $t('rooms.files.use_in_next_meeting_disabled') }}</Tag>
                        <Tag v-if="defaultFile?.id === item.id" class="flex flex-row gap-2 items-start">
                          <i class="fa-solid fa-star"></i> {{ $t('rooms.files.default') }}
                        </Tag>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="shrink-0 flex flex-row gap-1 items-start justify-end" >
                  <RoomTabFilesViewButton
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :token="props.token"
                    :access-code="props.accessCode"
                    :disabled="isBusy || (!downloadAgreement && requireAgreement)"
                    @file-not-found="loadData()"
                    @invalid-code="emit('invalidCode')"
                    @invalid-token="emit('invalidToken')"
                    @forbidden="loadData()"
                  />
                  <RoomTabFilesEditButton
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :filename="item.filename"
                    :use-in-meeting="item.use_in_meeting"
                    :download="item.download"
                    :default="defaultFile?.id === item.id"
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :disabled="isBusy"
                    @edited="loadData()"
                  />
                  <RoomTabFilesDeleteButton
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :filename="item.filename"
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :disabled="isBusy"
                    @deleted="loadData()"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </OverlayComponent>
  </div>
</template>
<script setup>
import env from '../env.js';
import EventBus from '../services/EventBus';
import { EVENT_CURRENT_ROOM_CHANGED } from '../constants/events';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useApi } from '../composables/useApi.js';
import { usePaginator } from '../composables/usePaginator.js';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  room: Object,

  accessCode: {
    type: Number,
    required: false
  },
  token: {
    type: String,
    required: false
  }
});

const emit = defineEmits(['invalidCode', 'invalidToken']);

const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const { t } = useI18n();

const files = ref([]);
const defaultFile = ref(null);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref('uploaded');
const sortOrder = ref(0);

const search = ref('');
const filter = ref('all');

const sortFields = computed(() => [
  { name: t('rooms.files.sort.filename'), value: 'filename' },
  { name: t('rooms.files.sort.uploaded_at'), value: 'uploaded' }
]);

const filterOptions = computed(() => [
  { name: t('rooms.files.filter.all'), value: 'all' },
  { name: t('rooms.files.filter.downloadable'), value: 'downloadable' },
  { name: t('rooms.files.filter.use_in_meeting'), value: 'use_in_meeting' }
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

const downloadAgreement = ref(false);

const requireAgreement = computed(() => {
  return !userPermissions.can('manageSettings', props.room);
});

/**
 * (Re)load file list
 */
function loadData (page = null) {
  // Change table to busy state
  isBusy.value = true;
  loadingError.value = false;

  // Fetch file list
  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      search: search.value === '' ? null : search.value,
      filter: filter.value === 'all' ? null : filter.value
    }
  };

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  api.call('rooms/' + props.room.id + '/files', config)
    .then(response => {
      // Fetch successful
      files.value = response.data.data;
      defaultFile.value = response.data.default;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    }).catch((error) => {
      if (error.response) {
        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return emit('invalidCode');
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return emit('invalidToken');
        }

        // Forbidden, require access code
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          return emit('invalidCode');
        }
      }
      api.error(error);
      loadingError.value = true;
    }).finally(() => {
      isBusy.value = false;
    });
}

function onPage (event) {
  loadData(event.page + 1);
}

/**
 * Sets the event listener for current room change to reload the file list.
 *
 * @method mounted
 * @return undefined
 */
onMounted(() => {
  EventBus.on(EVENT_CURRENT_ROOM_CHANGED, onRoomChanged);
  loadData();
});

function onRoomChanged () {
  loadData();
}

/**
 * Removes the listener for current room change
 *
 * @method beforeDestroy
 * @return undefined
 */
onBeforeUnmount(() => {
  EventBus.off(EVENT_CURRENT_ROOM_CHANGED, onRoomChanged);
});

</script>
