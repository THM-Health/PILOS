<template>
  <div
    :data-test="'room-setting-' + setting"
    class="col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3"
  >
    <label :for="'room-setting-' + setting" class="mb-2">{{ label }}</label>
    <div>
      <InputText
        :id="'room-setting-' + setting"
        v-model="model[setting]"
        class="w-full"
        :disabled="disabled"
        :placeholder="placeholder"
        :invalid="formErrors.fieldInvalid(setting)"
      />
      <FormError :errors="formErrors.fieldError(setting)" />
    </div>
  </div>
</template>

<script setup>
import FormError from "./FormError.vue";

const model = defineModel({ type: Object });

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
  formErrors: {
    type: Object,
    required: true,
  },
  setting: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: true,
  },
});
</script>
