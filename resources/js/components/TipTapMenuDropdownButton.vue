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
    class="shadow-0 right m-0 w-full origin-top cursor-pointer list-none border-surface-50 bg-white px-4 py-1 rounded-border lg:absolute lg:z-10 lg:w-60 lg:border lg:px-0 lg:py-2 lg:shadow dark:border-surface-800"
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
  () => {
    closeDropdown();
  },
  { ignore: [dropdownButton] },
];
</script>
