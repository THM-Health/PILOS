<template>
  <div>
    <Button
      data-test="room-create-button"
      :disabled="props.disabled"
      severity="primary"
      icon="fa-solid fa-plus"
      :label="$t('rooms.create.title')"
      @click="showModal"
    />

    <!-- new room modal-->
    <Dialog
      v-model:visible="modalVisible"
      data-test="room-create-dialog"
      modal
      :header="$t('rooms.create.title')"
      :style="{ width: '900px' }"
      :breakpoints="{ '975px': '90vw' }"
      :close-on-escape="!isLoadingAction && !roomTypeSelectBusy"
      :dismissable-mask="!isLoadingAction && !roomTypeSelectBusy"
      :closable="!isLoadingAction && !roomTypeSelectBusy"
      :draggable="false"
      aria-labelledby="room-create-dialog-title"
    >
      <template #header>
        <h2 id="room-create-dialog-title" class="p-dialog-title">
          {{ $t("rooms.create.title") }}
        </h2>
      </template>
      <div>
        <!-- Room name -->
        <div class="mt-6 flex flex-col gap-2">
          <label for="room-name">{{ $t("rooms.name") }}</label>
          <InputText
            id="room-name"
            v-model="room.name"
            :disabled="isLoadingAction"
            autofocus
            :invalid="formErrors.fieldInvalid('name')"
          />
          <FormError :errors="formErrors.fieldError('name')" />
        </div>

        <!-- Room type -->
        <div class="flex flex-col gap-2">
          <label id="room-type-label">{{
            $t("rooms.settings.general.type")
          }}</label>
          <RoomTypeSelect
            ref="roomTypeSelect"
            v-model="room.room_type"
            aria-labelledby="room-type-label"
            :disabled="isLoadingAction"
            :invalid="formErrors.fieldInvalid('room_type')"
            @loading-error="(value) => (roomTypeSelectLoadingError = value)"
            @busy="(value) => (roomTypeSelectBusy = value)"
          />
          <FormError :errors="formErrors.fieldError('room_type')" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            :label="$t('app.cancel')"
            data-test="dialog-cancel-button"
            severity="secondary"
            :disabled="isLoadingAction || roomTypeSelectBusy"
            @click="handleCancel"
          />
          <Button
            :label="$t('rooms.create.ok')"
            data-test="dialog-save-button"
            severity="success"
            :disabled="
              roomTypeSelectLoadingError ||
              isLoadingAction ||
              roomTypeSelectBusy
            "
            @click="handleOk"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
<script setup>
import env from "../env.js";
import _ from "lodash";
import { useAuthStore } from "../stores/auth";
import { reactive, ref } from "vue";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { useRouter } from "vue-router";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

const authStore = useAuthStore();
const formErrors = useFormErrors();
const api = useApi();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["limitReached"]);

const modalVisible = ref(false);
const roomTypeSelectBusy = ref(false);
const roomTypeSelectLoadingError = ref(false);
const isLoadingAction = ref(false);
const roomTypeSelect = ref(null);

const room = reactive({
  room_type: null,
  name: null,
});

function handleCancel() {
  modalVisible.value = false;
}

function showModal() {
  room.room_type = null;
  room.name = null;
  roomTypeSelectBusy.value = false;
  roomTypeSelectLoadingError.value = false;
  isLoadingAction.value = false;
  formErrors.clear();
  modalVisible.value = true;
}

function handleOk() {
  isLoadingAction.value = true;

  const newRoom = _.clone(room);
  newRoom.room_type = newRoom.room_type ? newRoom.room_type.id : null;

  api
    .call("rooms", {
      method: "post",
      data: newRoom,
    })
    .then((response) => {
      formErrors.clear();
      router.push({
        name: "rooms.view",
        params: { id: response.data.data.id },
      });
    })
    .catch((error) => {
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
          toast.error(t("rooms.flash.no_new_room"));
          modalVisible.value = false;
          authStore.getCurrentUser();
          return;
        }
        // room limit exceeded
        if (error.response.status === env.HTTP_ROOM_LIMIT_EXCEEDED) {
          emit("limitReached");
        }
      }
      modalVisible.value = false;
      api.error(error);
    });
}
</script>
