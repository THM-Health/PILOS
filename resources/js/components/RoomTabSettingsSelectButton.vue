<template>
  <div
    role="radiogroup"
    :aria-labelledby="'room-setting-' + setting + '-label'"
    :data-test="'room-setting-' + setting"
    :class="
      fullWidth
        ? 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0'
        : 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3'
    "
  >
    <div class="mb-2 flex flex-col justify-end">
      <span
        :id="'room-setting-' + setting + '-label'"
        class="flex items-center gap-2"
      >
        <RoomSettingEnforcedIcon
          v-if="model.room_type[setting + '_enforced']"
        />
        {{ label }}
      </span>
      <small v-if="hint">{{ hint }}</small>
    </div>
    <div class="flex flex-col gap-2">
      <SelectButton
        v-model="model[setting]"
        :allow-empty="false"
        class="shrink-0"
        data-key="value"
        option-label="label"
        option-value="value"
        :options="options"
        :disabled="disabled || model.room_type[setting + '_enforced']"
        :invalid="invalid"
        :pt="{
          pcToggleButton: {
            root: {
              'data-test': 'room-setting-' + setting + '-button',
            },
          },
        }"
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
import RoomSettingEnforcedIcon from "./RoomSettingEnforcedIcon.vue";

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
  options: {
    type: Array,
    required: true,
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
