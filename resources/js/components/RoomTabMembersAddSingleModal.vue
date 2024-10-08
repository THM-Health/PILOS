<template>
  <!-- add new user modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.members.add_single_user')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('rooms.members.modals.add.add')" :loading="isLoadingAction" :disabled="isLoadingAction" @click="save" />
        </div>
    </template>

    <!-- select user -->
    <div class="flex flex-col gap-2 mt-2 relative overflow-visible">
      <label for="user">{{ $t('app.user') }}</label>
      <multiselect
        autofocus
        v-model="user"
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
        @search-change="asyncFind"
        :invalid="formErrors.fieldInvalid('user')"
      >
        <template #noResult>
          <span v-if="tooManyResults" class="whitespace-normal">
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
      <FormError :errors="formErrors.fieldError('user')" />
    </div>

    <!-- select role -->
    <div class="flex flex-col gap-2 mt-6">
      <label for="role">{{ $t('rooms.role') }}</label>

      <div class="flex items-center">
        <RadioButton v-model="role" :disabled="isLoadingAction" input-id="participant-role" name="role" :value="1" />
        <label for="participant-role" class="ml-2"><RoomRoleBadge :role="1" /></label>
      </div>

      <div class="flex items-center">
        <RadioButton v-model="role" :disabled="isLoadingAction" input-id="moderator-role" name="role" :value="2" />
        <label for="participant-moderator" class="ml-2"><RoomRoleBadge :role="2" /></label>
      </div>

      <div class="flex items-center">
        <RadioButton v-model="role" :disabled="isLoadingAction" input-id="co_owner-role" name="role" :value="3" />
        <label for="participant-co_owner" class="ml-2"><RoomRoleBadge :role="3" /></label>
      </div>

      <FormError :errors="formErrors.fieldError('role')" />
    </div>
  </Dialog>
</template>
<script setup>
import Multiselect from 'vue-multiselect';
import env from '../env';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { ref } from 'vue';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['added']);

const api = useApi();
const formErrors = useFormErrors();

const showModal = ref(false);
const user = ref(null);
const role = ref(null);
const users = ref([]);
const tooManyResults = ref(false);
const isLoadingSearch = ref(false);
const isLoadingAction = ref(false);

defineExpose({
  openModal
});

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

    // disable users that are already members of this room or the room owner
    // const idOfMembers = this.members.map(user => user.id);
    users.value = response.data.data.map(user => {
      // if (idOfMembers.includes(user.id) || this.room.owner.id === user.id) { user.$isDisabled = true; }
      return user;
    });
    tooManyResults.value = false;
  }).catch((error) => {
    tooManyResults.value = false;
    api.error(error, { noRedirectOnUnauthenticated: true });
  }).finally(() => {
    isLoadingSearch.value = false;
  });
}

/**
 * show modal to add a new user as member
 */
function openModal () {
  user.value = null;
  role.value = null;
  formErrors.clear();
  users.value = [];
  showModal.value = true;
}

/**
 * Add a user as a room member
 */
function save () {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  // post new user as room members
  api.call('rooms/' + props.roomId + '/member', {
    method: 'post',
    data: { user: user.value?.id, role: role.value }
  }).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('added');
  }).catch((error) => {
    // adding failed
    if (error.response) {
      // failed due to form validation errors
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
        return;
      }
    }
    api.error(error, { noRedirectOnUnauthenticated: true });
  }).finally(() => {
    isLoadingAction.value = false;
  });
}
</script>
