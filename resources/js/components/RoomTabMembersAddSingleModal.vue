<template>
  <!-- add new user modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-members-add-single-dialog"
    modal
    :header="$t('rooms.members.add_single_user')"
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
          :label="$t('rooms.members.modals.add.add')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <!-- select user -->
    <div class="relative mt-2 flex flex-col gap-2 overflow-visible">
      <label id="user-label">{{ $t("app.user") }}</label>
      <multiselect
        v-model="user"
        aria-labelledby="user-label"
        autofocus
        data-test="select-user-dropdown"
        label="lastname"
        track-by="id"
        :placeholder="$t('rooms.members.modals.add.placeholder')"
        open-direction="bottom"
        :options="users"
        :multiple="false"
        :searchable="true"
        :loading="isLoadingSearch"
        :disabled="isLoadingAction"
        :internal-search="false"
        :clear-on-select="false"
        :preserve-search="true"
        :close-on-select="true"
        :options-limit="300"
        :max-height="150"
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

    <!-- select role -->
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
import Multiselect from "vue-multiselect";
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
const user = ref(null);
const role = ref(null);
const users = ref([]);
const tooManyResults = ref(false);
const isLoadingSearch = ref(false);
const isLoadingAction = ref(false);

defineExpose({
  showModal,
});

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

      // disable users that are already members of this room or the room owner
      // const idOfMembers = this.members.map(user => user.id);
      users.value = response.data.data.map((user) => {
        // if (idOfMembers.includes(user.id) || this.room.owner.id === user.id) { user.$isDisabled = true; }
        return user;
      });
      tooManyResults.value = false;
    })
    .catch((error) => {
      tooManyResults.value = false;
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      isLoadingSearch.value = false;
    });
}

/**
 * show modal to add a new user as member
 */
function showModal() {
  user.value = null;
  role.value = null;
  formErrors.clear();
  users.value = [];
  modalVisible.value = true;
}

/**
 * Add a user as a room member
 */
function save() {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  // post new user as room members
  api
    .call("rooms/" + props.roomId + "/member", {
      method: "post",
      data: { user: user.value?.id, role: role.value },
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("added");
    })
    .catch((error) => {
      // adding failed
      if (error.response) {
        // failed due to form validation errors
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
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
