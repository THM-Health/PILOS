<template>
  <Panel
    :header="$t('rooms.access_for_participants')"
    :toggleable="true"
    :collapsed="true"
    :pt="{
        header: { class: 'p-1 pl-3' },
        content: { class: 'p-1' }
    }"
  >
    <template #togglericon="slotProps">
      <i class="fa-solid" :class="slotProps.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
    </template>
    <template #icons>
      <button
        class="p-panel-header-icon p-link mr-2"
        @click="copyInvitationText"
        v-tooltip="$t('rooms.copy_access_for_participants')"
        :aria-label="$t('rooms.copy_access_for_participants')"
      >
        <span class="fa-solid fa-copy"></span>
      </button>
    </template>

    <div class="flex justify-content-between align-items-start gap-3">
      <div class="flex-grow-1">
        <IconField iconPosition="left">
          <InputIcon>
            <i
              class="fa-solid fa-link"
              v-tooltip="$t('rooms.invitation.link')"
            />
          </InputIcon>
          <InputText
            class="border-0 shadow-none w-full"
            id="invitationLink"
            :aria-label="$t('rooms.invitation.link')"
            readonly
            :value="roomUrl"
            @focus="$event.target.select()"
          />
        </IconField>

        <IconField iconPosition="left" v-if="room.access_code">
          <InputIcon>
            <i
              class="fa-solid fa-key"
              v-tooltip="$t('rooms.invitation.code')"
            />
          </InputIcon>
          <InputText
            class="border-0 shadow-none w-full"
            id="invitationLink"
            :aria-label="$t('rooms.invitation.code')"
            readonly
            :value="formattedAccessCode"
            @focus="$event.target.select()"
          />
        </IconField>
      </div>
    </div>
  </Panel>
</template>
<script setup>
import { useSettingsStore } from '../stores/settings';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';

const settingsStore = useSettingsStore();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

function copyInvitationText () {
  let message = t('rooms.invitation.room', { roomname: props.room.name, platform: settingsStore.getSetting('name') }) + '\n';
  message += t('rooms.invitation.link') + ': ' + roomUrl.value;
  // If room has access code, include access code in the message
  if (props.room.access_code) {
    message += '\n' + t('rooms.invitation.code') + ': ' + formattedAccessCode.value;
  }
  navigator.clipboard.writeText(message);
  toast.success(t('rooms.invitation.copied'));
}

const roomUrl = computed(() => {
  return settingsStore.getSetting('base_url') + router.resolve({
    name: 'rooms.view',
    params: { id: props.room.id }
  }).href;
});

const formattedAccessCode = computed(() => {
  return String(props.room.access_code).match(/.{1,3}/g).join('-');
});

</script>
