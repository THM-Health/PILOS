<template>
  <!-- Add role button -->
  <Button
    v-tooltip="$t('rooms.members.role_members.add')"
    type="button"
    icon="fa-solid fa-user-group"
    :aria-label="$t('rooms.members.role_members.add')"
    :disabled="props.disabled"
    data-test="room-role-members-add-button"
    @click="showModal"
  />

  <!-- add role modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-role-members-add-dialog"
    modal
    :header="$t('rooms.members.role_members.modals.add.title')"
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
          :label="$t('app.cancel')"
          severity="secondary"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('rooms.members.role_members.modals.add.add')"
          :loading="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <!-- select role -->
    <div class="relative mt-2 flex flex-col gap-2 overflow-visible">
      <label id="role-label">{{ $t("app.roles") }}</label>
      <Select
        v-model="selectedRoleId"
        aria-labelledby="role-label"
        data-test="select-role-dropdown"
        :disabled="isLoadingAction || isLoadingRoles"
        :loading="isLoadingRoles"
        :options="roles"
        option-label="name"
        option-value="id"
        :placeholder="$t('rooms.members.role_members.modals.add.placeholder')"
        :invalid="formErrors.fieldInvalid('role_id')"
        filter
        class="w-full"
      />
      <FormError :errors="formErrors.fieldError('role_id')" />
    </div>

    <!-- select permission level -->
    <div class="mt-6 flex flex-col gap-2">
      <fieldset class="flex w-full flex-col gap-2">
        <legend>{{ $t("rooms.role") }}</legend>

        <div class="flex items-center" data-test="participant-role-group">
          <RadioButton
            v-model="role"
            :disabled="isLoadingAction"
            input-id="participant-role"
            name="role"
            :value="1"
          />
          <label for="participant-role" class="ml-2"
            ><RoomRoleBadge :role="1"
          /></label>
        </div>

        <div class="flex items-center" data-test="moderator-role-group">
          <RadioButton
            v-model="role"
            :disabled="isLoadingAction"
            input-id="moderator-role"
            name="role"
            :value="2"
          />
          <label for="moderator-role" class="ml-2"
            ><RoomRoleBadge :role="2"
          /></label>
        </div>

        <div class="flex items-center" data-test="co-owner-role-group">
          <RadioButton
            v-model="role"
            :disabled="isLoadingAction"
            input-id="co_owner-role"
            name="role"
            :value="3"
          />
          <label for="co_owner-role" class="ml-2"
            ><RoomRoleBadge :role="3"
          /></label>
        </div>

        <FormError :errors="formErrors.fieldError('role')" />
      </fieldset>
    </div>
  </Dialog>
</template>
<script setup>
import env from "../env";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { ref } from "vue";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["added"]);

const api = useApi();
const formErrors = useFormErrors();

const modalVisible = ref(false);
const selectedRoleId = ref(null);
const role = ref(null);
const roles = ref([]);
const isLoadingRoles = ref(false);
const isLoadingAction = ref(false);

/**
 * Load available roles from API
 */
function loadRoles() {
  isLoadingRoles.value = true;

  api
    .call("roles", {
      params: {
        page: 1,
        per_page: 9999,
      },
    })
    .then((response) => {
      roles.value = response.data.data;
    })
    .catch((error) => {
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingRoles.value = false;
    });
}

/**
 * show modal to add a role as member
 */
function showModal() {
  selectedRoleId.value = null;
  role.value = null;
  formErrors.clear();
  loadRoles();
  modalVisible.value = true;
}

/**
 * Add a role as a room member
 */
function save() {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  api
    .call("rooms/" + props.roomId + "/role-member", {
      method: "post",
      data: { role_id: selectedRoleId.value, role: role.value },
    })
    .then(() => {
      modalVisible.value = false;
      emit("added");
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
