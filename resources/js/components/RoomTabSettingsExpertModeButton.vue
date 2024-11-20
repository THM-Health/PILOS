<template>
  <Button
    data-test="room-settings-expert-mode-button"
    severity="secondary"
    icon="fa-solid fa-cog"
    :label="
      expertMode
        ? $t('rooms.settings.expert_mode.deactivate')
        : $t('rooms.settings.expert_mode.activate')
    "
    :disabled="disabled"
    @click="modalVisible = true"
  />

  <Dialog
    v-model:visible="modalVisible"
    data-test="room-settings-expert-mode-dialog"
    modal
    :header="
      expertMode
        ? $t('rooms.settings.expert_mode.deactivate')
        : $t('rooms.settings.expert_mode.activate')
    "
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
  >
    <div>
      {{
        expertMode
          ? $t("rooms.settings.expert_mode.warning.deactivate")
          : $t("rooms.settings.expert_mode.warning.activate")
      }}
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          data-test="dialog-cancel-button"
          :label="$t('app.cancel')"
          severity="secondary"
          @click="modalVisible = false"
        />
        <Button
          data-test="dialog-continue-button"
          :label="
            expertMode
              ? $t('rooms.settings.expert_mode.deactivate')
              : $t('rooms.settings.expert_mode.activate')
          "
          severity="danger"
          @click="toggleExpertMode"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  expertMode: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["toggleExpertMode"]);

const modalVisible = ref(false);

function toggleExpertMode() {
  modalVisible.value = false;
  emit("toggleExpertMode");
}
</script>
