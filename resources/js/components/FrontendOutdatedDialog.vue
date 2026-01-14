<script setup>
import { ref, watch } from "vue";
import { useSettingsStore } from "../stores/settings.js";

const settingsStore = useSettingsStore();

const visible = ref(false);

watch(
  () => settingsStore.frontendVersion,
  (newVersion, oldVersion) => {
    if (oldVersion && newVersion !== oldVersion) {
      visible.value = true;
    }
  },
);

const reload = () => {
  window.location.reload();
};
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="false"
    :dismissable-mask="false"
    :closable="false"
  >
    <span>{{ $t("app.errors.frontend_outdated") }}</span>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="$t('app.reload')" @click="reload" />
      </div>
    </template>
  </Dialog>
</template>
