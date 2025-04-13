<template>
  <Card class="mt-6">
    <template #header>
      <!-- Tab header -->
      <div
        class="mb-5 flex flex-row justify-between border-b px-6 py-4 border-surface"
      >
        <!-- Current tab -->
        <div class="flex flex-row items-center gap-2 px-2 text-xl">
          <i :class="activeTab?.icon" />
          <h2 class="m-0">{{ activeTab?.label }}</h2>
        </div>
        <!-- Tab navigation -->
        <div v-if="availableTabs.length > 1" role="tablist">
          <!-- Desktop layout, icons only-->
          <div class="hidden flex-row gap-2 md:flex" @keydown="keydownHandler">
            <Button
              v-for="tab in availableTabs"
              :id="'tab-' + tab.key"
              :key="tab.key"
              v-tooltip.bottom="tab.label"
              :severity="tab.active ? 'contrast' : 'secondary'"
              :icon="tab.icon"
              :aria-label="tab.label"
              role="tab"
              :data-feature-disabled="!!tab.featureDisabled"
              :aria-selected="tab.active"
              :aria-controls="'panel-' + tab.key"
              :tabindex="tab.active ? 0 : -1"
              :class="tab.class"
              @click="tab.command"
            />
          </div>
          <!-- Mobile layout, dropdown menu -->
          <div class="block md:hidden">
            <Button
              type="button"
              severity="secondary"
              text
              icon="fa-solid fa-ellipsis-vertical"
              aria-haspopup="true"
              aria-controls="overlay_menu"
              @click="toggle"
            />
            <Menu
              id="overlay_menu"
              ref="menu"
              :model="availableTabs"
              :popup="true"
              role="tablist"
            >
              <template #item="slotProps">
                <a class="flex items-center" v-bind="slotProps.props.action">
                  <span :class="slotProps.item.icon" />
                  <span>{{ slotProps.item.label }}</span>

                  <i
                    v-if="slotProps.item.featureDisabled"
                    class="fa-solid fa-ban ml-auto"
                  ></i>
                </a>
              </template>
            </Menu>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <!-- Tab content -->
      <div
        v-for="tab in availableTabs"
        :id="'panel-' + tab.key"
        :key="tab.key"
        role="tabpanel"
        :aria-labelledby="'tab-' + tab.key"
        :hidden="!tab.active"
        tabindex="0"
      >
        <!-- Dynamic component, mounting only when tab is active -->
        <!-- Each tab can use this kind of api, with are the props and events defined here -->
        <component
          :is="tab.component"
          v-if="tab.active && !tab.disabled"
          :room="props.room"
          :access-code="props.accessCode"
          :token="props.token"
          @invalid-code="$emit('invalidCode')"
          @invalid-token="$emit('invalidToken')"
          @guests-not-allowed="$emit('guestsNotAllowed')"
          @settings-changed="$emit('settingsChanged')"
        />
      </div>
    </template>
  </Card>
  <Dialog
    v-model:visible="disabledFeatureModalVisible"
    modal
    data-test="room-feature-disabled-dialog"
    :show-header="false"
    :draggable="false"
    :style="{ width: '25rem' }"
  >
    <div class="mb-5 mt-4 flex justify-center">
      <Badge
        severity="contrast"
        class="flex h-16 w-16 items-center justify-center rounded-full"
      >
        <i
          class="fa-solid fa-ban text-4xl text-white dark:text-surface-950"
        ></i>
      </Badge>
    </div>

    <span v-if="disabledFeatureReason === 'system'">
      {{ $t("rooms.feature_disabled_system", { name: disabledFeatureName }) }}
    </span>
    <span v-else-if="disabledFeatureReason === 'roomtype'">
      {{ $t("rooms.feature_disabled_roomtype", { name: disabledFeatureName }) }}
    </span>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          :label="$t('app.close')"
          severity="secondary"
          icon="fa-solid fa-times"
          data-test="dialog-close-button"
          @click="disabledFeatureModalVisible = false"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { useUserPermissions } from "../composables/useUserPermission.js";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import RoomTabDescription from "./RoomTabDescription.vue";
import RoomTabMembers from "./RoomTabMembers.vue";
import RoomTabPersonalizedLinks from "./RoomTabPersonalizedLinks.vue";
import RoomTabFiles from "./RoomTabFiles.vue";
import RoomTabHistory from "./RoomTabHistory.vue";
import RoomTabSettings from "./RoomTabSettings.vue";
import RoomTabRecordings from "./RoomTabRecordings.vue";
import { onRoomHasChanged } from "../composables/useRoomHelpers.js";
import { useUrlSearchParams } from "@vueuse/core";
import { useSettingsStore } from "../stores/settings.js";
import RoomTabStreaming from "./RoomTabStreaming.vue";

defineEmits([
  "invalidCode",
  "invalidToken",
  "guestsNotAllowed",
  "settingsChanged",
]);

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  accessCode: {
    type: Number,
    default: null,
  },
  token: {
    type: String,
    default: null,
  },
});

