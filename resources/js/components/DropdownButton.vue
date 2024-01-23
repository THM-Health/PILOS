<script setup>
import { ref } from 'vue';
import { vOnClickOutside } from '@vueuse/components';
import { autoPlacement, useFloating } from '@floating-ui/vue';

const props = defineProps([
  'text'
]);

const dropdownButton = ref();
const dropdownMenu = ref();
const dropdown = ref(false);
function closeDropdown () {
  dropdown.value = false;
}

const { floatingStyles } = useFloating(dropdownButton, dropdownMenu, {
  middleware: [
    autoPlacement(
      {
        allowedPlacements: ['bottom-start', 'bottom-end']
      }
    )
  ]
});

const onClickOutsideHandler = [
  (ev) => {
    console.log(ev);
    closeDropdown();
  },
  { ignore: [dropdownButton] }
];

</script>

<template>
    <Button ref="dropdownButton" class="p-button-icon-only" @click="dropdown = !dropdown" v-bind="$attrs">
      <span class="p-button-icon">
        <slot name="button-content">{{ props.text }}</slot>
        <i class="fa-solid fa-caret-down ml-auto lg:ml-2"></i>
      </span>
    </Button>
    <ul ref="dropdownMenu" v-if="dropdown" v-on-click-outside="onClickOutsideHandler" @click="closeDropdown" :style="floatingStyles" class="list-none py-1 px-3 m-0 lg:px-0 lg:py-2 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute lg:z-1 bg-white origin-top w-full right lg:w-15rem cursor-pointer">
      <slot/>
    </ul>
</template>
