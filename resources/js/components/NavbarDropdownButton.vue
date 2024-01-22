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
  <li class="py-2 lg:py-0">
    <button ref="dropdownButton" class="bg-transparent border-none block flex align-items-center text-500 hover:text-900 focus:text-900 w-full p-0 lg:px-2 lg:py-3"
       @click="dropdown = !dropdown"
    >
      <slot name="button-content">{{ props.text }}</slot>
      <i class="fa-solid fa-caret-down ml-auto lg:ml-2"></i>
    </button>
    <ul ref="dropdownMenu" v-if="dropdown" v-on-click-outside="onClickOutsideHandler" @click="closeDropdown" :style="floatingStyles" class="list-none py-1 px-3 m-0 lg:px-0 lg:py-2 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute lg:z-1 bg-white origin-top w-full right lg:w-15rem cursor-pointer">
      <slot/>
    </ul>
  </li>
</template>
