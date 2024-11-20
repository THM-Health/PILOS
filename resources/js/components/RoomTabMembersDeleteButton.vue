<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.members.remove_user')"
    data-test="room-members-delete-button"
    :aria-label="$t('rooms.members.remove_user')"
    :disabled="disabled"
    severity="danger"
    icon="fa-solid fa-trash"
    @click="modalVisible = true"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-members-delete-dialog"
    modal
    :header="$t('rooms.members.modals.remove.title')"
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
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.yes')"
          severity="danger"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          data-test="dialog-continue-button"
          @click="deleteMember"
        />
      </div>
    </template>

    <span>
      {{
        $t("rooms.members.modals.remove.confirm", {
          firstname: firstname,
          lastname: lastname,
        })
      }}
    </span>
  </Dialog>
</template>
<script setup>
import env from "../env";
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  userId: {
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
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["deleted", "gone"]);

const api = useApi();

const modalVisible = ref(false);
const isLoadingAction = ref(false);

/*
 * Save new user role
 */
function deleteMember() {
  isLoadingAction.value = true;

  api
    .call("rooms/" + props.roomId + "/member/" + props.userId, {
      method: "delete",
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        // user not found
        if (error.response.status === env.HTTP_GONE) {
          emit("gone");
          modalVisible.value = false;
        }
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
