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
      <label :for="'room-setting-' + setting">
        <RoomSettingEnforcedIcon
          v-if="model.room_type.has_access_code_enforced"
        />
        {{ label }}</label
      >
    </div>
    <div class="flex flex-col gap-2">
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
          v-model="model[setting]"
          :disabled="disabled"
          :invalid="invalid"
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

/**
 * Create a new access code for the room
 */
function createAccessCode() {
  // Define the minimum and maximum values for the access code range
  const min = 0;
  const max = 999_999_999;

  // Calculate the range and the largest multiple of the range that fits in a 32-bit unsigned integer
  const range = max - min + 1;
  const limit = Math.floor(0xffffffff / range) * range;

  // Create a array to hold the random uint32 value
  const array = new Uint32Array(1);

  // Generate a random value within the acceptable range using rejection sampling
  do {
    crypto.getRandomValues(array);
  } while (array[0] > limit);

  // Calculate the random number within the desired range
  // using modulo to fit it into the range, only possible because of the rejection sampling above
  // otherwise this would introduce bias
  const randomNumber = array[0] % range;

  // Convert the random number to a zero-padded 9-digit string
  model.value[props.setting] = randomNumber.toString().padStart(9, "0");
}
</script>
