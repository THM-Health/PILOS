<template>
  <div>
    <div class="flex flex-column-reverse md:flex-row justify-content-between align-items-start gap-2">
      <div class="flex-grow-1 flex-shrink-1">
        <Message
          severity="info"
          v-if="requireAgreement && files.length >0"
          :closable="false"
          :pt="{
            root: { class: [ 'm-0' ] },
        wrapper: { class: [ 'align-items-start', 'gap-2']},
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
        <RoomTabFilesUpload
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @uploaded="loadData"
        />

      </div>
      <div class="flex justify-content-end w-full md:w-auto">
      <!-- Reload file list -->
      <Button
        class="flex-shrink-0"
        v-if="!hideReload"
        v-tooltip="$t('app.reload')"
        severity="secondary"
        :disabled="isBusy"
        @click="loadData"
        icon="fa-solid fa-sync"
      />
      </div>
    </div>

    <!-- Display files -->
    <DataTable
      class="mt-4"
      :totalRecords="files.length"
      :rows="settingsStore.getSetting('pagination_page_size')"
      :value="files"
      dataKey="id"
      paginator
      :loading="isBusy || loadingError"
      rowHover
      stripedRows
      scrollable
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData" />
      </template>

        <!-- Show message on empty file list -->
        <template #empty>
          <InlineNote v-if="!isBusy && !loadingError">{{ $t('rooms.files.nodata') }}</InlineNote>
        </template>

      <Column field="filename" sortable :header="$t('rooms.files.filename')" style="max-width: 250px">
        <template #body="slotProps">
          <TextTruncate>{{ slotProps.data.filename }}</TextTruncate>
        </template>
      </Column>

      <Column field="uploaded" sortable :header="$t('rooms.files.uploaded_at')" v-if="showManagementColumns">
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.uploaded), 'datetimeLong') }}
        </template>
      </Column>

      <!-- Checkbox if file should be downloadable by all room participants -->
      <Column field="download" sortable :header="$t('rooms.files.downloadable')" v-if="showManagementColumns">
        <template #body="slotProps">
          <InputSwitch
            v-model="slotProps.data.download"
            :disabled="isBusy"
            @update:modelValue="(downloadable) => changeSettings(slotProps.data,'download', downloadable)"
          />
        </template>
      </Column>

      <!--
        Checkbox if file should be send to the api on the next meeting start,
        setting can't be changed manually if the file is the default presentation
        -->
      <Column field="use_in_meeting" sortable :header="$t('rooms.files.use_in_next_meeting')" v-if="showManagementColumns">
        <template #body="slotProps">
          <InputSwitch
            v-model="slotProps.data.use_in_meeting"
            :disabled="isBusy"
            @update:modelValue="(useInMeeting) => changeSettings(slotProps.data,'use_in_meeting', useInMeeting)"
          />
        </template>
      </Column>

      <!-- Checkbox if the file should be default/first in the next api call to start a meeting -->
      <Column field="default" sortable :header="$t('rooms.files.default')" v-if="showManagementColumns">
        <template #body="slotProps">
          <RadioButton
            v-model="defaultFile"
            :value="slotProps.data.id"
            name="default_file"
            :disabled="slotProps.data.use_in_meeting !== true || isBusy"
            @update:modelValue="(selected) => changeSettings(slotProps.data,'default', selected)"
          />
        </template>
      </Column>

      <Column :header="$t('app.actions')" class="action-column action-column-2">
        <template #body="slotProps">
          <div>
            <RoomTabFilesViewButton
              :room-id="props.room.id"
              :file-id="slotProps.data.id"
              :token="props.token"
              :access-code="props.accessCode"
              :disabled="isBusy || (!downloadAgreement && requireAgreement)"
              @file-not-found="loadData"
              @invalid-code="emit('invalidCode')"
              @invalid-token="emit('invalidToken')"
            />
            <RoomTabFilesDeleteButton
              :room-id="props.room.id"
              :file-id="slotProps.data.id"
              :filename="slotProps.data.filename"
              v-if="userPermissions.can('manageSettings', props.room)"
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
import env from '../env.js';
import EventBus from '../services/EventBus';
import { EVENT_CURRENT_ROOM_CHANGED } from '../constants/events';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useSettingsStore } from '../stores/settings.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';

const props = defineProps({
  room: Object,

  accessCode: {
    type: Number,
    required: false
  },
  token: {
    type: String,
    required: false
  },
  showTitle: {
    type: Boolean,
    default: false,
    required: false
  },
  hideReload: {
    type: Boolean,
    default: false,
    required: false
  },
  requireAgreement: {
    type: Boolean,
    default: false,
    required: false
  }
});

const emit = defineEmits(['invalidCode', 'invalidToken']);

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();
const toast = useToast();

const files = ref([]);
const defaultFile = ref(null);
const isBusy = ref(false);
const loadingError = ref(false);
const downloadAgreement = ref(false);

/**
 * (Re)load file list
 */
function loadData () {
  // Change table to busy state
  isBusy.value = true;
  loadingError.value = false;
  // Fetch file list
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  api.call('rooms/' + props.room.id + '/files', config)
    .then(response => {
      // Fetch successful
      files.value = response.data.data.files;
      defaultFile.value = response.data.data.default;
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

/**
 * Change a setting for a file
 * @param file effected file
 * @param setting setting name
 * @param value new value
 */
function changeSettings (file, setting, value) {
  // Change table to busy state
  isBusy.value = true;

  if (setting === 'default') {
    value = true;
  }

  // Update value for the setting and the effected file
  api.call('rooms/' + props.room.id + '/files/' + file.id, {
    method: 'put',
    data: { [setting]: value }
  }).then(response => {
    // Fetch successful
    // Fetch successful
    files.value = response.data.data.files;
    defaultFile.value = response.data.data.default;
  }).catch((error) => {
    if (error.response.status === env.HTTP_NOT_FOUND) {
      // Show error message
      toast.error(this.$t('rooms.flash.file_gone'));
      // reload
      loadData();
      return;
    }
    api.error(error);
  }).finally(() => {
    isBusy.value = false;
  });
}

const showManagementColumns = computed(() => {
  return userPermissions.can('manageSettings', props.room);
});

/**
 * Sets the event listener for current room change to reload the file list.
 *
 * @method mounted
 * @return undefined
 */
onMounted(() => {
  EventBus.on(EVENT_CURRENT_ROOM_CHANGED, loadData);
  loadData();
});

/**
 * Removes the listener for current room change
 *
 * @method beforeDestroy
 * @return undefined
 */
onBeforeUnmount(() => {
  EventBus.off(EVENT_CURRENT_ROOM_CHANGED, loadData);
});

</script>
