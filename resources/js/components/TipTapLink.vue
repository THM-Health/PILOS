<template>
  <Button
    v-tooltip="$t('rooms.description.tooltips.link')"
    :aria-label="$t('rooms.description.tooltips.link')"
    :severity="props.editor.isActive('link') ? 'primary' : 'secondary'"
    text
    icon="fa-solid fa-link"
    data-test="tip-tap-link-button"
    @click="showModal"
  />
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="
      newLink
        ? $t('rooms.description.modals.link.new')
        : $t('rooms.description.modals.link.edit')
    "
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    data-test="tip-tap-link-dialog"
  >
    <div class="mt-6 flex flex-col gap-2" data-test="url-field">
      <label for="url">{{ $t("rooms.description.modals.link.url") }}</label>
      <InputText id="url" v-model.trim="link" autofocus :invalid="urlInvalid" />
      <p v-if="urlInvalid" class="text-red-500" role="alert">
        {{ $t("rooms.description.modals.link.invalid_url") }}
      </p>
    </div>

    <template #footer>
      <div class="flex w-full justify-between gap-2">
        <div>
          <Button
            v-if="!newLink"
            severity="danger"
            :label="$t('app.delete')"
            data-test="tip-tap-link-delete-button"
            @click="deleteLink"
          />
        </div>
        <div class="flex gap-2">
          <Button
            severity="secondary"
            :label="$t('app.cancel')"
            data-test="dialog-cancel-button"
            @click="modalVisible = false"
          />
          <Button
            :disabled="urlInvalid !== false"
            :label="$t('app.save')"
            data-test="dialog-save-button"
            @click="save"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
});

const link = ref(null);
const newLink = ref(true);
const modalVisible = ref(false);

const urlInvalid = computed(() => {
  // Only return state if link is not empty
  if (link.value === null || link.value === "") {
    return null;
  }
  // regex checks if url starts with http://, https:// or mailto:
  const regex = /^(https|http|mailto):\/\//;
  return regex.exec(link.value) == null;
});

/**
 * Delete link and close modal
 */
function deleteLink() {
  props.editor.chain().focus().unsetLink().run();
  modalVisible.value = false;
}

/**
 * Open modal to edit or create a link
 */
function showModal() {
  if (props.editor.isActive("link")) {
    link.value = props.editor.getAttributes("link").href;
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
function save() {
  props.editor.chain().focus().setLink({ href: link.value }).run();
  modalVisible.value = false;
}
</script>
