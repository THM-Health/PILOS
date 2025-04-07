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
      <Textarea
        :id="'room-setting-' + setting"
        v-model="model[setting]"
        class="w-full"
        :disabled="disabled"
        :rows="rows"
        :placeholder="placeholder"
        :invalid="invalid"
        :maxlength="max"
      />
      <small v-if="max">
        {{
          $t("rooms.settings.general.chars", {
            chars: charactersLeft,
          })
        }}
      </small>
      <FormError :errors="errors" />
      <InlineNote v-if="warningMessage" severity="warn">
        {{ warningMessage }}
      </InlineNote>
    </div>
  </div>
</template>

<script setup>
import FormError from "./FormError.vue";
import { computed } from "vue";

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
  max: {
    type: [Number, null],
    required: false,
    default: null,
  },
  rows: {
    type: [Number, null],
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

/**
 * Count the chars of the short description
 * @returns {string} amount of chars in comparison to the limit
 */
const charactersLeft = computed(() => {
  const char = model.value[props.setting]
    ? model.value[props.setting].length
    : 0;
  return char + " / " + props.max;
});
</script>
