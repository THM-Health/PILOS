<template>
  <Button
    v-tooltip="$t('rooms.description.tooltips.source_code')"
    severity="secondary"
    @click="openModal"
    icon="fa-solid fa-code"
  />
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.description.modals.source_code.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
  >

    <Textarea
      v-model="source"
      class="w-full mt-2"
      rows="5"
    />

    <template #footer>
      <div class="w-full flex justify-content-end">
          <Button
            severity="secondary"
            @click="modalVisible = false"
            :label="$t('app.cancel')"
          />
          <Button
            severity="success"
            class="ml-2"
            @click="save"
            :label="$t('app.save')"
          />
        </div>
    </template>
  </Dialog>
</template>
<script setup>

import { ref } from 'vue';

const props = defineProps([
  'editor'
]);

const source = ref(null);
const modalVisible = ref(false);

/**
 * Open modal with current source code
 */
function openModal () {
  source.value = props.editor.getHTML();
  modalVisible.value = true;
}

/**
 * Apply changes to the editor
 */
function save () {
  props.editor.commands.setContent(source.value, true);
  modalVisible.value = false;
}
</script>
