<template>
  <div
    :data-test="'room-setting-' + setting"
    class="col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3"
  >
    <label :for="'room-setting-' + setting" class="mb-2">{{ label }}</label>
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

const props = defineProps({
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
  placeholder: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: true,
  },
  warningMessage: {
    type: String,
    required: false,
  },
});
</script>
