<template>
  <div
    :data-test="'room-setting-' + setting"
    :class="
      fullWidth
        ? 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0'
        : 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3'
    "
  >
    <div class="row-start-2">
      <div class="flex items-center gap-2">
        <ToggleSwitch
          v-model="model[setting]"
          :input-id="'room-setting-' + setting"
          :disabled="disabled || model.room_type[setting + '_enforced']"
          :invalid="invalid"
          class="shrink-0"
        />
        <label :for="'room-setting-' + setting" class="flex items-center gap-2">
          <RoomSettingEnforcedIcon
            v-if="model.room_type[setting + '_enforced']"
          />
          {{ label }}</label
        >
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
  label: {
    type: String,
    required: true,
  },
  warningMessage: {
    type: [String, null],
    required: false,
    default: null,
  },
});
</script>
