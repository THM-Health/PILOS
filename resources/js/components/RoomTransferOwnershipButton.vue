<template>
  <div>
    <Button
      v-if="userPermissions.can('transfer', room)"
      @click="showTransferOwnershipModal"
      severity="secondary"
      icon="fa-solid fa-user-gear"
      :label="$t('rooms.modals.transfer_ownership.title')"
    />

    <!--transfer ownership modal-->
    <Dialog
      v-model:visible="showModal"
      modal
      :header="$t('rooms.modals.transfer_ownership.title')"
      :style="{ width: '500px' }"
      :breakpoints="{ '575px': '90vw' }"
      :draggable="false"
      :closeOnEscape="!isLoadingAction"
      :dismissableMask="false"
      :closable="!isLoadingAction"
    >
      <!--select new owner-->
      <!-- select user -->
      <div class="flex flex-column gap-2 mt-2 relative overflow-visible">
        <label for="user">{{ $t('app.user') }}</label>
        <multiselect
          v-model="newOwner"
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
          @search-change="asyncFind"
          :class="{'p-invalid': formErrors.fieldInvalid('user')}"
        >
          <template #noResult>
          <span v-if="tooManyResults" class="white-space-normal">
            {{ $t('rooms.members.modals.add.too_many_results') }}
          </span>
            <span v-else>
            {{ $t('rooms.members.modals.add.no_result') }}
          </span>

          </template>
          <template #noOptions>
            {{ $t('rooms.members.modals.add.no_options') }}
          </template>
          <template v-slot:option="{ option }">
            {{ option.firstname }} {{ option.lastname }}<br><small>{{ option.email }}</small>
          </template>
          <template v-slot:singleLabel="{ option }">
            {{ option.firstname }} {{ option.lastname }}
          </template>
        </multiselect>
        <p class="p-error" v-html="formErrors.fieldError('user')" />
      </div>

      <!--select new role with which the current owner should be added as a member of the room -->
      <div class="flex flex-column gap-2 mt-4">
        <label for="role">{{ $t('rooms.modals.transfer_ownership.new_role') }}</label>

        <div class="flex align-items-center">
          <RadioButton v-model="newRoleInRoom" inputId="participant-role" name="role" :value="1" />
          <label for="participant-role" class="ml-2"><RoomRoleBadge :role="1" /></label>
        </div>

        <div class="flex align-items-center">
          <RadioButton v-model="newRoleInRoom" inputId="participant-moderator" name="role" :value="2" />
          <label for="participant-moderator" class="ml-2"><RoomRoleBadge :role="2" /></label>
        </div>

        <div class="flex align-items-center">
          <RadioButton v-model="newRoleInRoom" inputId="participant-co-owner" name="role" :value="3" />
          <label for="participant-co-owner" class="ml-2"><RoomRoleBadge :role="3" /></label>
        </div>

        <Divider />
        <!--option to not add the current user as a member of the room-->
        <div>
          <div class="flex align-items-center">
            <RadioButton v-model="newRoleInRoom" inputId="participant-no-role" name="role" :value="-1" />
            <label for="participant-no-role" class="ml-2"><RoomRoleBadge /></label>
          </div>
          <small>{{$t('rooms.modals.transfer_ownership.warning')}}</small>
        </div>

        <p class="p-error" v-html="formErrors.fieldError('role')" />
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button :label="$t('app.cancel')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
          <Button :label="$t('rooms.modals.transfer_ownership.transfer')" severity="danger" :loading="isLoadingAction" :disabled="isLoadingAction" @click="transferOwnership" />
        </div>
      </template>

    </Dialog>
  </div>
</template>

<script setup>
import { Multiselect } from 'vue-multiselect';
import env from '../env';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';
import { useUserPermissions } from '../composables/useUserPermission.js';

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['transferredOwnership']);

const isLoadingAction = ref(false);
const isLoadingSearch = ref(false);
const tooManyResults = ref(false);
const showModal = ref(false);
const users = ref([]);
const newOwner = ref(null);
const newRoleInRoom = ref(3);

const formErrors = useFormErrors();
const api = useApi();
const userPermissions = useUserPermissions();

/**
 * transfer the room ownership to another user
 */
function transferOwnership () {
  isLoadingAction.value = true;

  // reset errors
  formErrors.clear();

  const data = {
    user: newOwner.value?.id
  };
  if (newRoleInRoom.value !== -1) {
    data.role = newRoleInRoom.value;
  }

  // transfer room ownership to the selected user
  api.call('rooms/' + props.room.id + '/transfer', {
    method: 'post',
    data
  }).then(response => {
    // operation successful, emit "transferred-ownership" to reload room view and close modal
    emit('transferredOwnership');
    showModal.value = false;
  }).catch(error => {
    // transferring failed
    if (error.response) {
      // failed due to validation errors
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
        return;
      }
    }
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}

/**
 * reset and show modal to transfer the room ownership
 */
function showTransferOwnershipModal () {
  newOwner.value = null;
  users.value = [];
  newRoleInRoom.value = 3;
  formErrors.clear();
  showModal.value = true;
}

/**
 * Search for users in database
 * @param query
 */
function asyncFind (query) {
  isLoadingSearch.value = true;

  const config = {
    params: {
      query
    }
  };

  api.call('users/search', config).then(response => {
    if (response.status === 204) {
      users.value = [];
      tooManyResults.value = true;
      return;
    }

    // disable user that is currently the owner of the room
    users.value = response.data.data.map(user => {
      if (props.room.owner.id === user.id) { user.$isDisabled = true; }
      return user;
    });
  }).catch((error) => {
    api.error(error);
  }).finally(() => {
    isLoadingSearch.value = false;
  });
}

</script>
