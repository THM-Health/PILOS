<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Button
    v-tooltip="$t('admin.servers.delete.item', { name: props.name })"
    severity="danger"
    icon="fa-solid fa-trash"
    :disabled="isBusy || props.disabled"
    :aria-label="$t('admin.servers.delete.item', { name: props.name })"
    data-test="servers-delete-button"
    @click="showModal()"
  />
  <Dialog
    v-model:visible="modalVisible"
    :header="$t('admin.servers.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    modal
    :close-on-escape="!isBusy"
    :closable="!isBusy"
    :dismissable-mask="!isBusy"
    :draggable="false"
    data-test="servers-delete-dialog"
  >
    <span>{{ $t("admin.servers.delete.confirm", { name: props.name }) }}</span>

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
        :loading="isBusy"
        severity="danger"
        data-test="dialog-continue-button"
        @click="deleteServer"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { HTTP_STATUS_NOT_FOUND } from "../constants/httpStatusCodes.js";

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
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["deleted", "notFound"]);
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
 * Deletes the server that is set in the property `serverToDelete`.
 */
function deleteServer() {
  isBusy.value = true;

  api
    .call(`servers/${props.id}`, {
      method: "delete",
    })
    .then(() => {
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      if (error.response && error.response.status === HTTP_STATUS_NOT_FOUND) {
        modalVisible.value = false;
        emit("notFound");
      }
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}
</script>
