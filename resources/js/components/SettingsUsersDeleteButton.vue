<template>
  <Button
    v-tooltip="
      $t('admin.users.delete.item', {
        firstname: props.firstname,
        lastname: props.lastname,
      })
    "
    :aria-label="
      $t('admin.users.delete.item', {
        firstname: props.firstname,
        lastname: props.lastname,
      })
    "
    :disabled="isBusy"
    severity="danger"
    icon="fa-solid fa-trash"
    data-test="users-delete-button"
    @click="showModal"
  />
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('admin.users.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :close-on-escape="!isBusy"
    :dismissable-mask="!isBusy"
    :closable="!isBusy"
    :draggable="false"
    data-test="users-delete-dialog"
  >
    <span>
      {{
        $t("admin.users.delete.confirm", {
          firstname: props.firstname,
          lastname: props.lastname,
        })
      }}
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
        @click="deleteUser"
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
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
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
 * Deletes the user
 *
 */
function deleteUser() {
  isBusy.value = true;
  api
    .call(`users/${props.id}`, {
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
