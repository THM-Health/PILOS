<template>
  <div
    :data-test="'room-setting-' + setting"
    class="col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3"
  >
    <label :for="'room-setting-' + setting" class="mb-2">
      <RoomSettingEnforcedIcon
        v-if="model.room_type.has_access_code_enforced"
      />
      {{ label }}</label
    >
    <div>
      <InputGroup>
        <!-- Generate random access code -->
        <Button
          v-if="!disabled"
          v-tooltip="$t('rooms.settings.general.generate_access_code')"
          data-test="generate-access-code-button"
          :aria-label="$t('rooms.settings.general.generate_access_code')"
          icon="fa-solid fa-dice"
          @click="createAccessCode"
        />
        <!-- Access code -->
        <InputText
          :id="'room-setting-' + setting"
          v-model.number="model[setting]"
          :disabled="disabled"
          :invalid="formErrors.fieldInvalid(setting)"
          :placeholder="placeholder"
          readonly="readonly"
        />
        <!-- Clear access code -->
        <Button
          v-if="model[setting] && !disabled"
          v-tooltip="$t('rooms.settings.general.delete_access_code')"
          :aria-label="$t('rooms.settings.general.delete_access_code')"
          icon="fa-solid fa-trash"
          data-test="clear-access-code-button"
          @click="model[setting] = null"
        />
      </InputGroup>
      <small v-if="model.room_type.has_access_code_enforced">
        {{
          model.room_type.has_access_code_default
            ? $t("rooms.settings.general.access_code_enforced")
            : $t("rooms.settings.general.access_code_prohibited")
        }}
      </small>
      <FormError :errors="formErrors.fieldError(setting)" />
    </div>
  </div>
</template>

<script setup>
import FormError from "./FormError.vue";
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
  placeholder: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: true,
  },
});

/**
 * Create a new access code for the room
 */
function createAccessCode() {
  model.value[props.setting] =
    Math.floor(Math.random() * (999999999 - 111111112)) + 111111111;
}
</script>
