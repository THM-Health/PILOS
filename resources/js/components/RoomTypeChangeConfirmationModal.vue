<template>

  <Dialog
    v-model:visible="modalVisible"
    :header="$t('rooms.change_type.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :dismissableMask="false"
    modal
  >
    <div class="overflow-y-auto" style="max-height:300px">
      {{ $t('rooms.change_type.changing_settings') }}

      <!-- Show all room setting grouped by category -->
      <div v-for="setting in roomTypeSettings" :key="setting.title">
        <h4 class="my-2">{{ setting.title }}</h4>

        <RoomTypeCompareSettingsField
          v-for="field in setting.settings"
          :key="field.key"
          :current-value="currentSettings[field.key]"
          :current-enforced="currentSettings.room_type[field.key+'_enforced']"
          :new-value="getResultingSetting(field.key)"
          :new-enforced="newRoomType[field.key+'_enforced']"
          :label="field.label"
          :type="field.type"
          :options="field.options"
        />
      </div>
    </div>

    <Divider class="mt-0"/>

    <div class="flex align-items-center gap-2">
      <InputSwitch
        input-id="reset-to-defaults"
        v-model="resetToDefaults"
      />
      <label for="reset-to-defaults"> {{$t('rooms.change_type.reset_to_default')}}</label>
    </div>
    <template #footer>
      <div class="flex  justify-content-end w-full gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="handleCancel" />
        <Button :label="$t('app.save')" @click="handleSave" />
      </div>
    </template>
  </Dialog>

</template>

<script setup>

import { ref } from 'vue';
import { useRoomTypeSettings } from '../composables/useRoomTypeSettings.js';

const modalVisible = defineModel();
const roomTypeSettings = useRoomTypeSettings();

const emit = defineEmits('confirmedRoomTypeChange');
const props = defineProps({
  currentSettings: {
    type: Object,
    required: true
  },
  newRoomType: {
    type: Object,
    required: true
  }
});

const resetToDefaults = ref(false);

/**
 * Get the setting that will be applied if the room type is changed to the new room type
 * @param settingName setting name of the setting
 * @returns {*|boolean} resulting setting value for the given setting name
 */
function getResultingSetting (settingName) {
  // Check if setting will be changed to default value
  if (resetToDefaults.value || props.newRoomType[settingName + '_enforced']) {
    // Return default value
    return props.newRoomType[settingName + '_default'];
  } else {
    // Return current setting value
    if (settingName === 'has_access_code') {
      return props.currentSettings.access_code !== null;
    }
    return props.currentSettings[settingName];
  }
}

function handleSave () {
  emit('confirmedRoomTypeChange', resetToDefaults.value);
  resetToDefaults.value = false;
}

function handleCancel () {
  modalVisible.value = false;
  resetToDefaults.value = false;
}
</script>
