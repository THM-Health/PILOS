<template>
  <search>
    <InputGroup :data-test="dataTest">
      <InputText
        v-model="model"
        :disabled="disabled"
        type="search"
        :placeholder="placeholder ? placeholder : $t('app.search')"
        :autofocus="autofocus"
        @keyup.enter="$emit('triggeredSearch')"
      />
      <Button
        v-tooltip="$t('app.search')"
        :disabled="disabled"
        :aria-label="ariaLabel"
        severity="primary"
        icon="fa-solid fa-magnifying-glass"
        @click="$emit('triggeredSearch')"
      />
    </InputGroup>
  </search>
</template>

<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: null,
  },
  ariaLabel: {
    type: String,
    required: true,
  },
  dataTest: {
    type: String,
    required: true,
  },
});

defineEmits(["triggeredSearch"]);

const model = defineModel({ type: String, default: "" });
</script>
