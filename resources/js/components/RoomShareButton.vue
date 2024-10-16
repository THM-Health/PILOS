<template>
  <Button
    data-test="room-share-button"
    :label="$t('rooms.invitation.share')"
    icon="fa-solid fa-share-nodes"
    severity="secondary"
    @click="toggle"
    class="shrink-0"
  />
  <Popover ref="op" aria-labelledby="room-invitation-title">
    <div class="flex flex-col items-start gap-4 min-w-min p-2">
      <fieldset class="flex w-full flex-col gap-2">
        <legend id="room-invitation-title" class="font-bold block whitespace-nowrap">{{ $t('rooms.invitation.title') }}</legend>
        <div class="grow">
          <IconField iconPosition="left">
            <InputIcon>
              <i
                class="fa-solid fa-link"
                v-tooltip="$t('rooms.invitation.link')"
              />
            </InputIcon>
            <InputText
              class="border-surface-0 dark:border-surface-900 shadow-none w-full text-ellipsis"
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
              class="border-surface-0 dark:border-surface-900 shadow-none w-full"
              id="invitationCode"
              :aria-label="$t('rooms.invitation.code')"
              readonly
              :value="formattedAccessCode"
              @focus="$event.target.select()"
            />
          </IconField>
        </div>
      </fieldset>
      <Button
        data-test="room-copy-invitation-button"
        @click="copyInvitationText"
        :label="$t('rooms.invitation.copy')"
        icon="fa-solid fa-copy"
        autofocus
      />
    </div>
  </Popover>
</template>
<script setup>
import { useSettingsStore } from '../stores/settings';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';

const settingsStore = useSettingsStore();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const op = ref();
const toggle = (event) => {
  op.value.toggle(event);
};

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

function copyInvitationText () {
  let message = t('rooms.invitation.room', { roomname: props.room.name, platform: settingsStore.getSetting('general.name') }) + '\n';
  message += t('rooms.invitation.link') + ': ' + roomUrl.value;
  // If room has access code, include access code in the message
  if (props.room.access_code) {
    message += '\n' + t('rooms.invitation.code') + ': ' + formattedAccessCode.value;
  }
  navigator.clipboard.writeText(message);
  toast.success(t('rooms.invitation.copied'));
}

const roomUrl = computed(() => {
  return settingsStore.getSetting('general.base_url') + router.resolve({
    name: 'rooms.view',
    params: { id: props.room.id }
  }).href;
});

const formattedAccessCode = computed(() => {
  return String(props.room.access_code).match(/.{1,3}/g).join('-');
});

</script>
