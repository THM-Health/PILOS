<template>
      <div class="p-card overflow-hidden">
        <TabView
          content-class="p-3"
          fill
          active-nav-item-class="bg-primary"
          :lazy="true"
          :pt="{
            root: { class: 'room-tabs' },
          }"
        >
          <!-- Room description tab -->
          <TabPanel >
            <template #header>
              <i class="fa-solid fa-file-lines mr-2" /> <span>{{ $t('rooms.description.title') }}</span>
            </template>
            <room-description-component
              :room="props.room"
              @settings-changed="$emit('settingsChanged')"
            />
          </TabPanel>
          <!-- Membership tab -->
          <TabPanel>
            <template #header>
              <i class="fa-solid fa-users mr-2" /> <span>{{ $t('rooms.members.title') }}</span>
            </template>
            <members-component
              :room="props.room"
            />
          </TabPanel>
          <!-- Personal room links tab -->
          <TabPanel :pt="{
            headerAction: { class: 'white-space-nowrap' }
          }">
            <template #header>
              <i class="fa-solid fa-link mr-2" /> <span>{{ $t('rooms.tokens.title') }}</span>
            </template>
            <tokens-component
              :room="props.room"
            />
          </TabPanel>
          <!-- File management tab -->
          <TabPanel>
            <template #header>
              <i class="fa-solid fa-folder-open mr-2" /> <span>{{ $t('rooms.files.title') }}</span>
            </template>
            <file-component
              :room="props.room"
            />
          </TabPanel>
          <!-- Statistics tab -->
          <TabPanel>
            <template #header>
              <i class="fa-solid fa-history mr-2" /> <span>{{ $t('rooms.meeting_history.title') }}</span>
            </template>
            <history-component
              :room="props.room"
            />
          </TabPanel>
          <!-- Room settings tab -->
          <TabPanel>
            <template #header>
              <i class="fa-solid fa-cog mr-2" /> <span>{{ $t('rooms.settings.title') }}</span>
            </template>
            <settings-component
              :room="props.room"
              @settings-changed="$emit('settingsChanged')"
            />
          </TabPanel>
        </TabView>
      </div>
</template>
<script setup>
const props = defineProps({
  room: Object
});
</script>
