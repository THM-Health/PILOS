<template>
  <div>
    <OverlayComponent :show="isBusy || loadingError">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadUser" />
      </template>
      <Tabs
        v-if="!isBusy && user"
        :value="activeTab"
        scrollable
        lazy
        @update:value="onActiveTabChanged"
      >
        <TabList>
          <Tab
            v-for="tab in availableTabs"
            :key="tab.key"
            :disabled="isLoadingAction"
            :value="tab.key"
            :data-test="tab.key + '-tab-button'"
          >
            <i :class="tab.icon" />
            {{ tab.label }}
          </Tab>
        </TabList>
        <TabPanels class="px-0">
          <TabPanel
            v-for="tab in availableTabs"
            :key="tab.key"
            :value="tab.key"
          >
            <component
              :is="tab.component"
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

      {{ staleError.message }}
    </Dialog>
  </div>
</template>

<script setup>
import env from "../env";
import { computed, onMounted, ref, watch } from "vue";
import { useApi } from "../composables/useApi.js";
import { useRouter } from "vue-router";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useUrlSearchParams } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import UserTabProfile from "./UserTabProfile.vue";
import UserTabEmail from "./UserTabEmail.vue";
import UserTabSecurity from "./UserTabSecurity.vue";
import UserTabOtherSettings from "./UserTabOtherSettings.vue";

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

const emit = defineEmits([
  "updateUser",
  "busy",
  "loadingAction",
  "activeTabChanged",
]);

const user = ref(null);
const isBusy = ref(false);
const isLoadingAction = ref(false);
const loadingError = ref(false);
const staleError = ref({});
const modalVisible = ref(false);
const activeTab = ref("base");

const api = useApi();
const router = useRouter();
const userPermissions = useUserPermissions();
const { t } = useI18n();
const hashParams = useUrlSearchParams("hash-params");

onMounted(() => {
  if (
    hashParams.tab &&
    availableTabs.value.some((tab) => tab.key === hashParams.tab)
  ) {
    activeTab.value = hashParams.tab;
    emit("activeTabChanged", activeTab.value);
  }
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

function onActiveTabChanged(newActiveTab) {
  activeTab.value = newActiveTab;
  hashParams.tab = newActiveTab;
  emit("activeTabChanged", newActiveTab);
}

const availableTabs = computed(() => {
  return [
    {
      key: "base",
      label: t("admin.users.base_data"),
      icon: "fa-solid fa-user",
      component: UserTabProfile,
    },
    {
      key: "email",
      label: t("app.email"),
      icon: "fa-solid fa-envelope",
      component: UserTabEmail,
    },
    {
      key: "security",
      label: t("app.security"),
      icon: "fa-solid fa-user-shield",
      component: UserTabSecurity,
    },
    {
      key: "others",
      label: t("admin.users.other_settings"),
      icon: "fa-solid fa-user-gear",
      component: UserTabOtherSettings,
    },
  ];
});

watch(user, (user) => {
  if (!userPermissions.can("update", user) && !props.viewOnly) {
    router.push({
      name: "admin.users.view",
      params: { id: user.id },
      hash: "#tab=" + activeTab.value,
    });
  }
});
</script>
