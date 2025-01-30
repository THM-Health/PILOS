<template>
  <label
    :for="inputId"
    class="p-button p-component shrink-0"
    :class="{ 'p-disabled': disabled }"
    tabindex="0"
    data-test="file-input-button"
    @keyup.enter="fileInputRef.click()"
    @keyup.space="fileInputRef.click()"
  >
    <i class="fa-solid fa-upload mr-2"></i>
    <span class="p-button-label">{{ model?.name ?? $t("app.browse") }}</span>
  </label>
  <input
    :id="inputId"
    ref="fileInputRef"
    type="file"
    class="sr-only"
    :disabled="disabled"
    :accept="accept"
    data-test="file-input-input"
    @input="fileSelected"
  />
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import _ from "lodash";

const fileInputRef = ref();

const inputId = ref();

onMounted(() => {
  inputId.value = _.uniqueId("file-input-");
});

const accept = computed(() => {
  if (!props.allowedExtensions) {
    return "";
  }
  return "." + props.allowedExtensions.join(",.");
});

const model = defineModel({ type: File });
const tooBig = defineModel("tooBig", { type: Boolean });
const invalidExtension = defineModel("invalidExtension", { type: Boolean });

const props = defineProps({
  maxFileSize: {
    type: Number,
    required: true,
  },
  allowedExtensions: {
    type: Array,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  invalid: {
    type: Boolean,
    default: false,
  },
});

watch(
  () => model.value,
  (value) => {
    if (value) {
      tooBig.value = !!(props.maxFileSize && value.size > props.maxFileSize);

      invalidExtension.value = !!(
        props.allowedExtensions &&
        !props.allowedExtensions.includes(value.name.split(".").pop())
      );
    } else {
      invalidExtension.value = false;
      tooBig.value = false;
      fileInputRef.value.value = null;
    }
  },
);

function fileSelected(event) {
  model.value = event.target.files[0];
}
</script>
