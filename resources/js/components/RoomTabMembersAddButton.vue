<template>
  <!-- Add user / users -->
  <Button
    type="button"
    severity="success"
    icon="fa-solid fa-user-plus"
    :aria-label="$t('rooms.members.add_user')"
    v-tooltip="$t('rooms.members.add_user')"
    @click="toggle"
    aria-haspopup="true"
    aria-controls="overlay_menu"
    :disabled="props.disabled"
  />
  <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const singleModal = ref();
const importModal = ref();

const menu = ref();
const items = computed(() => [
  {
    label: t('rooms.members.add_single_user'),
    command: () => singleModal.value.openModal()
  },
  {
    label: t('rooms.members.bulk_import_users'),
    command: () => importModal.value.openModal()
  }
]);

const toggle = (event) => {
  menu.value.toggle(event);
};

</script>
