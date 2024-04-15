<template>
  <InputGroup v-if="model">
    <InputText :value="model.name" readonly :id="inputId" />
    <Button icon="fa-solid fa-edit" @click="editRoomType" :aria-label="$t('rooms.change_type.title')" />
  </InputGroup>

  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.change_type.title')"
    :style="{ width: '900px' }"
    :breakpoints="{ '975px': '90vw' }"
    :draggable="false"
    :dismissableMask="false"
  >
    <RoomTypeSelect
      ref="roomTypeSelect"
      v-model="newRoomType"
    />

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="modalVisible = false" />
        <Button :label="$t('app.save')" :disabled="!newRoomType" @click="handleOk" />
      </div>
    </template>
  </Dialog>

  <RoomTypeChangeConfirmationModal
    v-model="confirmationModalVisible"
    :current-settings="currentSettings"
    :new-room-type="newRoomType"
    @confirmed-room-type-change="(resetToDefaults) => changeRoomType(resetToDefaults)"
  />

</template>

<script setup>
import { ref } from 'vue';
import _ from 'lodash';
import { ROOM_SETTINGS_DEFINITION } from '../constants/roomSettings.js';
const model = defineModel();

const emit = defineEmits(['roomTypeChanged']);
const props = defineProps({
  currentSettings: {
    type: Object,
    required: true
  },
  inputId: {
    type: String,
    default: 'room-type'
  }
});

const modalVisible = ref(false);
const confirmationModalVisible = ref(false);

const newRoomType = ref(null);

function editRoomType () {
  newRoomType.value = _.cloneDeep(model.value);
  modalVisible.value = true;
}

function handleOk () {
  if (roomSettingsChanged()) {
    confirmationModalVisible.value = true;
  } else {
    changeRoomType();
  }
}

function roomSettingChanged (settingName) {
  // Check if default value of the setting changed / is different to the current setting
  if (props.currentSettings[settingName] !== newRoomType.value[settingName + '_default']) {
    return true;
  }
  // Check if the enforced status of the setting changed
  if (props.currentSettings.room_type[settingName + '_enforced'] !== newRoomType.value[settingName + '_enforced']) {
    return true;
  }

  // Setting did not change
  return false;
}

function roomSettingsChanged () {
  // Check access code setting for changes
  const currentSettingsHasAccessCode = props.currentSettings.access_code !== null;
  if (currentSettingsHasAccessCode !== newRoomType.value.has_access_code_default) {
    return true;
  }
  if (props.currentSettings.room_type.has_access_code_enforced !== newRoomType.value.has_access_code_enforced) {
    return true;
  }

  // Check all other visible settings for changes
  for (const setting in ROOM_SETTINGS_DEFINITION) {
    // check if expert mode is enabled or the setting is not an expert setting
    if (props.currentSettings.expert_mode || !ROOM_SETTINGS_DEFINITION[setting].expert_setting) {
      if (roomSettingChanged(setting)) return true;
    }
  }

  // There are no change
  return false;
}

function changeRoomType (resetToDefaults = false) {
  model.value = _.cloneDeep(newRoomType.value);
  modalVisible.value = false;
  confirmationModalVisible.value = false;

  emit('roomTypeChanged', resetToDefaults);
}

</script>
