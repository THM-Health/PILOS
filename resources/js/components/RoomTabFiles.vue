<template>
  <div>
    <Message
      severity="info"
      v-if="requireAgreement && files.length >0"
      :closable="false"
      :pt="{
        wrapper: { class: 'align-items-start gap-2'},
        icon: { class: [ 'mt-1' ] }
      }"
    >
      <strong>{{ $t('rooms.files.terms_of_use.title') }}</strong><br>
      {{ $t('rooms.files.terms_of_use.content') }}
      <Divider/>
      <div class="flex align-items-center">
        <Checkbox v-model="downloadAgreement" inputId="terms_of_use" :binary="true" />
        <label for="terms_of_use" class="ml-2">{{ $t('rooms.files.terms_of_use.accept') }}</label>
      </div>
    </Message>

    <div class="flex justify-content-between flex-column-reverse lg:flex-row gap-2 px-2">
      <div class="flex justify-content-between flex-column lg:flex-row flex-grow-1 gap-2">
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
        <div class="flex gap-2 flex-column lg:flex-row">
          <InputGroup v-if="userPermissions.can('manageSettings', props.room)">
            <InputGroupAddon>
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Dropdown v-model="filter" :options="filterOptions" @change="loadData(1)" option-label="name" option-value="value" />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Dropdown v-model="sortField" :options="sortFields" @change="loadData(1)" option-label="name" option-value="value" />
            <InputGroupAddon class="p-0">
              <Button :icon="sortOrder === 1 ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short'" @click="toggleSortOrder" severity="secondary" text class="border-noround-left"  />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div class="flex gap-2 justify-content-end">
        <RoomTabFilesUploadButton
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @uploaded="loadData()"
        />

        <!-- Reload file list -->
        <Button
          class="flex-shrink-0"
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData()"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <!-- Display files -->
    <OverlayComponent :show="isBusy" style="min-height: 4rem;">
      <DataView
        :totalRecords="meta.total"
        :rows="meta.per_page"
        :first="meta.from"
        :value="files"
        lazy
        dataKey="id"
        paginator
        rowHover
        @page="onPage"
        class="mt-4"
      >

        <!-- Show message on empty recording list -->
        <template #empty>
          <div class="px-2">
            <InlineNote v-if="!isBusy && !loadingError && meta.total_no_filter === 0">{{ $t('rooms.files.nodata') }}</InlineNote>
            <InlineNote v-if="!isBusy && !loadingError && meta.total_no_filter !== 0">{{ $t('app.filter_no_results') }}</InlineNote>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2 border-top-1 border-bottom-1 surface-border">
            <div v-for="(item, index) in slotProps.items" :key="index">
              <div class="flex flex-column md:flex-row justify-content-between gap-3 py-3" :class="{ 'border-top-1 surface-border': index !== 0 }">
                <div class="flex flex-column gap-2">
                  <p class="text-lg font-semibold m-0 text-word-break">{{ item.filename }}</p>
                  <div class="flex flex-column gap-2 align-items-start">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-clock" />
                      <p class="text-sm m-0">
                        {{ $d(new Date(item.uploaded), 'datetimeLong') }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-column gap-2 align-items-start" v-if="userPermissions.can('manageSettings', props.room)">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-download" />
                      <p class="text-sm m-0">
                        <Tag v-if="item.download" severity="success">{{ $t('rooms.files.download_visible') }}</Tag>
                        <Tag v-else severity="danger">{{ $t('rooms.files.download_hidden') }}</Tag>
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-column gap-2 align-items-start" v-if="userPermissions.can('manageSettings', props.room)">
                    <div class="flex flex-row gap-2">
                      <i v-if="item.use_in_meeting" class="fa-solid fa-circle-check"></i>
                      <i v-else class="fa-solid fa-circle-xmark"></i>
                      <p class="text-sm m-0 flex flex-row gap-2">
                        <Tag v-if="item.use_in_meeting" severity="success">{{ $t('rooms.files.use_in_next_meeting') }}</Tag>
                        <Tag v-else severity="danger">{{ $t('rooms.files.use_in_next_meeting_disabled') }}</Tag>
                        <Tag v-if="defaultFile?.id === item.id" class="flex flex-row gap-2 align-items-start">
                          <i class="fa-solid fa-star"></i> {{ $t('rooms.files.default') }}
                        </Tag>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex-shrink-0 flex flex-row gap-1 align-items-start justify-content-end" >
                  <RoomTabFilesViewButton
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :token="props.token"
                    :access-code="props.accessCode"
                    :disabled="isBusy || (!downloadAgreement && requireAgreement)"
                    @file-not-found="loadData()"
                    @invalid-code="emit('invalidCode')"
                    @invalid-token="emit('invalidToken')"
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

const meta = ref({
  current_page: 1,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0,
  total_no_filter: 0
});

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
      page: page || meta.value.current_page,
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
      console.log(response);
      // Fetch successful
      files.value = response.data.data;
      defaultFile.value = response.data.default;
      meta.value = response.data.meta;
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
