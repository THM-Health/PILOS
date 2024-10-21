<template>
  <Button
    ref="dropdownButton"
    v-tooltip="label"
    text
    :aria-label="label"
    v-bind="$attrs"
    @click="dropdown = !dropdown"
  >
    <span class="p-button-icon">
      <slot name="button-content" />
      <i class="fa-solid fa-caret-down ml-auto lg:ml-2"></i>
    </span>
  </Button>
  <ul
    v-if="dropdown"
    ref="dropdownMenu"
    v-on-click-outside="onClickOutsideHandler"
    :style="floatingStyles"
    class="list-none py-1 px-4 m-0 lg:px-0 lg:py-2 rounded-border shadow-0 lg:shadow lg:border border-surface-50 dark:border-surface-800 lg:absolute lg:z-10 bg-white origin-top w-full right lg:w-60 cursor-pointer"
    @click="closeDropdown"
  >
    <slot />
  </ul>
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
  middleware: [
    autoPlacement({
      allowedPlacements: ["bottom-start", "bottom-end"],
    }),
  ],
});

const onClickOutsideHandler = [
  (ev) => {
    closeDropdown();
  },
  { ignore: [dropdownButton] },
];
</script>
