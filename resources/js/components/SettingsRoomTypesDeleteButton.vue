<template>
  <Button
    v-tooltip="$t('admin.room_types.delete.item', { id: props.name })"
    :aria-label="$t('admin.room_types.delete.item', { id: props.name })"
    :disabled="isBusy"
    severity="danger"
    icon="fa-solid fa-trash"
    data-test="room-types-delete-button"
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
    :closable="!isBusy"
    :draggable="false"
    data-test="room-types-delete-dialog"
  >
    <span>
      {{ $t("admin.room_types.delete.confirm", { name: props.name }) }}
    </span>
    <Divider />
    <div class="flex flex-col gap-2" data-test="replacement-room-type-field">
      <label for="replacement-room-type">{{
        $t("admin.room_types.delete.replacement")
      }}</label>
      <InputGroup>
        <Select
          id="replacement-room-type"
          v-model.number="replacement"
          data-test="replacement-room-type-dropdown"
          :disabled="
            isBusy || loadingRoomTypes || replacementRoomTypesLoadingError
          "
          :loading="loadingRoomTypes"
          :class="{
            'p-invalid': formErrors.fieldInvalid('replacement_room_type'),
          }"
          :options="replacementRoomTypeOptions"
          option-group-label="index"
          option-group-children="items"
          option-value="value"
          option-label="text"
          aria-describedby="replacement-help"
          :pt="{
            listContainer: {
              'data-test': 'replacement-room-type-dropdown-items',
            },
            option: {
              'data-test': 'replacement-room-type-dropdown-option',
            },
            optionGroup: 'p-0',
            label: {
              autofocus: true,
            },
          }"
        >
          <template #optiongroup="slotProps">
            <Divider v-if="slotProps.option.index > 0" class="my-1" />
            <div v-else />
          </template>
          <template #option="slotProps">
            <span :class="{ italic: slotProps.option.value === 0 }">{{
              slotProps.option.text
            }}</span>
          </template>
        </Select>
        <Button
          v-if="replacementRoomTypesLoadingError"
          :disabled="isBusy"
          outlined
          severity="secondary"
          icon="fa-solid fa-sync"
          :aria-label="$t('app.reload')"
          data-test="replacement-room-types-reload-button"
          @click="loadReplacementRoomTypes()"
        />
      </InputGroup>
      <FormError :errors="formErrors.fieldError('replacement_room_type')" />
      <small id="replacement-help">{{
        $t("admin.room_types.delete.replacement_info")
      }}</small>
    </div>
    <template #footer>
      <Button
        :label="$t('app.no')"
        :disabled="isBusy"
        severity="secondary"
        data-test="dialog-cancel-button"
        @click="modalVisible = false"
      />
      <Button
        :label="$t('app.yes')"
        severity="danger"
        :loading="isBusy"
        data-test="dialog-continue-button"
        @click="deleteRoomType"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import env from "../env.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { useI18n } from "vue-i18n";

const formErrors = useFormErrors();
const api = useApi();
const { t } = useI18n();

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
const replacement = ref(0);
const replacementRoomTypes = ref([]);
const loadingRoomTypes = ref(false);
const replacementRoomTypesLoadingError = ref(false);

/**
 * Shows the delete modal
 *
 */
function showModal() {
  formErrors.clear();
  replacement.value = 0;
  loadReplacementRoomTypes();
  modalVisible.value = true;
}

function loadReplacementRoomTypes() {
  loadingRoomTypes.value = true;
  replacementRoomTypesLoadingError.value = false;

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
      replacementRoomTypesLoadingError.value = true;
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
  formErrors.clear();

  api
    .call(`roomTypes/${props.id}`, {
      method: "delete",
      data: {
        replacement_room_type:
          replacement.value === 0 ? null : replacement.value,
      },
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
      }
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}

const replacementRoomTypeOptions = computed(() => {
  return [
    {
      index: 0,
      items: [{ text: t("admin.room_types.delete.no_replacement"), value: 0 }],
    },
    {
      index: 1,
      items: replacementRoomTypes.value,
    },
  ];
});
</script>
