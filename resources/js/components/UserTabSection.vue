<template>
  <div>
    <OverlayComponent :show="isBusy || loadingError">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadUser" />
      </template>
      <TabView
        v-if="!isBusy && user"
        lazy
        :pt="{
            root: { class: 'room-tabs' },
            navContent: { class: 'border-round-top' }
          }"
      >
        <TabPanel>
          <template #header>
            <i class="fa-solid fa-user mr-2" /> {{ $t('settings.users.base_data') }}
          </template>
          <UserTabProfile
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @stale-error="handleStaleError"
            @not-found-error="handleNotFoundError"
          />
        </TabPanel>
        <TabPanel>
          <template #header>
            <i class="fa-solid fa-envelope mr-2" /> {{ $t('app.email') }}
          </template>
          <UserTabEmail
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @not-found-error="handleNotFoundError"
          />
        </TabPanel>
        <TabPanel>
          <template #header>
            <i class="fa-solid fa-user-shield mr-2" /> {{ $t('app.security') }}
          </template>
          <UserTabSecurity
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @stale-error="handleStaleError"
            @not-found-error="handleNotFoundError"
          />
        </TabPanel>
        <TabPanel>
          <template #header>
            <i class="fa-solid fa-user-gear mr-2" /> {{ $t('settings.users.other_settings') }}
          </template>
          <UserTabOtherSettings
            :user="user"
            :view-only="viewOnly"
            @update-user="updateUser"
            @stale-error="handleStaleError"
            @not-found-error="handleNotFoundError"
          />
        </TabPanel>
      </TabView>
    </OverlayComponent>

    <!-- Stale user modal -->
    <Dialog
      v-model:visible="showModal"
      modal
      :style="{ width: '500px' }"
      :breakpoints="{ '575px': '90vw' }"
      :draggable="false"
      :closeOnEscape="false"
      :dismissableMask="false"
      :closable="false"
    >
      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button :label="$t('app.reload')" :loading="isBusy" :disabled="isBusy" @click="refreshUser" />
        </div>
      </template>

      {{ staleError.message }}
    </Dialog>
  </div>
</template>

<script setup>
import Base from '../api/base';
import env from '../env';
import { onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useRouter } from 'vue-router';

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  viewOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updateUser']);

const user = ref(null);
const isBusy = ref(false);
const loadingError = ref(false);
const staleError = ref({});
const showModal = ref(false);

const api = useApi();
const router = useRouter();

onMounted(() => {
  loadUser();
});

function handleNotFoundError (error) {
  router.push({ name: 'settings.users' });
  api.error(error);
}

function handleStaleError (error) {
  staleError.value = error;
  showModal.value = true;
}

function updateUser (newUser) {
  user.value = newUser;
  emit('updateUser', newUser);
}

/**
 * Refreshes the current model with the new passed from the stale error response.
 */
function refreshUser () {
  user.value = staleError.value.new_model;
  user.value.roles.forEach(role => {
    role.$isDisabled = role.automatic;
  });
  emit('updateUser', staleError.value.new_model);
  staleError.value = {};
  showModal.value = false;
}

/**
 * Load user from the API.
 */
function loadUser () {
  isBusy.value = true;

  Base.call('users/' + props.id).then(response => {
    loadingError.value = false;
    user.value = response.data.data;
    user.value.roles.forEach(role => {
      role.$isDisabled = role.automatic;
    });
    emit('updateUser', user.value);
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
      router.push({ name: 'settings.users' });
    }

    loadingError.value = true;
    api.error(error);
  }).finally(() => {
    isBusy.value = false;
  });
}

</script>
