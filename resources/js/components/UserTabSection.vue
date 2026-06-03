<template>
  <div>
    <OverlayComponent :show="isBusy || loadingError">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadUser" />
      </template>
      <Tabs v-if="!isBusy && user" value="base" scrollable lazy>
        <TabList>
          <Tab
            value="base"
            data-test="base-tab-button"
            :disabled="isLoadingAction"
            ><i class="fa-solid fa-user mr-2" />
            {{ $t("admin.users.base_data") }}</Tab
          >
          <Tab
            value="email"
            data-test="email-tab-button"
            :disabled="isLoadingAction"
            ><i class="fa-solid fa-envelope mr-2" /> {{ $t("app.email") }}</Tab
          >
          <Tab
            value="security"
            data-test="security-tab-button"
            :disabled="isLoadingAction"
            ><i class="fa-solid fa-user-shield mr-2" />
            {{ $t("app.security") }}</Tab
          >
          <Tab
            value="others"
            data-test="others-tab-button"
            :disabled="isLoadingAction"
            ><i class="fa-solid fa-user-gear mr-2" />
            {{ $t("admin.users.other_settings") }}</Tab
          >
        </TabList>
        <TabPanels class="px-0">
          <TabPanel value="base">
            <UserTabProfile
              :user="user"
              :view-only="viewOnly"
              @update-user="updateUser"
              @stale-error="handleStaleError"
              @not-found-error="handleNotFoundError"
              @busy="(state) => (isLoadingAction = state)"
            />
          </TabPanel>
          <TabPanel value="email">
            <UserTabEmail
              :user="user"
              :view-only="viewOnly"
              @update-user="updateUser"
              @not-found-error="handleNotFoundError"
              @busy="(state) => (isLoadingAction = state)"
            />
          </TabPanel>
          <TabPanel value="security">
            <UserTabSecurity
              :user="user"
              :view-only="viewOnly"
              @update-user="updateUser"
              @stale-error="handleStaleError"
              @not-found-error="handleNotFoundError"
              @busy="(state) => (isLoadingAction = state)"
            />
          </TabPanel>
          <TabPanel value="others">
            <UserTabOtherSettings
              :user="user"
              :view-only="viewOnly"
              @update-user="updateUser"
              @stale-error="handleStaleError"
              @not-found-error="handleNotFoundError"
              @busy="(state) => (isLoadingAction = state)"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </OverlayComponent>

    <!-- Stale user modal -->
    <Dialog
      v-model:visible="modalVisible"
      data-test="stale-user-dialog"
      modal
      :style="{ width: '500px' }"
      :breakpoints="{ '575px': '90vw' }"
      :draggable="false"
      :close-on-escape="false"
      :dismissable-mask="false"
      :closable="false"
    >
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            :label="$t('app.reload')"
            :loading="isBusy"
            data-test="stale-dialog-reload-button"
            @click="refreshUser"
          />
        </div>
      </template>
      {{
        $t("app.errors.stale_model", {
          model: $t("app.model." + _.snakeCase(user.model_name)),
        })
      }}
    </Dialog>
  </div>
</template>

<script setup>
import env from "../env";
import { onMounted, ref, watch } from "vue";
import { useApi } from "../composables/useApi.js";
import { useRouter } from "vue-router";
import { useUserPermissions } from "../composables/useUserPermission.js";
import * as _ from "lodash-es";

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
  viewOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["updateUser", "busy", "loadingAction"]);

const user = ref(null);
const isBusy = ref(false);
const isLoadingAction = ref(false);
const loadingError = ref(false);
const staleError = ref({});
const modalVisible = ref(false);

const api = useApi();
const router = useRouter();
const userPermissions = useUserPermissions();

onMounted(() => {
  loadUser();
});

// detect busy status while data fetching and notify parent
watch(isBusy, () => {
  emit("busy", isBusy.value);
});
watch(isLoadingAction, () => {
  emit("loadingAction", isLoadingAction.value);
});

function handleNotFoundError(error) {
  router.push({ name: "admin.users" });
  api.error(error);
}

function handleStaleError(error) {
  staleError.value = error;
  modalVisible.value = true;
}

function updateUser(newUser) {
  user.value = newUser;
  emit("updateUser", newUser);
}

/**
 * Refreshes the current model with the new passed from the stale error response.
 */
function refreshUser() {
  user.value = staleError.value.new_model;
  user.value.roles.forEach((role) => {
    role.$isDisabled = role.automatic;
  });
  emit("updateUser", staleError.value.new_model);
  staleError.value = {};
  modalVisible.value = false;
}

/**
 * Load user from the API.
 */
function loadUser() {
  isBusy.value = true;

  api
    .call("users/" + props.id)
    .then((response) => {
      loadingError.value = false;
      user.value = response.data.data;
      user.value.roles.forEach((role) => {
        role.$isDisabled = role.automatic;
      });
      emit("updateUser", user.value);
    })
    .catch((error) => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        router.push({ name: "admin.users" });
      }

      loadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}

watch(user, (user) => {
  if (!userPermissions.can("update", user) && !props.viewOnly) {
    router.push({ name: "admin.users.view", params: { id: user.id } });
  }
});
</script>
