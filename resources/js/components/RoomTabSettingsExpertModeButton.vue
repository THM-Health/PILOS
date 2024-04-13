<template>
  <Button
    severity="secondary"
    icon="fa-solid fa-cog"
    :label="expertMode? $t('rooms.settings.expert_mode.deactivate'): $t('rooms.settings.expert_mode.activate')"
    @click="showModal = true"
    :disabled="disabled"
  />

  <Dialog
    v-model:visible="showModal"
    modal
    :header="expertMode? $t('rooms.settings.expert_mode.deactivate'): $t('rooms.settings.expert_mode.activate')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
  >
    <div>
      {{expertMode? $t('rooms.settings.expert_mode.warning.deactivate'): $t('rooms.settings.expert_mode.warning.activate') }}
    </div>
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button
          :label=" $t('app.cancel')"
          severity="secondary"
          @click="showModal = false"
        />
        <Button
          :label="expertMode? $t('rooms.settings.expert_mode.deactivate'): $t('rooms.settings.expert_mode.activate')"
          severity="danger"
          @click="toggleExpertMode"
        />
      </div>
    </template>

  </Dialog>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  expertMode: {
    type: Boolean,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggleExpertMode']);

const showModal = ref(false);

function toggleExpertMode () {
  showModal.value = false;
  emit('toggleExpertMode');
}

</script>
