<script setup>

defineProps({
  label: String,
  value: [Boolean, Number],
  enforced: Boolean,
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
      <Tag v-if="type === 'switch' && value" class="p-tag-circle" rounded severity="primary">
        <span class="fas fa-check"  aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.enabled') }}</span>
      </Tag>
      <Tag v-if="type === 'switch' && !value" class="p-tag-circle" rounded severity="secondary">
        <span class="fa-solid fa-xmark" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.disabled') }}</span>
      </Tag>

      <Tag severity="info" v-if="type === 'select'">
        {{ options[value]}}
      </Tag>
    </div>
  </div>
</template>