const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
const { t } = useI18n();

// Dropdown menu for mobile layout
const menu = ref();

const disabledFeatureModalVisible = ref(false);
const disabledFeatureReason = ref("");
const disabledFeatureName = ref("");

const toggle = (event) => {
  menu.value.toggle(event);
};

const showDisabledFeatureModal = (name, reason) => {
  disabledFeatureName.value = name;
  disabledFeatureReason.value = reason;
  disabledFeatureModalVisible.value = true;
};

// Current active tab
const activeTabKey = ref("");

const hashParams = useUrlSearchParams("hash-params");

// Initial tab selection
onMounted(() => {
  // Check if tab selection is saved in URL hash and try to select it if it exists
  if (hashParams.tab) {
    if (availableTabs.value.find((tab) => tab.key === hashParams.tab)) {
      activeTabKey.value = hashParams.tab;
      return;
    }
  }
  // Default and fallback to first tab
  activeTabKey.value = availableTabs.value[0].key;
});

onRoomHasChanged(
  () => props.room,
  () => onRoomChanged(),
);

function onRoomChanged() {
  // If active tab has become undefined, fallback to first tab
  if (activeTab.value === undefined) {
    activeTabKey.value = availableTabs.value[0].key;
    hashParams.tab = activeTabKey.value;
  }
}

const availableTabs = computed(() => {
  const tabs = [];

  if (
    userPermissions.can("viewSettings", props.room) ||
    props.room.description
  ) {
    tabs.push({
      key: "description",
      label: t("rooms.description.title"),
      icon: "fa-solid fa-file-lines",
      component: RoomTabDescription,
    });
  }

  if (userPermissions.can("viewSettings", props.room)) {
    tabs.push({
      key: "members",
      label: t("rooms.members.title"),
      icon: "fa-solid fa-users",
      component: RoomTabMembers,
    });
    tabs.push({
      key: "tokens",
      label: t("rooms.tokens.title"),
      icon: "fa-solid fa-link",
      component: RoomTabPersonalizedLinks,
    });
  }

  tabs.push({
    key: "files",
    label: t("rooms.files.title"),
    icon: "fa-solid fa-folder-open",
    component: RoomTabFiles,
  });
  tabs.push({
    key: "recordings",
    label: t("rooms.recordings.title"),
    icon: "fa-solid fa-play-circle",
    component: RoomTabRecordings,
  });

  if (userPermissions.can("viewSettings", props.room)) {
    tabs.push({
      key: "streaming",
      label: t("rooms.streaming.title"),
      icon: "fa-solid fa-broadcast-tower",
      component: RoomTabStreaming,
      disabled: !settingsStore.getSetting("streaming.enabled")
        ? "system"
        : !props.room.type.features.streaming.enabled
          ? "roomtype"
          : false,
    });
  }

  if (userPermissions.can("viewSettings", props.room)) {
    tabs.push({
      key: "history",
      label: t("rooms.meeting_history.title"),
      icon: "fa-solid fa-history",
      component: RoomTabHistory,
    });
    tabs.push({
      key: "settings",
      label: t("rooms.settings.title"),
      icon: "fa-solid fa-cog",
      component: RoomTabSettings,
    });
  }

  return tabs
    .filter((tab) => {
      if (
        tab.disabled &&
        settingsStore.getSetting("general.hide_disabled_features")
      )
        return false;

      return true;
    })
    .map((tab) => {
      const classes = [];
      if (tab.disabled) {
        classes.push("opacity-60");
        classes.push("cursor-not-allowed");
      }

      return {
        key: tab.key,
        active: tab.key === activeTabKey.value,
        class: classes.join(" "),
        label: tab.label,
        icon: tab.icon,
        component: tab.component,
        featureDisabled: tab.disabled,
        //disabled: tab.disabled,
        command: () => {
          if (tab.disabled) {
            showDisabledFeatureModal(tab.label, tab.disabled);
            return;
          }

          activeTabKey.value = tab.key;
          // Save tab selection in URL hash
          hashParams.tab = tab.key;
        },
      };
    });
});

// Array of all tabs available to the user
const activeTab = computed(() => {
  return availableTabs.value.find((tab) => tab.key === activeTabKey.value);
});

// Keyboard navigation
const tabFocus = ref(0);
const keydownHandler = function (event) {
  switch (event.key) {
    case "ArrowLeft":
      if (tabFocus.value - 1 < 0) {
        tabFocus.value = availableTabs.value.length - 1;
      } else {
        tabFocus.value--;
      }
      focusTab(tabFocus.value);
      break;
    case "ArrowRight":
      if (tabFocus.value + 1 > availableTabs.value.length - 1) {
        tabFocus.value = 0;
      } else {
        tabFocus.value++;
      }
      focusTab(tabFocus.value);
      break;
    default:
  }
};

const focusTab = function (newTab) {
  newTab = availableTabs.value[newTab];
  document.getElementById("tab-" + newTab.key).focus();
};
</script>
