<template>
  <Button
    v-tooltip="$t('rooms.description.tooltips.link')"
    :severity="props.editor.isActive('link') ? 'primary' : 'secondary'"
    @click="openModal"
    icon="fa-solid fa-link"
  />
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="newLink ? $t('rooms.description.modals.link.new') : $t('rooms.description.modals.link.edit')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
  >
    <div class="flex flex-column gap-2 mt-4">
      <label for="url">{{ $t('rooms.description.modals.link.url') }}</label>
      <InputText
        id="url"
        v-model.trim="link"
        :invalid="urlInvalid"
      />
      <p v-if="urlInvalid" class="p-error">{{ $t('rooms.description.modals.link.invalid_url') }}</p>
    </div>

    <template #footer>
      <div class="w-full flex justify-content-between gap-2">
        <div>
          <Button
            v-if="!newLink"
            severity="danger"
            @click="deleteLink"
            :label="$t('app.delete')"
          />
        </div>
        <div class="flex gap-2">
          <Button
            severity="secondary"
            @click="modalVisible = false"
            :label="$t('app.cancel')"
          />
          <Button
            severity="success"
            :disabled="urlInvalid !== false"
            @click="save"
            :label="$t('app.save')"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { computed, ref } from 'vue';

const props = defineProps([
  'editor'
]);

const link = ref(null);
const newLink = ref(true);
const modalVisible = ref(false);

const urlInvalid = computed(() => {
  // Only return state if link is not empty
  if (link.value === null || link.value === '') {
    return null;
  }
  // regex checks if url starts with http://, https:// or mailto:
  const regex = /^(https|http|mailto):\/\//;
  return regex.exec(link.value) == null;
});

/**
 * Delete link and close modal
 */
function deleteLink () {
  props.editor.chain().focus().unsetLink().run();
  modalVisible.value = false;
}

/**
 * Open modal to edit or create a link
 */
function openModal () {
  if (props.editor.isActive('link')) {
    link.value = props.editor.getAttributes('link').href;
    newLink.value = false;
  } else {
    link.value = null;
    newLink.value = true;
  }
  modalVisible.value = true;
}

/**
 * Save changes to the link and close modal
 */
function save () {
  props.editor.chain().focus().setLink({ href: link.value }).run();
  modalVisible.value = false;
}
</script>
