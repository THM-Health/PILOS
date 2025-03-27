<template>
  <div
    :data-test="'room-setting-' + setting"
    :class="
      fullWidth
        ? 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0'
        : 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3'
    "
  >
    <div class="mb-2 flex flex-col justify-end">
      <label :for="'room-setting-' + setting">{{ label }}</label>
      <small v-if="hint">{{ hint }}</small>
    </div>
    <div class="flex flex-col gap-2">
      <InputText
        :id="'room-setting-' + setting"
        v-model="model[setting]"
        class="w-full"
        :disabled="disabled"
        :placeholder="placeholder"
        :invalid="invalid"
      />
      <FormError :errors="errors" />
      <InlineNote v-if="warningMessage" severity="warn">
        {{ warningMessage }}
      </InlineNote>
    </div>
  </div>
</template>

<script setup>
import FormError from "./FormError.vue";

const model = defineModel({ type: Object });

defineProps({
  disabled: {
    type: Boolean,
    required: true,
  },
  invalid: {
    type: Boolean,
    required: false,
  },
  errors: {
    type: Object,
    required: true,
  },
  setting: {
    type: String,
    required: true,
  },
  fullWidth: {
    type: Boolean,
    required: false,
    default: false,
  },
  placeholder: {
    type: [String, null],
    required: false,
    default: null,
  },
  label: {
    type: String,
    required: true,
  },
  warningMessage: {
    type: [String, null],
    required: false,
    default: null,
  },
  hint: {
    type: [String, null],
    required: false,
    default: null,
  },
});
</script>
