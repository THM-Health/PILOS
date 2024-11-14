<template>
  <!-- Add user / users -->
  <Button
    v-tooltip="$t('rooms.members.add_user')"
    type="button"
    icon="fa-solid fa-user-plus"
    :aria-label="$t('rooms.members.add_user')"
    aria-haspopup="true"
    aria-controls="overlay_menu"
    :disabled="props.disabled"
    data-test="room-members-add-button"
    @click="toggle"
  />
  <Menu id="overlay_menu" ref="menu" :model="items" :popup="true" />
  <!-- Add existing user from database -->
  <RoomTabMembersAddSingleModal
    ref="singleModal"
    :room-id="props.roomId"
    @added="$emit('added')"
  />

  <!-- Bulk Import -->
  <RoomTabMembersBulkImportModal
    ref="importModal"
    :room-id="props.roomId"
    @imported="$emit('added')"
  />
</template>
<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineEmits(["added"]);

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const singleModal = ref();
const importModal = ref();

const menu = ref();
const items = computed(() => [
  {
    label: t("rooms.members.add_single_user"),
    command: () => singleModal.value.showModal(),
  },
  {
    label: t("rooms.members.bulk_import_users"),
    command: () => importModal.value.showModal(),
  },
]);

const toggle = (event) => {
  menu.value.toggle(event);
};
</script>
