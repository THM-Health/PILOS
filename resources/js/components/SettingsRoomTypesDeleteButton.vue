<template>
  <Button
    v-tooltip="$t('admin.room_types.delete.item', { id: props.name })"
    :aria-label="$t('admin.room_types.delete.item', { id: props.name })"
    :disabled="isBusy"
    severity="danger"
    icon="fa-solid fa-trash"
    @click="showModal"
  />

  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('admin.room_types.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :close-on-escape="!isBusy"
    :dismissable-mask="!isBusy"
    :closeable="!isBusy"
    :draggable="false"
  >
    <span>
      {{ $t("admin.room_types.delete.confirm", { name: props.name }) }}
    </span>
    <Divider />
    <div class="flex flex-col gap-2">
      <label for="replacement-room-type">{{
        $t("admin.room_types.delete.replacement")
      }}</label>
      <Select
        id="replacement-room-type"
        v-model.number="replacement"
        autofocus
        :disabled="isBusy"
        :loading="loadingRoomTypes"
        :class="{
          'p-invalid': formErrors.fieldInvalid('replacement_room_type'),
        }"
        :options="replacementRoomTypes"
        :placeholder="$t('admin.room_types.delete.no_replacement')"
        option-value="value"
        option-label="text"
        aria-describedby="replacement-help"
        show-clear
      >
        <template #clearicon="{ clearCallback }">
          <span
            class="p-dropdown-clear"
            role="button"
            @click.stop="clearCallback"
          >
            <i class="fa-solid fa-times" />
          </span>
        </template>
      </Select>
      <FormError :errors="formErrors.fieldError('replacement_room_type')" />
      <small id="replacement-help">{{
        $t("admin.room_types.delete.replacement_info")
      }}</small>
    </div>
    <template #footer>
      <Button
        :label="$t('app.no')"
        severity="secondary"
        @click="modalVisible = false"
      />
      <Button
        :label="$t('app.yes')"
        severity="danger"
        :loading="isBusy"
        @click="deleteRoomType"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";
import env from "../env.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";

const formErrors = useFormErrors();
const api = useApi();

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["deleted", "notFound"]);

const modalVisible = ref(false);
const isBusy = ref(false);
const replacement = ref(null);
const replacementRoomTypes = ref([]);
const loadingRoomTypes = ref(false);

/**
 * Shows the delete modal
 *
 */
function showModal() {
  formErrors.clear();
  replacement.value = null;
  loadReplacementRoomTypes();
  modalVisible.value = true;
}

function loadReplacementRoomTypes() {
  loadingRoomTypes.value = true;
  api
    .call("roomTypes")
    .then((response) => {
      replacementRoomTypes.value = response.data.data
        .filter((roomType) => {
          return roomType.id !== props.id;
        })
        .map((roomType) => {
          return {
            value: roomType.id,
            text: roomType.name,
          };
        });
    })
    .catch((error) => {
      api.error(error);
    })
    .finally(() => {
      loadingRoomTypes.value = false;
    });
}

/**
 * Deletes the room type
 */
function deleteRoomType() {
  isBusy.value = true;

  api
    .call(`roomTypes/${props.id}`, {
      method: "delete",
      data: { replacement_room_type: replacement.value },
    })
    .then(() => {
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      // failed due to form validation errors
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
        return;
      }
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        modalVisible.value = false;
        emit("notFound");
        return;
      }
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}
</script>
