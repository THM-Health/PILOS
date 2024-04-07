<template>
  <Button
    severity="secondary"
    :label="expertMode? 'Expertenmodus deaktivieren': 'Expertenmodus aktivieren'"
    @click="showModal = true"
  />

  <Dialog
    v-model:visible="showModal"
    modal
    :header="expertMode? 'Expertenmodus deaktivieren': 'Expertenmodus aktivieren'"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
  >
    <div>
      {{expertMode? 'All settings will be reset to default': 'Default settings will not be updated anymore' }}
    </div>
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.no')" severity="secondary" @click="showModal = false" />
        <Button :label="$t('app.yes')" severity="danger"  @click="toggleExpertMode" />
      </div>
    </template>

  </Dialog>
</template>

<script setup>
import {ref} from "vue";

defineProps({
  expertMode: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['toggleExpertMode']);

const showModal = ref(false);

function toggleExpertMode(){
  showModal.value = false;
  emit('toggleExpertMode');
}

</script>

