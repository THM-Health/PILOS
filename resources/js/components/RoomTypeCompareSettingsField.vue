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
  <div class="field grid mx-0">
    <span class="col-12 mb-2">{{ label }}</span>

    <div class="col-3 flex align-items-center justify-content-center" :aria-label="currentEnforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')">
      <Tag v-if="type === 'switch' && currentValue" class="round-tag" rounded severity="primary">
        <span class="fas fa-check" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.enabled') }}</span>
      </Tag>
      <Tag v-if="type === 'switch' && !currentValue" class="round-tag" rounded severity="secondary">
        <span class="fa-solid fa-xmark" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.disabled') }}</span>
      </Tag>

      <Tag severity="info" v-if="type === 'select'">
        {{ options[currentValue]}}
      </Tag>
    </div>

    <div class="col-2 flex align-items-center justify-content-center">
      <RoomSettingEnforcedIcon v-if="currentEnforced"/>
    </div>

    <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>

    <div class="col-3 flex align-items-center justify-content-center" :aria-label="newEnforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')">
      <Tag v-if="type === 'switch' && newValue" class="round-tag" rounded severity="primary">
        <span class="fas fa-check" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.enabled') }}</span>
      </Tag>
      <Tag v-if="type === 'switch' && !newValue" class="round-tag" rounded severity="secondary">
        <span class="fa-solid fa-xmark" aria-hidden="true"></span>
        <span class="sr-only">{{ $t('app.disabled') }}</span>
      </Tag>

      <Tag severity="info" v-if="type === 'select'">
        {{ options[newValue]}}
      </Tag>
    </div>

    <div class="col-2 flex align-items-center justify-content-center">
      <RoomSettingEnforcedIcon v-if="newEnforced"/>
    </div>

  </div>
</template>
<style scoped>
.round-tag {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
