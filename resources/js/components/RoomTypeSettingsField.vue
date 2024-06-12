<script setup>

defineProps({
  id: Object,
  label: String,
  value: [Boolean, Number],
  enforced: Boolean,
  roomType: Object,
  type: String,
  options: Object
});

</script>

<template>
  <div class="field grid">
    <span class="col-8 flex align-items-center gap-2">
      <RoomSettingEnforcedIcon v-if="enforced"/>
      {{ label }}
    </span>

    <div class="col-4 justify-content-center flex align-items-center">
      <Tag v-if="type === 'switch' && value" icon="fas fa-check" rounded severity="primary" :aria-label="$t('app.enabled')"></Tag>
      <Tag v-if="type === 'switch' && !value" icon="fas fa-times" rounded severity="secondary" :aria-label="$t('app.disabled')"></Tag>

      <Tag severity="info" v-if="type === 'select'">
        {{ options[value]}}
      </Tag>
    </div>
  </div>
</template>
