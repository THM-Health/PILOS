<template>
  <Button
    v-tooltip="$t('rooms.recordings.edit_recording')"
    :disabled="disabled"
    severity="secondary"
    @click="showEditModal"
    icon="fa-solid fa-edit"
  />

  <!-- edit recording modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >
    <template #header>
      <div>
      <span class="p-dialog-title">
        {{ $t('rooms.recordings.modals.edit.title') }}
      </span>
        <br/>
        <small>{{ $d(new Date(props.start),'datetimeShort') }} <raw-text>-</raw-text> {{ $d(new Date(props.end),'datetimeShort') }}</small>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.save')" severity="success" :loading="isLoadingAction" :disabled="isLoadingAction" @click="save" />
        </div>
    </template>

    <!-- description -->
    <div class="flex flex-column gap-2">
      <label for="description">{{ $t('rooms.recordings.description') }}</label>
      <Textarea
        id="description"
        v-model="newDescription"
        :disabled="isLoadingAction"
        :invalid="formErrors.fieldInvalid('description')"
        :maxlength="settingsStore.getSetting('recording.description_limit')"
      />
      <p class="p-error" v-html="formErrors.fieldError('description')" />
      <small>
        {{ $t('rooms.settings.general.chars', {chars: charactersLeftDescription}) }}
      </small>
    </div>

    <!-- available formats -->
    <div class="flex flex-column gap-2 mt-4">
      <label>{{ $t('rooms.recordings.available_formats') }}</label>
      <div class="flex align-items-center" v-for="format in newFormats" :key="format.id">
        <InputSwitch
          :inputId="format.id"
          v-model="format.disabled"
          :true-value="false"
          :false-value="true"
        />
        <label :for="format.id" class="ml-2">{{ $t('rooms.recordings.format_types.'+format.format)}}</label>
      </div>
      <p class="p-error" v-html="formErrors.fieldError('formats', true)" />
    </div>

    <!-- access -->
    <div class="flex flex-column gap-2 mt-4">
      <label>{{ $t('rooms.recordings.access') }}</label>
      <div v-for="accessType in accessTypes" :key="accessType" class="flex align-items-center">
        <RadioButton v-model="newAccess" :inputId="'access-'+accessType" name="access" :value="accessType" />
        <label :for="'access-'+accessType" class="ml-2"><RoomRecodingAccessBadge :access="accessType"/></label>
      </div>
      <p class="p-error" v-html="formErrors.fieldError('access')" />
    </div>

  </Dialog>
</template>
<script setup>
import env from '../env';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { computed, ref } from 'vue';
import _ from 'lodash';
import { useSettingsStore } from '../stores/settings.js';

const props = defineProps({
  recordingId: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  formats: {
    type: Array,
    required: true
  },
  access: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['edited', 'notFound']);

const api = useApi();
const formErrors = useFormErrors();
const settingsStore = useSettingsStore();

const showModal = ref(false);
const newDescription = ref(null);
const newFormats = ref([]);
const newAccess = ref(null);
const isLoadingAction = ref(false);
const accessTypes = ref([0, 1, 2, 3]);

/**
 * Count the chars of the description
 * @returns {string} amount of chars in comparison to the limit
 */
const charactersLeftDescription = computed(() => {
  return newDescription.value.length + ' / ' + settingsStore.getSetting('recording.description_limit');
});

/**
 * show modal to edit recording
 */
function showEditModal () {
  newDescription.value = props.description;
  newFormats.value = _.cloneDeep(props.formats);
  newAccess.value = props.access;
  formErrors.clear();
  showModal.value = true;
}

/**
 * Save recording changes
 */
function save () {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  api.call('rooms/' + props.roomId + '/recordings/' + props.recordingId, {
    method: 'put',
    data: { description: newDescription.value, access: newAccess.value, formats: newFormats.value }
  }).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('edited');
  }).catch((error) => {
    // editing failed
    if (error.response) {
      // recording not found
      if (error.response.status === env.HTTP_NOT_FOUND) {
        showModal.value = false;
        emit('notFound');
        return;
      }
      // failed due to form validation errors
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
        return;
      }
    }
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}
</script>
