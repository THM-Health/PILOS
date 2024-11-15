<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.tokens.delete')"
    severity="danger"
    :disabled="disabled"
    icon="fa-solid fa-trash"
    :aria-label="$t('rooms.tokens.delete')"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.tokens.delete')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.no')"
          severity="secondary"
          :disabled="isLoadingAction"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.yes')"
          severity="danger"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          @click="deleteToken"
        />
      </div>
    </template>

    <span>
      {{
        $t("rooms.tokens.confirm_delete", {
          firstname: props.firstname,
          lastname: props.lastname,
        })
      }}
    </span>
  </Dialog>
</template>

<script setup>
import env from "../env";
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
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
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["deleted", "notFound"]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  modalVisible.value = true;
}

/**
 * Sends a request to the server to create a new token or edit a existing.
 */
function deleteToken() {
  isLoadingAction.value = true;

  const config = {
    method: "delete",
  };

  api
    .call(`rooms/${props.roomId}/tokens/${props.token}`, config)
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      // deleting failed
      if (error.response) {
        // token not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          toast.error(t("rooms.flash.token_gone"));
          showModal.value = false;
          emit("notFound");
          return;
        }
      }
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
