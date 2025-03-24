<template>
  <div
    role="radiogroup"
    :aria-labelledby="'room-setting-' + setting + '-label'"
    :data-test="'room-setting-' + setting"
    :class="
      full_width
        ? 'col-span-12 row-span-2 grid grid-rows-subgrid'
        : 'col-span-12 row-span-2 grid grid-rows-subgrid md:col-span-6 xl:col-span-3'
    "
  >
    <span
      :id="'room-setting-' + setting + '-label'"
      class="flex items-center gap-2"
    >
      <RoomSettingEnforcedIcon v-if="model.room_type[setting + '_enforced']" />
      {{ label }}
    </span>
    <SelectButton
      :allow-empty="false"
      class="shrink-0"
      data-key="value"
      option-label="label"
      option-value="value"
      v-model="model[setting]"
      :options="options"
      :disabled="disabled || model.room_type[setting + '_enforced']"
      :invalid="formErrors.fieldInvalid(setting)"
    />
    <FormError :errors="formErrors.fieldError(setting)" />
  </div>
</template>

<script setup>
import FormError from "./FormError.vue";
import { computed } from "vue";
import RoomSettingEnforcedIcon from "./RoomSettingEnforcedIcon.vue";

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
  full_width: {
    type: Boolean,
    required: false,
    default: false,
  },
  options: {
    type: Object,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
});
</script>
