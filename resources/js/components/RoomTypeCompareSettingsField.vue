<script setup>

defineProps({
  label: String,
  currentValue: [Boolean, Number],
  currentEnforced: Boolean,
  newValue: [Boolean, Number],
  newEnforced: Boolean,
  type: String,
  options: Object
});

</script>

<template>
  <div class="field grid grid-cols-12 gap-4 mx-0 mb-6">
    <span class="col-span-12">{{ label }}</span>

    <div class="col-span-3 flex justify-center items-center" :aria-label="currentEnforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')">
      <Tag v-if="type === 'switch' && currentValue" class="p-tag-circle" rounded severity="primary">
        <span class="fas fa-check" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.enabled') }}</span>
      </Tag>
      <Tag v-if="type === 'switch' && !currentValue" class="p-tag-circle" rounded severity="secondary">
        <span class="fa-solid fa-xmark" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.disabled') }}</span>
      </Tag>

      <Tag severity="info" v-if="type === 'select'">
        {{ options[currentValue]}}
      </Tag>
    </div>

    <div class="col-span-2 flex justify-center items-center">
      <RoomSettingEnforcedIcon v-if="currentEnforced"/>
    </div>

    <div class="col-span-2 fa-solid fa-arrow-right flex items-center justify-center"/>

    <div class="col-span-3 flex justify-center items-center" :aria-label="newEnforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')">
      <Tag v-if="type === 'switch' && newValue" class="p-tag-circle" rounded severity="primary">
        <span class="fas fa-check" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.enabled') }}</span>
      </Tag>
      <Tag v-if="type === 'switch' && !newValue" class="p-tag-circle" rounded severity="secondary">
        <span class="fa-solid fa-xmark" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.disabled') }}</span>
      </Tag>

      <Tag severity="info" v-if="type === 'select'">
        {{ options[newValue]}}
      </Tag>
    </div>

    <div class="col-span-2 flex justify-center items-center">
      <RoomSettingEnforcedIcon v-if="newEnforced"/>
    </div>

  </div>
</template>
