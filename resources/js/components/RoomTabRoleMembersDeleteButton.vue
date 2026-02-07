<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.members.role_members.remove')"
    data-test="room-role-members-delete-button"
    :aria-label="$t('rooms.members.role_members.remove')"
    :disabled="disabled"
    severity="danger"
    icon="fa-solid fa-trash"
    @click="modalVisible = true"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-role-members-delete-dialog"
    modal
    :header="$t('rooms.members.role_members.modals.remove.title')"
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
          data-test="dialog-continue-button"
          @click="deleteRoleMember"
        />
      </div>
    </template>

    <span>
      {{
        $t("rooms.members.role_members.modals.remove.confirm", {
          name: roleName,
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
  roleId: {
    type: Number,
    required: true,
  },
  roleName: {
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

/**
 * Remove role from room
 */
function deleteRoleMember() {
  isLoadingAction.value = true;

  api
    .call("rooms/" + props.roomId + "/role-member/" + props.roleId, {
      method: "delete",
    })
    .then(() => {
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      if (error.response) {
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
