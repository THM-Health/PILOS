<template>
      <div class="p-card">
        <TabView
          content-class="p-3"
          fill
          active-nav-item-class="bg-primary"
          :lazy="true"
          :pt="{
            root: { class: 'room-tabs' },
            navContent: { class: 'border-round-top' }
          }"
        >
          <!-- Room description tab -->
          <TabPanel v-if="userPermissions.can('viewSettings', room) || room.description" >
            <template #header>
              <i class="fa-solid fa-file-lines mr-2" /> <span>{{ $t('rooms.description.title') }}</span>
            </template>
            <RoomTabDescription
              :room="props.room"
              @settings-changed="$emit('settingsChanged')"
            />
          </TabPanel>
          <!-- Membership tab -->
          <TabPanel v-if="userPermissions.can('viewSettings', room)">
            <template #header>
              <i class="fa-solid fa-users mr-2" /> <span>{{ $t('rooms.members.title') }}</span>
            </template>
            <RoomTabMembers
              :room="props.room"
            />
          </TabPanel>
          <!-- Personal room links tab -->
          <TabPanel
            v-if="userPermissions.can('viewSettings', room)"
            :pt="{
            headerAction: { class: 'white-space-nowrap' }
            }"
          >
            <template #header>
              <i class="fa-solid fa-link mr-2" /> <span>{{ $t('rooms.tokens.title') }}</span>
            </template>
            <RoomTabPersonalizedLinks
              :room="props.room"
            />
          </TabPanel>
          <!-- File management tab -->
          <TabPanel>
            <template #header>
              <i class="fa-solid fa-folder-open mr-2" /> <span>{{ $t('rooms.files.title') }}</span>
            </template>
            <RoomTabFiles
              :room="props.room"
              :access-code="props.accessCode"
              :token="props.token"
              :require-agreement="!userPermissions.can('viewSettings', room)"

              @invalid-code="$emit('invalidCode')"
              @invalid-token="$emit('invalidToken')"
              @guests-not-allowed="$emit('guestsNotAllowed')"
            />
          </TabPanel>
          <!-- Statistics tab -->
          <TabPanel v-if="userPermissions.can('viewSettings', room)">
            <template #header>
              <i class="fa-solid fa-history mr-2" /> <span>{{ $t('rooms.meeting_history.title') }}</span>
            </template>
            <RoomTabHistory
              :room="props.room"
            />
          </TabPanel>
          <!-- Room settings tab -->
          <TabPanel v-if="userPermissions.can('viewSettings', room)">
            <template #header>
              <i class="fa-solid fa-cog mr-2" /> <span>{{ $t('rooms.settings.title') }}</span>
            </template>
            <RoomTabSettings
              :room="props.room"
              @settings-changed="$emit('settingsChanged')"
            />
          </TabPanel>
        </TabView>
      </div>
</template>
<script setup>
import { useUserPermissions } from '../composables/useUserPermission.js';

const props = defineProps({
  room: Object,
  accessCode: Number,
  token: String
});

const userPermissions = useUserPermissions();
</script>
