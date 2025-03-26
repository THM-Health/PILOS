<template>
  <div
    role="radiogroup"
    :aria-labelledby="'room-setting-' + setting + '-label'"
    :data-test="'room-setting-' + setting"
    :class="
      full_width
        ? 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0'
        : 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3'
    "
  >
    <span
      :id="'room-setting-' + setting + '-label'"
      class="mb-2 flex items-center gap-2"
    >
      <RoomSettingEnforcedIcon v-if="model.room_type[setting + '_enforced']" />
      {{ label }}
    </span>
    <div class="flex flex-col gap-2">
      <div v-for="option in options" class="flex items-center gap-2">
        <RadioButton
          :input-id="'room-setting-' + setting + '-' + option.value"
          :name="'room-setting-' + setting"
          v-model="model[setting]"
          :value="parseInt(option.value)"
          :disabled="disabled || model.room_type[setting + '_enforced']"
          :invalid="invalid"
          class="shrink-0"
        />
        <label :for="'room-setting-' + setting + '-' + option.value">{{
          option.label
        }}</label>
      </div>
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
import RoomSettingEnforcedIcon from "./RoomSettingEnforcedIcon.vue";

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
  warningMessage: {
    type: String,
    required: false,
  },
});
</script>
