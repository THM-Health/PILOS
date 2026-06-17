<template>
  <Button
    data-test="room-share-button"
    :label="$t('rooms.invitation.share')"
    icon="fa-solid fa-share-nodes"
    severity="secondary"
    class="shrink-0"
    @click="toggle"
  />
  <Popover ref="op" aria-labelledby="room-invitation-title" aria-modal="false">
    <div class="flex min-w-min flex-col items-start gap-4 p-2">
      <fieldset class="flex w-full flex-col gap-2">
        <legend
          id="room-invitation-title"
          class="block font-bold whitespace-nowrap"
        >
          {{ $t("rooms.invitation.title") }}
        </legend>
        <div class="grow">
          <div class="mt-2 flex flex-row items-center">
            <InputGroup>
              <InputGroupAddon
                class="min-w-5 border-none px-0 dark:bg-surface-900"
              >
                <i
                  v-tooltip="$t('rooms.invitation.link')"
                  class="fa-solid fa-link"
                  :aria-label="$t('rooms.invitation.link')"
                />
              </InputGroupAddon>
              <InputText
                id="invitationLink"
                class="w-full border-none text-ellipsis shadow-none dark:bg-surface-900"
                :aria-label="$t('rooms.invitation.link')"
                readonly
                :value="roomUrl"
                @focus="$event.target.select()"
              />
            </InputGroup>

            <Button
              v-tooltip="$t('rooms.invitation.copy_url')"
              data-test="room-invitation-copy-link-button"
              class="shrink-0"
              :aria-label="$t('rooms.invitation.copy_url')"
              icon="fa-solid fa-copy"
              severity="secondary"
              @click="copyUrl"
            />
          </div>

          <div v-if="room.access_code" class="mt-2 flex flex-row items-center">
            <InputGroup>
              <InputGroupAddon
                class="min-w-5 border-none px-0 dark:bg-surface-900"
              >
                <i
                  v-tooltip="$t('rooms.invitation.code')"
                  class="fa-solid fa-key"
                  :aria-label="$t('rooms.invitation.code')"
                />
              </InputGroupAddon>
              <InputText
                id="invitationCode"
                class="w-full border-none shadow-none dark:bg-surface-900"
                :aria-label="$t('rooms.invitation.code')"
                readonly
                :value="formattedAccessCode"
                @focus="$event.target.select()"
              />
            </InputGroup>

            <Button
              v-tooltip="$t('rooms.invitation.copy_code')"
              data-test="room-invitation-copy-code-button"
              class="shrink-0"
              :aria-label="$t('rooms.invitation.copy_code')"
              icon="fa-solid fa-copy"
              severity="secondary"
              @click="copyCode"
            />
          </div>
        </div>
      </fieldset>
      <divider class="m-0" />
      <Button
        data-test="room-copy-invitation-button"
        :label="$t('rooms.invitation.copy_message')"
        class="w-full"
        icon="fa-solid fa-copy"
        autofocus
        @click="copyInvitationMessage"
      />
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

function copyInvitationMessage() {
  let message =
    t("rooms.invitation.room", {
      roomname: props.room.name,
      platform: settingsStore.getSetting("general.name"),
    }) + "\n";
  message += t("rooms.invitation.link") + ": " + roomUrl.value;
  // If room has access code, include access code in the message
  if (props.room.access_code) {
    message +=
      "\n" + t("rooms.invitation.code") + ": " + formattedAccessCode.value;
  }
  navigator.clipboard.writeText(message);
  toast.success(t("rooms.invitation.copied_message"));
}

function copyUrl() {
  navigator.clipboard.writeText(roomUrl.value);
  toast.success(t("rooms.invitation.copied_url"));
}

function copyCode() {
  navigator.clipboard.writeText(formattedAccessCode.value);
  toast.success(t("rooms.invitation.copied_code"));
}

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

const formattedAccessCode = computed(() => {
  return props.room.legacy_code
    ? props.room.access_code
    : String(props.room.access_code)
        .match(/.{1,3}/g)
        .join("-");
});
</script>
