<template>
  <Button
    data-test="room-share-button"
    :label="$t('rooms.invitation.share')"
    icon="fa-solid fa-share-nodes"
    severity="secondary"
    class="shrink-0"
    @click="toggle"
  />
  <Popover ref="op" aria-labelledby="room-invitation-title">
    <div class="flex min-w-min flex-col items-start gap-4 p-2">
      <fieldset class="flex w-full flex-col gap-2">
        <legend
          id="room-invitation-title"
          class="block whitespace-nowrap font-bold"
        >
          {{ $t("rooms.invitation.title") }}
        </legend>
        <div class="grow">
          <InputGroup>
            <InputGroupAddon>
              <i
                v-tooltip="$t('rooms.invitation.link')"
                class="fa-solid fa-link"
                :aria-label="$t('rooms.invitation.link')"
              />
            </InputGroupAddon>
            <InputText
              id="invitationLink"
              :aria-label="$t('rooms.invitation.link')"
              readonly
              :value="roomUrl"
              @focus="$event.target.select()"
            />
            <InputGroupAddon>
              <Button
                severity="secondary"
                data-test="room-copy-invitation-link-button"
                :label="$t('rooms.invitation.copy_link')"
                icon="fa-solid fa-copy"
                @click="copyLink"
              />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Button
          data-test="room-copy-invitation-message-button"
          :label="$t('rooms.invitation.copy_invitation_message')"
          icon="fa-solid fa-copy"
          autofocus
          @click="copyInvitationText"
        />
      </fieldset>
    </div>
  </Popover>
</template>
<script setup>
import { useSettingsStore } from "../stores/settings";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useToast } from "../composables/useToast.js";

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
    required: true,
  },
});

function copyInvitationText() {
  navigator.clipboard.writeText(invitationMessage.value);
  toast.success(t("rooms.invitation.message_copied"));
}

function copyLink() {
  navigator.clipboard.writeText(roomUrl.value);
  toast.success(t("rooms.invitation.link_copied"));
}

const invitationMessage = computed(() => {
  return (
    t("rooms.invitation.room", {
      roomname: props.room.name,
      platform: settingsStore.getSetting("general.name"),
    }) +
    "\n" +
    t("rooms.invitation.link") +
    ": " +
    roomUrl.value
  );
});

const roomUrl = computed(() => {
  return (
    settingsStore.getSetting("general.base_url") +
    router.resolve({
      name: "rooms.view",
      params: { id: props.room.id },
      hash: props.room.access_code
        ? "#accessCode=" + props.room.access_code
        : "",
    }).href
  );
});
</script>
