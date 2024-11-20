<template>
  <Button
    v-if="userPermissions.can('transfer', room)"
    data-test="room-transfer-ownership-button"
    severity="secondary"
    icon="fa-solid fa-user-gear"
    :label="$t('rooms.modals.transfer_ownership.title')"
    :disabled="disabled"
    @click="showModal"
  />

  <!--transfer ownership modal-->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-transfer-ownership-dialog"
    modal
    :header="$t('rooms.modals.transfer_ownership.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <!--select new owner-->
    <!-- select user -->
    <div class="relative mt-2 flex flex-col gap-2 overflow-visible">
      <label id="user-label">{{ $t("app.user") }}</label>
      <multiselect
        v-model="newOwner"
        aria-labelledby="user-label"
        autofocus
        data-test="new-owner-dropdown"
        :disabled="isLoadingAction"
        label="lastname"
        track-by="id"
        :placeholder="$t('app.user_name')"
        open-direction="bottom"
        :options="users"
        :multiple="false"
        :searchable="true"
        :loading="isLoadingSearch"
        :internal-search="false"
        :clear-on-select="false"
        :preserve-search="true"
        :close-on-select="true"
        :options-limit="300"
        :max-height="600"
        :show-no-results="true"
        :show-labels="false"
        :invalid="formErrors.fieldInvalid('user')"
        @search-change="asyncFind"
      >
        <template #noResult>
          <span v-if="tooManyResults" class="whitespace-normal">
            {{ $t("rooms.members.modals.add.too_many_results") }}
          </span>
          <span v-else>
            {{ $t("rooms.members.modals.add.no_result") }}
          </span>
        </template>
        <template #noOptions>
          {{ $t("rooms.members.modals.add.no_options") }}
        </template>
        <template #option="{ option }">
          {{ option.firstname }} {{ option.lastname }}<br /><small>{{
            option.email
          }}</small>
        </template>
        <template #singleLabel="{ option }">
          {{ option.firstname }} {{ option.lastname }}
        </template>
      </multiselect>
      <FormError :errors="formErrors.fieldError('user')" />
    </div>

    <!--select new role with which the current owner should be added as a member of the room -->
    <div class="mt-6 flex flex-col gap-2">
      <fieldset class="flex w-full flex-col gap-2">
        <legend>{{ $t("rooms.modals.transfer_ownership.new_role") }}</legend>

        <div class="flex items-center" data-test="participant-role-group">
          <RadioButton
            v-model="newRoleInRoom"
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
            v-model="newRoleInRoom"
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
            v-model="newRoleInRoom"
            :disabled="isLoadingAction"
            input-id="co-owner-role"
            name="role"
            :value="3"
          />
          <label for="co-owner-role" class="ml-2"
            ><RoomRoleBadge :role="3"
          /></label>
        </div>

        <Divider />
        <!--option to not add the current user as a member of the room-->
        <div data-test="no-role-group">
          <div class="flex items-center">
            <RadioButton
              v-model="newRoleInRoom"
              :disabled="isLoadingAction"
              input-id="no-role"
              name="role"
              :value="-1"
              :pt="{
                input: {
                  'aria-describedby': 'no-role-warning',
                },
              }"
            />
            <label for="no-role" class="ml-2"><RoomRoleBadge /></label>
          </div>
          <small id="no-role-warning">{{
            $t("rooms.modals.transfer_ownership.warning")
          }}</small>
        </div>

        <FormError :errors="formErrors.fieldError('role')" />
      </fieldset>
    </div>

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
          :label="$t('rooms.modals.transfer_ownership.transfer')"
          severity="danger"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          data-test="dialog-continue-button"
          @click="transferOwnership"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { Multiselect } from "vue-multiselect";
import env from "../env";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["transferredOwnership"]);

const isLoadingAction = ref(false);
const isLoadingSearch = ref(false);
const tooManyResults = ref(false);
const modalVisible = ref(false);
const users = ref([]);
const newOwner = ref(null);
const newRoleInRoom = ref(3);

const formErrors = useFormErrors();
const api = useApi();
const userPermissions = useUserPermissions();

/**
 * transfer the room ownership to another user
 */
function transferOwnership() {
  isLoadingAction.value = true;

  // reset errors
  formErrors.clear();

  const data = {
    user: newOwner.value?.id,
  };
  if (newRoleInRoom.value !== -1) {
    data.role = newRoleInRoom.value;
  }

  // transfer room ownership to the selected user
  api
    .call("rooms/" + props.room.id + "/transfer", {
      method: "post",
      data,
    })
    .then(() => {
      // operation successful, emit "transferred-ownership" to reload room view and close modal
      emit("transferredOwnership");
      modalVisible.value = false;
    })
    .catch((error) => {
      // transferring failed
      if (error.response) {
        // failed due to validation errors
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

/**
 * reset and show modal to transfer the room ownership
 */
function showModal() {
  newOwner.value = null;
  users.value = [];
  newRoleInRoom.value = 3;
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Search for users in database
 * @param query
 */
function asyncFind(query) {
  isLoadingSearch.value = true;

  const config = {
    params: {
      query,
    },
  };

  api
    .call("users/search", config)
    .then((response) => {
      if (response.status === 204) {
        users.value = [];
        tooManyResults.value = true;
        return;
      }

      // disable user that is currently the owner of the room
      users.value = response.data.data.map((user) => {
        if (props.room.owner.id === user.id) {
          user.$isDisabled = true;
        }
        return user;
      });
      tooManyResults.value = false;
    })
    .catch((error) => {
      tooManyResults.value = false;
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingSearch.value = false;
    });
}
</script>
