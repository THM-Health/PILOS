<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.edit')"
    :disabled="disabled"
    severity="info"
    @click="showEditModal"
    icon="fa-solid fa-edit"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.files.edit')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.save')" severity="success" :loading="isLoadingAction" :disabled="isLoadingAction" @click="save" />
      </div>
    </template>

    <div class="field grid grid-cols-12 gap-4">
      <label for="download" class="col-span-12 mb-2 md:col-span-6 md:mb-0">{{ $t('rooms.files.downloadable') }}</label>
      <div class="col-span-12 md:col-span-6">
        <ToggleSwitch
          id="download"
          v-model="newDownload"
          required
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('download')"
        />
        <FormError :errors="formErrors.fieldError('download')" />
      </div>
    </div>

    <div class="field grid grid-cols-12 gap-4">
      <label for="use_in_meeting" class="col-span-12 mb-2 md:col-span-6 md:mb-0">{{ $t('rooms.files.use_in_next_meeting') }}</label>
      <div class="col-span-12 md:col-span-6">
        <ToggleSwitch
          id="use_in_meeting"
          v-model="newUseInMeeting"
          required
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('use_in_meeting')"
        />
        <FormError :errors="formErrors.fieldError('use_in_meeting')" />
      </div>
    </div>

    <div class="field grid grid-cols-12 gap-4">
      <label for="default" class="col-span-12 mb-2 md:col-span-6 md:mb-0">{{ $t('rooms.files.default') }}</label>
      <div class="col-span-12 md:col-span-6">
        <ToggleSwitch
          id="default"
          v-model="newDefault"
          required
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('default')"
        />
        <FormError :errors="formErrors.fieldError('default')" />
      </div>
    </div>

  </Dialog>
</template>
<script setup>
import env from '../env';
import { useApi } from '../composables/useApi.js';
import { ref, watch } from 'vue';
import { useFormErrors } from '../composables/useFormErrors.js';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  fileId: {
    type: Number,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  useInMeeting: {
    type: Boolean,
    default: false
  },
  download: {
    type: Boolean,
    default: false
  },
  default: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edited']);

const api = useApi();
const formErrors = useFormErrors();

const showModal = ref(false);
const newUseInMeeting = ref(null);
const newDownload = ref(null);
const newDefault = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showEditModal () {
  newUseInMeeting.value = props.useInMeeting;
  newDownload.value = props.download;
  newDefault.value = props.default;
  formErrors.clear();
  showModal.value = true;
}

watch(newDefault, (value) => {
  if (value) { newUseInMeeting.value = true; }
});

watch(newUseInMeeting, (value) => {
  if (!value) { newDefault.value = false; }
});

/**
 * Sends a request to the server to create a new token or edit a existing.
 */
function save () {
  isLoadingAction.value = true;
  formErrors.clear();

  const config = {
    method: 'put',
    data: {
      use_in_meeting: newUseInMeeting.value,
      download: newDownload.value,
      default: newDefault.value
    }
  };

  api.call(`rooms/${props.roomId}/files/${props.fileId}`, config).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('edited');
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else {
      api.error(error);
    }
  }).finally(() => {
    isLoadingAction.value = false;
  });
}

</script>
