<template>
  <Button
    ref="dropdownButton"
    v-tooltip="label"
    text
    :aria-label="label"
    v-bind="$attrs"
    @click="dropdown = !dropdown"
  >
    <span class="p-button-icon flex-shrink-0">
      <slot name="button-content" />
      <i class="fa-solid fa-caret-down ml-2"></i>
    </span>
  </Button>
  <div
    v-if="dropdown"
    ref="dropdownMenu"
    :style="floatingStyles"
    class="absolute z-10 w-full px-4 max-sm:!left-0 sm:w-60 sm:px-0"
  >
    <ul
      v-on-click-outside="onClickOutsideHandler"
      class="origin-top cursor-pointer list-none border border-surface-50 bg-white px-1 shadow rounded-border dark:border-surface-800 dark:bg-surface-900"
      @click="closeDropdown"
    >
      <slot />
    </ul>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { vOnClickOutside } from "@vueuse/components";
import { autoPlacement, useFloating } from "@floating-ui/vue";

defineProps({
  label: {
    type: String,
    required: true,
  },
});

const dropdownButton = ref();
const dropdownMenu = ref();
const dropdown = ref(false);
function closeDropdown() {
  dropdown.value = false;
}

const { floatingStyles } = useFloating(dropdownButton, dropdownMenu, {
  transform: false,
  middleware: [
    autoPlacement({
      allowedPlacements: ["bottom-start", "bottom-end"],
    }),
  ],
});

const onClickOutsideHandler = [
  () => {
    closeDropdown();
  },
  { ignore: [dropdownButton] },
];
</script>
