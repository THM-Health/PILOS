<template>
  <Button
    v-tooltip="$t('admin.roles.delete.item', { id: props.name })"
    :aria-label="$t('admin.roles.delete.item', { id: props.name })"
    :disabled="isBusy"
    severity="danger"
    icon="fa-solid fa-trash"
    data-test="roles-delete-button"
    @click="showModal"
  />

  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('admin.roles.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :close-on-escape="!isBusy"
    :dismissable-mask="!isBusy"
    :closable="!isBusy"
    :draggable="false"
    data-test="roles-delete-dialog"
  >
    <span>
      {{ $t("admin.roles.delete.confirm", { name: props.name }) }}
    </span>
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
        @click="deleteRole"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";
import { useApi } from "../composables/useApi.js";

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

const emit = defineEmits(["deleted"]);

const modalVisible = ref(false);
const isBusy = ref(false);

/**
 * Shows the delete modal
 *
 */
function showModal() {
  modalVisible.value = true;
}

/**
 * Deletes the role
 *
 */
function deleteRole() {
  isBusy.value = true;
  api
    .call(`roles/${props.id}`, {
      method: "delete",
    })
    .then(() => {
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}
</script>
