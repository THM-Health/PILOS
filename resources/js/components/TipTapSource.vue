<template>
  <Button
    v-tooltip="$t('rooms.description.tooltips.source_code')"
    :aria-label="$t('rooms.description.tooltips.source_code')"
    severity="secondary"
    text
    icon="fa-solid fa-code"
    data-test="tip-tap-source-button"
    @click="showModal"
  />
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.description.modals.source_code.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    data-test="tip-tap-source-dialog"
  >
    <Textarea
      v-model="source"
      autofocus
      class="mt-2 w-full"
      rows="5"
      data-test="source-textarea"
    />

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <Button
          severity="secondary"
          :label="$t('app.cancel')"
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.save')"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { ref } from "vue";

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
});

const source = ref(null);
const modalVisible = ref(false);

/**
 * Open modal with current source code
 */
function showModal() {
  source.value = props.editor.getHTML();
  modalVisible.value = true;
}

/**
 * Apply changes to the editor
 */
function save() {
  props.editor.commands.setContent(source.value, true);
  modalVisible.value = false;
}
</script>
