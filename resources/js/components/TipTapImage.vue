<template>
  <Button
    v-tooltip="$t('rooms.description.tooltips.image')"
    :aria-label="$t('rooms.description.tooltips.image')"
    :severity="props.editor.isActive('image') ? 'primary' : 'secondary'"
    text
    icon="fa-solid fa-image"
    data-test="tip-tap-image-button"
    @click="showModal"
  />
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="
      newImage
        ? $t('rooms.description.modals.image.new')
        : $t('rooms.description.modals.image.edit')
    "
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    data-test="tip-tap-image-dialog"
  >
    <div class="mt-6 flex flex-col gap-2" data-test="src-field">
      <label for="src">{{ $t("rooms.description.modals.image.src") }}</label>
      <InputText id="src" v-model.trim="src" autofocus :invalid="srcInvalid" />
      <p v-if="srcInvalid" class="text-red-500" role="alert">
        {{ $t("rooms.description.modals.image.invalid_src") }}
      </p>
    </div>

    <div class="mt-6 flex flex-col gap-2" data-test="width-field">
      <label for="width">{{
        $t("rooms.description.modals.image.width")
      }}</label>
      <InputText id="width" v-model="width" aria-describedby="width-help" />
      <small id="width-help">{{
        $t("rooms.description.modals.image.width_description")
      }}</small>
    </div>

    <div class="mt-6 flex flex-col gap-2" data-test="alt-field">
      <label for="alt">{{ $t("rooms.description.modals.image.alt") }}</label>
      <InputText id="alt" v-model="alt" />
    </div>

    <template #footer>
      <div class="flex w-full justify-between gap-2">
        <div>
          <Button
            v-if="!newImage"
            severity="danger"
            :label="$t('app.delete')"
            data-test="tip-tap-image-delete-button"
            @click="deleteImage"
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
            :disabled="srcInvalid !== false"
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

const src = ref(null);
const width = ref(null);
const alt = ref(null);
const newImage = ref(true);
const modalVisible = ref(false);

const srcInvalid = computed(() => {
  if (src.value === null || src.value === "") {
    return null;
  }
  const regex = /^(https):\/\//;
  return regex.exec(src.value) == null;
});

/**
 * Delete the image and close modal
 */
function deleteImage() {
  props.editor.commands.deleteSelection();
  modalVisible.value = false;
}

/**
 * Open modal and fill fields with current image attributes if image is selected
 */
function showModal() {
  if (props.editor.isActive("image")) {
    src.value = props.editor.getAttributes("image").src;
    width.value = props.editor.getAttributes("image").width;
    alt.value = props.editor.getAttributes("image").alt;
    newImage.value = false;
  } else {
    src.value = null;
    width.value = null;
    alt.value = null;
    newImage.value = true;
  }
  modalVisible.value = true;
}

/**
 * Save changes to the image and close modal
 */
function save() {
  props.editor
    .chain()
    .insertContent({
      type: "image",
      attrs: {
        src: src.value,
        width: width.value,
        alt: alt.value,
      },
    })
    .run();
  modalVisible.value = false;
}
</script>
