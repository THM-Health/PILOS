<template>
  <Fieldset
    :legend="$t('rooms.access_for_participants')"
    :pt="{
        root: { class: 'm-0' },
        content: { class: 'p-0' },
        legend: { class: 'p-2 bg-primary' }
    }"
  >
    <div class="flex justify-content-between align-items-start gap-3">
      <div class="flex-grow-1">
        <div class="p-input-icon-left w-full">
          <i
             class="fa-solid fa-link"
             v-tooltip="$t('rooms.invitation.link')"
           />
          <InputText
            class="border-0 w-full"
            id="invitationLink"
            :aria-label="$t('rooms.invitation.link')"
            readonly
            :value="roomUrl"
            @focus="$event.target.select()"
          />
        </div>
        <div v-if="room.access_code" class="p-input-icon-left w-full mt-2">
          <i
            class="fa-solid fa-key"
            v-tooltip="$t('rooms.invitation.code')"
          />
          <InputText
            class="border-0 w-full text-color"
            id="invitationLink"
            :aria-label="$t('rooms.invitation.code')"
            readonly
            :value="formattedAccessCode"
            @focus="$event.target.select()"
          />
        </div>
      </div>
      <Button
        v-tooltip="$t('rooms.copy_access_for_participants')"
        class="float-right flex-shrink-0"
        :aria-label="$t('rooms.copy_access_for_participants')"
        variant="light"
        @click="copyInvitationText"
        icon="fa-solid fa-copy"
      />
    </div>
  </Fieldset>
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
