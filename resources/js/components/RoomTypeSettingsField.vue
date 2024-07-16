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
  <div class="field grid grid-cols-12 gap-4 mb-4">
    <span class="col-span-8 flex items-center gap-2">
      <RoomSettingEnforcedIcon v-if="enforced"/>
      {{ label }}
    </span>

    <div class="col-span-4 justify-center flex items-center">
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
