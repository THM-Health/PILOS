<template>
      <Card
        :pt="{
          body: { class: 'p-4' }
        }"
      >
        <template #content>
          <Toolbar class="m-0 p-0 border-0">
            <template #start>
              <i class="mr-2" :class="activeTab?.icon" /> <h3 class="m-0">{{ activeTab?.label }}</h3>
            </template>
            <template #end>
              <div class="hidden md:flex flex-row gap-2 ">
                <Button v-for="menuItem in menuItems" :key="menuItem.id" :severity="menuItem.active ? 'primary' : 'secondary'" @click="menuItem.command" :icon="menuItem.icon" v-tooltip.bottom="menuItem.label"/>
              </div>

              <div class="block md:hidden">
                <Button type="button" severity="secondary" text icon="fa-solid fa-ellipsis-vertical" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu" />
                <Menu ref="menu" id="overlay_menu" :model="menuItems" :popup="true" />
              </div>

            </template>
          </Toolbar>
          <Divider />

          <RoomTabDescription
            v-if="activeTabKey === 'description'"
            :room="props.room"
            @settings-changed="$emit('settingsChanged')"
          />

          <!-- Membership tab -->
          <RoomTabMembers
            v-if="activeTabKey === 'members'"
            :room="props.room"
          />

            <!-- Personal room links tab -->
            <RoomTabPersonalizedLinks
              v-if="activeTabKey === 'tokens'"
              :room="props.room"
            />

            <!-- File management tab -->
            <RoomTabFiles
              v-if="activeTabKey === 'files'"
              :room="props.room"
              :access-code="props.accessCode"
              :token="props.token"
              :require-agreement="!userPermissions.can('viewSettings', room)"

              @invalid-code="$emit('invalidCode')"
              @invalid-token="$emit('invalidToken')"
              @guests-not-allowed="$emit('guestsNotAllowed')"
            />

            <!-- Recordings tab -->
            <RoomTabRecordings
              v-if="activeTabKey === 'recordings'"
              :room="props.room"
              :access-code="props.accessCode"
              :token="props.token"

              @invalid-code="$emit('invalidCode')"
              @invalid-token="$emit('invalidToken')"
              @guests-not-allowed="$emit('guestsNotAllowed')"
            />

            <!-- Statistics tab -->
            <RoomTabHistory
              v-if="activeTabKey === 'history'"
              :room="props.room"
            />

            <!-- Room settings tab -->
            <RoomTabSettings
              v-if="activeTabKey === 'settings'"
              :room="props.room"
              @settings-changed="$emit('settingsChanged')"
            />
        </template>
      </Card>
</template>
<script setup>
import { useUserPermissions } from '../composables/useUserPermission.js';
import {computed, onMounted, ref} from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  room: Object,
  accessCode: Number,
  token: String
});

const menu = ref();
const toggle = (event) => {
  menu.value.toggle(event);
};

onMounted(() => {
  activeTabKey.value = availableTabs.value[0].key;
});

const activeTabKey = ref('');

const activeTab = computed(() => {
  return availableTabs.value.find(tab => tab.key === activeTabKey.value);
});

const availableTabs = computed(() => {
  const tabs = [];

  if (userPermissions.can('viewSettings', props.room) || props.room.description) {
    tabs.push({ key: 'description', label: t('rooms.description.title'), icon: 'fa-solid fa-file-lines' });
  }

  if (userPermissions.can('viewSettings', props.room)) {
    tabs.push({ key: 'members', label: t('rooms.members.title'), icon: 'fa-solid fa-users' });
    tabs.push({ key: 'tokens', label: t('rooms.tokens.title'), icon: 'fa-solid fa-link' });
  }

  tabs.push({ key: 'files', label: t('rooms.files.title'), icon: 'fa-solid fa-folder-open' });
  tabs.push({ key: 'recordings', label: t('rooms.recordings.title'), icon: 'fa-solid fa-circle-play' });

  if (userPermissions.can('viewSettings', props.room)) {
    tabs.push({ key: 'history', label: t('rooms.meeting_history.title'), icon: 'fa-solid fa-history' });
    tabs.push({ key: 'settings', label: t('rooms.settings.title'), icon: 'fa-solid fa-cog' });
  }

  return tabs;
});

const menuItems = computed(() => {
  return availableTabs.value.map(tab => {
    return {
      key: tab.key,
      active: tab.key === activeTabKey.value,
      class: tab.key === activeTabKey.value ? 'active-menu-item' : '',
      label: tab.label,
      icon: tab.icon,
      command: () => {
        activeTabKey.value = tab.key;
      }
    };
  });
});

const userPermissions = useUserPermissions();
</script>
