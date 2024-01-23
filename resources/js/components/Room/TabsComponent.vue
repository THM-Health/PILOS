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
      <TabPanel v-if="room.description" >
        <template #header>
          <i class="fa-solid fa-file-lines mr-2" /> <span>{{ $t('rooms.description.title') }}</span>
        </template>
        <room-description-component
          :room="props.room"
        />
      </TabPanel>
      <!-- File management tab -->
      <TabPanel>
        <template #header>
          <i class="fa-solid fa-folder-open mr-2" /> <span>{{ $t('rooms.files.title') }}</span>
        </template>
        <file-component
          :access-code="props.accessCode"
          :token="props.token"
          :room="props.room"

          :require-agreement="true"
          :hide-reload="true"
          @invalid-code="$emit('invalidCode')"
          @invalid-token="$emit('invalidToken')"
          @guests-not-allowed="$emit('guestsNotAllowed')"
        />
      </TabPanel>
    </TabView>
  </div>
</template>
<script setup>
const props = defineProps({
  room: Object,
  accessCode: Number,
  token: String
});
</script>
