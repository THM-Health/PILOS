<template>
  <div>
    <Button
      :disabled="props.disabled"
      @click="modalVisible = true"
      severity="success"
      icon="fa-solid fa-plus"
      :label="$t('rooms.create.title')"
    />

    <!-- new room modal-->
    <Dialog
      v-model:visible="modalVisible"
      modal
      :header="$t('rooms.create.title')"
      :style="{ width: '900px' }"
      :breakpoints="{ '975px': '90vw' }"
      :closeOnEscape="!isLoadingAction && !roomTypeSelectBusy"
      :dismissableMask="!isLoadingAction && !roomTypeSelectBusy"
      :closable="!isLoadingAction && !roomTypeSelectBusy"
      :draggable="false"
      @hide="clearModal"
    >
      <!-- Room name -->
      <div class="flex flex-column gap-2 mt-4">
        <label for="room-name">{{ $t('rooms.name') }}</label>
        <InputText
          id="room-name"
          v-model="room.name"
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('name')"
        />
        <p class="p-error" v-html="formErrors.fieldError('name')" />
      </div>

      <!-- Room type -->
      <div class="flex flex-column gap-2">
        <label id="room-type-label">{{ $t('rooms.settings.general.type') }}</label>
        <RoomTypeSelect
          aria-labelledby="room-type-label"
          ref="roomTypeSelect"
          v-model="room.room_type"
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('room_type')"
          @loading-error="(value) => roomTypeSelectLoadingError = value"
          @busy="(value) => roomTypeSelectBusy = value"
        />
        <p class="p-error" v-html="formErrors.fieldError('room_type')" />
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button :label="$t('app.cancel')" severity="secondary" :disabled="isLoadingAction || roomTypeSelectBusy" @click="handleCancel" />
          <Button :label="$t('rooms.create.ok')" severity="success" :disabled="roomTypeSelectLoadingError || isLoadingAction || roomTypeSelectBusy" @click="handleOk" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
<script setup>
import env from '../env.js';
import _ from 'lodash';
import { useAuthStore } from '../stores/auth';
import { reactive, ref } from 'vue';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const formErrors = useFormErrors();
const api = useApi();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['limitReached']);

const modalVisible = ref(false);
const roomTypeSelectBusy = ref(false);
const roomTypeSelectLoadingError = ref(false);
const isLoadingAction = ref(false);
const roomTypeSelect = ref(null);

const room = reactive({
  room_type: null,
  name: null
});

function handleCancel () {
  modalVisible.value = false;
}

function clearModal () {
  room.room_type = null;
  room.name = null;
  roomTypeSelectBusy.value = false;
  roomTypeSelectLoadingError.value = false;
  isLoadingAction.value = false;
  formErrors.clear();
}

function handleOk () {
  isLoadingAction.value = true;

  const newRoom = _.clone(room);
  newRoom.room_type = newRoom.room_type ? newRoom.room_type.id : null;

  api.call('rooms', {
    method: 'post',
    data: newRoom
  }).then(response => {
    formErrors.clear();
    router.push({ name: 'rooms.view', params: { id: response.data.data.id } });
  }).catch((error) => {
    isLoadingAction.value = false;
    if (error.response) {
      // failed due to form validation errors
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        if (error.response.data.errors.room_type !== undefined) {
          // roomTypeSelect.value.reloadRoomTypes();
        }

        formErrors.set(error.response.data.errors);
        return;
      }
      // permission denied
      if (error.response.status === env.HTTP_FORBIDDEN) {
        toast.success(t('rooms.flash.no_new_room'));
        modalVisible.value = false;
        authStore.getCurrentUser();
        return;
      }
      // room limit exceeded
      if (error.response.status === env.HTTP_ROOM_LIMIT_EXCEEDED) {
        emit('limitReached');
      }
    }
    modalVisible.value = false;
    api.error(error);
  });
}
</script>
