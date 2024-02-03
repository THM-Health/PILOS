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
        <Button :label="$t('app.cancel')" outlined @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.save')" :loading="isLoadingAction" :disabled="isLoadingAction" @click="save" />
        </div>
    </template>

    <!-- description -->
    <div class="flex flex-column gap-2 mt-4">
      <label for="description">{{ $t('rooms.recordings.description') }}</label>
      <InputText id="description" v-model="newDescription" :disabled="isLoadingAction" />
      <p class="p-error" v-html="formErrors.fieldError('description')" />
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
      <p class="p-error" v-html="formErrors.fieldError('formats')" />
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
import { ref } from 'vue';
import _ from 'lodash';

const props = defineProps([
  'roomId',
  'recordingId',
  'start',
  'end',
  'description',
  'formats',
  'access',
  'disabled'
]);

const emit = defineEmits(['edited']);

const api = useApi();
const formErrors = useFormErrors();

const showModal = ref(false);
const newDescription = ref(null);
const newFormats = ref([]);
const newAccess = ref(null);
const isLoadingAction = ref(false);
const accessTypes = ref([0, 1, 2, 3]);

/**
 * show modal to edit user role
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
      // user not found
      if (error.response.status === env.HTTP_GONE) {
        showModal.value = false;
        emit('edited');
        return;
      }
      // failed due to form validation errors
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
        return;
      }
    }
    showModal.value = false;
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}
</script>
